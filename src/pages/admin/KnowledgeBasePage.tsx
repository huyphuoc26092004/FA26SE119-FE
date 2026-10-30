import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckBox,
  EmptyRow,
  Headline,
  Modal,
  Note,
  SectionHead,
  StatRow,
  Toast,
  UnderlineTabs,
  boxInput,
  brandLink,
  dangerLink,
  fieldLabel,
  outlineButton,
  primaryButton,
  smallPrimary,
  underlineInput,
  underlineSelect,
} from '../../components/admin/AdminKit';
import {
  approveRagCourse,
  archiveRagCourse,
  archiveRagDocument,
  createRagCourse,
  createRagDocument,
  getRagCourses,
  getRagDocument,
  getRagDocuments,
  indexRagCourse,
  indexRagDocument,
} from '../../services/ragService';

type Tab = 'documents' | 'courses';
const errorText = (error: unknown) => (error instanceof Error ? error.message : 'Có lỗi xảy ra.');

const EMBED_LABEL: Record<string, string> = { PENDING: 'Chờ lập chỉ mục', PROCESSING: 'Đang xử lý', COMPLETED: 'Đã lập chỉ mục', FAILED: 'Lỗi' };
const COURSE_LABEL: Record<string, string> = { PENDING_REVIEW: 'Chờ duyệt', APPROVED: 'Đã duyệt', ARCHIVED: 'Đã lưu trữ' };

/** /admin/vector — tài liệu tri thức và khoá học dùng cho RAG (tư vấn, lộ trình học). */
export default function KnowledgeBasePage() {
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get('tab') === 'courses' ? 'courses' : 'documents';
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3000);
  };
  const [creating, setCreating] = useState<Tab | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);

  const docsQuery = useQuery({ queryKey: ['admin', 'rag-docs'], queryFn: getRagDocuments });
  const coursesQuery = useQuery({ queryKey: ['admin', 'rag-courses'], queryFn: getRagCourses });
  const viewQuery = useQuery({ queryKey: ['admin', 'rag-doc', viewId], queryFn: () => getRagDocument(viewId!), enabled: Boolean(viewId) });
  const docs = docsQuery.data ?? [];
  const courses = coursesQuery.data ?? [];

  const action = useMutation({
    mutationFn: async ({ run }: { run: () => Promise<unknown>; done: string; key: string }) => run(),
    onSuccess: (_, { done, key }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', key] });
      showToast(done);
    },
    onError: (e) => showToast(errorText(e)),
  });

  return (
    <div className="space-y-[clamp(2.5rem,5vw,4rem)]">
      <Headline
        eyebrow="Nền tảng"
        line1="Kho tri thức."
        line2="Tài liệu và khoá học cho RAG."
        intro="Tài liệu được chia đoạn và tạo embedding để AI tra cứu khi tư vấn. Khoá học YouTube/Coursera cần duyệt trước khi xuất hiện trong lộ trình học."
      />
      <StatRow
        items={[
          { label: 'Tài liệu', value: docs.length },
          { label: 'Đã lập chỉ mục', value: docs.filter((d) => d.embeddingStatus === 'COMPLETED').length, valueTone: 'brand' },
          { label: 'Tổng số đoạn', value: docs.reduce((s, d) => s + d.chunksCount, 0) },
          { label: 'Khoá học chờ duyệt', value: courses.filter((c) => c.status === 'PENDING_REVIEW').length, valueTone: 'warning' },
        ]}
      />
      <UnderlineTabs
        value={tab}
        onChange={(t) => setParams(t === 'documents' ? {} : { tab: t }, { replace: true })}
        tabs={[
          { value: 'documents', label: 'Tài liệu', count: docs.length },
          { value: 'courses', label: 'Khoá học', count: courses.length },
        ]}
      />

      {tab === 'documents' ? (
        <section className="space-y-4">
          <SectionHead index="01" title="Tài liệu tri thức" action={<button type="button" className={smallPrimary} onClick={() => setCreating('documents')}>Thêm tài liệu</button>} />
          {docsQuery.isError && <Note tone="danger">{errorText(docsQuery.error)}</Note>}
          {docs.length === 0 ? (
            <EmptyRow>{docsQuery.isLoading ? 'Đang tải...' : 'Chưa có tài liệu nào.'}</EmptyRow>
          ) : (
            <ul>
              {docs.map((d) => (
                <li key={d.id} className="grid gap-2 border-b border-border py-4 md:grid-cols-[minmax(0,1fr)_12rem_auto] md:items-baseline md:gap-6">
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] text-ink">{d.title}</span>
                    <span className="text-[12px] text-slate-500">
                      {d.sourceType} · {d.chunksCount} đoạn · {d.createdAt}
                    </span>
                  </span>
                  <span className={`text-[13px] ${d.embeddingStatus === 'FAILED' ? 'text-danger' : d.embeddingStatus === 'COMPLETED' ? 'text-brand' : 'text-slate-600'}`}>
                    {EMBED_LABEL[d.embeddingStatus] ?? d.embeddingStatus}
                  </span>
                  <span className="flex gap-5">
                    <button type="button" className={brandLink} onClick={() => setViewId(d.id)}>Xem</button>
                    <button type="button" className={brandLink} disabled={action.isPending} onClick={() => action.mutate({ run: () => indexRagDocument(d.id), done: 'Đã gửi lập chỉ mục', key: 'rag-docs' })}>Lập chỉ mục</button>
                    <button type="button" className={dangerLink} disabled={action.isPending} onClick={() => action.mutate({ run: () => archiveRagDocument(d.id), done: 'Đã lưu trữ tài liệu', key: 'rag-docs' })}>Lưu trữ</button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <section className="space-y-4">
          <SectionHead index="01" title="Khoá học đề xuất" action={<button type="button" className={smallPrimary} onClick={() => setCreating('courses')}>Thêm khoá học</button>} />
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
                    {c.status === 'PENDING_REVIEW' && (
                      <button type="button" className={brandLink} disabled={action.isPending} onClick={() => action.mutate({ run: () => approveRagCourse(c.id), done: 'Đã duyệt khoá học', key: 'rag-courses' })}>Duyệt</button>
                    )}
                    {c.status === 'APPROVED' && (
                      <button type="button" className={brandLink} disabled={action.isPending} onClick={() => action.mutate({ run: () => indexRagCourse(c.id), done: 'Đã gửi lập chỉ mục', key: 'rag-courses' })}>Lập chỉ mục</button>
                    )}
                    {c.status !== 'ARCHIVED' && (
                      <button type="button" className={dangerLink} disabled={action.isPending} onClick={() => action.mutate({ run: () => archiveRagCourse(c.id), done: 'Đã lưu trữ khoá học', key: 'rag-courses' })}>Lưu trữ</button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {creating === 'documents' && (
        <DocumentModal
          onClose={() => setCreating(null)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'rag-docs'] });
            setCreating(null);
            showToast('Đã thêm tài liệu');
          }}
        />
      )}
      {creating === 'courses' && (
        <CourseModal
          onClose={() => setCreating(null)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'rag-courses'] });
            setCreating(null);
            showToast('Đã thêm khoá học, đang chờ duyệt');
          }}
        />
      )}
      {viewId && (
        <Modal title={viewQuery.data?.title ?? 'Tài liệu'} width="max-w-3xl" onClose={() => setViewId(null)}>
          {viewQuery.isLoading ? (
            <p className="text-sm text-slate-500">Đang tải...</p>
          ) : (
            <p className="whitespace-pre-line text-[14px] leading-7 text-slate-700">{viewQuery.data?.content || 'Tài liệu không có nội dung văn bản.'}</p>
          )}
        </Modal>
      )}
      <Toast message={toast} />
    </div>
  );
}

function DocumentModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const save = useMutation({ mutationFn: () => createRagDocument({ title, content }), onSuccess: onSaved });
  return (
    <Modal
      title="Thêm tài liệu tri thức"
      width="max-w-3xl"
      onClose={onClose}
      footer={
        <>
          <button type="button" className={outlineButton} onClick={onClose}>Huỷ</button>
          <button type="button" className={primaryButton} disabled={save.isPending || !title.trim() || !content.trim()} onClick={() => save.mutate()}>
            {save.isPending ? 'Đang lưu...' : 'Lưu tài liệu'}
          </button>
        </>
      }
    >
      <label className="block">
        <span className={fieldLabel}>Tiêu đề</span>
        <input className={underlineInput} maxLength={255} value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="mt-5 block">
        <span className={fieldLabel}>Nội dung</span>
        <textarea rows={12} className={`${boxInput} mt-2 text-[14px]`} value={content} onChange={(e) => setContent(e.target.value)} />
      </label>
      {save.isError && <p className="mt-3 text-sm text-danger">{errorText(save.error)}</p>}
    </Modal>
  );
}

function CourseModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ title: '', url: '', description: '', skills: '', language: 'vi', isFree: true });
  const save = useMutation({
    mutationFn: () =>
      createRagCourse({
        title: form.title.trim(),
        url: form.url.trim(),
        description: form.description.trim(),
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        language: form.language,
        isFree: form.isFree,
      }),
    onSuccess: onSaved,
  });
  return (
    <Modal
      title="Thêm khoá học"
      onClose={onClose}
      footer={
        <>
          <button type="button" className={outlineButton} onClick={onClose}>Huỷ</button>
          <button type="button" className={primaryButton} disabled={save.isPending || !form.title.trim() || !form.url.trim() || !form.skills.trim()} onClick={() => save.mutate()}>
            {save.isPending ? 'Đang lưu...' : 'Lưu khoá học'}
          </button>
        </>
      }
    >
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className={fieldLabel}>Đường dẫn (YouTube hoặc Coursera)</span>
          <input type="url" className={underlineInput} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
        </label>
        <label className="block md:col-span-2">
          <span className={fieldLabel}>Tên khoá học</span>
          <input className={underlineInput} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </label>
        <label className="block md:col-span-2">
          <span className={fieldLabel}>Mô tả</span>
          <textarea rows={4} className={`${boxInput} mt-2 text-[14px]`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>
        <label className="block">
          <span className={fieldLabel}>Kỹ năng (cách nhau bằng dấu phẩy)</span>
          <input className={underlineInput} value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="React, TypeScript" />
        </label>
        <label className="block">
          <span className={fieldLabel}>Ngôn ngữ</span>
          <select className={underlineSelect} value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </label>
        <div className="md:col-span-2">
          <CheckBox checked={form.isFree} onChange={(v) => setForm({ ...form, isFree: v })} label="Khoá học miễn phí" />
        </div>
      </div>
      {save.isError && <p className="mt-3 text-sm text-danger">{errorText(save.error)}</p>}
    </Modal>
  );
}
