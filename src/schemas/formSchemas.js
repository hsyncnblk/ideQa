/**
 * @module schemas/formSchemas
 *
 * Declarative form schemas for dynamic rendering.
 * Each schema defines sections → fields. DynamicFormRenderer reads these
 * at runtime to generate forms without any hardcoded JSX per field.
 *
 * Field types: 'text' | 'textarea' | 'dropdown' | 'radio' | 'number'
 * optionsKey: references a key in dropdownOptions.OPTIONS_REGISTRY
 */

// ── IPK Demand Form Schema ────────────────────────────────────────────────────

export const IPK_FORM_SCHEMA = {
  id: 'ipk_demand',
  label: 'IPK Demand Formu',
  sections: [
    {
      key: 'genel',
      label: '📋 Genel Bilgiler',
      icon: 'FileText',
      allowFileUpload: true,
      fields: [
        { key: 'summary', label: 'Özet Başlık', type: 'text', required: true, maxLength: 200, placeholder: 'IPK Demand başlığını girin...' },
        { key: 'business_goal', label: 'İş Hedefi', type: 'dropdown', optionsKey: 'BUSINESS_GOAL', required: true },
        { key: 'business_goal_detail', label: 'İş Hedefi Detayı', type: 'textarea', maxLength: 1000, rows: 3, placeholder: 'İş hedefinin detaylı açıklamasını girin...' },
        { key: 'as_is', label: 'Mevcut Süreç (As-Is)', type: 'textarea', maxLength: 1000, rows: 3, placeholder: 'Mevcut durumu açıklayın...' },
        { key: 'to_be', label: 'Gelecek Süreç (To-Be)', type: 'textarea', maxLength: 1000, rows: 3, placeholder: 'Hedeflenen durumu açıklayın...' },
        { key: 'demand_trigger', label: 'Talep Tetikleyicisi', type: 'dropdown', optionsKey: 'DEMAND_TRIGGER' },
        { key: 'impacted_stakeholders', label: 'Etkilenen Paydaşlar', type: 'dropdown', optionsKey: 'IMPACTED_STAKEHOLDERS' },
        { key: 'platform', label: 'Platform', type: 'dropdown', optionsKey: 'PLATFORM' },
        { key: 'product_area', label: 'Ürün Alanı', type: 'text', maxLength: 200, placeholder: 'Örn: Ödeme, Sepet, Arama...' },
        { key: 'stakeholder_touchpoint', label: 'Paydaş Temas Noktası', type: 'dropdown', optionsKey: 'STAKEHOLDER_TOUCHPOINT' },
        { key: 'stakeholder_touchpoint_other', label: 'Diğer Temas Noktası', type: 'text', maxLength: 200, placeholder: 'Listede yoksa buraya yazın...', dependsOn: { field: 'stakeholder_touchpoint', value: 'Diğer' } },
        { key: 'how_stakeholders_affected', label: 'Paydaş Etkilenme Şekli', type: 'dropdown', optionsKey: 'HOW_STAKEHOLDERS_AFFECTED' },
        { key: 'demand_category', label: 'Talep Kategorisi', type: 'dropdown', optionsKey: 'DEMAND_CATEGORY' },
        { key: 'acceptance_criteria', label: 'Kabul Kriterleri', type: 'textarea', maxLength: 2000, rows: 5, required: true, placeholder: '1. Kullanıcı X yapabilmeli\n2. Sistem Y kontrol etmeli\n3. ...' },
        { key: 'urgency_timing', label: 'Aciliyet & Zamanlama', type: 'text', maxLength: 300, placeholder: 'Beklenen teslim süresi veya sprint hedefi...' },
        { key: 'dependent_internal_systems', label: 'Bağımlı İç Sistemler', type: 'text', maxLength: 300, placeholder: 'Örn: Ödeme servisi, Stok yönetimi...' },
        { key: 'dependent_external_systems', label: 'Bağımlı Dış Sistemler', type: 'text', maxLength: 300, placeholder: 'Örn: SMS gateway, Kargo API...' },
        { key: 'el_comment', label: 'EL Yorumu', type: 'textarea', maxLength: 500, rows: 2, placeholder: 'Engineering Lead yorumu...' },
        { key: 'expected_output_value', label: 'Beklenen Çıktı Değeri', type: 'text', maxLength: 300, placeholder: 'Beklenen iş değeri veya KPI etkisi...' },
        { key: 'confidence', label: 'Güven Seviyesi', type: 'dropdown', optionsKey: 'CONFIDENCE' },
        { key: 'demand_size', label: 'Demand Büyüklüğü', type: 'dropdown', optionsKey: 'DEMAND_SIZE' },
        { key: 'show_on_timeline', label: 'Timeline\'da Göster', type: 'dropdown', optionsKey: 'SHOW_ON_TIMELINE' },
      ],
    },
    {
      key: 'etki_kapsami',
      label: '🎯 Etki Kapsamı',
      icon: 'Layers',
      fields: [
        { key: 'scope_channel', label: 'Kanal', type: 'text', maxLength: 200, placeholder: 'Örn: Web, Mobil, Tüm Kanallar...' },
        { key: 'scope_segment', label: 'Segment', type: 'text', maxLength: 200, placeholder: 'Örn: B2C, B2B, Premium...' },
        { key: 'scope_category', label: 'Kategori', type: 'text', maxLength: 200, placeholder: 'Ürün kategorisi...' },
        { key: 'scope_location', label: 'Lokasyon', type: 'text', maxLength: 200, placeholder: 'Örn: Türkiye, Global...' },
        { key: 'scope_seller_group', label: 'Satıcı Grubu', type: 'text', maxLength: 200, placeholder: 'Örn: Tüm Satıcılar, Premium Satıcılar...' },
      ],
    },
    {
      key: 'finansal_etki',
      label: '💰 Finansal Etki Tahmini',
      icon: 'DollarSign',
      fields: [
        { key: 'financial_aov', label: 'AOV Etkisi', type: 'text', maxLength: 200, placeholder: 'Ortalama Sipariş Değeri etkisi...' },
        { key: 'financial_cr', label: 'CR Etkisi', type: 'text', maxLength: 200, placeholder: 'Dönüşüm Oranı etkisi...' },
        { key: 'financial_revenue', label: 'Gelir Etkisi', type: 'text', maxLength: 200, placeholder: 'Tahmini gelir etkisi...' },
        { key: 'financial_orders', label: 'Sipariş Etkisi', type: 'text', maxLength: 200, placeholder: 'Sipariş sayısı etkisi...' },
        { key: 'financial_traffic', label: 'Trafik Etkisi', type: 'text', maxLength: 200, placeholder: 'Trafik/ziyaretçi etkisi...' },
      ],
    },
  ],
};

// ── IPK Initial Form State (matches schema structure) ─────────────────────────

export const IPK_INITIAL_STATE = {
  assignee: 'hsyn deneme',
  labels: ['otomasyon_ai'],
  genel: {
    summary: '',
    business_goal: 'Gelir Artışı',
    business_goal_detail: '',
    as_is: '',
    impacted_stakeholders: 'Son Kullanıcı (Alıcı)',
    platform: 'Tüm Platformlar',
    product_area: '',
    stakeholder_touchpoint: 'Ürün Detay Sayfası',
    stakeholder_touchpoint_other: '',
    how_stakeholders_affected: 'Kullanıcı Deneyimi İyileşir',
    demand_category: 'Yeni Özellik Geliştirme',
    to_be: '',
    demand_trigger: 'Müşteri Geri Bildirimi',
    acceptance_criteria: '',
    urgency_timing: '',
    dependent_internal_systems: '',
    dependent_external_systems: '',
    el_comment: '',
    expected_output_value: '',
    confidence: 'High',
    demand_size: 'L',
    show_on_timeline: 'Evet',
  },
  etki_kapsami: {
    scope_channel: '',
    scope_segment: '',
    scope_category: '',
    scope_location: '',
    scope_seller_group: '',
  },
  finansal_etki: {
    financial_aov: '',
    financial_cr: '',
    financial_revenue: '',
    financial_orders: '',
    financial_traffic: '',
  },
};

// ── Story Form Initial State ──────────────────────────────────────────────────

export const STORY_INITIAL_STATE = {
  summary: '',
  userStory: '',
  background: '',
  acceptanceCriteria: [],
  technicalNotes: '',
};

// ── Bug/Issue Form Initial State ──────────────────────────────────────────────

export const BUG_INITIAL_STATE = {
  summary: '',
  stepsToReproduce: [],
  actualResult: '',
  expectedResult: '',
  environment: 'Web / Chrome / Test Ortamı',
  severity: 'Major',
};

// ── Platform Info (for test scenarios) ────────────────────────────────────────

export const PLATFORM_INFO = {
  FE: { name: 'Frontend (Web UI)', framework: 'Playwright / Selenium' },
  BE: { name: 'Backend (API Services)', framework: 'RestAssured / Java / JUnit' },
  App: { name: 'Mobile App (iOS & Android)', framework: 'Appium / Mobile Automation' },
};
