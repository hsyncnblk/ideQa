import { useState } from 'react';
import { MP_TEAMS } from '../constants/jiraConstants';

// localStorage anahtarları
const STORAGE_KEYS = {
  team: 'jira_selected_team',
  setupDone: 'jira_setup_done',
  token: 'jira_token',
  user: 'jira_current_user',
  email: 'jira_email',
};

export function useAuth() {
  // localStorage'dan kayıtlı oturum bilgilerini oku
  const savedToken = localStorage.getItem(STORAGE_KEYS.token) || '';
  const savedUser = localStorage.getItem(STORAGE_KEYS.user) || '';
  const savedEmail = localStorage.getItem(STORAGE_KEYS.email) || '';
  const savedTeam = localStorage.getItem(STORAGE_KEYS.team);
  const savedSetupDone = localStorage.getItem(STORAGE_KEYS.setupDone) === 'true';

  // Kayıtlı takım listede hâlâ var mı kontrol et
  const isTeamValid = savedTeam && MP_TEAMS.some(t => t.name === savedTeam);
  const effectiveSetupDone = savedSetupDone && isTeamValid;

  const [isAuthenticated, setIsAuthenticated] = useState(!!savedToken);
  const [jiraToken, setJiraToken] = useState(savedToken);
  const [jiraEmail, setJiraEmail] = useState(savedEmail);
  const [currentUser, setCurrentUser] = useState(savedUser);
  const [selectedTeam, setSelectedTeam] = useState(isTeamValid ? savedTeam : MP_TEAMS[0].name);
  const [isSetupComplete, setIsSetupComplete] = useState(effectiveSetupDone);

  const login = (token, userInfo) => {
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
    localStorage.removeItem(STORAGE_KEYS.email);
    // Setup durumunu sıfırlama — takım seçimi kalıcı
  };

  return {
    isAuthenticated,
    jiraToken,
    jiraEmail,
    isSetupComplete,
    selectedTeam,
    setSelectedTeam: handleSetSelectedTeam,
    currentUser,
    login,
    completeSetup,
    logout,
  };
}
