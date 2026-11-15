/**
 * @module services/geminiService
 *
 * Business logic layer for Google Gemini AI operations.
 * All HTTP concerns delegated to GeminiApiClient.
 * This service focuses on prompt construction, result transformation,
 * and multimodal content assembly.
 */

import { formatStoryKey } from '../utils/formatters';
import { jiraService } from './jiraService';
import { geminiApiClient } from '../core/GeminiApiClient';
import { logError } from '../core/ErrorHandler';
import { PLATFORM_INFO } from '../schemas/formSchemas';

// ── Shared Helpers ────────────────────────────────────────────────────────────

/**
 * Converts image objects to Gemini-compatible inlineData parts.
 * @param {Array<{ base64: string, mimeType: string }>} images
 * @returns {Array<object>}
 */
function buildImageParts(images = []) {
  return images
    .filter((img) => img && img.base64)
    .map((img) => ({
      inlineData: {
        mimeType: img.mimeType || 'image/png',
        data: img.base64,
      },
    }));
}

/**
 * Downloads Jira image attachments as base64 parts for Gemini Vision.
 * @param {Array} attachments - Jira attachment metadata
 * @param {number} [maxCount=3]
 * @returns {Promise<Array<object>>}
 */
async function downloadJiraImageParts(attachments = [], maxCount = 3) {
  const imageAttachments = attachments
    .filter(
      (att) =>
        att.mimeType &&
        (att.mimeType.startsWith('image/') || /\.(png|jpg|jpeg|webp)$/i.test(att.filename))
    )
    .slice(0, maxCount);

  const parts = [];
  for (const att of imageAttachments) {
    try {
      if (att.contentUrl) {
        const downloaded = await jiraService.downloadAttachmentAsBase64(att.contentUrl);
        parts.push({
          inlineData: {
            mimeType: downloaded.mimeType || att.mimeType || 'image/png',
            data: downloaded.base64,
          },
        });
      }
    } catch (err) {
      logError(`downloadJiraImage[${att.filename}]`, err);
    }
  }
  return parts;
}

// ── Gemini Service ────────────────────────────────────────────────────────────

export const geminiService = {
  /**
   * Generates platform-specific test scenarios for selected platforms.
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async generatePlatformScenarios({
    storyKey,
    platforms = ['FE'],
    extraGuidance = '',
    teamName = 'Search',
    customImage = null,
  }) {
    const formattedKey = formatStoryKey(storyKey);
    let storyData;

    try {
      storyData = await jiraService.fetchStory(formattedKey);
    } catch (error) {
      throw new Error(`Jira'dan Story bilgileri alınamadı: ${error.message}`);
    }

    const { summary, description, type, attachments = [] } = storyData;

    // Build image parts: custom image + Jira attachments
    const imageParts = [
      ...buildImageParts(customImage ? [customImage] : []),
      ...(await downloadJiraImageParts(attachments)),
    ];

    const prompt = `
Lütfen aşağıdaki Jira Story detaylarına ve varsa ekli görsellere/tasarımlara göre test senaryoları üret.

Jira Story: ${formattedKey} (${type})
Başlık: ${summary}
Açıklama: ${description || 'Açıklama girilmemiş.'}
${attachments.length > 0 ? `Story'de Bulunan Ekli Dosyalar: ${attachments.map((a) => a.filename).join(', ')}` : ''}
${imageParts.length > 0 ? `DİKKAT: Bu Story'e ait ${imageParts.length} adet ekran görüntüsü / tasarım / mockup görseli eklenmiştir. Lütfen görsellerdeki butonları, form alanlarını, hata durumlarını, UI elementlerini ve akışları DİKKATLE ANALİZ EDEREK test senaryolarına birebir dahil et!` : ''}
${extraGuidance ? `
---
ÖZEL EK YÖNLENDİRME / İSTEKLER: 
"${extraGuidance}"

DİKKAT: Eğer bu ek yönlendirmede belirli bir platform ismi (örn: sadece "App" veya "Mobile") geçiyorsa, bu yönlendirmedeki kuralları SADECE o platformun senaryolarında uygula. Diğer platformlar için bu özel isteği GÖRMEZDEN GEL ve o platformların standart doğasına uygun testler yaz.
---
` : ''}
İstenen Platformlar: ${platforms.join(', ')}

Sen bir Kıdemli QA Analisti ve Test Mühendisisin. 
Her bir istenen platform için (sadece istenenler için), 1 adet "Pozitif Test Senaryoları" ve 1 adet "Negatif & Sınır Test Senaryoları" markdown formatında metin üretmelisin. 

Senaryoları BDD (Given/When/Then) formatında DEĞİL, yapılandırılmış profesyonel bir Manuel Test formatında yazmalısın. Her senaryo şu başlıkları içermeli:
- **Test Case Başlığı** (örn: TC-01: Başarılı Giriş)
- **Ön Koşullar** (Preconditions)
- **Test Adımları** (Step-by-step actions)
- **Beklenen Sonuç** (Expected Result)
- **Kullanılacak Veriler / Test Data** (varsa)

Çıktıyı KESİNLİKLE JSON formatında ver. Başka hiçbir açıklama yazma. Aşağıdaki JSON şemasına birebir uyumlu olsun:
{
  "FE": {
    "positive": "Markdown metni buraya gelecek...",
    "negative": "Markdown metni buraya gelecek..."
  },
  "BE": {
    "positive": "Markdown metni buraya gelecek...",
    "negative": "Markdown metni buraya gelecek..."
  }
}
(Sadece istenen platformların key'leri (FE, BE, App) olmalı.)
`;

    const parts = [{ text: prompt }, ...imageParts];
    const generatedJson = await geminiApiClient.generateJson(parts, 'Test Senaryoları');

    // Transform to UI format
    const scenariosByPlatform = {};
    platforms.forEach((platform) => {
      const meta = PLATFORM_INFO[platform];
      const platformData = generatedJson[platform] || {};

      scenariosByPlatform[platform] = {
        platformKey: platform,
        platformName: meta.name,
        framework: meta.framework,
        positive: {
          id: `${platform.toLowerCase()}-pos`,
          title: `Pozitif Senaryolar (${platform})`,
          content: platformData.positive || `### ${platform} Pozitif Senaryolar\n(İçerik üretilemedi)`,
          selected: true,
        },
        negative: {
          id: `${platform.toLowerCase()}-neg`,
          title: `Negatif & Sınır Senaryoları (${platform})`,
          content: platformData.negative || `### ${platform} Negatif Senaryolar\n(İçerik üretilemedi)`,
          selected: true,
        },
      };
    });

    return {
      storyKey: formattedKey,
      storySummary: summary,
      teamName,
      platforms,
      extraGuidance,
      scenarios: scenariosByPlatform,
    };
  },

  /**
   * Generates IPK Demand form data using Gemini AI.
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async generateIpkDemand({
    mode = 'story',
    storyKey = '',
    textDescription = '',
    imageFile = null,
    extraGuidance = '',
    teamName = 'Search',
  }) {
    let sourceContent = '';
    let formattedKey = '';

    if (mode === 'story') {
      formattedKey = formatStoryKey(storyKey);
      try {
        const storyData = await jiraService.fetchStory(formattedKey);
        sourceContent = `Jira Story No: ${formattedKey}\nBaşlık: ${storyData.summary}\nAçıklama: ${storyData.description || 'Açıklama girilmemiş.'}\nTürü: ${storyData.type || 'Story'}`;
      } catch (err) {
        logError('geminiService.generateIpkDemand.fetchStory', err);
        sourceContent = `Jira Story No: ${formattedKey}\nTalep Konusu: ${formattedKey} biletli kullanıcı hikayesi için IPK talep analizi.`;
      }
      if (extraGuidance) {
        sourceContent += `\n\n--- KULLANICININ YAPAY ZEKEYA EK NOTU / ÖZEL YÖNLENDİRMESİ ---\n"${extraGuidance}"`;
      }
    } else {
      sourceContent = `Kullanıcı Açıklaması / Talep Detayı:\n"${textDescription}"`;
      if (imageFile) {
        sourceContent += '\n(Not: Talebe ait bir ekran görüntüsü/tasarım dosyası ek olarak iletilmiştir. Görsel içeriğini de analiz et.)';
      }
    }

    const prompt = `
Sen İdefix Portfolio Kanban (IPK) sisteminde uzman bir Kıdemli Ürün Yöneticisi ve Süreç Otomasyon Asistanısın. Görevin, sana iletilen bir Jira Story verisini (veya kullanıcı açıklamasını/görselini) analiz ederek, IPK altındaki "Demand" (Talep) formunu eksiksiz, profesyonel, kurumsal e-ticaret diline uygun ve mantıksal tutarlılıkla doldurmaktır.

ANALİZ EDİLECEK GİRDİ METNİ:
---
${sourceContent}
---

Aşağıdaki kurallara KESİNLİKLE UY:
1. Atanan Kişi (assignee) her zaman: "hsyn deneme" olmalıdır.
2. Oluşturulacak Jira kaydının etiketleri (labels) alanına mutlaka "otomasyon_ai" etiketini ekle.
3. Yanıtını SADECE aşağıda belirtilen geçerli bir JSON formatında ver. Markdown kod blokları (\`\`\`json ... \`\`\`) dışında hiçbir ekstra açıklama veya metin yazma.
4. Kabul kriterleri (acceptance_criteria) en az 3 maddeden oluşan, test edilebilir ve net ifadeler içermelidir (1. ..., 2. ..., 3. ... formatında).

DROPDOWN ALANLARI - Aşağıdaki alanlara SADECE verilen seçeneklerden birini yaz (başka bir değer yazma):

business_goal seçenekleri: "Gelir Artışı" | "Maliyet Azaltma" | "Müşteri Deneyiminin İyileştirilmesi" | "Operasyonel Verimlilik" | "Pazara Giriş Hızı" | "Satıcı / Tedarikçi Deneyiminin İyileştirilmesi" | "Risk Azaltma / Uyumluluk" | "Ürün Kalitesi / Güvenilirlik" | "Diğer"

impacted_stakeholders seçenekleri: "Son Kullanıcı (Alıcı)" | "Satıcı / Tedarikçi" | "Operasyon Ekibi" | "Müşteri Hizmetleri" | "Finans / Muhasebe" | "Pazarlama" | "Teknoloji / Geliştirici" | "Üst Yönetim" | "İç Paydaşlar (Tümü)" | "Dış Paydaşlar (Tümü)"

platform seçenekleri: "Tüm Platformlar" | "Web" | "iOS" | "Android" | "Mobil Web" | "Back-Office / Admin Panel" | "API / Entegrasyon"

stakeholder_touchpoint seçenekleri: "Ürün Detay Sayfası" | "Sepet & Ödeme Akışı" | "Arama & Kategori Listesi" | "Ana Sayfa & Banner" | "Satıcı Paneli" | "Sipariş Yönetimi" | "Kargo & Teslimat" | "İade & İptal Akışı" | "Bildirim & E-posta" | "Müşteri Hizmetleri Arayüzü" | "Raporlama & Analitik" | "Diğer"

how_stakeholders_affected seçenekleri: "Kullanıcı Deneyimi İyileşir" | "İşlem Süresi Kısalır" | "Hata Oranı Düşer" | "Gelir Artar" | "Maliyet Düşer" | "Yeni Özellik / Kapasite Kazanılır" | "Mevcut Sorun Giderilir" | "Risk Azalır" | "Uyumluluk Sağlanır"

demand_category seçenekleri: "Yeni Özellik Geliştirme" | "Mevcut Özellik İyileştirme" | "Hata Düzeltme" | "Teknik Borç" | "Entegrasyon" | "Altyapı / Platform" | "Güvenlik" | "Performans" | "UX / Tasarım" | "Veri & Raporlama" | "Regülasyon / Uyumluluk"

demand_trigger seçenekleri: "Müşteri Geri Bildirimi" | "Satıcı Talebi" | "İş Stratejisi" | "Rekabet Analizi" | "Yasal / Regülatif Zorunluluk" | "Teknik Borç / Altyapı İhtiyacı" | "Operasyonel Süreç İyileştirme" | "Veri / Analitik Bulgusu" | "Mevcut Hata / Sorun" | "Üst Yönetim Kararı"

confidence seçenekleri: "High" | "Medium" | "Low"
demand_size seçenekleri: "S" | "M" | "L" | "XL"
show_on_timeline seçenekleri: "Evet" | "Hayır"

Aşağıdaki JSON şemasına birebir uyumlu çıktı üret:
{
  "assignee": "hsyn deneme",
  "labels": ["otomasyon_ai"],
  "genel": {
    "summary": "...",
    "business_goal": "<yukarıdaki listeden birini seç>",
    "business_goal_detail": "...",
    "as_is": "...",
    "impacted_stakeholders": "<yukarıdaki listeden birini seç>",
    "platform": "<yukarıdaki listeden birini seç>",
    "product_area": "...",
    "stakeholder_touchpoint": "<yukarıdaki listeden birini seç>",
    "stakeholder_touchpoint_other": "",
    "how_stakeholders_affected": "<yukarıdaki listeden birini seç>",
    "demand_category": "<yukarıdaki listeden birini seç>",
    "to_be": "...",
    "demand_trigger": "<yukarıdaki listeden birini seç>",
    "acceptance_criteria": "1. ...\\n2. ...\\n3. ...",
    "urgency_timing": "...",
    "dependent_internal_systems": "...",
    "dependent_external_systems": "...",
    "el_comment": "...",
    "expected_output_value": "...",
    "confidence": "<High|Medium|Low>",
    "demand_size": "<S|M|L|XL>",
    "show_on_timeline": "<Evet|Hayır>"
  },
  "etki_kapsami": {
    "scope_channel": "...",
    "scope_segment": "...",
    "scope_category": "...",
    "scope_location": "...",
    "scope_seller_group": "..."
  },
  "finansal_etki": {
    "financial_aov": "...",
    "financial_cr": "...",
    "financial_revenue": "...",
    "financial_orders": "...",
    "financial_traffic": "..."
  }
}
`;

    const parts = [{ text: prompt }, ...buildImageParts(imageFile ? [imageFile] : [])];
    const parsedJson = await geminiApiClient.generateJson(parts, 'IPK Demand');

    return {
      storyKey: formattedKey || null,
      mode,
      teamName,
      data: parsedJson,
    };
  },

  /**
   * Generates a Jira User Story from description and uploaded images.
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async generateStoryDetails({ description = '', teamName = 'Search', images = [], files = [] }) {
    const fileListText = files.length > 0
      ? `\nEkli Dokümanlar: ${files.map((f) => f.name).join(', ')}`
      : '';

    const prompt = `
Sen kıdemli bir Agile Product Owner ve Kıdemli QA/İş Analistisin. 
Aşağıda verilen talep/ihtiyaç açıklaması, ekli dokümanlar ve varsa yüklenen UI mockup / ekran görüntüsü / akış şemalarını detaylıca analiz ederek Jira'da açılabilecek profesyonel bir "Story" hazırla.

Talep Açıklaması:
${description || 'Görseller ve dokümanlar incelenerek story oluşturulacak.'}
Takım: ${teamName}
${fileListText}
${images.length > 0 ? `DİKKAT: Kullanıcı ${images.length} adet ekran görüntüsü / tasarım / mockup yükledi. Görsellerdeki form alanlarını, butonları, akış adımlarını, olası validasyonları ve arayüz detaylarını dikkatle inceleyerek kullanıcı hikayesi ve kabul kriterlerine yansıt!` : ''}

Çıktıyı KESİNLİKLE aşağıdaki JSON şemasına birebir uyumlu olarak döndür. Başka hiçbir markdown veya açıklama yazma:
{
  "summary": "Kısa, net ve profesyonel Story Başlığı (Örn: [Search] Ürün Arama Filtrelerinde Çoklu Marka Seçimi ve Fiyat Aralığı Desteği)",
  "userStory": "As a [kullanıcı tipi / paydaş],\\nI want to [yapılmak istenen eylem],\\nSo that [elde edilecek iş faydası/değer].",
  "background": "Geliştirmenin arka planı, mevcut durum ve neden bu geliştirmeye ihtiyaç duyulduğu.",
  "acceptanceCriteria": [
    "Kabul kriteri 1",
    "Kabul kriteri 2",
    "Kabul kriteri 3"
  ],
  "technicalNotes": "Teknik notlar ve bağımlılıklar."
}
`;

    const parts = [{ text: prompt }, ...buildImageParts(images)];
    return await geminiApiClient.generateJson(parts, 'Story');
  },

  /**
   * Generates structured Bug or Issue details from user notes and screenshots.
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async generateBugOrIssueDetails({
    type = 'bug',
    notes = '',
    storyKey = '',
    storyData = null,
    teamName = 'Search',
    images = [],
  }) {
    const isIssue = type === 'issue';
    const storyContext = storyData
      ? `Bağlı Story: ${storyData.key} - ${storyData.summary}\nStory Açıklaması: ${storyData.description || 'Yok'}`
      : storyKey
      ? `Bağlı Story No: ${storyKey}`
      : '';

    const prompt = `
Sen kıdemli bir QA Test Mühendisi ve Hata Takip Uzmanısın.
Kullanıcı Jira'da ${isIssue ? 'bir Story\'e bağlı "Issue / Görev / QA Bulgusu"' : 'bağımsız bir "Bug / Hata Kaydı"'} oluşturmak istiyor.

Kullanıcının Girdiği Notlar (Zorunlu Hata/Sorun Tanımı):
"${notes}"

${storyContext ? `\nStory Bağlantı Detayı:\n${storyContext}\n` : ''}
Takım: ${teamName}
${images.length > 0 ? `DİKKAT: Kullanıcı ${images.length} adet ekran görüntüsü / hata görseli / log yükledi. Görsellerdeki hata mesajlarını, UI kaymalarını, butonları veya sistem uyarılarını detayla inceleyerek hata kaydına entegre et!` : ''}

Lütfen bu girdileri inceleyerek Jira için profesyonel bir Hata Kaydı (Bug / Issue) formatı hazırla.
Çıktıyı KESİNLİKLE aşağıdaki JSON şemasına birebir uyumlu olarak döndür. Başka hiçbir markdown veya açıklama yazma:
{
  "summary": "[${isIssue ? 'ISSUE' : 'BUG'}] [${teamName}] Kısa, net ve açıklayıcı hata başlığı",
  "stepsToReproduce": [
    "Adım 1: ...",
    "Adım 2: ...",
    "Adım 3: ..."
  ],
  "expectedResult": "Beklenen sonuç.",
  "actualResult": "Gerçekleşen hatalı durum.",
  "environment": "Web / Mobile App / API",
  "severity": "Major"
}
`;

    const parts = [{ text: prompt }, ...buildImageParts(images)];
    return await geminiApiClient.generateJson(parts, 'Bug/Issue');
  },

  /**
   * Generates Planning Poker Story Point estimation using Gemini AI.
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async generatePlanningPokerEstimation({
    mode = 'jira',
    storyKey = '',
    customTitle = '',
    customDescription = '',
    teamName = 'Search',
    images = [],
    files = [],
  }) {
    let storyContent = '';
    let formattedKey = '';
    let jiraAttachments = [];

    if (mode === 'jira' && storyKey) {
      formattedKey = formatStoryKey(storyKey);
      try {
        const storyData = await jiraService.fetchStory(formattedKey);
        jiraAttachments = storyData.attachments || [];
        storyContent = `Jira Story No: ${formattedKey} (${storyData.type || 'Story'})
Başlık: ${storyData.summary}
Açıklama: ${storyData.description || 'Açıklama girilmemiş.'}`;
      } catch (err) {
        logError('geminiService.generatePlanningPokerEstimation.fetchStory', err);
        storyContent = `Jira Story No: ${formattedKey}
Başlık: ${formattedKey} Kullanıcı Hikayesi`;
      }
    } else {
      storyContent = `Başlık: ${customTitle || 'Yeni Özellik / Geliştirme Talebi'}
Açıklama: ${customDescription || 'Açıklama girilmemiş.'}`;
    }

    const fileListText = files.length > 0
      ? `\nEkli Dokümanlar: ${files.map((f) => f.name).join(', ')}`
      : '';

    const jiraImageParts = await downloadJiraImageParts(jiraAttachments);
    const userImageParts = buildImageParts(images);
    const imageParts = [...userImageParts, ...jiraImageParts];

    const prompt = `
Sen kıdemli bir Scrum Master ve Agile Test Mimarısısın. Sana verilecek olan Jira Story detaylarını (Başlık, Açıklama ve Kabul Kriterleri, fotoğraf/doküman) analiz ederek bir Planning Poker efor tahminlemesi yapacaksın.

Değerlendirme Kriterlerin:
1. İşin teknik karmaşıklığı (Frontend, Backend, Veritabanı değişiklikleri)
2. Test ve QA eforu (senaryolar, regression riski)
3. Bilinmeyenler ve bağımlılıklar

Jira Story İçeriği:
${storyContent}
Takım: ${teamName}
${fileListText}
${imageParts.length > 0 ? `DİKKAT: Story'ye ait ${imageParts.length} adet ekran görüntüsü / mimari / tasarım / doküman görseli mevcuttur. Görsellerdeki arayüzleri, veri yapısını ve akış karmaşıklığını dikkatle analiz et!` : ''}

Çıktıyı KESİNLİKLE aşağıdaki JSON formatında döndür. Markdown kod bloğu dışında hiçbir metin yazma:
{
  "storyPoint": 5,
  "technicalComplexity": "Teknik karmaşıklık analizi (FE, BE, Veritabanı)...",
  "qaEffort": "Test ve QA eforu analizi (Senaryolar, regression riski)...",
  "risksAndDependencies": "Bilinmeyenler, riskler ve bağımlılıklar...",
  "reasoning": [
    "Teknik Karmaşıklık: FE ve BE entegrasyonu gerektiriyor.",
    "Test Eforu: Sınır senaryoları ve regresyon riski yüksek.",
    "Bağımlılıklar: Üçüncü parti servis entegrasyonu bulunuyor."
  ]
}
DİKKAT: storyPoint değeri KESİNLİKLE Planning Poker serisinden bir sayı olmalıdır: 1, 2, 3, 5, 8, 13, 20, 40 veya 100.
`;

    const parts = [{ text: prompt }, ...imageParts];
    const result = await geminiApiClient.generateJson(parts, 'Planning Poker');

    const fibonacciNumbers = [1, 2, 3, 5, 8, 13, 20, 40, 100];
    let point = Number(result.storyPoint) || 3;
    if (!fibonacciNumbers.includes(point)) {
      point = fibonacciNumbers.reduce((prev, curr) =>
        Math.abs(curr - point) < Math.abs(prev - point) ? curr : prev
      );
    }

    return {
      storyKey: formattedKey || null,
      storyPoint: point,
      technicalComplexity: result.technicalComplexity || '',
      qaEffort: result.qaEffort || '',
      risksAndDependencies: result.risksAndDependencies || '',
      reasoning: Array.isArray(result.reasoning) ? result.reasoning : [
        result.technicalComplexity,
        result.qaEffort,
        result.risksAndDependencies,
      ].filter(Boolean),
    };
  },
};
