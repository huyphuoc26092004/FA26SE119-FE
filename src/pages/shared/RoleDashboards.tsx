import {
  Activity,
  ClipboardList,
  Users,
  Wallet,
  ShieldCheck,
  Server,
} from 'lucide-react';
import { Card, PageTitle, StatCard, Badge } from '../../components/ui';
import { useTranslation } from '../../i18n';

export function ConsultantDashboard() {
  const { t } = useTranslation();

  return (
    <>
      <PageTitle
        title={t('roleDashboards.consultantTitle')}
        subtitle={t('roleDashboards.consultantSubtitle')}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label={t('roleDashboards.assignedRequests')}
          value="12"
          detail={t('common.demoOnly')}
          icon={<ClipboardList size={20} />}
        />
        <StatCard
          label={t('roleDashboards.pendingResponses')}
          value="4"
          detail={t('roleDashboards.awaitingAdvice')}
          icon={<Activity size={20} />}
        />
        <StatCard
          label={t('roleDashboards.candidatesSupported')}
          value="38"
          detail={t('roleDashboards.thisMonth')}
          icon={<Users size={20} />}
        />
      </div>
      <Card className="mt-6">
        <h2 className="text-lg font-medium text-slate-900">{t('roleDashboards.recentConsultations')}</h2>
        <p className="mt-2 text-sm text-slate-500">{t('roleDashboards.consultationPhase6')}</p>
      </Card>
    </>
  );
}

import AdminDashboardPage from '../admin/AdminDashboardPage';

export function AdminDashboard() {
  return <AdminDashboardPage />;
}

