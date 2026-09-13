/**
 * Jira and Test Automation Constants
 */

export const FIXED_AUTOMATION_LABEL = 'otomasyon_ai';
export const DEFAULT_USER = 'Hüseyin Ç.';

export const MP_TEAMS = [
  { id: 'team-search', name: 'Search', lead: 'Ayşe Belgin B.' },
  { id: 'team-promo', name: 'Promo', lead: 'Uğur İ.' },
  { id: 'team-vendor', name: 'Vendor', lead: 'Zeynep İ.' },
  { id: 'team-soupers', name: 'Soupers', lead: 'Ayşegül Ö.' },
  { id: 'team-lots', name: 'Lots', lead: 'Gamze Ç.' },
  { id: 'team-ceo', name: 'CEO', lead: 'Erol D.' },
  { id: 'team-cms', name: 'CMS', lead: 'Bahadır A.' },
];

export const SAMPLE_STORIES = [
  {
    key: 'MP-123',
    summary: 'Kullanıcı Şifre Sıfırlama ve 2FA SMS Doğrulama Akışı',
    type: 'Story',
    priority: 'High',
  },
  {
    key: 'PAY-450',
    summary: 'Sepet Ödeme Adımında 3D Secure 2.0 Entegrasyonu',
    type: 'Story',
    priority: 'Critical',
  },
  {
    key: 'AUTH-89',
    summary: 'OAuth 2.0 ile Google ve Apple ID Sosyal Giriş',
    type: 'Story',
    priority: 'Medium',
  },
  {
    key: 'CART-204',
    summary: 'Kupon Kodu Uygulama ve Çoklu İndirim Hesaplama',
    type: 'Story',
    priority: 'Medium',
  },
];

export const INITIAL_SUBTASKS = [
  {
    id: 'PROJ-122',
    parentKey: 'PROJ-120',
    title: '[TEST] PROJ-120: Kullanıcı Kayıt Formu Validasyonları',
    team: 'Team Alpha',
    label: FIXED_AUTOMATION_LABEL,
    status: 'In Progress',
    createdAt: '10 dakika önce',
    author: DEFAULT_USER,
  },
  {
    id: 'PAY-449',
    parentKey: 'PAY-445',
    title: '[TEST] PAY-445: Masterpass Kart Saklama ve Tokenization Testleri',
    team: 'Team Beta',
    label: FIXED_AUTOMATION_LABEL,
    status: 'Done',
    createdAt: '1 saat önce',
    author: DEFAULT_USER,
  },
  {
    id: 'AUTH-88',
    parentKey: 'AUTH-82',
    title: '[TEST] AUTH-82: JWT Token Yenileme Sınır Testleri',
    team: 'Team Alpha',
    label: FIXED_AUTOMATION_LABEL,
    status: 'Done',
    createdAt: '3 saat önce',
    author: DEFAULT_USER,
  },
];
