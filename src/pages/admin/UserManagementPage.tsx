import { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loading, ErrorState } from '../../components/ui';
import {
  EmptyRow,
  InfoRow,
  Modal,
  RowMenu,
  Toast,
  UnderlineTabs,
  brandLink,
  dangerButton,
  fieldLabel,
  outlineButton,
  primaryButton,
  smallPrimary,
  textLink,
  underlineInput,
  underlineSelect,
} from '../../components/admin/AdminKit';
import { RolePicker } from '../../components/admin/RolePicker';
import {
  getManagedUsers,
  createUser,
  updateUser,
  toggleLockUser,
  updateUserRole,
  deleteUser,
  resetUserPassword,
  getDefaultPermissionsForRole,
} from '../../services/userService';
import type {
  AdminManagedUser,
  CreateUserPayload,
  UpdateUserPayload,
  UserAccountStatus,
  UserSubscriptionTier,
} from '../../types/userManagement';
import type { UserRole } from '../../types/domain';
import { useTranslation } from '../../i18n';

const copy = {
  vi: {
    eyebrow: 'Quản lý người dùng',
    title: 'Người dùng.',
    line2: (n: number) => `${n.toLocaleString('vi-VN')} tài khoản trong hệ thống.`,
    create: 'Tạo người dùng',
    exportCsv: 'Xuất CSV',
    refresh: 'Làm mới',
    refreshing: 'Đang làm mới…',
    search: 'Tìm kiếm',
    searchPh: 'Tên, email, số điện thoại hoặc ID',
    plan: 'Gói đăng ký',
    allPlans: 'Tất cả gói',
    status: 'Trạng thái',
    allStatus: 'Tất cả',
    sort: 'Sắp xếp',
    sorts: { newest: 'Mới nhất', oldest: 'Cũ nhất', name_asc: 'Tên A–Z', tokens_desc: 'Dùng nhiều token' },
    all: 'Tất cả',
    showing: (n: number) => `Hiển thị ${n} người dùng`,
    resetFilters: 'Xoá bộ lọc',
    empty: 'Không tìm thấy người dùng phù hợp. Thử từ khoá khác hoặc xoá bớt bộ lọc.',
    detail: 'Chi tiết',
    more: 'Thao tác khác',
    menu: { inspect: 'Xem nhanh', edit: 'Sửa thông tin', role: 'Phân quyền', lock: 'Khoá tài khoản', unlock: 'Mở khoá', del: 'Xoá tài khoản' },
    toastCreate: (n: string) => `Đã tạo tài khoản "${n}".`,
    toastUpdate: (n: string) => `Đã cập nhật tài khoản "${n}".`,
    toastLock: (n: string) => `Đã khoá tài khoản "${n}".`,
    toastUnlock: (n: string) => `Đã mở khoá tài khoản "${n}".`,
    toastRole: (n: string, r: string, p: number) => `Đã chuyển "${n}" sang ${r} với ${p} quyền.`,
    toastDelete: 'Đã xoá tài khoản.',
    toastReset: (p: string) => `Đã đặt lại mật khẩu về mặc định: "${p}"`,
    toastExport: 'Đã xuất danh sách người dùng CSV.',
    errCreate: 'Lỗi khi tạo người dùng.',
    errUpdate: 'Lỗi khi cập nhật.',
    errLock: 'Lỗi khi thay đổi trạng thái.',
    errRole: 'Lỗi khi đổi vai trò.',
    errDelete: 'Không thể xoá người dùng.',
    form: {
      createTitle: 'Tạo tài khoản mới',
      editTitle: 'Sửa thông tin',
      name: 'Họ và tên *',
      namePh: 'Ví dụ: Nguyễn Văn A',
      email: 'Email *',
      phone: 'Số điện thoại',
      password: 'Mật khẩu ban đầu',
      role: 'Vai trò *',
      plan: 'Gói dịch vụ',
      status: 'Trạng thái',
      location: 'Địa điểm làm việc',
      headline: 'Chức danh',
      headlinePh: 'Ví dụ: Senior Backend Engineer / HR Consultant',
      notes: 'Ghi chú nội bộ',
      notesPh: 'Nguồn gốc tài khoản, lý do tạo hoặc yêu cầu hỗ trợ…',
      cancel: 'Huỷ',
      creating: 'Đang tạo…',
      createBtn: 'Tạo tài khoản',
      saving: 'Đang lưu…',
      save: 'Lưu thay đổi',
      resetPwd: 'Đặt lại mật khẩu mặc định',
    },
    planOptions: {
      free: 'Miễn phí (20k token)',
      pro: 'Pro (250k token)',
      executive: 'Premium (1M token)',
      consultant: 'Đối tác cố vấn (500k token)',
      enterprise: 'Enterprise (2M token)',
    } as Record<UserSubscriptionTier, string>,
    statusOptions: { ACTIVE: 'Hoạt động', PENDING: 'Chờ xác thực OTP', SUSPENDED: 'Khoá tạm thời' } as Record<UserAccountStatus, string>,
    lockModal: {
      lockTitle: 'Khoá tài khoản',
      unlockTitle: 'Mở khoá tài khoản',
      lockText: (n: string, e: string) => `Khi bị khoá, "${n}" (${e}) sẽ không thể đăng nhập hoặc dùng các dịch vụ AI.`,
      unlockText: (n: string, e: string) => `Kích hoạt lại "${n}" (${e})? Người dùng sẽ đăng nhập bình thường.`,
      reason: 'Lý do khoá (ghi vào nhật ký) *',
      reasonPh: 'Ví dụ: vi phạm tần suất gọi API, phát tán spam, yêu cầu bảo mật…',
      confirmLock: 'Xác nhận khoá',
      confirmUnlock: 'Mở khoá',
    },
    roleModal: {
      title: 'Phân quyền',
      step1: 'Vai trò',
      step2: (a: number, b: number) => `Quyền hạn (${a}/${b})`,
      selectAll: 'Chọn tất cả',
      desc: {
        CANDIDATE: 'Nộp CV, làm bài kiểm tra, chat AI',
        CAREER_CONSULTANT: 'Tư vấn, xem CV và phản hồi',
        ADMIN: 'Toàn quyền quản trị hệ thống',
      } as Record<UserRole, string>,
      saving: 'Đang lưu…',
      save: 'Lưu phân quyền',
    },
    inspect: {
      eyebrow: 'Hồ sơ người dùng',
      plan: 'Gói đăng ký',
      tokens: 'Token tháng này',
      status: 'Trạng thái',
      recent: 'Hoạt động gần đây',
      full: 'Mở trang chi tiết',
      close: 'Đóng',
    },
    deleteModal: {
      title: 'Xoá tài khoản vĩnh viễn',
      text: (n: string, e: string) =>
        `Xoá tài khoản ${n} (${e})? Toàn bộ hồ sơ và lịch sử hoạt động liên quan sẽ bị loại khỏi hệ thống.`,
      cancel: 'Huỷ',
      deleting: 'Đang xoá…',
      confirm: 'Xoá vĩnh viễn',
    },
  },
  en: {
    eyebrow: 'User management',
    title: 'Users.',
    line2: (n: number) => `${n.toLocaleString('en-US')} accounts on the platform.`,
    create: 'Create user',
    exportCsv: 'Export CSV',
    refresh: 'Refresh',
    refreshing: 'Refreshing…',
    search: 'Search',
    searchPh: 'Name, email, phone or ID',
    plan: 'Plan',
    allPlans: 'All plans',
    status: 'Status',
    allStatus: 'All',
    sort: 'Sort',
    sorts: { newest: 'Newest', oldest: 'Oldest', name_asc: 'Name A–Z', tokens_desc: 'Most tokens' },
    all: 'All',
    showing: (n: number) => `Showing ${n} users`,
    resetFilters: 'Reset filters',
    empty: 'No users match. Try another keyword or clear some filters.',
    detail: 'Details',
    more: 'More actions',
    menu: { inspect: 'Quick view', edit: 'Edit details', role: 'Roles', lock: 'Suspend', unlock: 'Activate', del: 'Delete account' },
    toastCreate: (n: string) => `Created account "${n}".`,
    toastUpdate: (n: string) => `Updated account "${n}".`,
    toastLock: (n: string) => `Suspended "${n}".`,
    toastUnlock: (n: string) => `Activated "${n}".`,
    toastRole: (n: string, r: string, p: number) => `Moved "${n}" to ${r} with ${p} permissions.`,
    toastDelete: 'Deleted the account.',
    toastReset: (p: string) => `Password reset to default: "${p}"`,
    toastExport: 'Exported users to CSV.',
    errCreate: 'Could not create the user.',
    errUpdate: 'Could not update.',
    errLock: 'Could not change status.',
    errRole: 'Could not change role.',
    errDelete: 'Could not delete the user.',
    form: {
      createTitle: 'New account',
      editTitle: 'Edit details',
      name: 'Full name *',
      namePh: 'e.g. Jane Doe',
      email: 'Email *',
      phone: 'Phone',
      password: 'Initial password',
      role: 'Role *',
      plan: 'Plan',
      status: 'Status',
      location: 'Location',
      headline: 'Headline',
      headlinePh: 'e.g. Senior Backend Engineer / HR Consultant',
      notes: 'Internal notes',
      notesPh: 'Where the account came from, why it was created…',
      cancel: 'Cancel',
      creating: 'Creating…',
      createBtn: 'Create account',
      saving: 'Saving…',
      save: 'Save changes',
      resetPwd: 'Reset password to default',
    },
    planOptions: {
      free: 'Free (20k tokens)',
      pro: 'Pro (250k tokens)',
      executive: 'Premium (1M tokens)',
      consultant: 'Consultant partner (500k tokens)',
      enterprise: 'Enterprise (2M tokens)',
    } as Record<UserSubscriptionTier, string>,
    statusOptions: { ACTIVE: 'Active', PENDING: 'Awaiting OTP', SUSPENDED: 'Suspended' } as Record<UserAccountStatus, string>,
    lockModal: {
      lockTitle: 'Suspend account',
      unlockTitle: 'Activate account',
      lockText: (n: string, e: string) => `"${n}" (${e}) will not be able to sign in or use AI services.`,
      unlockText: (n: string, e: string) => `Reactivate "${n}" (${e})? They will be able to sign in again.`,
      reason: 'Reason (written to the audit log) *',
      reasonPh: 'e.g. API rate abuse, spam, security request…',
      confirmLock: 'Suspend',
      confirmUnlock: 'Activate',
    },
    roleModal: {
      title: 'Roles & permissions',
      step1: 'Role',
      step2: (a: number, b: number) => `Permissions (${a}/${b})`,
      selectAll: 'Select all',
      desc: {
        CANDIDATE: 'Upload CVs, take tests, chat with AI',
        CAREER_CONSULTANT: 'Consult, review CVs, give feedback',
        ADMIN: 'Full system administration',
      } as Record<UserRole, string>,
      saving: 'Saving…',
      save: 'Save permissions',
    },
    inspect: {
      eyebrow: 'User profile',
      plan: 'Plan',
      tokens: 'Tokens this month',
      status: 'Status',
      recent: 'Recent activity',
      full: 'Open full profile',
      close: 'Close',
    },
    deleteModal: {
      title: 'Delete account permanently',
      text: (n: string, e: string) => `Delete ${n} (${e})? Their profile and activity history will be removed.`,
      cancel: 'Cancel',
      deleting: 'Deleting…',
      confirm: 'Delete permanently',
    },
  },
};

const ROLE_LABEL: Record<'vi' | 'en', Record<UserRole, string>> = {
  vi: { CANDIDATE: 'Ứng viên', CAREER_CONSULTANT: 'Cố vấn', ADMIN: 'Quản trị viên' },
  en: { CANDIDATE: 'Candidate', CAREER_CONSULTANT: 'Consultant', ADMIN: 'Administrator' },
};

const STATUS_LABEL: Record<'vi' | 'en', Record<UserAccountStatus, string>> = {
  vi: { ACTIVE: 'Hoạt động', SUSPENDED: 'Bị khoá', PENDING: 'Chờ kích hoạt' },
  en: { ACTIVE: 'Active', SUSPENDED: 'Suspended', PENDING: 'Pending' },
};

const PLAN_SHORT: Record<'vi' | 'en', Record<UserSubscriptionTier, string>> = {
  vi: { free: 'Miễn phí', pro: 'Pro', executive: 'Premium', consultant: '–', enterprise: 'Enterprise' },
  en: { free: 'Free', pro: 'Pro', executive: 'Premium', consultant: '–', enterprise: 'Enterprise' },
};

const statusTone = (s: UserAccountStatus) =>
  s === 'ACTIVE' ? 'text-brand' : s === 'SUSPENDED' ? 'text-danger' : 'text-orange-600';

const isRole = (v: string | null): v is UserRole => v === 'CANDIDATE' || v === 'CAREER_CONSULTANT' || v === 'ADMIN';

export default function UserManagementPage() {
  const { isVietnamese } = useTranslation();
  const lang = isVietnamese ? 'vi' : 'en';
  const c = copy[lang];
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filter state (role can be opened from the sidebar via ?role=)
  const roleParam = searchParams.get('role');
  const selectedRole: UserRole | 'ALL' = isRole(roleParam) ? roleParam : 'ALL';
  const setSelectedRole = (role: UserRole | 'ALL') => {
    const next = new URLSearchParams(searchParams);
    if (role === 'ALL') next.delete('role');
    else next.set('role', role);
    setSearchParams(next, { replace: true });
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<UserAccountStatus | 'ALL'>('ALL');
  const [selectedPlan, setSelectedPlan] = useState<UserSubscriptionTier | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name_asc' | 'tokens_desc'>('newest');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<AdminManagedUser | null>(null);
  const [userToLock, setUserToLock] = useState<AdminManagedUser | null>(null);
  const [lockReason, setLockReason] = useState('');
  const [userToRole, setUserToRole] = useState<AdminManagedUser | null>(null);
  const [newAssignedRole, setNewAssignedRole] = useState<UserRole>('CANDIDATE');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [userToDelete, setUserToDelete] = useState<AdminManagedUser | null>(null);
  const [quickInspectUser, setQuickInspectUser] = useState<AdminManagedUser | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Create form state
  const [createForm, setCreateForm] = useState<CreateUserPayload>({
    name: '',
    email: '',
    phone: '',
    role: 'CANDIDATE',
    status: 'ACTIVE',
    isVerified: true,
    planId: 'pro',
    initialPassword: 'password123',
    location: 'TP. Hồ Chí Minh',
    headline: '',
    notes: '',
  });

  // Edit form state
  const [editForm, setEditForm] = useState<UpdateUserPayload>({});

  // Query users
  const {
    data: users = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['admin-managed-users'],
    queryFn: () => getManagedUsers(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: ['admin-managed-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        email: '',
        phone: '',
        role: 'CANDIDATE',
        status: 'ACTIVE',
        isVerified: true,
        planId: 'pro',
        initialPassword: 'password123',
        location: 'TP. Hồ Chí Minh',
        headline: '',
        notes: '',
      });
      showToast(c.toastCreate(newUser.name));
    },
    onError: (err: Error) => {
      showToast(err.message || c.errCreate);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) => updateUser(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-managed-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setUserToEdit(null);
      showToast(c.toastUpdate(updated.name));
    },
    onError: (err: Error) => {
      showToast(err.message || c.errUpdate);
    },
  });

  const lockMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: 'ACTIVE' | 'SUSPENDED'; reason?: string }) =>
      toggleLockUser(id, status, reason),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-managed-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setUserToLock(null);
      setLockReason('');
      showToast(res.status === 'SUSPENDED' ? c.toastLock(res.name) : c.toastUnlock(res.name));
    },
    onError: (err: Error) => {
      showToast(err.message || c.errLock);
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role, permissions }: { id: string; role: UserRole; permissions: string[] }) =>
      updateUserRole(id, role, permissions),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-managed-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setUserToRole(null);
      showToast(c.toastRole(res.name, ROLE_LABEL[lang][res.role], res.permissions.length));
    },
    onError: (err: Error) => {
      showToast(err.message || c.errRole);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-managed-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setUserToDelete(null);
      showToast(c.toastDelete);
    },
    onError: (err: Error) => {
      showToast(err.message || c.errDelete);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) => resetUserPassword(id),
    onSuccess: (pwd) => {
      showToast(c.toastReset(pwd));
    },
  });

  // Filtered & sorted users list
  const filteredUsers = useMemo(() => {
    let list = [...users];

    if (selectedRole !== 'ALL') {
      list = list.filter((u) => u.role === selectedRole);
    }

    if (selectedStatus !== 'ALL') {
      list = list.filter((u) => u.status === selectedStatus);
    }

    if (selectedPlan !== 'ALL') {
      list = list.filter((u) => u.planId === selectedPlan);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.includes(q) ||
          u.id.toLowerCase().includes(q) ||
          u.planName.toLowerCase().includes(q) ||
          (u.headline && u.headline.toLowerCase().includes(q)) ||
          (u.location && u.location.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'tokens_desc') {
        return b.tokensUsedThisMonth - a.tokensUsedThisMonth;
      }
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'oldest') {
        return Number(a.id) - Number(b.id);
      }
      return Number(b.id) - Number(a.id);
    });

    return list;
  }, [users, selectedRole, selectedStatus, selectedPlan, searchQuery, sortBy]);

  // Aggregate counts
  const counts = useMemo(() => {
    return {
      total: users.length,
      candidates: users.filter((u) => u.role === 'CANDIDATE').length,
      consultants: users.filter((u) => u.role === 'CAREER_CONSULTANT').length,
      admins: users.filter((u) => u.role === 'ADMIN').length,
      active: users.filter((u) => u.status === 'ACTIVE').length,
      suspended: users.filter((u) => u.status === 'SUSPENDED').length,
      pending: users.filter((u) => u.status === 'PENDING').length,
    };
  }, [users]);

  // Export CSV
  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent(
        `ID,Ho Ten,Email,So Dien Thoai,Vai Tro,Trang Thai,Goi Cuoc,Tokens Da Dung,Xac Thuc,Ngay Tao\n` +
          filteredUsers
            .map(
              (u) =>
                `"${u.id}","${u.name}","${u.email}","${u.phone}","${u.role}","${u.status}","${u.planName}",${u.tokensUsedThisMonth},"${u.isVerified ? 'Da xac minh' : 'Chua xac minh'}","${u.createdAt}"`
            )
            .join('\n')
      );

    const anchor = document.createElement('a');
    anchor.setAttribute('href', csvContent);
    anchor.setAttribute('download', `careerpilot-users-${Date.now()}.csv`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    showToast(c.toastExport);
  };

  const openEditModal = (user: AdminManagedUser) => {
    setUserToEdit(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      planId: user.planId,
      location: user.location,
      headline: user.headline,
      notes: user.notes,
    });
  };

  const openRoleModal = (user: AdminManagedUser) => {
    setUserToRole(user);
    setNewAssignedRole(user.role);
    setSelectedPermissions(user.permissions || getDefaultPermissionsForRole(user.role));
  };

  const resetFilters = () => {
    setSelectedRole('ALL');
    setSelectedStatus('ALL');
    setSelectedPlan('ALL');
    setSearchQuery('');
  };
  const hasFilters = selectedRole !== 'ALL' || selectedStatus !== 'ALL' || selectedPlan !== 'ALL' || !!searchQuery;

  if (isLoading) return <Loading />;
  if (isError) return <ErrorState />;

  return (
    <div>
      <Toast message={toastMessage} />

      {/* Header */}
      <header>
        <div className="mb-[clamp(1.25rem,2.5vw,2rem)] flex flex-wrap items-center justify-between gap-4">
          <p className="text-[13px] text-brand">{c.eyebrow}</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <button type="button" onClick={() => refetch()} disabled={isFetching} className={`${textLink} text-slate-600`}>
              {isFetching ? c.refreshing : c.refresh}
            </button>
            <button type="button" onClick={handleExportCsv} className={`${textLink} text-slate-600`}>
              {c.exportCsv}
            </button>
            <button type="button" onClick={() => setShowCreateModal(true)} className={smallPrimary}>
              {c.create}
            </button>
          </div>
        </div>
        <h1 className="text-[clamp(2.25rem,4.6vw,4rem)] font-normal leading-[1.08] tracking-[-0.03em] text-ink">
          {c.title}
          <span className="block text-brand">{c.line2(counts.total)}</span>
        </h1>
      </header>

      {/* Filters */}
      <div className="mt-[clamp(2rem,4vw,3rem)] grid gap-x-8 gap-y-6 md:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)]">
        <label className="block">
          <span className={fieldLabel}>{c.search}</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={c.searchPh}
            className={`${underlineInput} border-ink`}
          />
        </label>
        <label className="block">
          <span className={fieldLabel}>{c.plan}</span>
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value as UserSubscriptionTier | 'ALL')}
            className={`${underlineSelect} border-ink`}
          >
            <option value="ALL">{c.allPlans}</option>
            {(['free', 'pro', 'executive', 'consultant', 'enterprise'] as const).map((p) => (
              <option key={p} value={p}>
                {c.planOptions[p].replace(/\s*\(.*\)$/, '')}
              </option>
            ))}
          </select>
        </label>
      </div>

      <UnderlineTabs
        className="mt-10"
        tabs={[
          { value: 'ALL' as const, label: c.all, count: counts.total },
          { value: 'CANDIDATE' as const, label: ROLE_LABEL[lang].CANDIDATE, count: counts.candidates },
          { value: 'CAREER_CONSULTANT' as const, label: ROLE_LABEL[lang].CAREER_CONSULTANT, count: counts.consultants },
          { value: 'ADMIN' as const, label: ROLE_LABEL[lang].ADMIN, count: counts.admins },
        ]}
        value={selectedRole}
        onChange={setSelectedRole}
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-[13px] text-slate-600">
        <span>{c.showing(filteredUsers.length)}</span>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <label className="flex items-center gap-2">
            <span>{c.status}</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as UserAccountStatus | 'ALL')}
              className="cursor-pointer border-0 border-b border-slate-300 bg-transparent py-0.5 text-[13px] text-ink outline-none focus:border-brand"
            >
              <option value="ALL">
                {c.allStatus} ({counts.total})
              </option>
              <option value="ACTIVE">
                {STATUS_LABEL[lang].ACTIVE} ({counts.active})
              </option>
              <option value="PENDING">
                {STATUS_LABEL[lang].PENDING} ({counts.pending})
              </option>
              <option value="SUSPENDED">
                {STATUS_LABEL[lang].SUSPENDED} ({counts.suspended})
              </option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span>{c.sort}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="cursor-pointer border-0 border-b border-slate-300 bg-transparent py-0.5 text-[13px] text-ink outline-none focus:border-brand"
            >
              {(['newest', 'oldest', 'name_asc', 'tokens_desc'] as const).map((s) => (
                <option key={s} value={s}>
                  {c.sorts[s]}
                </option>
              ))}
            </select>
          </label>
          {hasFilters && (
            <button type="button" onClick={resetFilters} className={`${textLink} text-[13px]`}>
              {c.resetFilters}
            </button>
          )}
        </div>
      </div>

      {/* User rows */}
      {filteredUsers.length === 0 ? (
        <div className="mt-6">
          <EmptyRow>{c.empty}</EmptyRow>
        </div>
      ) : (
        <ul className="mt-2">
          {filteredUsers.map((u) => (
            <li
              key={u.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-1.5 border-b border-border py-5 md:grid-cols-[minmax(0,1fr)_7.5rem_6.5rem_7rem_6.5rem_auto]"
            >
              <div className="min-w-0">
                <Link to={`/admin/users/${u.id}`} className="block truncate text-[clamp(1rem,1.2vw,1.0625rem)] font-medium text-ink hover:text-brand">
                  {u.name}
                </Link>
                <p className="mt-0.5 truncate text-sm text-slate-600">{u.email}</p>
                <p className="mt-1 text-[13px] text-slate-600 md:hidden">
                  {ROLE_LABEL[lang][u.role]} · {PLAN_SHORT[lang][u.planId]} ·{' '}
                  <span className={statusTone(u.status)}>{STATUS_LABEL[lang][u.status]}</span> · {u.createdAt}
                </p>
              </div>
              <span className="hidden text-sm text-ink md:block">{ROLE_LABEL[lang][u.role]}</span>
              <span className="hidden text-sm text-slate-600 md:block">{PLAN_SHORT[lang][u.planId]}</span>
              <span className={`hidden text-sm md:block ${statusTone(u.status)}`} title={u.suspendedReason}>
                {STATUS_LABEL[lang][u.status]}
              </span>
              <span className="hidden text-[13px] tabular-nums text-slate-600 md:block">{u.createdAt}</span>
              <div className="flex items-center justify-end gap-2">
                <Link to={`/admin/users/${u.id}`} className={brandLink}>
                  {c.detail}
                </Link>
                <RowMenu
                  label={c.more}
                  items={[
                    { label: c.menu.inspect, onClick: () => setQuickInspectUser(u) },
                    { label: c.menu.edit, onClick: () => openEditModal(u) },
                    { label: c.menu.role, onClick: () => openRoleModal(u) },
                    {
                      label: u.status === 'SUSPENDED' ? c.menu.unlock : c.menu.lock,
                      onClick: () => {
                        setUserToLock(u);
                        setLockReason(u.suspendedReason || '');
                      },
                    },
                    {
                      label: c.menu.del,
                      tone: 'danger',
                      hidden: u.email === 'admin@example.com',
                      onClick: () => setUserToDelete(u),
                    },
                  ]}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* MODAL 1: CREATE NEW USER */}
      {showCreateModal && (
        <Modal
          title={c.form.createTitle}
          eyebrow={c.eyebrow}
          onClose={() => setShowCreateModal(false)}
          footer={
            <>
              <button type="button" onClick={() => setShowCreateModal(false)} className={outlineButton}>
                {c.form.cancel}
              </button>
              <button
                type="submit"
                form="admin-create-user"
                disabled={createMutation.isPending || !createForm.name.trim() || !createForm.email.trim()}
                className={primaryButton}
              >
                {createMutation.isPending ? c.form.creating : c.form.createBtn}
              </button>
            </>
          }
        >
          <form
            id="admin-create-user"
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(createForm);
            }}
            className="grid gap-x-8 gap-y-6 sm:grid-cols-2"
          >
            <label className="block">
              <span className={fieldLabel}>{c.form.name}</span>
              <input
                type="text"
                required
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder={c.form.namePh}
                className={underlineInput}
              />
            </label>
            <label className="block">
              <span className={fieldLabel}>{c.form.email}</span>
              <input
                type="email"
                required
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="email@example.com"
                className={underlineInput}
              />
            </label>
            <label className="block">
              <span className={fieldLabel}>{c.form.phone}</span>
              <input
                type="text"
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                placeholder="0912 345 678"
                className={underlineInput}
              />
            </label>
            <label className="block">
              <span className={fieldLabel}>{c.form.password}</span>
              <input
                type="text"
                value={createForm.initialPassword}
                onChange={(e) => setCreateForm({ ...createForm, initialPassword: e.target.value })}
                placeholder="password123"
                className={`${underlineInput} font-mono`}
              />
            </label>
            <label className="block">
              <span className={fieldLabel}>{c.form.role}</span>
              <select
                value={createForm.role}
                onChange={(e) => {
                  const role = e.target.value as UserRole;
                  const planId = role === 'ADMIN' ? 'enterprise' : role === 'CAREER_CONSULTANT' ? 'consultant' : 'pro';
                  setCreateForm({ ...createForm, role, planId });
                }}
                className={underlineSelect}
              >
                <option value="CANDIDATE">{ROLE_LABEL[lang].CANDIDATE}</option>
                <option value="CAREER_CONSULTANT">{ROLE_LABEL[lang].CAREER_CONSULTANT}</option>
                <option value="ADMIN">{ROLE_LABEL[lang].ADMIN}</option>
              </select>
            </label>
            <label className="block">
              <span className={fieldLabel}>{c.form.plan}</span>
              <select
                value={createForm.planId}
                onChange={(e) => setCreateForm({ ...createForm, planId: e.target.value as UserSubscriptionTier })}
                className={underlineSelect}
              >
                {(['free', 'pro', 'executive', 'consultant', 'enterprise'] as const).map((p) => (
                  <option key={p} value={p}>
                    {c.planOptions[p]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={fieldLabel}>{c.form.status}</span>
              <select
                value={createForm.status}
                onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as UserAccountStatus })}
                className={underlineSelect}
              >
                {(['ACTIVE', 'PENDING', 'SUSPENDED'] as const).map((s) => (
                  <option key={s} value={s}>
                    {c.statusOptions[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={fieldLabel}>{c.form.headline}</span>
              <input
                type="text"
                value={createForm.headline}
                onChange={(e) => setCreateForm({ ...createForm, headline: e.target.value })}
                placeholder={c.form.headlinePh}
                className={underlineInput}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={fieldLabel}>{c.form.notes}</span>
              <textarea
                rows={2}
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                placeholder={c.form.notesPh}
                className={`${underlineInput} resize-none leading-7`}
              />
            </label>
          </form>
        </Modal>
      )}

      {/* MODAL 2: EDIT USER ACCOUNT */}
      {userToEdit && (
        <Modal
          title={`${c.form.editTitle}: ${userToEdit.name}`}
          eyebrow={`#${userToEdit.id}`}
          onClose={() => setUserToEdit(null)}
          footer={
            <>
              <button
                type="button"
                onClick={() => resetPasswordMutation.mutate(userToEdit.id)}
                disabled={resetPasswordMutation.isPending}
                className={`${textLink} mr-auto text-slate-600`}
              >
                {c.form.resetPwd}
              </button>
              <button type="button" onClick={() => setUserToEdit(null)} className={outlineButton}>
                {c.form.cancel}
              </button>
              <button type="submit" form="admin-edit-user" disabled={updateMutation.isPending} className={primaryButton}>
                {updateMutation.isPending ? c.form.saving : c.form.save}
              </button>
            </>
          }
        >
          <form
            id="admin-edit-user"
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate({ id: userToEdit.id, payload: editForm });
            }}
            className="grid gap-x-8 gap-y-6 sm:grid-cols-2"
          >
            <label className="block">
              <span className={fieldLabel}>{c.form.name}</span>
              <input
                type="text"
                required
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className={underlineInput}
              />
            </label>
            <label className="block">
              <span className={fieldLabel}>{c.form.email}</span>
              <input
                type="email"
                required
                value={editForm.email || ''}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className={underlineInput}
              />
            </label>
            <label className="block">
              <span className={fieldLabel}>{c.form.phone}</span>
              <input
                type="text"
                value={editForm.phone || ''}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className={underlineInput}
              />
            </label>
            <label className="block">
              <span className={fieldLabel}>{c.form.plan}</span>
              <select
                value={editForm.planId}
                onChange={(e) => setEditForm({ ...editForm, planId: e.target.value as UserSubscriptionTier })}
                className={underlineSelect}
              >
                {(['free', 'pro', 'executive', 'consultant', 'enterprise'] as const).map((p) => (
                  <option key={p} value={p}>
                    {c.planOptions[p].replace(/\s*\(.*\)$/, '')}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={fieldLabel}>{c.form.status}</span>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as UserAccountStatus })}
                className={underlineSelect}
              >
                {(['ACTIVE', 'PENDING', 'SUSPENDED'] as const).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[lang][s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={fieldLabel}>{c.form.location}</span>
              <input
                type="text"
                value={editForm.location || ''}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                className={underlineInput}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={fieldLabel}>{c.form.headline}</span>
              <input
                type="text"
                value={editForm.headline || ''}
                onChange={(e) => setEditForm({ ...editForm, headline: e.target.value })}
                className={underlineInput}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={fieldLabel}>{c.form.notes}</span>
              <textarea
                rows={2}
                value={editForm.notes || ''}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                className={`${underlineInput} resize-none leading-7`}
              />
            </label>
          </form>
        </Modal>
      )}

      {/* MODAL 3: LOCK / UNLOCK USER */}
      {userToLock && (
        <Modal
          title={userToLock.status === 'SUSPENDED' ? c.lockModal.unlockTitle : c.lockModal.lockTitle}
          eyebrow={userToLock.name}
          onClose={() => setUserToLock(null)}
          width="max-w-lg"
          footer={
            <>
              <button type="button" onClick={() => setUserToLock(null)} className={outlineButton}>
                {c.form.cancel}
              </button>
              <button
                type="button"
                onClick={() =>
                  lockMutation.mutate({
                    id: userToLock.id,
                    status: userToLock.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED',
                    reason: lockReason.trim(),
                  })
                }
                disabled={lockMutation.isPending}
                className={userToLock.status === 'SUSPENDED' ? primaryButton : dangerButton}
              >
                {userToLock.status === 'SUSPENDED' ? c.lockModal.confirmUnlock : c.lockModal.confirmLock}
              </button>
            </>
          }
        >
          <p className="text-[15px] leading-7 text-slate-700">
            {userToLock.status === 'SUSPENDED'
              ? c.lockModal.unlockText(userToLock.name, userToLock.email)
              : c.lockModal.lockText(userToLock.name, userToLock.email)}
          </p>
          {userToLock.status !== 'SUSPENDED' && (
            <label className="mt-6 block">
              <span className={fieldLabel}>{c.lockModal.reason}</span>
              <textarea
                rows={2}
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
                placeholder={c.lockModal.reasonPh}
                className={`${underlineInput} resize-none leading-7 focus:border-danger`}
              />
            </label>
          )}
        </Modal>
      )}

      {/* MODAL 4: ROLE ASSIGNMENT & PERMISSIONS MATRIX */}
      {userToRole && (
        <Modal
          title={c.roleModal.title}
          eyebrow={userToRole.name}
          onClose={() => setUserToRole(null)}
          footer={
            <>
              <button type="button" onClick={() => setUserToRole(null)} className={outlineButton}>
                {c.form.cancel}
              </button>
              <button
                type="button"
                onClick={() =>
                  roleMutation.mutate({
                    id: userToRole.id,
                    role: newAssignedRole,
                    permissions: selectedPermissions,
                  })
                }
                disabled={roleMutation.isPending}
                className={primaryButton}
              >
                {roleMutation.isPending ? c.roleModal.saving : c.roleModal.save}
              </button>
            </>
          }
        >
          <RolePicker
            lang={lang}
            role={newAssignedRole}
            onRole={(role) => {
              setNewAssignedRole(role);
              setSelectedPermissions(getDefaultPermissionsForRole(role));
            }}
            permissions={selectedPermissions}
            onPermissions={setSelectedPermissions}
          />
        </Modal>
      )}

      {/* MODAL 5: QUICK INSPECT USER PROFILE */}
      {quickInspectUser && (
        <Modal
          title={quickInspectUser.name}
          eyebrow={c.inspect.eyebrow}
          onClose={() => setQuickInspectUser(null)}
          width="max-w-xl"
          footer={
            <>
              <button
                type="button"
                onClick={() => {
                  setQuickInspectUser(null);
                  navigate(`/admin/users/${quickInspectUser.id}`);
                }}
                className={`${textLink} text-ink`}
              >
                {c.inspect.full}
              </button>
              <button type="button" onClick={() => setQuickInspectUser(null)} className={primaryButton}>
                {c.inspect.close}
              </button>
            </>
          }
        >
          <p className="text-sm text-slate-600">
            {ROLE_LABEL[lang][quickInspectUser.role]}
            {quickInspectUser.headline ? ` · ${quickInspectUser.headline}` : ''}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {quickInspectUser.email} · {quickInspectUser.phone}
          </p>
          <dl className="mt-5">
            <InfoRow label={c.inspect.plan}>{quickInspectUser.planName}</InfoRow>
            <InfoRow label={c.inspect.tokens}>
              {quickInspectUser.tokensUsedThisMonth.toLocaleString(isVietnamese ? 'vi-VN' : 'en-US')} /{' '}
              {(quickInspectUser.tokenMonthlyQuota / 1000).toFixed(0)}k
            </InfoRow>
            <InfoRow label={c.inspect.status} tone={quickInspectUser.status === 'ACTIVE' ? 'brand' : 'danger'}>
              {STATUS_LABEL[lang][quickInspectUser.status]}
            </InfoRow>
          </dl>
          {quickInspectUser.bio && <p className="mt-5 text-[15px] leading-7 text-slate-700">{quickInspectUser.bio}</p>}
          <h4 className="mt-7 border-b border-ink pb-2 text-[15px] font-medium text-ink">{c.inspect.recent}</h4>
          <ul>
            {quickInspectUser.recentActivities.slice(0, 3).map((act) => (
              <li key={act.id} className="grid gap-1 border-b border-border py-3 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-5">
                <span className="text-[13px] tabular-nums text-slate-500">{act.timestamp}</span>
                <span className="min-w-0">
                  <span className="block text-sm text-ink">{act.action}</span>
                  <span className="block text-[13px] text-slate-600">{act.details}</span>
                </span>
              </li>
            ))}
          </ul>
        </Modal>
      )}

      {/* MODAL 6: DELETE CONFIRMATION */}
      {userToDelete && (
        <Modal
          title={c.deleteModal.title}
          eyebrow={userToDelete.name}
          onClose={() => setUserToDelete(null)}
          width="max-w-lg"
          footer={
            <>
              <button type="button" onClick={() => setUserToDelete(null)} className={outlineButton}>
                {c.deleteModal.cancel}
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(userToDelete.id)}
                disabled={deleteMutation.isPending}
                className={dangerButton}
              >
                {deleteMutation.isPending ? c.deleteModal.deleting : c.deleteModal.confirm}
              </button>
            </>
          }
        >
          <p className="text-[15px] leading-7 text-slate-700">{c.deleteModal.text(userToDelete.name, userToDelete.email)}</p>
        </Modal>
      )}
    </div>
  );
}
