import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, MapPin, Phone } from 'lucide-react';
import { deleteResume, getResumeById, setDefaultResume } from '../../mocks/services/mockService';
import { useTranslation } from '../../i18n';
import { ErrorState } from '../../components/ui';
import {
  BigButton,
  BigLink,
  Card,
  Pill,
  PillLink,
  ScoreRing,
  Screen,
  Sheet,
  Skeleton,
  Tag,
  useToast,
} from '../MobileKit';

const copy = {
  vi: {
    primary: 'CV chính',
    improve: 'Phân tích & cải thiện bằng AI',
    edit: 'Chỉnh sửa',
    fit: 'So khớp việc làm',
    letter: 'Viết thư ứng tuyển',
    makePrimary: 'Đặt làm CV chính',
    primaryDone: 'Đã đặt làm CV chính',
    delete: 'Xoá CV',
    summary: 'Giới thiệu',
    experience: 'Kinh nghiệm',
    education: 'Học vấn',
    skills: 'Kỹ năng',
    now: 'Hiện tại',
    confirmTitle: 'Xoá CV này?',
    confirmBody: 'CV sẽ bị xoá khỏi danh sách và không dùng để gợi ý việc làm nữa.',
    cancel: 'Huỷ',
  },
  en: {
    primary: 'Primary CV',
    improve: 'Analyse & improve with AI',
    edit: 'Edit',
    fit: 'Job fit',
    letter: 'Cover letter',
    makePrimary: 'Make primary',
    primaryDone: 'Set as primary CV',
    delete: 'Delete CV',
    summary: 'Summary',
    experience: 'Experience',
    education: 'Education',
    skills: 'Skills',
    now: 'Present',
    confirmTitle: 'Delete this CV?',
    confirmBody: 'The CV is removed from your list and no longer used for job suggestions.',
    cancel: 'Cancel',
  },
};

export default function MobileResumeDetail() {
  const { resumeId = '' } = useParams<{ resumeId: string }>();
  const { isVietnamese } = useTranslation();
  const c = isVietnamese ? copy.vi : copy.en;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);

  const {
    data: cv,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['resume', resumeId],
    queryFn: () => getResumeById(resumeId),
    enabled: !!resumeId,
  });
  const remove = useMutation({
    mutationFn: () => deleteResume(resumeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      navigate('/candidate/resumes', { replace: true });
    },
  });
  const makePrimary = useMutation({
    mutationFn: () => setDefaultResume(resumeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      queryClient.invalidateQueries({ queryKey: ['resume', resumeId] });
      toast.show(c.primaryDone);
    },
  });

  if (isPending) return <Skeleton rows={3} />;
  if (isError || !cv) return <ErrorState />;

  const contacts = [
    { icon: Mail, value: cv.email },
    { icon: Phone, value: cv.phone },
    { icon: MapPin, value: cv.location },
  ].filter((x) => !!x.value);
  const skills = cv.skills ?? cv.detailedSkills?.map((s) => s.name) ?? [];

  return (
    <Screen>
      <Card>
        <div className="flex items-center gap-4">
          <ScoreRing value={cv.atsScore} size={68} label={`ATS ${cv.atsScore}`} />
          <div className="min-w-0">
            <p className="text-[18px] font-medium leading-snug text-ink">
              {cv.fullName ?? cv.name}
            </p>
            <p className="mt-0.5 text-[14px] text-slate-600">{cv.position}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {cv.isDefault && <Tag tone="brand">{c.primary}</Tag>}
              <Tag>{cv.language}</Tag>
            </div>
          </div>
        </div>
        {contacts.length > 0 && (
          <div className="mt-4 space-y-1.5 border-t border-border pt-3">
            {contacts.map(({ icon: Icon, value }) => (
              <p key={value} className="flex items-center gap-2 text-[13px] text-slate-700">
                <Icon size={14} className="shrink-0 text-slate-500" aria-hidden="true" />
                <span className="truncate">{value}</span>
              </p>
            ))}
          </div>
        )}
      </Card>

      <BigLink to={`/candidate/resumes/${cv.id}/analysis`}>{c.improve}</BigLink>
      <div className="flex flex-wrap gap-2">
        <PillLink to={`/candidate/resumes/${cv.id}/edit`}>{c.edit}</PillLink>
        <PillLink to={`/candidate/resumes/${cv.id}/job-fit`}>{c.fit}</PillLink>
        <PillLink to="/candidate/applications">{c.letter}</PillLink>
        {!cv.isDefault && (
          <Pill onClick={() => makePrimary.mutate()} disabled={makePrimary.isPending}>
            {c.makePrimary}
          </Pill>
        )}
      </div>

      {cv.summary && (
        <Card>
          <p className="text-[16px] font-medium text-ink">{c.summary}</p>
          <p className="mt-2 text-[14px] leading-6 text-slate-700">{cv.summary}</p>
        </Card>
      )}

      {(cv.experience?.length ?? 0) > 0 && (
        <Card>
          <p className="text-[16px] font-medium text-ink">{c.experience}</p>
          <ol className="mt-3 space-y-4 border-l border-border pl-4">
            {cv.experience!.map((exp) => (
              <li key={exp.id} className="relative">
                <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-brand bg-canvas" />
                <p className="text-[15px] font-medium leading-snug text-ink">{exp.role}</p>
                <p className="text-[13px] text-slate-600">
                  {exp.company} · {exp.startDate} – {exp.isCurrent ? c.now : exp.endDate}
                </p>
                {exp.description && (
                  <p className="mt-1.5 text-[13px] leading-5 text-slate-700">{exp.description}</p>
                )}
              </li>
            ))}
          </ol>
        </Card>
      )}

      {(cv.education?.length ?? 0) > 0 && (
        <Card>
          <p className="text-[16px] font-medium text-ink">{c.education}</p>
          <div className="mt-3 space-y-3">
            {cv.education!.map((ed) => (
              <div key={ed.id}>
                <p className="text-[15px] text-ink">{ed.school}</p>
                <p className="text-[13px] text-slate-600">
                  {[ed.degree, ed.field].filter(Boolean).join(' · ')} · {ed.startDate} –{' '}
                  {ed.endDate}
                  {ed.gpa ? ` · GPA ${ed.gpa}` : ''}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {skills.length > 0 && (
        <Card>
          <p className="text-[16px] font-medium text-ink">{c.skills}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <Tag key={s}>{s}</Tag>
            ))}
          </div>
        </Card>
      )}

      <BigButton tone="danger" onClick={() => setConfirm(true)}>
        {c.delete}
      </BigButton>

      <Sheet open={confirm} onClose={() => setConfirm(false)}>
        <p className="text-[19px] font-medium text-ink">{c.confirmTitle}</p>
        <p className="mt-2 text-[14px] leading-6 text-slate-600">{c.confirmBody}</p>
        <div className="mt-5 space-y-3">
          <BigButton tone="danger" onClick={() => remove.mutate()} disabled={remove.isPending}>
            {c.delete}
          </BigButton>
          <BigButton tone="secondary" onClick={() => setConfirm(false)}>
            {c.cancel}
          </BigButton>
        </div>
      </Sheet>
      {toast.node}
    </Screen>
  );
}
