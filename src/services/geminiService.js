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
};

