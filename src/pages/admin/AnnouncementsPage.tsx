import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  EmptyRow,
  Headline,
  Modal,
  Note,
  RadioRow,
  SectionHead,
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
  archiveAnnouncement,
  createAnnouncement,
  getAdminAnnouncements,
  publishAnnouncement,
  updateAnnouncement,
  type Announcement,
  type AnnouncementStatus,
  type AnnouncementTarget,
} from '../../services/notificationService';
import NotificationsPage from '../shared/NotificationsPage';

const STATUS_LABEL: Record<AnnouncementStatus, string> = { DRAFT: 'Bản nháp', PUBLISHED: 'Đã phát hành', ARCHIVED: 'Đã lưu trữ' };
const ROLE_LABEL = { CANDIDATE: 'Ứng viên', CAREER_CONSULTANT: 'Cố vấn', ADMIN: 'Quản trị viên' } as const;
const errorText = (error: unknown) => (error instanceof Error ? error.message : 'Có lỗi xảy ra.');

type Tab = 'announcements' | 'inbox';

/** /admin/notifications — soạn, phát hành và lưu trữ thông báo hệ thống; kèm hộp thư của admin. */
export default function AnnouncementsPage() {
  const [tab, setTab] = useState<Tab>('announcements');
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Partial<Announcement> | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3000);
  };
  const query = useQuery({ queryKey: ['admin', 'announcements'], queryFn: getAdminAnnouncements });
  const list = query.data ?? [];
  const act = useMutation({
    mutationFn: ({ id, kind }: { id: string; kind: 'publish' | 'archive' }) => (kind === 'publish' ? publishAnnouncement(id) : archiveAnnouncement(id)),
    onSuccess: (_, { kind }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] });
      showToast(kind === 'publish' ? 'Đã phát hành, người nhận sẽ thấy trong hộp thư' : 'Đã lưu trữ thông báo');
    },
    onError: (e) => showToast(errorText(e)),
  });

  return (
    <div className="space-y-[clamp(2.5rem,5vw,4rem)]">
      <UnderlineTabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'announcements', label: 'Thông báo hệ thống' },
          { value: 'inbox', label: 'Hộp thư của tôi' },
        ]}
      />
      {tab === 'inbox' ? (
        <NotificationsPage />
      ) : (
        <>
          <Headline eyebrow="Vận hành" line1="Thông báo hệ thống." line2="Gửi tới mọi người, một vai trò hoặc một người." />
          <section className="space-y-4">
            <SectionHead
              index="01"
              title="Danh sách thông báo"
              meta={`${list.length} thông báo`}
              action={
                <button type="button" className={smallPrimary} onClick={() => setEditing({ targets: [{ type: 'ALL' }] })}>
                  Soạn thông báo
                </button>
              }
            />
            {query.isError && <Note tone="danger">{errorText(query.error)}</Note>}
            {list.length === 0 ? (
              <EmptyRow>{query.isLoading ? 'Đang tải...' : 'Chưa có thông báo nào.'}</EmptyRow>
            ) : (
              <ul>
                {list.map((a) => (
                  <li key={a.id} className="grid gap-2 border-b border-border py-4 md:grid-cols-[minmax(0,1fr)_9rem_auto] md:items-baseline md:gap-6">
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] text-ink">{a.title}</span>
                      <span className="block truncate text-[13px] text-slate-500">{a.content}</span>
                      <span className="text-[12px] text-slate-500">
                        Tạo {a.createdAt}
                        {a.publishAt && ` · phát hành ${a.publishAt}`}
                        {a.expiresAt && ` · hết hạn ${a.expiresAt}`}
                      </span>
                    </span>
                    <span className={`text-[13px] ${a.status === 'PUBLISHED' ? 'text-brand' : 'text-slate-600'}`}>{STATUS_LABEL[a.status] ?? a.status}</span>
                    <span className="flex gap-5">
                      {a.status === 'DRAFT' && (
                        <>
                          <button type="button" className={brandLink} onClick={() => setEditing(a)}>Sửa</button>
                          <button type="button" className={brandLink} disabled={act.isPending} onClick={() => act.mutate({ id: a.id, kind: 'publish' })}>Phát hành</button>
                        </>
                      )}
                      {a.status !== 'ARCHIVED' && (
                        <button type="button" className={dangerLink} disabled={act.isPending} onClick={() => act.mutate({ id: a.id, kind: 'archive' })}>Lưu trữ</button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
      {editing && (
        <AnnouncementModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] });
            setEditing(null);
            showToast('Đã lưu bản nháp');
          }}
        />
      )}
      <Toast message={toast} />
    </div>
  );
}

function AnnouncementModal({ initial, onClose, onSaved }: { initial: Partial<Announcement>; onClose: () => void; onSaved: () => void }) {
  const first = initial.targets?.[0] ?? { type: 'ALL' };
  const [title, setTitle] = useState(initial.title ?? '');
  const [content, setContent] = useState(initial.content ?? '');
  const [expiresAt, setExpiresAt] = useState(initial.expiresAtIso ? initial.expiresAtIso.slice(0, 16) : '');
  const [target, setTarget] = useState<AnnouncementTarget>(first);
  const save = useMutation({
    mutationFn: () => {
      const input = { title, content, expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined, targets: [target] };
      return initial.id ? updateAnnouncement(initial.id, input) : createAnnouncement(input);
    },
    onSuccess: onSaved,
  });
  const valid = title.trim() && content.trim() && (target.type !== 'USER' || target.userId?.trim());
  return (
    <Modal
      title={initial.id ? 'Sửa thông báo' : 'Soạn thông báo'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={outlineButton} onClick={onClose}>Huỷ</button>
          <button type="button" className={primaryButton} disabled={save.isPending || !valid} onClick={() => save.mutate()}>
            {save.isPending ? 'Đang lưu...' : 'Lưu bản nháp'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <label className="block">
          <span className={fieldLabel}>Tiêu đề</span>
          <input className={underlineInput} maxLength={255} value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="block">
          <span className={fieldLabel}>Nội dung</span>
          <textarea rows={6} className={`${boxInput} mt-2`} value={content} onChange={(e) => setContent(e.target.value)} />
        </label>
        <label className="block max-w-xs">
          <span className={fieldLabel}>Hết hạn (để trống nếu không hết hạn)</span>
          <input type="datetime-local" className={underlineInput} value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </label>
        <div>
          <span className={fieldLabel}>Người nhận</span>
          <RadioRow name="target" checked={target.type === 'ALL'} onChange={() => setTarget({ type: 'ALL' })} label="Mọi người dùng" />
          <RadioRow name="target" checked={target.type === 'ROLE'} onChange={() => setTarget({ type: 'ROLE', role: 'CANDIDATE' })} label="Theo vai trò" />
          {target.type === 'ROLE' && (
            <select className={`${underlineSelect} mt-2 max-w-xs`} value={target.role} onChange={(e) => setTarget({ type: 'ROLE', role: e.target.value as AnnouncementTarget['role'] })}>
              {Object.entries(ROLE_LABEL).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          )}
          <RadioRow name="target" checked={target.type === 'USER'} onChange={() => setTarget({ type: 'USER', userId: '' })} label="Một người dùng (theo ID)" />
          {target.type === 'USER' && (
            <input className={`${underlineInput} mt-2`} placeholder="UUID người dùng" value={target.userId ?? ''} onChange={(e) => setTarget({ type: 'USER', userId: e.target.value })} />
          )}
        </div>
      </div>
      {save.isError && <p className="mt-3 text-sm text-danger">{errorText(save.error)}</p>}
    </Modal>
  );
}
