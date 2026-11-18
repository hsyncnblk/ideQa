/**
 * Jira and Test Automation Constants
 */

export const FIXED_AUTOMATION_LABEL = 'otomasyon_ai';
export const DEFAULT_USER = 'Hüseyin Ç.';

/**
 * Jira Field Mappings by Team
 * Maps selected team to its Jira Components (Bileşenler) and MP TEAM field values.
 * In case of null/empty component, the field is left empty / omitted.
 */
export const TEAM_JIRA_MAPPINGS = {
  'Search': {
    component: 'SEARCH',
    mpTeam: 'Search-u Lisan',
  },
  'Promo': {
    component: 'PROMO',
    mpTeam: 'CoW',
  },
  'Vendor Rangers': {
    component: 'ONBOARDING',
    mpTeam: 'Vendor Rangers',
  },
  'Soupers': {
    component: 'OTOMASYON',
    mpTeam: 'Soupers',
  },
  'Lots': {
    component: 'OTOMASYON',
    mpTeam: 'Lord Of The Sprints',
  },
  'Ceo': {
    component: 'ESCROW',
    mpTeam: 'CEO',
  },
  'TheCodeFather': {
    component: 'OTOMASYON',
    mpTeam: 'TheCodeFather',
  },
  'PIMFix': {
    component: 'PIM KOKPIT',
    mpTeam: 'PIMFix',
  },
  // Geriye dönük uyumluluk ve alternatif eşleşmeler
  'Vendor': {
    component: 'ONBOARDING',
    mpTeam: 'Vendor Rangers',
  },
  'CMS': {
    component: 'OTOMASYON',
    mpTeam: 'TheCodeFather',
  },
  'CEO': {
    component: 'ESCROW',
    mpTeam: 'CEO',
  },
};

/**
 * Resolves Jira field mappings (component & MP TEAM) for a given team name.
 * @param {string} teamName
 * @returns {{ component: string | null, mpTeam: string | null }}
 */
export function getTeamJiraMapping(teamName) {
  if (!teamName || typeof teamName !== 'string') {
    return { component: null, mpTeam: null };
  }
  const trimmed = teamName.trim();
  if (TEAM_JIRA_MAPPINGS[trimmed]) {
    return TEAM_JIRA_MAPPINGS[trimmed];
  }
  const foundKey = Object.keys(TEAM_JIRA_MAPPINGS).find(
    (k) => k.toLowerCase() === trimmed.toLowerCase()
  );
  return foundKey ? TEAM_JIRA_MAPPINGS[foundKey] : { component: null, mpTeam: null };
}

export const MP_TEAMS = [
  {
    id: 'team-search',
    name: 'Search',
    lead: 'Ayşe Belgin B.',
    component: 'SEARCH',
    mpTeam: 'Search-u Lisan',
    domain: 'Search-u Lisan',
  },
  {
    id: 'team-promo',
    name: 'Promo',
    lead: 'Uğur İ.',
    component: 'PROMO',
    mpTeam: 'CoW',
    domain: 'CoW',
  },
  {
    id: 'team-vendor-rangers',
    name: 'Vendor Rangers',
    lead: 'Zeynep İ.',
    component: 'ONBOARDING',
    mpTeam: 'Vendor Rangers',
    domain: 'Vendor Rangers',
  },
  {
    id: 'team-soupers',
    name: 'Soupers',
    lead: 'Ayşegül Ö.',
    component: null,
    mpTeam: 'Soupers',
    domain: 'Soupers',
  },
  {
    id: 'team-lots',
    name: 'Lots',
    lead: 'Gamze Ç.',
    component: null,
    mpTeam: 'Lord Of The Sprints',
    domain: 'Lord Of The Sprints',
  },
  {
    id: 'team-ceo',
    name: 'Ceo',
    lead: 'Erol D.',
    component: 'ESCROW',
    mpTeam: 'CEO',
    domain: 'CEO',
  },
  {
    id: 'team-thecodefather',
    name: 'TheCodeFather',
    lead: 'Bahadır A.',
    component: null,
    mpTeam: 'TheCodeFather',
    domain: 'TheCodeFather',
  },
  {
    id: 'team-pimfix',
    name: 'PIMFix',
    lead: 'PIM Ekibi',
    component: 'PIM KOKPIT',
    mpTeam: 'PIMFix',
    domain: 'PIMFix',
  },
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
    team: 'Search',
    label: FIXED_AUTOMATION_LABEL,
    status: 'In Progress',
    createdAt: '10 dakika önce',
    author: DEFAULT_USER,
  },
  {
    id: 'PAY-449',
    parentKey: 'PAY-445',
    title: '[TEST] PAY-445: Masterpass Kart Saklama ve Tokenization Testleri',
    team: 'Vendor Rangers',
    label: FIXED_AUTOMATION_LABEL,
    status: 'Done',
    createdAt: '1 saat önce',
    author: DEFAULT_USER,
  },
  {
    id: 'AUTH-88',
    parentKey: 'AUTH-82',
    title: '[TEST] AUTH-82: JWT Token Yenileme Sınır Testleri',
    team: 'TheCodeFather',
    label: FIXED_AUTOMATION_LABEL,
    status: 'Done',
    createdAt: '3 saat önce',
    author: DEFAULT_USER,
  },
];
