import React, { useState } from 'react';
import Header from './components/layout/Header';
import Toast from './components/layout/Toast';
import LoginScreen from './components/auth/LoginScreen';
import TeamSetupModal from './components/auth/TeamSetupModal';
import Dashboard from './components/dashboard/Dashboard';
import SubtaskDrawer from './components/subtask/SubtaskDrawer';
import SubtaskDetailModal from './components/subtask/SubtaskDetailModal';
import IpkDrawer from './components/ipk/IpkDrawer';
import StoryDrawer from './components/story/StoryDrawer';
import BugDrawer from './components/bug/BugDrawer';
import PlanningPokerDrawer from './components/poker/PlanningPokerDrawer';
import StatsModal from './components/stats/StatsModal';
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
  const [isDevSubtaskDrawerOpen, setIsDevSubtaskDrawerOpen] = useState(false);
  const [isIpkDrawerOpen, setIsIpkDrawerOpen] = useState(false);
  const [isStoryDrawerOpen, setIsStoryDrawerOpen] = useState(false);
  const [isBugDrawerOpen, setIsBugDrawerOpen] = useState(false);
  const [isPokerDrawerOpen, setIsPokerDrawerOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const handleStoryCreated = (result) => {
    setToast({
      message: result.message || 'Story başarıyla Backlog\'a eklendi!',
      team: selectedTeam,
      count: 1,
      platforms: ['Story Backlog'],
      subtaskKey: result.key,
    });
  };

  const handleBugCreated = (result) => {
    setToast({
      message: result.message || 'Hata kaydı başarıyla oluşturuldu!',
      team: selectedTeam,
      count: 1,
      platforms: ['Jira Issue/Bug'],
      subtaskKey: result.key,
    });
  };

  const handlePokerCompleted = (result) => {
    setToast({
      message: result.message || 'Planning Poker puanı Jira\'ya aktarıldı!',
      team: selectedTeam,
      count: 1,
      platforms: [`${result.storyPoint} SP`],
      subtaskKey: result.key,
    });
  };

  const handleSubtaskCreated = async ({ storyKey, storySummary, stories, platforms, scenarios, team, isDevMode }) => {
    // Dev modda birden fazla story gelebilir; tek story akışı da aynı döngüden geçer
    const targets = stories && stories.length > 0 ? stories : [{ storyKey, storySummary }];
    const results = [];
    const failures = [];

    for (const target of targets) {
      try {
        const result = await createBulkSubtasks({
          storyKey: target.storyKey,
          storySummary: target.storySummary,
          selectedPlatforms: platforms,
          scenarios,
          team,
          author: currentUser,
          isDevMode,
        });
        results.push(result);
      } catch (err) {
        failures.push({ storyKey: target.storyKey, error: err });
      }
    }

    if (results.length === 0) {
      throw failures[0]?.error || new Error('Subtask oluşturulamadı.');
    }

    const totalCount = results.reduce((sum, r) => sum + (r.count || 0), 0);
    const message = targets.length === 1
      ? results[0].message
      : `${results.length} story için toplam ${totalCount} adet subtask oluşturuldu.` +
      (failures.length > 0 ? ` Başarısız: ${failures.map((f) => f.storyKey).join(', ')}` : '');

    setToast({
      message,
      team: team,
      count: totalCount,
      platforms: [...new Set(results.flatMap((r) => r.platforms || []))],
      subtaskKey: results[0].subtasks[0]?.id,
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
            onOpenStats={() => setIsStatsOpen(true)}
          />

          <main className="flex-1">
            <Dashboard
              user={currentUser}
              selectedTeam={selectedTeam}
              onOpenCreateSubtask={() => setIsDrawerOpen(true)}
              onOpenCreateIpk={() => setIsIpkDrawerOpen(true)}
              onOpenCreateDevSubtask={() => setIsDevSubtaskDrawerOpen(true)}
              onOpenCreateStory={() => setIsStoryDrawerOpen(true)}
              onOpenCreateBug={() => setIsBugDrawerOpen(true)}
              onOpenPlanningPoker={() => setIsPokerDrawerOpen(true)}
              subtasks={subtasks}
              onSelectSubtask={(task) => setActiveSubtaskDetail(task)}
            />
          </main>

          {/* 4. Test Subtask Drawer */}
          <SubtaskDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            selectedTeam={selectedTeam}
            onSubtaskCreated={handleSubtaskCreated}
            isCreatingSubtask={isCreating}
            mode="test"
          />

          {/* 4b. Dev Subtask Drawer */}
          <SubtaskDrawer
            isOpen={isDevSubtaskDrawerOpen}
            onClose={() => setIsDevSubtaskDrawerOpen(false)}
            selectedTeam={selectedTeam}
            onSubtaskCreated={handleSubtaskCreated}
            isCreatingSubtask={isCreating}
            mode="dev"
          />

          {/* 5. IPK (İdefix Portfolio Kanban) Demand Drawer Akışı */}
          <IpkDrawer
            isOpen={isIpkDrawerOpen}
            onClose={() => setIsIpkDrawerOpen(false)}
            selectedTeam={selectedTeam}
            onIpkCreated={handleIpkCreated}
          />

          {/* 6. Story Oluştur Drawer Akışı (Gemini Vision Multimodal & Backlog) */}
          <StoryDrawer
            isOpen={isStoryDrawerOpen}
            onClose={() => setIsStoryDrawerOpen(false)}
            selectedTeam={selectedTeam}
            onStoryCreated={handleStoryCreated}
          />

          {/* 7. Issue / Bug Oluştur Drawer Akışı */}
          <BugDrawer
            isOpen={isBugDrawerOpen}
            onClose={() => setIsBugDrawerOpen(false)}
            selectedTeam={selectedTeam}
            onBugCreated={handleBugCreated}
          />

          {/* 8. Planning Poker Tahmini Drawer Akışı */}
          <PlanningPokerDrawer
            isOpen={isPokerDrawerOpen}
            onClose={() => setIsPokerDrawerOpen(false)}
            selectedTeam={selectedTeam}
            onPokerCompleted={handlePokerCompleted}
          />

          {/* Stats Modal */}
          <StatsModal
            isOpen={isStatsOpen}
            onClose={() => setIsStatsOpen(false)}
            subtasks={subtasks}
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

