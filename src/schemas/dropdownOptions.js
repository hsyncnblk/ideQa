/**
 * @module schemas/dropdownOptions
 *
 * All dropdown / select options used across IPK, Story, Bug forms.
 * Centralized here so that adding a new option never requires touching component code.
 *
 * Each export is an array of strings. The key names match the form field keys
 * used in formSchemas.js via `optionsKey`.
 */

// ── IPK Demand Form Dropdown Options ──────────────────────────────────────────

export const BUSINESS_GOAL = [
  'Gelir Artışı',
  'Maliyet Azaltma',
  'Müşteri Deneyiminin İyileştirilmesi',
  'Operasyonel Verimlilik',
  'Pazara Giriş Hızı',
  'Satıcı / Tedarikçi Deneyiminin İyileştirilmesi',
  'Risk Azaltma / Uyumluluk',
  'Ürün Kalitesi / Güvenilirlik',
  'Diğer',
];

export const IMPACTED_STAKEHOLDERS = [
  'Son Kullanıcı (Alıcı)',
  'Satıcı / Tedarikçi',
  'Operasyon Ekibi',
  'Müşteri Hizmetleri',
  'Finans / Muhasebe',
  'Pazarlama',
  'Teknoloji / Geliştirici',
  'Üst Yönetim',
  'İç Paydaşlar (Tümü)',
  'Dış Paydaşlar (Tümü)',
];

export const PLATFORM = [
  'Tüm Platformlar',
  'Web',
  'iOS',
  'Android',
  'Mobil Web',
  'Back-Office / Admin Panel',
  'API / Entegrasyon',
];

export const STAKEHOLDER_TOUCHPOINT = [
  'Ürün Detay Sayfası',
  'Sepet & Ödeme Akışı',
  'Arama & Kategori Listesi',
  'Ana Sayfa & Banner',
  'Satıcı Paneli',
  'Sipariş Yönetimi',
  'Kargo & Teslimat',
  'İade & İptal Akışı',
  'Bildirim & E-posta',
  'Müşteri Hizmetleri Arayüzü',
  'Raporlama & Analitik',
  'Diğer',
];

export const HOW_STAKEHOLDERS_AFFECTED = [
  'Kullanıcı Deneyimi İyileşir',
  'İşlem Süresi Kısalır',
  'Hata Oranı Düşer',
  'Gelir Artar',
  'Maliyet Düşer',
  'Yeni Özellik / Kapasite Kazanılır',
  'Mevcut Sorun Giderilir',
  'Risk Azalır',
  'Uyumluluk Sağlanır',
];

export const DEMAND_CATEGORY = [
  'Yeni Özellik Geliştirme',
  'Mevcut Özellik İyileştirme',
  'Hata Düzeltme',
  'Teknik Borç',
  'Entegrasyon',
  'Altyapı / Platform',
  'Güvenlik',
  'Performans',
  'UX / Tasarım',
  'Veri & Raporlama',
  'Regülasyon / Uyumluluk',
];

export const DEMAND_TRIGGER = [
  'Müşteri Geri Bildirimi',
  'Satıcı Talebi',
  'İş Stratejisi',
  'Rekabet Analizi',
  'Yasal / Regülatif Zorunluluk',
  'Teknik Borç / Altyapı İhtiyacı',
  'Operasyonel Süreç İyileştirme',
  'Veri / Analitik Bulgusu',
  'Mevcut Hata / Sorun',
  'Üst Yönetim Kararı',
];

export const CONFIDENCE = ['High', 'Medium', 'Low'];

export const DEMAND_SIZE = ['S', 'M', 'L', 'XL'];

export const SHOW_ON_TIMELINE = ['Evet', 'Hayır'];

// ── Bug / Issue Severity Options ──────────────────────────────────────────────

export const BUG_SEVERITY = ['Blocker', 'Critical', 'Major', 'Minor', 'Trivial'];

// ── Lookup Map for DynamicFormRenderer ─────────────────────────────────────────

/**
 * Maps optionsKey strings (used in formSchemas) to their option arrays.
 * DynamicFormRenderer uses this to resolve dropdown options at render time.
 */
export const OPTIONS_REGISTRY = {
  BUSINESS_GOAL,
  IMPACTED_STAKEHOLDERS,
  PLATFORM,
  STAKEHOLDER_TOUCHPOINT,
  HOW_STAKEHOLDERS_AFFECTED,
  DEMAND_CATEGORY,
  DEMAND_TRIGGER,
  CONFIDENCE,
  DEMAND_SIZE,
  SHOW_ON_TIMELINE,
  BUG_SEVERITY,
};
