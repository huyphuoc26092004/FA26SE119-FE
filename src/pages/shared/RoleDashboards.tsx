import { Activity, ClipboardList, Users, Wallet, ShieldCheck, Server } from 'lucide-react';
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
        <h2 className="text-lg font-bold text-slate-900">{t('roleDashboards.recentConsultations')}</h2>
        <p className="mt-2 text-sm text-slate-500">{t('roleDashboards.consultationPhase6')}</p>
      </Card>
    </>
  );
}

export function AdminDashboard() {
  const { t } = useTranslation();

  return (
    <>
      <PageTitle
        title={t('roleDashboards.adminTitle')}
        subtitle={t('roleDashboards.adminSubtitle')}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('roleDashboards.totalUsers')}
          value="2,840"
          detail={`+12.5% ${t('roleDashboards.thisMonth')}`}
          icon={<Users size={20} />}
        />
        <StatCard
          label={t('roleDashboards.aiRequests')}
          value="18.2k"
          detail={t('common.demoOnly')}
          icon={<Activity size={20} />}
        />
        <StatCard
          label={t('roleDashboards.subscriptions')}
          value="486"
          detail={t('roleDashboards.activePlans')}
          icon={<Wallet size={20} />}
        />
        <StatCard
          label={t('roleDashboards.systemStatus')}
          value={t('roleDashboards.healthy')}
          detail={t('common.mockEnvironment')}
          icon={<Server size={20} />}
        />
      </div>
      <Card className="mt-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-emerald-600" />
          <h2 className="text-lg font-bold text-slate-900">{t('roleDashboards.systemOverview')}</h2>
          <Badge tone="green">{t('common.demoBadge')}</Badge>
        </div>
        <p className="mt-3 text-sm text-slate-500">{t('roleDashboards.adminPhase7')}</p>
      </Card>
    </>
  );
}
