/**
 * Utility functions for text, story keys, and formatting
 */

export const formatStoryKey = (key = '') => {
  return key.trim().toUpperCase();
};

export const generateSubtaskKey = (parentStoryKey = 'PROJ-100') => {
  const prefix = parentStoryKey.includes('-') ? parentStoryKey.split('-')[0] : 'PROJ';
  const randomId = Math.floor(Math.random() * 800) + 120;
  return `${prefix}-${randomId}`;
};

export const truncateText = (text = '', maxLength = 60) => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};
