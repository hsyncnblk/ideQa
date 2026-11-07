/**
 * @module schemas/actionCardSchemas
 *
 * Dashboard ActionGrid card definitions.
 * Adding/removing/reordering a card only requires editing this file.
 * No component code changes needed.
 */

import {
  Sparkles,
  FileText,
  Code2,
  FileCheck2,
  Bug,
  Calculator,
} from 'lucide-react';

/**
 * @typedef {object} ActionCardSchema
 * @property {string} id - Unique card identifier
 * @property {string} title - Card title
 * @property {string} subtitle - Card description
 * @property {React.ComponentType} icon - Lucide icon component
 * @property {boolean} isActive - Whether the card is enabled
 * @property {string} badge - Badge text
 * @property {string} onClickKey - Key to map to handler props (e.g. 'onOpenCreateSubtask')
 * @property {object} theme - Visual theme configuration
 */

/**
 * Theme presets for action cards.
 * Each theme defines icon background, icon color, and badge styling.
 */
export const CARD_THEMES = {
  jira: {
    iconBg: 'jira-gradient-bg',
    iconColor: 'text-amber-300',
    badge: 'bg-jira-50 text-jira-700 border-jira-200',
    accent: 'text-jira-600',
  },
  dev: {
    iconBg: 'bg-gradient-to-br from-violet-600 to-indigo-700',
    iconColor: 'text-violet-200',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    accent: 'text-indigo-600',
  },
  story: {
    iconBg: 'bg-gradient-to-br from-blue-600 to-cyan-700',
    iconColor: 'text-cyan-200',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    accent: 'text-jira-600',
  },
  bug: {
    iconBg: 'bg-gradient-to-br from-rose-600 to-red-700',
    iconColor: 'text-rose-200',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    accent: 'text-jira-600',
  },
  poker: {
    iconBg: 'bg-gradient-to-br from-amber-500 to-emerald-600',
    iconColor: 'text-amber-100',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    accent: 'text-amber-700',
  },
};

/**
 * Action card definitions.
 * The `onClickKey` is used by ActionGrid to wire up the correct handler from props.
 */
export const ACTION_CARDS = [
  {
    id: 'subtask',
    title: "Story'e Test Subtask Oluştur",
    subtitle: 'Gemini AI ile test senaryoları',
    icon: Sparkles,
    isActive: true,
    badge: 'AI Destekli',
    onClickKey: 'onOpenCreateSubtask',
    theme: CARD_THEMES.jira,
  },
  {
    id: 'dev-subtask',
    title: "Story'e Dev Subtask Oluştur",
    subtitle: "Yazılımcılar için boş Jira subtask'ları",
    icon: Code2,
    isActive: true,
    badge: 'Hızlı',
    onClickKey: 'onOpenCreateDevSubtask',
    theme: CARD_THEMES.dev,
  },
  {
    id: 'ipk',
    title: 'İPK Oluştur',
    subtitle: 'IPK Demand (Talep) otomasyonu',
    icon: FileCheck2,
    isActive: false,
    badge: 'AI Destekli',
    onClickKey: 'onOpenCreateIpk',
    theme: CARD_THEMES.jira,
  },
  {
    id: 'story',
    title: 'Story Oluştur',
    subtitle: "Backlog'a görsel & dosya ile hikaye üretimi",
    icon: FileText,
    isActive: false,
    badge: 'Gemini Vision',
    onClickKey: 'onOpenCreateStory',
    theme: CARD_THEMES.story,
  },
  {
    id: 'bug',
    title: 'Issue / Bug Oluştur',
    subtitle: 'Story bağlantılı issue veya bağımsız bug',
    icon: Bug,
    isActive: false,
    badge: 'Jira Entegre',
    onClickKey: 'onOpenCreateBug',
    theme: CARD_THEMES.bug,
  },
  {
    id: 'poker',
    title: 'Planning Poker Tahmini',
    subtitle: 'AI Story Point efor tahmini & gerekçe',
    icon: Calculator,
    isActive: false,
    badge: 'Scrum AI',
    onClickKey: 'onOpenPlanningPoker',
    theme: CARD_THEMES.poker,
  },
];
