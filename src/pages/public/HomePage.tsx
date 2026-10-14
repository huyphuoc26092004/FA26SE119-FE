import { ArrowRight, BriefcaseBusiness, ChartNoAxesCombined, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../../components/ui';
import { useTranslation } from '../../i18n';

export default function HomePage() {
  const { t } = useTranslation();

  const features = [
    [BriefcaseBusiness, t('home.feature1Title'), t('home.feature1Desc')],
    [ChartNoAxesCombined, t('home.feature2Title'), t('home.feature2Desc')],
    [Sparkles, t('home.feature3Title'), t('home.feature3Desc')],
  ] as const;

  return (
    <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
      <div className="max-w-3xl">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
          <Sparkles size={16} /> {t('home.heroBadge')}
        </p>
        <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-6xl">
          {t('home.heroTitlePrefix')}{' '}
          <span className="text-blue-600">{t('home.heroTitleConfidence')}</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-500">
          {t('home.heroSubtitle')}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/login">
            <Button>
              {t('home.exploreDashboard')} <ArrowRight size={17} />
            </Button>
          </Link>
          <Link to="/jobs">
            <Button variant="secondary">{t('home.browseOpportunities')}</Button>
          </Link>
        </div>
      </div>

      <div className="mt-20 grid gap-5 md:grid-cols-3">
        {features.map(([Icon, title, description]) => {
          const IconComponent = Icon;
          return (
            <Card key={title}>
              <IconComponent className="mb-4 text-blue-600" size={28} />
              <h2 className="text-lg font-bold text-slate-900">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
