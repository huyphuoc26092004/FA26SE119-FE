import type { UserRole } from './domain';

export type UserAccountStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

export type UserSubscriptionTier = 'free' | 'pro' | 'executive' | 'consultant' | 'enterprise';

export interface UserPermission {
  key: string;
  name: string;
  description: string;
  category: 'core' | 'ai' | 'consultation' | 'admin';
}

export interface UserActivityLog {
  id: string;
  timestamp: string;
  action: string;
  ipAddress: string;
  userAgent?: string;
  details: string;
}

export interface AdminManagedUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserAccountStatus;
  isVerified: boolean;
  avatar?: string;
  createdAt: string;
  lastActiveAt: string;
  planId: UserSubscriptionTier;
  planName: string;
  tokenMonthlyQuota: number;
  tokensUsedThisMonth: number;
  suspendedReason?: string;
  suspendedAt?: string;
  location?: string;
  headline?: string;
  bio?: string;
  notes?: string;
  permissions: string[];
  recentActivities: UserActivityLog[];
}

export interface CreateUserPayload {
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status?: UserAccountStatus;
  isVerified?: boolean;
  planId?: UserSubscriptionTier;
  initialPassword?: string;
  location?: string;
  headline?: string;
  notes?: string;
  permissions?: string[];
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  status?: UserAccountStatus;
  isVerified?: boolean;
  planId?: UserSubscriptionTier;
  location?: string;
  headline?: string;
  notes?: string;
  permissions?: string[];
  suspendedReason?: string;
}

export interface UserFilterParams {
  search?: string;
  role?: UserRole | 'ALL';
  status?: UserAccountStatus | 'ALL';
  planId?: UserSubscriptionTier | 'ALL';
  sortBy?: 'newest' | 'oldest' | 'name_asc' | 'tokens_desc';
}
