import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getCandidateProfile } from '../../mocks/services/mockService';
import { Badge, Button, Card, ErrorState, Loading, PageTitle } from '../../components/ui';
import { useTranslation } from '../../i18n';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { data, isPending, isError } = useQuery({
    queryKey: ['profile'],
    queryFn: getCandidateProfile,
  });

  return (
    <>
      <PageTitle
        title={t('profile.title')}
        subtitle={t('profile.subtitle')}
        action={
          <Link to="/candidate/profile/edit">
            <Button variant="secondary">{t('profile.editProfile')}</Button>
          </Link>
        }
      />
      {isPending ? (
        <Loading />
      ) : isError ? (
        <ErrorState />
      ) : (
        data && (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card>
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-blue-100 text-2xl font-bold text-blue-700">
                  AM
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{data.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{data.headline}</p>
                </div>
              </div>

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                {[
                  [t('profile.targetPosition'), data.targetPosition],
                  [t('profile.experienceLevel'), data.experienceLevel],
                  [t('profile.preferredLocation'), data.location],
                  [t('profile.employmentType'), t('profile.employmentTypeValue')],
                  [t('profile.expectedSalary'), t('profile.expectedSalaryValue')],
                  [t('profile.careerField'), t('profile.careerFieldValue')],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {label}
                    </p>
                    <p className="mt-2 font-medium text-slate-800">{value}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-bold text-slate-900">{t('profile.skillsAndExpertise')}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {data.skills.map((skill) => (
                  <Badge key={skill}>{skill}</Badge>
                ))}
              </div>

              <h3 className="mt-8 font-semibold text-slate-900">{t('profile.careerGoal')}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{t('profile.careerGoalText')}</p>
            </Card>
          </div>
        )
      )}
    </>
  );
}
