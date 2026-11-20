import { useState } from 'react';
import { MP_TEAMS } from '../constants/jiraConstants';
import { envConfig } from '../config/envConfig';

// localStorage anahtarları
const STORAGE_KEYS = {
  team: 'jira_selected_team',
  setupDone: 'jira_setup_done',
  token: 'jira_token',
  user: 'jira_current_user',
  email: 'jira_email',
  jiraUrl: 'jira_custom_base_url',
};

export function useAuth() {
  // localStorage'dan kayıtlı oturum bilgilerini oku
  const savedToken = localStorage.getItem(STORAGE_KEYS.token) || '';
  const savedUser = localStorage.getItem(STORAGE_KEYS.user) || '';
  const savedEmail = localStorage.getItem(STORAGE_KEYS.email) || '';
  let savedJiraUrl = localStorage.getItem(STORAGE_KEYS.jiraUrl) || '';
  if (savedJiraUrl.includes('your-domain')) {
    localStorage.removeItem(STORAGE_KEYS.jiraUrl);
    savedJiraUrl = '';
  }
  let savedTeam = localStorage.getItem(STORAGE_KEYS.team);
  const savedSetupDone = localStorage.getItem(STORAGE_KEYS.setupDone) === 'true';

  // Eski takım isimlerini otomatik migrate et (Vendor -> Vendor Rangers, CMS -> TheCodeFather)
  if (savedTeam === 'Vendor') {
    savedTeam = 'Vendor Rangers';
    localStorage.setItem(STORAGE_KEYS.team, 'Vendor Rangers');
  } else if (savedTeam === 'CMS') {
    savedTeam = 'TheCodeFather';
    localStorage.setItem(STORAGE_KEYS.team, 'TheCodeFather');
  } else if (savedTeam === 'CEO') {
    savedTeam = 'Ceo';
    localStorage.setItem(STORAGE_KEYS.team, 'Ceo');
  }

  // Kayıtlı takım listede hâlâ var mı kontrol et (büyük/küçük harf toleranslı)
  const matchedTeam = savedTeam
    ? MP_TEAMS.find((t) => t.name.toLowerCase() === savedTeam.toLowerCase())
    : null;
  const isTeamValid = Boolean(matchedTeam);
  const resolvedTeam = matchedTeam ? matchedTeam.name : MP_TEAMS[0].name;
  const effectiveSetupDone = savedSetupDone && isTeamValid;

  const effectiveJiraUrl = (savedJiraUrl || envConfig.jira.baseUrl || '').replace(/\/+$/, '');
  const isAuthValid = Boolean(savedToken && effectiveJiraUrl);

  const [isAuthenticated, setIsAuthenticated] = useState(isAuthValid);
  const [jiraToken, setJiraToken] = useState(savedToken);
  const [jiraEmail, setJiraEmail] = useState(savedEmail);
  const [jiraUrl, setJiraUrl] = useState(effectiveJiraUrl);
  const [currentUser, setCurrentUser] = useState(savedUser);
  const [selectedTeam, setSelectedTeam] = useState(resolvedTeam);
  const [isSetupComplete, setIsSetupComplete] = useState(effectiveSetupDone);

  const login = (token, userInfo, customUrl) => {
    const displayName = userInfo?.displayName || 'Kullanıcı';
    const email = userInfo?.emailAddress || '';
    const accountId = userInfo?.accountId || '';

    setJiraToken(token);
    setJiraEmail(email);
    setCurrentUser(displayName);
    setIsAuthenticated(true);

    localStorage.setItem(STORAGE_KEYS.token, token);
    localStorage.setItem(STORAGE_KEYS.user, displayName);
    localStorage.setItem(STORAGE_KEYS.email, email);
    localStorage.setItem('jira_account_id', accountId);

    if (customUrl) {
      setJiraUrl(customUrl);
      localStorage.setItem(STORAGE_KEYS.jiraUrl, customUrl);
    }

    // Daha önce geçerli bir takım seçilmişse modal'ı tekrar gösterme
    if (!effectiveSetupDone) {
      setIsSetupComplete(false);
    }
  };

  const completeSetup = (teamName) => {
    setSelectedTeam(teamName);
    setIsSetupComplete(true);
    localStorage.setItem(STORAGE_KEYS.team, teamName);
    localStorage.setItem(STORAGE_KEYS.setupDone, 'true');
  };

  const handleSetSelectedTeam = (teamName) => {
    setSelectedTeam(teamName);
    localStorage.setItem(STORAGE_KEYS.team, teamName);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setJiraToken('');
    setJiraEmail('');
    setCurrentUser('');

    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
    // jiraUrl ve email kullanıcıyı hatırlamak için localStorage'da korunur
  };

  return {
    isAuthenticated,
    jiraToken,
    jiraEmail,
    jiraUrl,
    isSetupComplete,
    selectedTeam,
    setSelectedTeam: handleSetSelectedTeam,
    currentUser,
    login,
    completeSetup,
    logout,
  };
}
