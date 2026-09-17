import React, { useState } from 'react';
import Header from './components/layout/Header';
import Toast from './components/layout/Toast';
import LoginScreen from './components/auth/LoginScreen';
import TeamSetupModal from './components/auth/TeamSetupModal';
import Dashboard from './components/dashboard/Dashboard';
import SubtaskDrawer from './components/subtask/SubtaskDrawer';
import SubtaskDetailModal from './components/subtask/SubtaskDetailModal';
import IpkDrawer from './components/ipk/IpkDrawer';
import { useAuth } from './hooks/useAuth';
import { useSubtasks } from './hooks/useSubtasks';

export default function App() {
  const {
    isAuthenticated,
    isSetupComplete,
    selectedTeam,
    setSelectedTeam,
    currentUser,
    login,
    completeSetup,
    logout,
  } = useAuth();

  const {
    subtasks,
    activeSubtaskDetail,
    setActiveSubtaskDetail,
    isCreating,
    createBulkSubtasks,
  } = useSubtasks();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isIpkDrawerOpen, setIsIpkDrawerOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSubtaskCreated = async ({ storyKey, storySummary, platforms, scenarios, team }) => {
    const result = await createBulkSubtasks({
      storyKey,
      storySummary,
      selectedPlatforms: platforms,
      scenarios,
      team,
      author: currentUser,
    });

    setToast({
      message: result.message,
      team: team,
      count: result.count,
      platforms: result.platforms,
      subtaskKey: result.subtasks[0]?.id,
    });
  };

  const handleIpkCreated = (result) => {
    setToast({
      message: result.message || 'IPK Demand kaydı başarıyla oluşturuldu!',
      team: selectedTeam,
      count: 1,
      platforms: ['IPK Demand'],
      subtaskKey: result.key,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-jira-600 selection:text-white">
      
      {/* 1. Giriş Ekranı */}
      {!isAuthenticated ? (
        <LoginScreen onLoginSuccess={login} />
      ) : (
        <>
          {/* 2. Post-Login MPTeam Kurulum Modalı */}
          {!isSetupComplete && (
            <TeamSetupModal onTeamConfirmed={completeSetup} />
          )}

          {/* 3. Header & Minimalist Dashboard */}
          <Header
            user={currentUser}
            selectedTeam={selectedTeam}
            onSelectTeam={setSelectedTeam}
            onLogout={logout}
          />

          <main className="flex-1">
            <Dashboard
              user={currentUser}
              selectedTeam={selectedTeam}
              onOpenCreateSubtask={() => setIsDrawerOpen(true)}
              onOpenCreateIpk={() => setIsIpkDrawerOpen(true)}
              subtasks={subtasks}
              onSelectSubtask={(task) => setActiveSubtaskDetail(task)}
            />
          </main>

          {/* 4. Gelişmiş "Story'e Subtask Test Oluştur" Drawer Akışı */}
          <SubtaskDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            selectedTeam={selectedTeam}
            onSubtaskCreated={handleSubtaskCreated}
            isCreatingSubtask={isCreating}
          />

          {/* 5. IPK (İdefix Portfolio Kanban) Demand Drawer Akışı */}
          <IpkDrawer
            isOpen={isIpkDrawerOpen}
            onClose={() => setIsIpkDrawerOpen(false)}
            selectedTeam={selectedTeam}
            onIpkCreated={handleIpkCreated}
          />

          {/* Subtask Detay Modalı */}
          <SubtaskDetailModal
            subtask={activeSubtaskDetail}
            onClose={() => setActiveSubtaskDetail(null)}
          />

          {/* 6. Jira Başarı Toast Bildirimi */}
          <Toast toast={toast} onClose={() => setToast(null)} />
        </>
      )}

    </div>
  );
}

