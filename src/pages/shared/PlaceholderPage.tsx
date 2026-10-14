import { Construction } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Card, PageTitle } from '../../components/ui';
import { useTranslation } from '../../i18n';

export default function PlaceholderPage() {
  const path = useLocation().pathname;
  const { t } = useTranslation();
  const name =
    path
      .split('/')
      .filter(Boolean)
      .slice(-1)[0]
      ?.replaceAll('-', ' ') ?? 'Module';

  return (
    <>
      <PageTitle
        title={name.replace(/\b\w/g, (c) => c.toUpperCase())}
        subtitle={t('placeholder.plannedMilestone')}
      />
      <Card className="flex flex-col items-center py-20 text-center">
        <span className="rounded-2xl bg-blue-50 p-5 text-blue-600">
          <Construction size={30} />
        </span>
        <h2 className="mt-5 text-xl font-bold text-slate-900">{t('placeholder.comingFuturePhase')}</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{t('placeholder.readyNotice')}</p>
      </Card>
    </>
  );
}
