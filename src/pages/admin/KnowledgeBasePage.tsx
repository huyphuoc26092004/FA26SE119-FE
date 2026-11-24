import { useState } from 'react';
import { authErrorMessage } from '../../services/authService';
import { LearningResourcesTab } from './LearningResourcesTab';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  EmptyRow,
  Headline,
  Note,
  SectionHead,
  StatRow,
  Toast,
  UnderlineTabs,
  brandLink,
  dangerLink,
  boxInput,
  smallPrimary,
} from '../../components/admin/AdminKit';
import {
  approveRagCourse,
  archiveRagCourse,
  getCourseSearchStatus,
  getRagCourses,
  indexRagCourse,
  searchRagCourses,
  type CourseSearchInput,
} from '../../services/ragService';

type Tab = 'courses' | 'resources';
const errorText = (error: unknown) => (error instanceof Error ? error.message : 'Có lỗi xảy ra.');

const COURSE_LABEL: Record<string, string> = { PENDING_REVIEW: 'Chờ duyệt', APPROVED: 'Đã duyệt', ARCHIVED: 'Đã lưu trữ' };

export default function KnowledgeBasePage({ staff = false }: { staff?: boolean }) {
  const [params, setParams] = useSearchParams();
  const tab: Tab = !staff && params.get('tab') === 'resources' ? 'resources' : 'courses';
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3000);
  };

  const coursesQuery = useQuery({ queryKey: ['admin', 'rag-courses', staff], queryFn: () => getRagCourses(staff) });
  const courses = coursesQuery.data ?? [];

  const action = useMutation({
    mutationFn: ({ run }: { run: () => Promise<unknown>; done: string }) => run(),
    onSuccess: (_, { done }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'rag-courses'] });
      showToast(done);
    },
    onError: (e) => showToast(errorText(e)),
  });

  return (
    <div className="space-y-[clamp(2.5rem,5vw,4rem)]">
      <Headline
        eyebrow="Nền tảng"
        line1="Khóa học."
        line2={staff ? 'Tìm nguồn học để gửi duyệt.' : 'Tìm và duyệt nguồn học.'}
      />
      <StatRow
        items={[
          { label: 'Khoá học chờ duyệt', value: courses.filter((c) => c.status === 'PENDING_REVIEW').length, valueTone: 'warning' },
        ]}
      />
      {!staff && <UnderlineTabs
        value={tab}
        onChange={(t) => setParams(t === 'courses' ? {} : { tab: t }, { replace: true })}
        tabs={[
          { value: 'courses', label: 'Khoá học', count: courses.length },
          { value: 'resources', label: 'Tài nguyên học' },
        ]}
      />}

      {tab === 'resources' ? <LearningResourcesTab /> : (
        <section className="space-y-4">
          <SectionHead index="01" title="Khoá học đề xuất" />
          <CourseSearch staff={staff} />
          {coursesQuery.isError && <Note tone="danger">{errorText(coursesQuery.error)}</Note>}
          {courses.length === 0 ? (
            <EmptyRow>{coursesQuery.isLoading ? 'Đang tải...' : 'Chưa có khoá học nào.'}</EmptyRow>
          ) : (
            <ul>
              {courses.map((c) => (
                <li key={c.id} className="grid gap-2 border-b border-border py-4 md:grid-cols-[minmax(0,1fr)_9rem_auto] md:items-baseline md:gap-6">
                  <span className="min-w-0">
                    <a href={c.url} target="_blank" rel="noreferrer" className="block truncate text-[15px] text-ink hover:text-brand">{c.title}</a>
                    <span className="text-[12px] text-slate-500">
                      {c.provider} · {c.language} · {c.isFree ? 'Miễn phí' : 'Trả phí'} · {c.skills.join(', ')}
                    </span>
                  </span>
                  <span className={`text-[13px] ${c.status === 'APPROVED' ? 'text-brand' : 'text-slate-600'}`}>{COURSE_LABEL[c.status] ?? c.status}</span>
                  <span className="flex gap-5">
                    {!staff && c.status === 'PENDING_REVIEW' && (
                      <button type="button" className={brandLink} disabled={action.isPending} onClick={() => action.mutate({ run: () => approveRagCourse(c.id), done: 'Đã duyệt khoá học, hệ thống sẽ tự lập chỉ mục nền' })}>Duyệt</button>
                    )}
                    {!staff && c.status === 'APPROVED' && (
                      <button type="button" className={brandLink} disabled={action.isPending} onClick={() => action.mutate({ run: () => indexRagCourse(c.id), done: 'Đã gửi lập chỉ mục' })}>Lập chỉ mục</button>
                    )}
                    {!staff && c.status !== 'ARCHIVED' && (
                      <button type="button" className={dangerLink} disabled={action.isPending} onClick={() => action.mutate({ run: () => archiveRagCourse(c.id), done: 'Đã lưu trữ khoá học' })}>Lưu trữ</button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <Toast message={toast} />
    </div>
  );
}

function CourseSearch({ staff }: { staff: boolean }) {
  const queryClient = useQueryClient();
  const [input, setInput] = useState<CourseSearchInput>({ skill: '', language: 'vi', provider: 'ALL' });
  const status = useQuery({ queryKey: ['rag-course-search', staff], queryFn: () => getCourseSearchStatus(staff) });
  const search = useMutation({
    mutationFn: () => searchRagCourses(staff, { ...input, skill: input.skill.trim() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'rag-courses'] }),
  });
  return (
    <form className="space-y-3 py-3" onSubmit={(event) => {
      event.preventDefault();
      if (status.data?.configured && input.skill.trim() && !search.isPending) search.mutate();
    }}>
      <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_10rem_auto]">
        <label className="space-y-1 text-sm">
          <span>Kỹ năng</span>
          <input className={boxInput} placeholder="Ví dụ: Spring Boot" value={input.skill} maxLength={150}
            required onChange={(event) => setInput({ ...input, skill: event.target.value })} />
        </label>
        <label className="space-y-1 text-sm">
          <span>Ngôn ngữ tìm kiếm</span>
          <select className={boxInput} value={input.language}
            onChange={(event) => setInput({ ...input, language: event.target.value as CourseSearchInput['language'] })}>
            <option value="vi">Tiếng Việt</option><option value="en">Tiếng Anh</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span>Nguồn</span>
          <select className={boxInput} value={input.provider}
            onChange={(event) => setInput({ ...input, provider: event.target.value as CourseSearchInput['provider'] })}>
            <option value="ALL">Tất cả</option><option value="YOUTUBE">YouTube</option><option value="COURSERA">Coursera</option>
          </select>
        </label>
        <button className={smallPrimary} type="submit" disabled={!status.data?.configured || !input.skill.trim() || search.isPending}>
          {search.isPending ? 'Đang tìm…' : 'Tìm khóa học từ Google'}
        </button>
      </div>
      {status.isError && <Note tone="danger">{authErrorMessage(status.error, 'Không kiểm tra được cấu hình SerpApi.')}</Note>}
      {status.data?.configured === false && <Note>Backend chưa cấu hình SERPAPI_API_KEY.</Note>}
      {search.isError && <Note tone="danger">{authErrorMessage(search.error, 'Không tìm được khóa học từ Google.')}</Note>}
      {search.data && <p role="status" className="text-sm text-slate-600">
        {search.data.found === 0 ? 'Không tìm thấy link khóa học phù hợp.' :
          `Tìm thấy ${search.data.found} link. Đã gửi duyệt ${search.data.added}, bỏ qua ${search.data.duplicates} link đã có.`}
      </p>}
    </form>
  );
}

