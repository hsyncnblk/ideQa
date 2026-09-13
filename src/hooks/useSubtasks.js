import { useState, useEffect } from 'react';
import { jiraService } from '../services/jiraService';

export function useSubtasks() {
  const [subtasks, setSubtasks] = useState([]);
  const [activeSubtaskDetail, setActiveSubtaskDetail] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  useEffect(() => {
    async function loadRecent() {
      setIsLoadingInitial(true);
      try {
        const recent = await jiraService.fetchRecentSubtasks();
        if (recent && recent.length > 0) {
          setSubtasks(recent);
        }
      } catch (err) {
        console.error("Recent subtasks yüklenirken hata:", err);
      } finally {
        setIsLoadingInitial(false);
      }
    }
    loadRecent();
  }, []);

  const createBulkSubtasks = async ({ storyKey, storySummary, selectedPlatforms, scenarios, team, author }) => {
    setIsCreating(true);
    try {
      const result = await jiraService.createBulkPlatformSubtasks({
        storyKey,
        storySummary,
        selectedPlatforms,
        scenarios,
        team,
        author,
      });

      // Prepend newly created subtasks to the list
      setSubtasks((prev) => [...result.subtasks, ...prev]);
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
