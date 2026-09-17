import { envConfig } from '../config/envConfig';
import { formatStoryKey } from '../utils/formatters';
import { jiraService } from './jiraService';

const PLATFORM_INFO = {
  FE: { name: 'Frontend (Web UI)', framework: 'Playwright / Selenium' },
  BE: { name: 'Backend (API Services)', framework: 'RestAssured / Java / JUnit' },
  App: { name: 'Mobile App (iOS & Android)', framework: 'Appium / Mobile Automation' }
};

export const geminiService = {
  /**
   * Generates platform-specific, editable test scenarios for selected platforms
   * @param {Object} params
   * @param {string} params.storyKey - e.g. "PROJ-123"
   * @param {Array<string>} params.platforms - e.g. ['App', 'BE', 'FE']
   * @param {string} params.extraGuidance - optional guidance
   * @param {string} params.teamName - active MPTeam
   */
  async generatePlatformScenarios({ storyKey, platforms = ['FE'], extraGuidance = '', teamName = 'Team Alpha' }) {
    const formattedKey = formatStoryKey(storyKey);
    let storyData;

    try {
      // 1. Jira'dan gerçek story detaylarını çek
      storyData = await jiraService.fetchStory(formattedKey);
    } catch (error) {
      throw new Error(`Jira'dan Story bilgileri alınamadı: ${error.message}`);
    }

    const { summary, description, type } = storyData;

    // 2. Gemini API için Prompt hazırla
    const prompt = `
Lütfen aşağıdaki Jira Story detaylarına göre test senaryoları üret.

Jira Story: ${formattedKey} (${type})
Başlık: ${summary}
Açıklama: ${description || 'Açıklama girilmemiş.'}
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

    // 3. Gemini REST API Çağrısı (fetch)
    const apiKey = envConfig.gemini.apiKey;
    const model = envConfig.gemini.model;

    if (!apiKey || apiKey.includes('your_gemini_api_key_here')) {
      throw new Error('Gemini API Anahtarı eksik veya geçersiz. Lütfen .env dosyasını kontrol edin.');
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API Hatası: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      throw new Error('Gemini boş bir sonuç döndürdü.');
    }

    let generatedJson;
    try {
      // Gemini bazen JSON çıktısını markdown bloğu içine alabilir (```json ... ```)
      const cleanText = resultText.replace(/```json/gi, '').replace(/```/gi, '').trim();
      generatedJson = JSON.parse(cleanText);
    } catch (e) {
      console.error("Parse hatası, raw text:", resultText);
      throw new Error('Gemini beklenen JSON formatında cevap vermedi. Lütfen tekrar deneyin.');
    }

    // 4. UI'ın beklediği formata dönüştür
    const scenariosByPlatform = {};
    platforms.forEach((platform) => {
      const meta = PLATFORM_INFO[platform];
      const platformData = generatedJson[platform] || {};
      
      const positiveContent = platformData.positive || `### ${platform} Pozitif Senaryolar\n(İçerik üretilemedi)`;
      const negativeContent = platformData.negative || `### ${platform} Negatif Senaryolar\n(İçerik üretilemedi)`;

      scenariosByPlatform[platform] = {
        platformKey: platform,
        platformName: meta.name,
        framework: meta.framework,
        positive: {
          id: `${platform.toLowerCase()}-pos`,
          title: `Pozitif Senaryolar (${platform})`,
          content: positiveContent,
          selected: true,
        },
        negative: {
          id: `${platform.toLowerCase()}-neg`,
          title: `Negatif & Sınır Senaryoları (${platform})`,
          content: negativeContent,
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
   * Generates comprehensive IPK (İdefix Portfolio Kanban) Demand Form data using Gemini AI
   * @param {Object} params
   * @param {'story'|'text'} params.mode
   * @param {string} [params.storyKey]
   * @param {string} [params.textDescription]
   * @param {Object|null} [params.imageFile] - { mimeType, base64 }
   * @param {string} [params.extraGuidance] - optional extra note for AI in story mode
   * @param {string} [params.teamName]
   */
  async generateIpkDemand({ mode = 'story', storyKey = '', textDescription = '', imageFile = null, extraGuidance = '', teamName = 'Team Alpha' }) {
    let sourceContent = '';
    let formattedKey = '';

    if (mode === 'story') {
      formattedKey = formatStoryKey(storyKey);
      try {
        const storyData = await jiraService.fetchStory(formattedKey);
        sourceContent = `Jira Story No: ${formattedKey}\nBaşlık: ${storyData.summary}\nAçıklama: ${storyData.description || 'Açıklama girilmemiş.'}\nTürü: ${storyData.type || 'Story'}`;
      } catch (err) {
        console.warn('Jira Story detayları alınamadı, genel başlıkla devam ediliyor:', err.message);
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
5. Confidence dropdown için "High", "Medium" veya "Low" değerlerinden birini seç.
6. Demand Size dropdown için "S", "M", "L" veya "XL" değerlerinden birini seç.
7. Show on timeline için "Evet" veya "Hayır" değerlerinden birini seç.

Aşağıdaki JSON şemasına birebir uyumlu çıktı üret:
{
  "assignee": "hsyn deneme",
  "labels": ["otomasyon_ai"],
  "genel": {
    "summary": "...",
    "business_goal": "...",
    "business_goal_detail": "...",
    "as_is": "...",
    "impacted_stakeholders": "...",
    "platform": "Tüm Platformlar",
    "product_area": "...",
    "stakeholder_touchpoint": "...",
    "stakeholder_touchpoint_other": "...",
    "how_stakeholders_affected": "...",
    "demand_category": "...",
    "to_be": "...",
    "demand_trigger": "...",
    "acceptance_criteria": "1. ...\\n2. ...\\n3. ...",
    "urgency_timing": "...",
    "dependent_internal_systems": "...",
    "dependent_external_systems": "...",
    "el_comment": "...",
    "expected_output_value": "...",
    "confidence": "High",
    "demand_size": "L",
    "show_on_timeline": "Evet"
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

    const apiKey = envConfig.gemini.apiKey;
    const model = envConfig.gemini.model;

    if (!apiKey || apiKey.includes('your_gemini_api_key_here')) {
      throw new Error('Gemini API Anahtarı eksik veya geçersiz.');
    }

    const parts = [{ text: prompt }];
    if (imageFile && imageFile.base64) {
      parts.push({
        inlineData: {
          mimeType: imageFile.mimeType || 'image/png',
          data: imageFile.base64
        }
      });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API Hatası: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error('Gemini boş bir sonuç döndürdü.');
    }

    try {
      const cleanText = resultText.replace(/```json/gi, '').replace(/```/gi, '').trim();
      const parsedJson = JSON.parse(cleanText);

      return {
        storyKey: formattedKey || null,
        mode,
        teamName,
        data: parsedJson
      };
    } catch (e) {
      console.error('IPK Gemini JSON Parse Hatası:', resultText);
      throw new Error('Gemini geçerli IPK JSON şemasında yanıt vermedi. Lütfen tekrar deneyin.');
    }
  }
};


