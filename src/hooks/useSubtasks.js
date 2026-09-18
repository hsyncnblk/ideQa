import { useState, useEffect } from 'react';
import { jiraService } from '../services/jiraService';

const STORAGE_KEY = 'jira_recent_subtasks';
const MAX_RECORDS = 20;

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_RECORDS)));
  } catch {}
}

export function useSubtasks() {
  const [subtasks, setSubtasks] = useState(() => loadFromStorage());
  const [activeSubtaskDetail, setActiveSubtaskDetail] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Sayfa açılışında Jira'dan son kayıtları çek, local listeyle birleştir
  useEffect(() => {
    async function loadRecent() {
      try {
        const recent = await jiraService.fetchRecentSubtasks();
        if (recent && recent.length > 0) {
          setSubtasks(prev => {
            // Jira'dan gelenleri öne al, mevcut local-only kayıtları sonra ekle
            const jiraIds = new Set(recent.map(r => r.id));
            const localOnly = prev.filter(p => !jiraIds.has(p.id));
            const merged = [...recent, ...localOnly].slice(0, MAX_RECORDS);
            saveToStorage(merged);
            return merged;
          });
        }
      } catch (err) {
        console.warn('Jira kayıtları çekilemedi, yerel liste kullanılıyor:', err.message);
      }
    }
    loadRecent();
  }, []);

  const createBulkSubtasks = async ({ storyKey, storySummary, selectedPlatforms, scenarios, team, author, isDevMode }) => {
    setIsCreating(true);
    try {
      const result = await jiraService.createBulkPlatformSubtasks({
        storyKey,
        storySummary,
        selectedPlatforms,
        scenarios,
        team,
        author,
        isDevMode,
      });

      // Yeni oluşturulanları öne ekle, max 20 tut, localStorage'a yaz
      setSubtasks(prev => {
        const updated = [...result.subtasks, ...prev].slice(0, MAX_RECORDS);
        saveToStorage(updated);
        return updated;
      });
      return result;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    subtasks,
    activeSubtaskDetail,
    setActiveSubtaskDetail,
    isCreating,
    createBulkSubtasks,
  };
}
