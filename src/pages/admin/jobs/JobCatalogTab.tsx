import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckBox,
  EmptyRow,
  InfoRow,
  Modal,
  Note,
  SectionHead,
  boxInput,
  brandLink,
  fieldLabel,
  outlineButton,
  primaryButton,
  smallPrimary,
  underlineInput,
  underlineSelect,
} from '../../../components/admin/AdminKit';
import { getJobs } from '../../../services/candidateService';
import {
  getJobIndexing,
  getSalaryPolicy,
  importJob,
  indexJob,
  updateJobStatus,
  updateSalaryPolicy,
  type AdminJobStatus,
  type ImportJobInput,
} from '../../../services/adminJobService';
import { crawlErrorMessage } from '../../../services/jobCrawlService';

const STATUS_LABEL: Record<AdminJobStatus, string> = { ACTIVE: 'Đang tuyển', EXPIRED: 'Hết hạn', REMOVED: 'Đã gỡ', INVALID: 'Không hợp lệ' };

/** Tab "Kho việc làm": nhập tin thủ công, gỡ / đánh dấu hết hạn, lập chỉ mục lại và chính sách lương khi đối sánh. */
export function JobCatalogTab({ onDone }: { onDone: (message: string) => void }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [importing, setImporting] = useState(false);
  const [indexOf, setIndexOf] = useState<{ id: string; title: string } | null>(null);
  const jobsQuery = useQuery({ queryKey: ['admin', 'catalog', submitted], queryFn: () => getJobs({ search: submitted }) });
  const indexQuery = useQuery({ queryKey: ['admin', 'job-index', indexOf?.id], queryFn: () => getJobIndexing(indexOf!.id), enabled: Boolean(indexOf) });
  const policyQuery = useQuery({ queryKey: ['admin', 'salary-policy'], queryFn: getSalaryPolicy });
  const [tolerance, setTolerance] = useState<string>('');

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'catalog'] });
  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AdminJobStatus }) => updateJobStatus(id, status),
    onSuccess: (_, { status }) => {
      refresh();
      onDone(`Đã chuyển sang "${STATUS_LABEL[status]}"`);
    },
    onError: (e) => onDone(crawlErrorMessage(e, 'Không đổi được trạng thái.')),
  });
  const reindex = useMutation({
    mutationFn: indexJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'job-index'] });
      onDone('Đã gửi lập chỉ mục lại');
    },
    onError: (e) => onDone(crawlErrorMessage(e, 'Không lập chỉ mục được.')),
  });
  const savePolicy = useMutation({
    mutationFn: () => updateSalaryPolicy(Number(tolerance)),
    onSuccess: (p) => {
      queryClient.setQueryData(['admin', 'salary-policy'], p);
      setTolerance('');
      onDone('Đã lưu chính sách lương');
    },
    onError: (e) => onDone(crawlErrorMessage(e, 'Không lưu được.')),
  });

  const jobs = jobsQuery.data ?? [];
  const policy = policyQuery.data;

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <SectionHead
          index="01"
          title="Tin đang hiển thị"
          meta={`${jobs.length} tin`}
          action={
            <button type="button" className={smallPrimary} onClick={() => setImporting(true)}>
              Nhập tin thủ công
            </button>
          }
        />
        <form
          className="flex max-w-xl gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(search.trim());
          }}
        >
          <input className={boxInput} placeholder="Tìm theo tên việc..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <button type="submit" className={outlineButton}>Tìm</button>
        </form>
        {jobsQuery.isError && <Note tone="danger">{crawlErrorMessage(jobsQuery.error, 'Không tải được việc làm.')}</Note>}
        {jobs.length === 0 ? (
          <EmptyRow>{jobsQuery.isLoading ? 'Đang tải...' : 'Không có tin nào.'}</EmptyRow>
        ) : (
          <ul>
            {jobs.map((job) => (
              <li key={job.id} className="grid gap-2 border-b border-border py-3.5 md:grid-cols-[minmax(0,1fr)_11rem_auto] md:items-center md:gap-6">
                <span className="min-w-0">
                  <span className="block truncate text-[15px] text-ink">{job.title}</span>
                  <span className="text-[12px] text-slate-500">
                    {job.company} · {job.location} · {job.posted}
                  </span>
                </span>
                <select
                  aria-label="Trạng thái tin"
                  className={underlineSelect}
                  value="ACTIVE"
                  disabled={setStatus.isPending}
                  onChange={(e) => setStatus.mutate({ id: job.id, status: e.target.value as AdminJobStatus })}
                >
                  {Object.entries(STATUS_LABEL).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                <span className="flex gap-5">
                  <button type="button" className={brandLink} disabled={reindex.isPending} onClick={() => reindex.mutate(job.id)}>
                    Lập chỉ mục
                  </button>
                  <button type="button" className={brandLink} onClick={() => setIndexOf({ id: job.id, title: job.title })}>
                    Lịch sử chỉ mục
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
        <Note>Danh sách lấy từ tìm kiếm việc làm công khai nên chỉ gồm tin đang tuyển. Tin đã gỡ hoặc hết hạn không hiện ở đây.</Note>
      </section>

      <section className="space-y-4">
        <SectionHead index="02" title="Chính sách lương khi đối sánh" />
        {policy && (
          <dl>
            <InfoRow label="Biên độ chấp nhận">{policy.tolerancePercent}%</InfoRow>
            <InfoRow label="Tỉ lệ tối thiểu">{policy.minimumRatio}</InfoRow>
            <InfoRow label="Phiên bản">
              {policy.policyVersion || `v${policy.version}`} · {policy.updatedAt || '—'}
            </InfoRow>
          </dl>
        )}
        <form
          className="flex max-w-md items-end gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (tolerance !== '') savePolicy.mutate();
          }}
        >
          <label className="block flex-1">
            <span className={fieldLabel}>Biên độ mới (0–100%)</span>
            <input type="number" min={0} max={100} step={0.01} className={underlineInput} value={tolerance} onChange={(e) => setTolerance(e.target.value)} />
          </label>
          <button type="submit" className={outlineButton} disabled={savePolicy.isPending || tolerance === ''}>
            Lưu
          </button>
        </form>
      </section>

      {importing && (
        <ImportJobModal
          onClose={() => setImporting(false)}
          onSaved={() => {
            setImporting(false);
            refresh();
            onDone('Đã nhập tin tuyển dụng');
          }}
        />
      )}
      {indexOf && (
        <Modal title={indexOf.title} eyebrow="Lịch sử lập chỉ mục" onClose={() => setIndexOf(null)}>
          {(indexQuery.data ?? []).length === 0 ? (
            <EmptyRow>{indexQuery.isLoading ? 'Đang tải...' : 'Chưa có lần lập chỉ mục nào.'}</EmptyRow>
          ) : (
            <ul>
              {indexQuery.data!.map((r) => (
                <li key={r.id} className="border-b border-border py-3 text-[14px]">
                  <span className={r.status === 'FAILED' ? 'text-danger' : 'text-ink'}>{r.status}</span>
                  <span className="ml-3 text-[12px] text-slate-500">
                    {r.createdAt} · {r.attempts} lần thử{r.finishedAt && ` · xong ${r.finishedAt}`}
                  </span>
                  {r.error && <p className="mt-1 text-[12px] text-danger">{r.error}</p>}
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
    </div>
  );
}

const EMPTY: ImportJobInput = {
  sourceSite: 'MANUAL',
  sourceUrl: '',
  jobTitle: '',
  companyName: '',
  location: '',
  salaryText: '',
  roleCategory: '',
  content: '',
  skills: [],
  requirements: '',
  responsibilities: '',
  benefits: '',
  validThrough: '',
};

function ImportJobModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<ImportJobInput>(EMPTY);
  const [skills, setSkills] = useState('');
  const [requiredSkills, setRequiredSkills] = useState(true);
  const set = (key: keyof ImportJobInput) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value });
  const save = useMutation({
    mutationFn: () =>
      importJob({
        ...form,
        validThrough: form.validThrough ? new Date(form.validThrough).toISOString() : undefined,
        skills: skills.split(',').map((name) => ({ name, required: requiredSkills })),
      }),
    onSuccess: onSaved,
  });
  const valid = form.sourceUrl.trim() && form.jobTitle.trim() && form.roleCategory.trim() && form.content.trim();
  const field = (key: keyof ImportJobInput, label: string, props: Record<string, unknown> = {}) => (
    <label className="block">
      <span className={fieldLabel}>{label}</span>
      <input className={underlineInput} value={String(form[key] ?? '')} onChange={set(key)} {...props} />
    </label>
  );
  const area = (key: keyof ImportJobInput, label: string, rowsCount = 4) => (
    <label className="block md:col-span-2">
      <span className={fieldLabel}>{label}</span>
      <textarea rows={rowsCount} className={`${boxInput} mt-2 text-[14px]`} value={String(form[key] ?? '')} onChange={set(key)} />
    </label>
  );
  return (
    <Modal
      title="Nhập tin tuyển dụng"
      width="max-w-3xl"
      onClose={onClose}
      footer={
        <>
          <button type="button" className={outlineButton} onClick={onClose}>Huỷ</button>
          <button type="button" className={primaryButton} disabled={save.isPending || !valid} onClick={() => save.mutate()}>
            {save.isPending ? 'Đang nhập...' : 'Nhập tin'}
          </button>
        </>
      }
    >
      <div className="grid gap-5 md:grid-cols-2">
        {field('jobTitle', 'Tên vị trí *')}
        {field('companyName', 'Công ty')}
        {field('sourceUrl', 'Đường dẫn gốc *', { type: 'url' })}
        {field('sourceSite', 'Nguồn')}
        {field('roleCategory', 'Nhóm vai trò * (VD: frontend)')}
        {field('location', 'Địa điểm')}
        {field('salaryText', 'Mức lương (VD: 20-30 triệu)')}
        {field('validThrough', 'Hạn nộp', { type: 'datetime-local' })}
        <label className="block md:col-span-2">
          <span className={fieldLabel}>Kỹ năng (cách nhau bằng dấu phẩy)</span>
          <input className={underlineInput} value={skills} onChange={(e) => setSkills(e.target.value)} />
        </label>
        <div className="md:col-span-2">
          <CheckBox checked={requiredSkills} onChange={setRequiredSkills} label="Các kỹ năng trên là bắt buộc" />
        </div>
        {area('content', 'Mô tả công việc *', 6)}
        {area('requirements', 'Yêu cầu')}
        {area('responsibilities', 'Trách nhiệm')}
        {area('benefits', 'Quyền lợi')}
      </div>
      {save.isError && <p className="mt-3 text-sm text-danger">{crawlErrorMessage(save.error, 'Không nhập được tin.')}</p>}
    </Modal>
  );
}
