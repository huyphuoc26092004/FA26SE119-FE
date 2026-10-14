import { FileText, Plus, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getResumes } from '../../mocks/services/mockService';
import { Badge, Button, Card, EmptyState, ErrorState, Loading, PageTitle } from '../../components/ui';
import { useTranslation } from '../../i18n';

export default function ResumesPage() {
  const { t } = useTranslation();
  const { data, isPending, isError } = useQuery({ queryKey: ['resumes'], queryFn: getResumes });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Ready':
        return t('resumes.statusReady');
      case 'Draft':
        return t('resumes.statusDraft');
      default:
        return t('resumes.statusReview');
    }
  };

  return (
    <>
      <PageTitle
        title={t('resumes.title')}
        subtitle={t('resumes.subtitle')}
        action={
          <div className="flex gap-2">
            <Link to="/candidate/resumes/upload">
              <Button variant="secondary">
                <Upload size={16} />
                {t('resumes.uploadCv')}
              </Button>
            </Link>
            <Link to="/candidate/resumes/create">
              <Button>
                <Plus size={16} />
                {t('resumes.createCv')}
              </Button>
            </Link>
          </div>
        }
      />

      {isPending ? (
        <Loading />
      ) : isError ? (
        <ErrorState />
      ) : !data?.length ? (
        <EmptyState message={t('resumes.emptyResumes')} />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data.map((cv) => (
            <Card key={cv.id}>
              <div className="mb-6 flex items-start justify-between">
                <span className="rounded-xl bg-blue-50 p-3 text-blue-600">
                  <FileText size={24} />
                </span>
                <Badge
                  tone={
                    cv.status === 'Ready' ? 'green' : cv.status === 'Draft' ? 'gray' : 'amber'
                  }
                >
                  {getStatusLabel(cv.status)}
                </Badge>
              </div>

              <h2 className="text-lg font-bold text-slate-900">{cv.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{cv.position}</p>

              <div className="mt-5 flex justify-between border-t border-slate-100 pt-4 text-sm">
                <span className="text-slate-500">{t('resumes.atsScore')}</span>
                <span className="font-bold text-blue-600">
                  {cv.atsScore || '—'}
                  {cv.atsScore ? ' / 100' : ''}
                </span>
              </div>

              <div className="mt-2 flex justify-between text-xs text-slate-400">
                <span>{cv.language}</span>
                <span>{cv.updatedAt}</span>
              </div>

              <Link
                className="mt-5 block rounded-xl border border-slate-200 py-2.5 text-center text-sm font-semibold hover:bg-slate-50 text-slate-700 transition"
                to={`/candidate/resumes/${cv.id}`}
              >
                {t('resumes.viewDetails')}
              </Link>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
