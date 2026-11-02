import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Loading, ErrorState } from '../../components/ui';
import {
  InfoRow,
  Modal,
  SectionHead,
  ThinBar,
  Toast,
  dangerButton,
  fieldLabel,
  outlineButton,
  primaryButton,
  textLink,
  underlineInput,
} from '../../components/admin/AdminKit';
import { RolePicker } from '../../components/admin/RolePicker';
import {
  getUserById,
  updateUser,
  toggleLockUser,
  updateUserRole,
  resetUserPassword,
  deleteUser,
  permissionsForRole,
  getDefaultPermissionsForRole,
} from '../../services/userService';
import type { AdminManagedUser, UpdateUserPayload } from '../../types/userManagement';
import type { UserRole } from '../../types/domain';
import { useTranslation } from '../../i18n';

const copy = {
  vi: {
    back: 'Quay lại danh sách người dùng',
    joined: 'Tham gia',
    roles: { CANDIDATE: 'Ứng viên', CAREER_CONSULTANT: 'Cố vấn nghề nghiệp', ADMIN: 'Quản trị viên' } as Record<UserRole, string>,
    status: { ACTIVE: 'Hoạt động', SUSPENDED: 'Bị khoá', PENDING: 'Chờ kích hoạt' } as Record<AdminManagedUser['status'], string>,
    verified: 'Đã xác thực OTP',
    unverified: 'Chờ xác thực OTP',
    defaultHeadline: 'Người dùng nền tảng CCV',
    activeAgo: (t: string) => `Hoạt động ${t}`,
    actions: { edit: 'Sửa thông tin', role: 'Phân quyền (Role)', lock: 'Khoá tài khoản', unlock: 'Mở khoá', reset: 'Reset mật khẩu', del: 'Xoá tài khoản' },
    suspended: 'Tài khoản đang bị khoá bởi quản trị viên.',
    reason: 'Lý do',
    defaultReason: 'Vi phạm điều khoản sử dụng hệ thống',
    lockedAt: 'Thời gian khoá',
    anchors: [
      ['profile', 'Hồ sơ'],
      ['permissions', 'Quyền hạn'],
      ['subscription', 'Gói cước & Token AI'],
      ['activities', 'Lịch sử hoạt động'],
      ['notes', 'Ghi chú'],
      ['security', 'Bảo mật'],
    ] as [string, string][],
    s1: 'Giới thiệu bản thân',
    noBio: 'Chưa cập nhật phần giới thiệu cá nhân.',
    s2: 'Thông tin chi tiết tài khoản',
    fullName: 'Họ và tên đầy đủ',
    email: 'Email đăng nhập',
    phone: 'Số điện thoại',
    location: 'Địa điểm làm việc',
    notUpdated: 'Chưa cập nhật',
    created: 'Ngày tạo tài khoản',
    lastActive: 'Lần hoạt động gần nhất',
    s3: (n: number) => `Ma trận quyền hạn (${n})`,
    editRole: 'Chỉnh sửa phân quyền',
    allowed: 'Được phép',
    denied: 'Không có',
    s4: 'Gói cước & Token AI',
    plan: 'Gói cước',
    quota: 'Token AI được cấp',
    perMonth: 'token / tháng',
    used: 'Đã dùng tháng này',
    remaining: 'Còn lại',
    cycle: 'Chu kỳ',
    cycleValue: 'Hàng tháng, tự động gia hạn',
    s5: 'Lịch sử hoạt động & kiểm toán',
    events: (n: number) => `${n} sự kiện`,
    noEvents: 'Chưa có hoạt động nào.',
    s6: 'Ghi chú quản trị viên',
    private: 'Riêng tư, chỉ admin thấy',
    notesPh: 'Ghi chú riêng của ban quản trị về tài khoản này…',
    saveNotes: 'Lưu ghi chú',
    savingNotes: 'Đang lưu…',
    s7: 'Bảo mật & tuân thủ',
    hash: 'Mã hoá mật khẩu',
    otp: 'Xác thực 2 bước (OTP)',
    otpOn: 'Đã kích hoạt',
    otpOff: 'Chưa kích hoạt',
    pwdChanged: 'Lần đổi mật khẩu cuối',
    pwdChangedValue: '10 ngày trước',
    lastIp: 'Địa chỉ IP truy cập gần nhất',
    toastUpdated: 'Đã cập nhật thông tin.',
    toastLocked: 'Đã khoá tài khoản.',
    toastUnlocked: 'Đã kích hoạt lại tài khoản.',
    toastRole: (r: string) => `Đã chuyển vai trò sang ${r}.`,
    toastReset: (p: string) => `Đặt lại mật khẩu: ${p}.`,
    toastDeleted: 'Đã xoá tài khoản vĩnh viễn.',
    editTitle: 'Sửa thông tin',
    nameField: 'Họ và tên *',
    emailField: 'Email *',
    phoneField: 'Số điện thoại',
    locationField: 'Địa điểm',
    headlineField: 'Chức danh',
    cancel: 'Huỷ',
    saving: 'Đang lưu…',
    save: 'Lưu thay đổi',
    lockTitle: 'Khoá tài khoản',
    unlockTitle: 'Mở khoá tài khoản',
    lockText: (n: string) => `Khoá "${n}" sẽ chặn đăng nhập và mọi lượt gọi AI.`,
    unlockText: (n: string) => `Kích hoạt lại tài khoản "${n}"?`,
    lockReason: 'Lý do khoá',
    lockReasonPh: 'Nhập lý do khoá tài khoản…',
    confirmLock: 'Xác nhận khoá',
    confirmUnlock: 'Mở khoá',
    roleTitle: 'Phân quyền',
    saveRole: 'Lưu phân quyền',
    deleteTitle: 'Xoá tài khoản vĩnh viễn',
    deleteText: (n: string) => `Xoá tài khoản ${n}? Hành động này không thể hoàn tác.`,
    confirmDelete: 'Xác nhận xoá',
  },
  en: {
    back: 'Back to users',
    joined: 'Joined',
    roles: { CANDIDATE: 'Candidate', CAREER_CONSULTANT: 'Career consultant', ADMIN: 'Administrator' } as Record<UserRole, string>,
    status: { ACTIVE: 'Active', SUSPENDED: 'Suspended', PENDING: 'Pending' } as Record<AdminManagedUser['status'], string>,
    verified: 'OTP verified',
    unverified: 'Awaiting OTP',
    defaultHeadline: 'CCV platform user',
    activeAgo: (t: string) => `Active ${t}`,
    actions: { edit: 'Edit details', role: 'Roles', lock: 'Suspend account', unlock: 'Activate', reset: 'Reset password', del: 'Delete account' },
    suspended: 'This account is suspended by an administrator.',
    reason: 'Reason',
    defaultReason: 'Terms of service violation',
    lockedAt: 'Suspended at',
    anchors: [
      ['profile', 'Profile'],
      ['permissions', 'Permissions'],
      ['subscription', 'Plan & AI tokens'],
      ['activities', 'Activity'],
      ['notes', 'Notes'],
      ['security', 'Security'],
    ] as [string, string][],
    s1: 'About',
    noBio: 'No bio yet.',
    s2: 'Account details',
    fullName: 'Full name',
    email: 'Login email',
    phone: 'Phone',
    location: 'Location',
    notUpdated: 'Not set',
    created: 'Created',
    lastActive: 'Last active',
    s3: (n: number) => `Permission matrix (${n})`,
    editRole: 'Edit permissions',
    allowed: 'Allowed',
    denied: 'None',
    s4: 'Plan & AI tokens',
    plan: 'Plan',
    quota: 'Monthly AI tokens',
    perMonth: 'tokens / month',
    used: 'Used this month',
    remaining: 'Remaining',
    cycle: 'Cycle',
    cycleValue: 'Monthly, auto-renew',
    s5: 'Activity & audit log',
    events: (n: number) => `${n} events`,
    noEvents: 'No activity yet.',
    s6: 'Admin notes',
    private: 'Private, admins only',
    notesPh: 'Private notes about this account…',
    saveNotes: 'Save notes',
    savingNotes: 'Saving…',
    s7: 'Security & compliance',
    hash: 'Password hashing',
    otp: 'Two-step verification (OTP)',
    otpOn: 'Enabled',
    otpOff: 'Not enabled',
    pwdChanged: 'Password last changed',
    pwdChangedValue: '10 days ago',
    lastIp: 'Last IP address',
    toastUpdated: 'Details updated.',
    toastLocked: 'Account suspended.',
    toastUnlocked: 'Account activated.',
    toastRole: (r: string) => `Role changed to ${r}.`,
    toastReset: (p: string) => `Password reset: ${p}.`,
    toastDeleted: 'Account deleted permanently.',
    editTitle: 'Edit details',
    nameField: 'Full name *',
    emailField: 'Email *',
    phoneField: 'Phone',
    locationField: 'Location',
    headlineField: 'Headline',
    cancel: 'Cancel',
    saving: 'Saving…',
    save: 'Save changes',
    lockTitle: 'Suspend account',
    unlockTitle: 'Activate account',
    lockText: (n: string) => `Suspending "${n}" blocks sign-in and every AI request.`,
    unlockText: (n: string) => `Reactivate "${n}"?`,
    lockReason: 'Reason',
    lockReasonPh: 'Why is this account suspended…',
    confirmLock: 'Suspend',
    confirmUnlock: 'Activate',
    roleTitle: 'Roles & permissions',
    saveRole: 'Save permissions',
    deleteTitle: 'Delete account permanently',
    deleteText: (n: string) => `Delete ${n}? This cannot be undone.`,
    confirmDelete: 'Delete',
  },
};

export default function UserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isVietnamese } = useTranslation();
  const lang = isVietnamese ? 'vi' : 'en';
  const c = copy[lang];
  const locale = isVietnamese ? 'vi-VN' : 'en-US';
  const queryClient = useQueryClient();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockReason, setLockReason] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>('CANDIDATE');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Admin notes state
  const [adminNotes, setAdminNotes] = useState('');
  const [notesInitialized, setNotesInitialized] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['admin-managed-user', id],
    queryFn: () => getUserById(id || ''),
    enabled: !!id,
  });

  if (user && !notesInitialized) {
    setAdminNotes(user.notes || '');
    setNotesInitialized(true);
  }

  // Mutations
  const updateMutation = useMutation({
    mutationFn: (payload: UpdateUserPayload) => updateUser(id!, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['admin-managed-user', id], updated);
      queryClient.invalidateQueries({ queryKey: ['admin-managed-users'] });
      setShowEditModal(false);
      showToast(c.toastUpdated);
    },
    onError: (err: Error) => showToast(err.message),
  });

  const lockMutation = useMutation({
    mutationFn: ({ status, reason }: { status: 'ACTIVE' | 'SUSPENDED'; reason?: string }) =>
      toggleLockUser(id!, status, reason),
    onSuccess: (updated) => {
      queryClient.setQueryData(['admin-managed-user', id], updated);
      queryClient.invalidateQueries({ queryKey: ['admin-managed-users'] });
      setShowLockModal(false);
      setLockReason('');
      showToast(updated.status === 'SUSPENDED' ? c.toastLocked : c.toastUnlocked);
    },
    onError: (err: Error) => showToast(err.message),
  });

  const roleMutation = useMutation({
    mutationFn: ({ role, permissions }: { role: UserRole; permissions: string[] }) =>
      updateUserRole(id!, role, permissions),
    onSuccess: (updated) => {
      queryClient.setQueryData(['admin-managed-user', id], updated);
      queryClient.invalidateQueries({ queryKey: ['admin-managed-users'] });
      setShowRoleModal(false);
      showToast(c.toastRole(c.roles[updated.role]));
    },
    onError: (err: Error) => showToast(err.message),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: () => resetUserPassword(id!),
    onSuccess: (pwd) => {
      showToast(c.toastReset(pwd));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteUser(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-managed-users'] });
      navigate('/admin/users');
      showToast(c.toastDeleted);
    },
    onError: (err: Error) => showToast(err.message),
  });

  if (isLoading) return <Loading />;
  if (isError || !user) {
    return (
      <div className="py-12">
        <ErrorState />
        <Link to="/admin/users" className={`${textLink} mt-6 text-ink`}>
          {c.back}
        </Link>
      </div>
    );
  }

  const openRoleModal = () => {
    setNewRole(user.role);
    setSelectedPermissions(user.permissions || getDefaultPermissionsForRole(user.role));
    setShowRoleModal(true);
  };

  const tokenUsagePercent = Math.min(100, Math.round((user.tokensUsedThisMonth / user.tokenMonthlyQuota) * 100));
  const statusTone = user.status === 'ACTIVE' ? 'text-brand' : user.status === 'SUSPENDED' ? 'text-danger' : 'text-orange-600';
  const lastIp = user.recentActivities[0]?.ipAddress ?? '113.161.72.45';
  // Chỉ quyền của vai trò hiện tại.
  const rolePermissions = permissionsForRole(user.role);
  const grantedCount = rolePermissions.filter((p) => user.permissions?.includes(p.key)).length;
  const sorted = [...rolePermissions].sort(
    (a, b) => Number(user.permissions?.includes(b.key)) - Number(user.permissions?.includes(a.key))
  );

  return (
    <div className="max-w-[56rem]">
      <Toast message={toastMessage} />

      {/* Top row */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[13px]">
        <Link to="/admin/users" className={`${textLink} text-[13px] text-slate-600`}>
          <ArrowLeft size={13} aria-hidden />
          {c.back}
        </Link>
        <span className="tabular-nums text-slate-500">
          ID #{user.id} · {c.joined} {user.createdAt}
        </span>
      </div>

      {/* Header */}
      <header className="mt-[clamp(1.75rem,3.5vw,2.5rem)]">
        <p className="text-[13px] text-slate-600">
          {c.roles[user.role]} · <span className={statusTone}>{c.status[user.status]}</span> ·{' '}
          {user.isVerified ? c.verified : <span className="text-orange-600">{c.unverified}</span>}
        </p>
        <h1 className="mt-3 text-[clamp(2.25rem,4.6vw,4rem)] font-normal leading-[1.08] tracking-[-0.03em] text-ink">
          {user.name}.
          <span className="block text-brand">{(user.headline || c.defaultHeadline).replace(/\.$/, '')}.</span>
        </h1>
        <p className="mt-5 text-[13px] text-slate-600">
          {[user.email, user.phone, user.location, c.activeAgo(user.lastActiveAt)].filter(Boolean).join(' · ')}
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
          <button type="button" onClick={() => setShowEditModal(true)} className={primaryButton}>
            {c.actions.edit}
          </button>
          <button type="button" onClick={openRoleModal} className={`${textLink} text-ink`}>
            {c.actions.role}
          </button>
          <button
            type="button"
            onClick={() => {
              setLockReason(user.suspendedReason || '');
              setShowLockModal(true);
            }}
            className={`${textLink} ${user.status === 'SUSPENDED' ? 'text-brand' : 'text-danger'}`}
          >
            {user.status === 'SUSPENDED' ? c.actions.unlock : c.actions.lock}
          </button>
          <button
            type="button"
            onClick={() => resetPasswordMutation.mutate()}
            disabled={resetPasswordMutation.isPending}
            className={`${textLink} text-ink`}
          >
            {c.actions.reset}
          </button>
          {user.email !== 'admin@example.com' && (
            <button type="button" onClick={() => setShowDeleteModal(true)} className={`${textLink} text-danger`}>
              {c.actions.del}
            </button>
          )}
        </div>
      </header>

      {user.status === 'SUSPENDED' && (
        <div className="mt-10 border-y border-red-200 py-4 text-sm">
          <p className="text-danger">{c.suspended}</p>
          <p className="mt-1 text-slate-700">
            {c.reason}: {user.suspendedReason || c.defaultReason}
            {user.suspendedAt && <span className="text-slate-500"> · {c.lockedAt}: {user.suspendedAt}</span>}
          </p>
        </div>
      )}

      {/* Anchor row */}
      <nav className="mt-[clamp(2.5rem,5vw,3.5rem)] flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
        {c.anchors.map(([key, label]) => (
          <a key={key} href={`#user-${key}`} className="border-b border-current pb-px text-ink hover:text-brand">
            {label}
          </a>
        ))}
      </nav>

      {/* 01 */}
      <section className="mt-[clamp(2.5rem,5vw,3.5rem)]">
        <SectionHead id="user-profile" index="01" title={c.s1} />
        <p className="py-5 text-[15px] leading-7 text-ink">{user.bio || <span className="text-slate-500">{c.noBio}</span>}</p>
      </section>

      {/* 02 */}
      <section className="mt-12">
        <SectionHead index="02" title={c.s2} />
        <dl>
          <InfoRow label={c.fullName}>{user.name}</InfoRow>
          <InfoRow label={c.email}>{user.email}</InfoRow>
          <InfoRow label={c.phone}>{user.phone}</InfoRow>
          <InfoRow label={c.location}>{user.location || c.notUpdated}</InfoRow>
          <InfoRow label={c.created}>{user.createdAt}</InfoRow>
          <InfoRow label={c.lastActive} tone="brand">
            {user.lastActiveAt}
          </InfoRow>
        </dl>
      </section>

      {/* 03 */}
      <section className="mt-14">
        <SectionHead
          id="user-permissions"
          index="03"
          title={c.s3(grantedCount)}
          action={
            <button type="button" onClick={openRoleModal} className={`${textLink} text-[13px] text-ink`}>
              {c.editRole}
            </button>
          }
        />
        <ul>
          {sorted.map((p) => {
            const has = user.permissions?.includes(p.key);
            return (
              <li key={p.key} className="flex items-baseline justify-between gap-6 border-b border-border py-3" title={p.description}>
                <span className={`text-sm ${has ? 'text-ink' : 'text-slate-500'}`}>{p.name}</span>
                <span className={`shrink-0 text-xs ${has ? 'text-brand' : 'text-slate-500'}`}>{has ? c.allowed : c.denied}</span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 04 */}
      <section className="mt-14">
        <SectionHead id="user-subscription" index="04" title={c.s4} />
        <dl>
          <InfoRow label={c.plan}>{user.planName}</InfoRow>
          <InfoRow label={c.quota}>
            {user.tokenMonthlyQuota.toLocaleString(locale)} {c.perMonth}
          </InfoRow>
          <InfoRow label={c.used}>
            <span className="tabular-nums">
              {user.tokensUsedThisMonth.toLocaleString(locale)} token <span className="text-slate-500">({tokenUsagePercent}%)</span>
            </span>
            <span className="mt-2.5 block max-w-sm">
              <ThinBar value={tokenUsagePercent} tone={tokenUsagePercent > 80 ? 'danger' : 'brand'} />
            </span>
          </InfoRow>
          <InfoRow label={c.remaining}>
            {Math.max(0, user.tokenMonthlyQuota - user.tokensUsedThisMonth).toLocaleString(locale)} token
          </InfoRow>
          <InfoRow label={c.cycle}>{c.cycleValue}</InfoRow>
        </dl>
      </section>

      {/* 05 */}
      <section className="mt-14">
        <SectionHead id="user-activities" index="05" title={c.s5} meta={c.events(user.recentActivities.length)} />
        {user.recentActivities.length === 0 ? (
          <p className="border-b border-border py-6 text-sm text-slate-500">{c.noEvents}</p>
        ) : (
          <ul>
            {user.recentActivities.map((act) => (
              <li key={act.id} className="grid gap-1 border-b border-border py-3.5 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-6">
                <span className="text-[13px] tabular-nums text-slate-500">{act.timestamp}</span>
                <div className="min-w-0">
                  <p className="text-sm text-ink">{act.action}</p>
                  <p className="mt-0.5 text-[13px] text-slate-600">
                    {act.details} · IP {act.ipAddress}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 06 */}
      <section className="mt-14">
        <SectionHead id="user-notes" index="06" title={c.s6} meta={c.private} />
        <textarea
          rows={4}
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder={c.notesPh}
          aria-label={c.s6}
          className="mt-4 w-full resize-y border-0 border-b border-slate-300 bg-transparent py-2 text-[15px] leading-7 text-ink outline-none placeholder:text-slate-400 focus:border-brand"
        />
        <button
          type="button"
          onClick={() => updateMutation.mutate({ notes: adminNotes })}
          disabled={updateMutation.isPending}
          className={`${textLink} mt-4 text-ink`}
        >
          {updateMutation.isPending ? c.savingNotes : c.saveNotes}
        </button>
      </section>

      {/* 07 */}
      <section className="mt-14">
        <SectionHead id="user-security" index="07" title={c.s7} />
        <dl>
          <InfoRow label={c.hash}>PBKDF2 SHA-256</InfoRow>
          <InfoRow label={c.otp} tone={user.isVerified ? 'brand' : 'warning'}>
            {user.isVerified ? c.otpOn : c.otpOff}
          </InfoRow>
          <InfoRow label={c.pwdChanged}>{c.pwdChangedValue}</InfoRow>
          <InfoRow label={c.lastIp}>{lastIp}</InfoRow>
        </dl>
      </section>

      {/* Edit Modal */}
      {showEditModal && (
        <Modal
          title={c.editTitle}
          eyebrow={user.name}
          onClose={() => setShowEditModal(false)}
          footer={
            <>
              <button type="button" onClick={() => setShowEditModal(false)} className={outlineButton}>
                {c.cancel}
              </button>
              <button type="submit" form="admin-user-edit" disabled={updateMutation.isPending} className={primaryButton}>
                {updateMutation.isPending ? c.saving : c.save}
              </button>
            </>
          }
        >
          <form
            id="admin-user-edit"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const name = (form.elements.namedItem('name') as HTMLInputElement).value;
              const email = (form.elements.namedItem('email') as HTMLInputElement).value;
              const phone = (form.elements.namedItem('phone') as HTMLInputElement).value;
              const location = (form.elements.namedItem('location') as HTMLInputElement).value;
              const headline = (form.elements.namedItem('headline') as HTMLInputElement).value;
              updateMutation.mutate({ name, email, phone, location, headline });
            }}
            className="grid gap-x-8 gap-y-6 sm:grid-cols-2"
          >
            <label className="block">
              <span className={fieldLabel}>{c.nameField}</span>
              <input name="name" defaultValue={user.name} required className={underlineInput} />
            </label>
            <label className="block">
              <span className={fieldLabel}>{c.emailField}</span>
              <input name="email" type="email" defaultValue={user.email} required className={underlineInput} />
            </label>
            <label className="block">
              <span className={fieldLabel}>{c.phoneField}</span>
              <input name="phone" defaultValue={user.phone} className={underlineInput} />
            </label>
            <label className="block">
              <span className={fieldLabel}>{c.locationField}</span>
              <input name="location" defaultValue={user.location} className={underlineInput} />
            </label>
            <label className="block sm:col-span-2">
              <span className={fieldLabel}>{c.headlineField}</span>
              <input name="headline" defaultValue={user.headline} className={underlineInput} />
            </label>
          </form>
        </Modal>
      )}

      {/* Lock Modal */}
      {showLockModal && (
        <Modal
          title={user.status === 'SUSPENDED' ? c.unlockTitle : c.lockTitle}
          eyebrow={user.name}
          onClose={() => setShowLockModal(false)}
          width="max-w-lg"
          footer={
            <>
              <button type="button" onClick={() => setShowLockModal(false)} className={outlineButton}>
                {c.cancel}
              </button>
              <button
                type="button"
                onClick={() =>
                  lockMutation.mutate({
                    status: user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED',
                    reason: lockReason.trim(),
                  })
                }
                disabled={lockMutation.isPending}
                className={user.status === 'SUSPENDED' ? primaryButton : dangerButton}
              >
                {user.status === 'SUSPENDED' ? c.confirmUnlock : c.confirmLock}
              </button>
            </>
          }
        >
          <p className="text-[15px] leading-7 text-slate-700">
            {user.status === 'SUSPENDED' ? c.unlockText(user.name) : c.lockText(user.name)}
          </p>
          {user.status !== 'SUSPENDED' && (
            <label className="mt-6 block">
              <span className={fieldLabel}>{c.lockReason}</span>
              <textarea
                rows={2}
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
                placeholder={c.lockReasonPh}
                className={`${underlineInput} resize-none leading-7`}
              />
            </label>
          )}
        </Modal>
      )}

      {/* Role Modal */}
      {showRoleModal && (
        <Modal
          title={c.roleTitle}
          eyebrow={user.name}
          onClose={() => setShowRoleModal(false)}
          footer={
            <>
              <button type="button" onClick={() => setShowRoleModal(false)} className={outlineButton}>
                {c.cancel}
              </button>
              <button
                type="button"
                onClick={() => roleMutation.mutate({ role: newRole, permissions: selectedPermissions })}
                disabled={roleMutation.isPending}
                className={primaryButton}
              >
                {c.saveRole}
              </button>
            </>
          }
        >
          <RolePicker
            lang={lang}
            role={newRole}
            onRole={(r) => {
              setNewRole(r);
              setSelectedPermissions(getDefaultPermissionsForRole(r));
            }}
            permissions={selectedPermissions}
            onPermissions={setSelectedPermissions}
          />
        </Modal>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <Modal
          title={c.deleteTitle}
          eyebrow={user.name}
          onClose={() => setShowDeleteModal(false)}
          width="max-w-lg"
          footer={
            <>
              <button type="button" onClick={() => setShowDeleteModal(false)} className={outlineButton}>
                {c.cancel}
              </button>
              <button type="button" onClick={() => deleteMutation.mutate()} className={dangerButton}>
                {c.confirmDelete}
              </button>
            </>
          }
        >
          <p className="text-[15px] leading-7 text-slate-700">{c.deleteText(user.name)}</p>
        </Modal>
      )}
    </div>
  );
}
