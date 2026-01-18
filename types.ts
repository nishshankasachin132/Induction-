
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export interface Attachment {
  id: string;
  title: string;
  url: string;
  type: string;
  canDownload: boolean;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  joinedDate: string;
  password?: string;
  isFirstLogin: boolean;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  orderIndex: number;
  attachments: Attachment[];
}

export interface UserProgress {
  userId: string;
  moduleId: string;
  isCompleted: boolean;
  dateCompleted?: string;
}

export interface SiteSettings {
  logoUrl: string;
  heroImageUrl: string;
  companyName: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
