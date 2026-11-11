export const managerSections = ['', 'subscriptions', 'subscribers', 'consultation-services', 'payments', 'templates', 'jobs', 'consultants', 'crawl-reports', 'notifications', 'feedback', 'support', 'analytics', 'account', 'inbox'];

export function managerCanOpen(pathname: string) {
  const parts = pathname.split('/').filter(Boolean);
  return ['admin', 'manager'].includes(parts[0] ?? '') && managerSections.includes(parts[1] ?? '') && parts.length <= 2;
}

export function homeForRole(role: string | null) {
  return role === 'MANAGER' ? '/manager' : role === 'ADMIN' ? '/admin' : role === 'CAREER_CONSULTANT' ? '/consultant' : '/candidate';
}
