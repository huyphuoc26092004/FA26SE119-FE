import type { AdminDashboardData } from '../types/admin';
import { notConnected } from './apiPending';

// TODO(api): GET /api/v1/admin/dashboard
export async function getAdminDashboardData(timeRange: '24h' | '7d' | '30d' | '90d' = '30d'): Promise<AdminDashboardData> {
  return notConnected('GET /api/v1/admin/dashboard', timeRange);
}

// TODO(api): BE chưa có API
export async function toggleMaintenanceMode(enable: boolean): Promise<{ maintenance: boolean; message: string }> {
  return notConnected('BE chưa có API', enable);
}

// TODO(api): BE chưa có API
export async function purgeSystemCache(): Promise<{ clearedKeysCount: number; freedMemoryMB: number }> {
  return notConnected('BE chưa có API');
}

// TODO(api): PUT /api/v1/admin/users/{id}
export async function toggleUserStatus(userId: string, newStatus: 'ACTIVE' | 'SUSPENDED'): Promise<{ userId: string; status: 'ACTIVE' | 'SUSPENDED' }> {
  return notConnected('PUT /api/v1/admin/users/{id}', userId, newStatus);
}
