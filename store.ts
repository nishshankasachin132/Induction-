
import { User, UserRole, Module, UserProgress, SiteSettings } from './types';

export const INITIAL_MODULES: Module[] = [
  {
    id: 'm1',
    title: 'Company Culture & Values',
    description: 'Learn about the core values that drive Best Pacific Textiles.',
    orderIndex: 0,
    attachments: [
      {
        id: 'a1',
        title: 'Culture Handbook',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        type: 'application/pdf',
        canDownload: true
      },
      {
        id: 'a2',
        title: 'Welcome Video',
        url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        type: 'video/mp4',
        canDownload: false
      }
    ]
  },
  {
    id: 'm2',
    title: 'Health & Safety Protocols',
    description: 'Essential safety guidelines for our manufacturing facilities.',
    orderIndex: 1,
    attachments: [
      {
        id: 'a3',
        title: 'Safety Procedures PPT',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        type: 'application/pdf',
        canDownload: true
      }
    ]
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    email: 'admin@bestpacific.com',
    fullName: 'System Administrator',
    role: UserRole.ADMIN,
    joinedDate: '2024-01-01',
    isFirstLogin: false,
    password: 'admin'
  }
];

export const INITIAL_SETTINGS: SiteSettings = {
  logoUrl: 'https://picsum.photos/id/20/200/50',
  heroImageUrl: 'https://picsum.photos/id/26/1200/400',
  companyName: 'Best Pacific Textiles (Pvt) Ltd'
};

export const db = {
  getUsers: (): User[] => JSON.parse(localStorage.getItem('bp_users') || JSON.stringify(INITIAL_USERS)),
  setUsers: (users: User[]) => localStorage.setItem('bp_users', JSON.stringify(users)),
  getModules: (): Module[] => JSON.parse(localStorage.getItem('bp_modules') || JSON.stringify(INITIAL_MODULES)),
  setModules: (modules: Module[]) => localStorage.setItem('bp_modules', JSON.stringify(modules)),
  getProgress: (): UserProgress[] => JSON.parse(localStorage.getItem('bp_progress') || '[]'),
  setProgress: (progress: UserProgress[]) => localStorage.setItem('bp_progress', JSON.stringify(progress)),
  getSettings: (): SiteSettings => JSON.parse(localStorage.getItem('bp_settings') || JSON.stringify(INITIAL_SETTINGS)),
  setSettings: (settings: SiteSettings) => localStorage.setItem('bp_settings', JSON.stringify(settings)),
};
