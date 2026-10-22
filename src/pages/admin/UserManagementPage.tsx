import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Download,
  Lock,
  Unlock,
  Eye,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Check,
  X,
  CreditCard,
  Zap,
  Phone,
  Mail,
  MapPin,
  Clock,
  Lightbulb,
  ArrowRight,
  UserCheck,
  UserX,
} from 'lucide-react';
import { Card, PageTitle, StatCard, Badge, Button, Loading, ErrorState } from '../../components/ui';
import {
  getManagedUsers,
  createUser,
  updateUser,
  toggleLockUser,
  updateUserRole,
  deleteUser,
  resetUserPassword,
  ALL_SYSTEM_PERMISSIONS,
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

export default function UserManagementPage() {
  const { isVietnamese } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'ALL'>('ALL');
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
      showToast(
        isVietnamese
          ? `Tạo tài khoản "${newUser.name}" (${newUser.role}) thành công!`
          : `Created account "${newUser.name}" successfully!`
      );
    },
    onError: (err: Error) => {
      showToast(err.message || 'Lỗi khi tạo người dùng.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      updateUser(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-managed-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setUserToEdit(null);
      showToast(
        isVietnamese
          ? `Cập nhật thông tin tài khoản "${updated.name}" thành công!`
          : `Updated account "${updated.name}" successfully!`
      );
    },
    onError: (err: Error) => {
      showToast(err.message || 'Lỗi khi cập nhật.');
    },
  });

  const lockMutation = useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: 'ACTIVE' | 'SUSPENDED';
      reason?: string;
    }) => toggleLockUser(id, status, reason),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-managed-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setUserToLock(null);
      setLockReason('');
      showToast(
        res.status === 'SUSPENDED'
          ? isVietnamese
            ? `Đã khóa tài khoản "${res.name}"!`
            : `Suspended account "${res.name}"!`
          : isVietnamese
            ? `Đã mở khóa tài khoản "${res.name}"!`
            : `Activated account "${res.name}"!`
      );
    },
    onError: (err: Error) => {
      showToast(err.message || 'Lỗi khi thay đổi trạng thái.');
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({
      id,
      role,
      permissions,
    }: {
      id: string;
      role: UserRole;
      permissions: string[];
    }) => updateUserRole(id, role, permissions),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-managed-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setUserToRole(null);
      showToast(
        isVietnamese
          ? `Đã chuyển vai trò "${res.name}" sang ${res.role} với ${res.permissions.length} quyền!`
          : `Changed role of "${res.name}" to ${res.role} with ${res.permissions.length} permissions!`
      );
    },
    onError: (err: Error) => {
      showToast(err.message || 'Lỗi khi đổi vai trò.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-managed-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setUserToDelete(null);
      showToast(isVietnamese ? 'Đã xóa tài khoản thành công!' : 'Deleted user account!');
    },
    onError: (err: Error) => {
      showToast(err.message || 'Không thể xóa người dùng.');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) => resetUserPassword(id),
    onSuccess: (pwd) => {
      showToast(
        isVietnamese
          ? `Đã đặt lại mật khẩu về mặc định: "${pwd}"`
          : `Password reset to default: "${pwd}"`
      );
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
    showToast(isVietnamese ? 'Đã xuất danh sách người dùng CSV!' : 'Exported users to CSV!');
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

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 border border-rose-200">
            <ShieldAlert size={12} />
            <span>Admin</span>
          </span>
        );
      case 'CAREER_CONSULTANT':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 border border-brand-200">
            <ShieldCheck size={12} />
            <span>Consultant</span>
          </span>
        );
      case 'CANDIDATE':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 border border-brand-200">
            <Users size={12} />
            <span>Candidate</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status: UserAccountStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isVietnamese ? 'Hoạt động' : 'Active'}</span>
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 border border-red-200">
            <Lock size={10} />
            <span>{isVietnamese ? 'Bị khóa' : 'Suspended'}</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 border border-amber-200">
            <Clock size={10} />
            <span>{isVietnamese ? 'Chờ kích hoạt' : 'Pending'}</span>
          </span>
        );
    }
  };

  if (isLoading) return <Loading />;
  if (isError) return <ErrorState />;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-sm animate-fade-in border border-slate-700">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/admin" className="hover:text-brand-600 transition">
          {isVietnamese ? 'Bảng điều khiển Admin' : 'Admin Dashboard'}
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-800">
          {isVietnamese ? 'Quản lý Người dùng & Phân quyền' : 'User Management & Roles'}
        </span>
      </nav>

      {/* Page Title & Actions */}
      <PageTitle
        title={isVietnamese ? 'Quản Lý Danh Sách Người Dùng' : 'User Accounts Management'}
        subtitle={
          isVietnamese
            ? 'Theo dõi toàn bộ tài khoản, xem chi tiết hồ sơ, tạo mới, khóa/mở khóa và điều chỉnh phân quyền vai trò (Roles).'
            : 'Directory of all platform users: inspect profiles, create/update accounts, toggle suspension, and manage role permissions.'
        }
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-surface px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <RefreshCw size={14} className={isFetching ? 'animate-spin text-brand-600' : ''} />
              <span>{isVietnamese ? 'Làm mới' : 'Refresh'}</span>
            </button>

            <Button variant="secondary" onClick={handleExportCsv} className="text-xs py-2 px-3 gap-1.5">
              <Download size={14} />
              <span>{isVietnamese ? 'Xuất CSV' : 'Export CSV'}</span>
            </Button>

            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              className="text-xs py-2 px-3.5 gap-1.5 shadow-sm"
            >
              <UserPlus size={15} />
              <span>{isVietnamese ? 'Tạo Người Dùng Mới' : 'Create New User'}</span>
            </Button>
          </div>
        }
      />

      {/* Overview Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label={isVietnamese ? 'Tổng Người Dùng' : 'Total Users'}
          value={counts.total.toLocaleString()}
          detail={isVietnamese ? `${counts.active} đang hoạt động` : `${counts.active} active accounts`}
          icon={<Users size={20} className="text-brand-600" />}
        />
        <StatCard
          label={isVietnamese ? 'Ứng Viên (Candidates)' : 'Candidates'}
          value={counts.candidates.toLocaleString()}
          detail={isVietnamese ? 'Tài khoản tìm việc' : 'Job seeking accounts'}
          icon={<UserCheck size={20} className="text-emerald-600" />}
        />
        <StatCard
          label={isVietnamese ? 'Cố Vấn (Consultants)' : 'Career Consultants'}
          value={counts.consultants.toLocaleString()}
          detail={isVietnamese ? 'Chuyên gia nhân sự' : 'Verified career mentors'}
          icon={<ShieldCheck size={20} className="text-brand-600" />}
        />
        <StatCard
          label={isVietnamese ? 'Quản Trị Viên (Admins)' : 'Administrators'}
          value={counts.admins.toLocaleString()}
          detail={isVietnamese ? 'Đặc quyền Root / Ops' : 'Full access privileges'}
          icon={<ShieldAlert size={20} className="text-rose-600" />}
        />
        <StatCard
          label={isVietnamese ? 'Tài Khoản Bị Khóa' : 'Suspended Users'}
          value={counts.suspended.toLocaleString()}
          detail={isVietnamese ? 'Cần xem xét an ninh' : 'Policy violations'}
          icon={<UserX size={20} className="text-amber-600" />}
        />
      </div>

      {/* Search & Multi-criteria Filter Bar */}
      <Card className="p-4 sm:p-5 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
          {/* Search Box */}
          <div className="relative lg:col-span-5">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isVietnamese
                  ? 'Tìm theo tên, email, số điện thoại, ID hoặc vị trí...'
                  : 'Search by name, email, phone, ID, or headline...'
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-9 text-xs sm:text-sm outline-none transition focus:border-brand-500 focus:bg-surface"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Role Filter */}
          <div className="lg:col-span-3">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole | 'ALL')}
              className="w-full rounded-xl border border-slate-200 bg-surface px-3 py-2 text-xs sm:text-sm text-slate-700 outline-none focus:border-brand-500 cursor-pointer"
            >
              <option value="ALL">{isVietnamese ? 'Tất cả vai trò' : 'All Roles'}</option>
              <option value="CANDIDATE">Ứng viên (Candidate)</option>
              <option value="CAREER_CONSULTANT">Cố vấn (Consultant)</option>
              <option value="ADMIN">Quản trị viên (Admin)</option>
            </select>
          </div>

          {/* Plan Filter */}
          <div className="lg:col-span-2">
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value as UserSubscriptionTier | 'ALL')}
              className="w-full rounded-xl border border-slate-200 bg-surface px-3 py-2 text-xs sm:text-sm text-slate-700 outline-none focus:border-brand-500 cursor-pointer"
            >
              <option value="ALL">{isVietnamese ? 'Tất cả gói cước' : 'All Plans'}</option>
              <option value="free">Khởi đầu (Free)</option>
              <option value="pro">Chuyên nghiệp (Pro)</option>
              <option value="executive">Cao cấp (VIP)</option>
              <option value="consultant">Consultant Partner</option>
              <option value="enterprise">Enterprise Admin</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="lg:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-surface px-3 py-2 text-xs sm:text-sm text-slate-700 outline-none focus:border-brand-500 cursor-pointer"
            >
              <option value="newest">{isVietnamese ? 'Mới nhất' : 'Newest'}</option>
              <option value="oldest">{isVietnamese ? 'Cũ nhất' : 'Oldest'}</option>
              <option value="name_asc">{isVietnamese ? 'Tên A - Z' : 'Name A - Z'}</option>
              <option value="tokens_desc">{isVietnamese ? 'Token dùng nhiều nhất' : 'Most Tokens'}</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
          <button
            onClick={() => setSelectedStatus('ALL')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${selectedStatus === 'ALL'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            {isVietnamese ? 'Tất cả' : 'All'} ({counts.total})
          </button>
          <button
            onClick={() => setSelectedStatus('ACTIVE')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${selectedStatus === 'ACTIVE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
          >
            {isVietnamese ? 'Đang hoạt động' : 'Active'} ({counts.active})
          </button>
          <button
            onClick={() => setSelectedStatus('PENDING')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${selectedStatus === 'PENDING'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
          >
            {isVietnamese ? 'Chờ kích hoạt' : 'Pending'} ({counts.pending})
          </button>
          <button
            onClick={() => setSelectedStatus('SUSPENDED')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${selectedStatus === 'SUSPENDED'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-red-50 text-red-800 hover:bg-red-100'
              }`}
          >
            {isVietnamese ? 'Đã bị khóa' : 'Suspended'} ({counts.suspended})
          </button>

          {(selectedRole !== 'ALL' || selectedStatus !== 'ALL' || selectedPlan !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedRole('ALL');
                setSelectedStatus('ALL');
                setSelectedPlan('ALL');
                setSearchQuery('');
              }}
              className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600 cursor-pointer"
            >
              <X size={14} />
              <span>{isVietnamese ? 'Đặt lại bộ lọc' : 'Reset filters'}</span>
            </button>
          )}
        </div>
      </Card>

      {/* User Directory Table */}
      {filteredUsers.length === 0 ? (
        <Card className="py-14 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
            <Filter size={24} />
          </div>
          <h3 className="text-base font-medium text-slate-900">
            {isVietnamese ? 'Không tìm thấy người dùng phù hợp' : 'No users match criteria'}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {isVietnamese
              ? 'Vui lòng thử tìm kiếm với từ khóa khác hoặc xóa bớt các tiêu chí lọc.'
              : 'Try searching with a different keyword or reset filters.'}
          </p>
          <div className="mt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedRole('ALL');
                setSelectedStatus('ALL');
                setSelectedPlan('ALL');
                setSearchQuery('');
              }}
            >
              {isVietnamese ? 'Xóa bộ lọc' : 'Reset filters'}
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden border border-slate-200">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50 text-xs text-slate-500">
            <span>
              {isVietnamese
                ? `Hiển thị ${filteredUsers.length} trên tổng số ${users.length} tài khoản`
                : `Showing ${filteredUsers.length} of ${users.length} accounts`}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider font-medium text-[11px]">
                  <th className="py-3 px-4">Tài Khoản & Hồ Sơ</th>
                  <th className="py-3 px-3">Vai Trò (Role)</th>
                  <th className="py-3 px-3">Trạng Thái</th>
                  <th className="py-3 px-3">Gói Cước & Hạn Mức</th>
                  <th className="py-3 px-3">Tokens Tháng Này</th>
                  <th className="py-3 px-3">Xác Thực</th>
                  <th className="py-3 px-3">Hoạt Động Gần Nhất</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const tokenUsagePercent = Math.min(
                    100,
                    Math.round((u.tokensUsedThisMonth / u.tokenMonthlyQuota) * 100)
                  );
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      {/* Avatar & Profile */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="h-10 w-10 shrink-0 rounded-xl object-cover border border-slate-200 shadow-2xs"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Link
                                to={`/admin/users/${u.id}`}
                                className="font-medium text-slate-900 text-sm hover:text-brand-600 transition truncate"
                              >
                                {u.name}
                              </Link>
                              <span className="font-mono text-slate-400 text-[11px]">#{u.id}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                            {u.headline && (
                              <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                                {u.headline}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          {getRoleBadge(u.role)}
                          <p className="text-[10px] text-slate-400 font-medium">
                            {u.permissions?.length || 0} quyền được cấp
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          {getStatusBadge(u.status)}
                          {u.status === 'SUSPENDED' && u.suspendedReason && (
                            <span
                              className="block text-[10px] text-red-600 truncate max-w-[120px]"
                              title={u.suspendedReason}
                            >
                              {u.suspendedReason}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="py-3.5 px-3">
                        <span className="font-medium text-slate-800 block text-xs">{u.planName}</span>
                        <span className="text-[10px] text-slate-400">
                          Quota: {(u.tokenMonthlyQuota / 1000).toFixed(0)}k tokens
                        </span>
                      </td>

                      {/* Token Bar */}
                      <td className="py-3.5 px-3">
                        <div className="w-28 space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="font-mono font-medium text-slate-800">
                              {(u.tokensUsedThisMonth / 1000).toFixed(1)}k
                            </span>
                            <span className="text-slate-400">{tokenUsagePercent}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${tokenUsagePercent > 85 ? 'bg-red-500' : tokenUsagePercent > 50 ? 'bg-amber-500' : 'bg-brand-600'
                                }`}
                              style={{ width: `${tokenUsagePercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Verified */}
                      <td className="py-3.5 px-3">
                        {u.isVerified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            <span>Đã xác minh</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                            <Clock size={12} />
                            <span>Chờ OTP</span>
                          </span>
                        )}
                      </td>

                      {/* Last Active */}
                      <td className="py-3.5 px-3">
                        <span className="text-slate-600 block">{u.lastActiveAt}</span>
                        <span className="text-[10px] text-slate-400">Tạo: {u.createdAt}</span>
                      </td>

                      {/* Action Menu */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Quick Inspect Modal */}
                          <button
                            onClick={() => setQuickInspectUser(u)}
                            className="rounded-lg p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition cursor-pointer"
                            title="Xem nhanh chi tiết"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Full Page Link */}
                          <Link
                            to={`/admin/users/${u.id}`}
                            className="rounded-lg p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition cursor-pointer"
                            title="Mở trang chi tiết tài khoản"
                          >
                            <ArrowRight size={15} />
                          </Link>

                          {/* Edit User */}
                          <button
                            onClick={() => openEditModal(u)}
                            className="rounded-lg p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition cursor-pointer"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit size={15} />
                          </button>

                          {/* Role & Permissions */}
                          <button
                            onClick={() => openRoleModal(u)}
                            className="rounded-lg p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition cursor-pointer"
                            title="Phân quyền vai trò (Roles)"
                          >
                            <Shield size={15} />
                          </button>

                          {/* Lock / Unlock */}
                          <button
                            onClick={() => {
                              setUserToLock(u);
                              setLockReason(u.suspendedReason || '');
                            }}
                            className={`rounded-lg p-1.5 transition cursor-pointer ${u.status === 'SUSPENDED'
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                              }`}
                            title={u.status === 'SUSPENDED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                          >
                            {u.status === 'SUSPENDED' ? <Unlock size={15} /> : <Lock size={15} />}
                          </button>

                          {/* Delete User */}
                          {u.email !== 'admin@example.com' && (
                            <button
                              onClick={() => setUserToDelete(u)}
                              className="rounded-lg p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                              title="Xóa tài khoản"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE NEW USER                                                  */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-surface p-6 shadow-sm my-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus size={20} className="text-brand-600" />
                <h3 className="text-lg font-medium text-slate-900">
                  {isVietnamese ? 'Tạo Tài Khoản Người Dùng Mới' : 'Create New User Account'}
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(createForm);
              }}
              className="space-y-3.5 text-xs text-slate-700"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-800 block mb-1">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-800 block mb-1">
                    Địa chỉ Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="email@example.com"
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-800 block mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="0912 345 678"
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-800 block mb-1">
                    Mật khẩu ban đầu
                  </label>
                  <input
                    type="text"
                    value={createForm.initialPassword}
                    onChange={(e) => setCreateForm({ ...createForm, initialPassword: e.target.value })}
                    placeholder="password123"
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-brand-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-medium text-slate-800 block mb-1">
                    Vai trò (Role) *
                  </label>
                  <select
                    value={createForm.role}
                    onChange={(e) => {
                      const role = e.target.value as UserRole;
                      const planId =
                        role === 'ADMIN'
                          ? 'enterprise'
                          : role === 'CAREER_CONSULTANT'
                            ? 'consultant'
                            : 'pro';
                      setCreateForm({ ...createForm, role, planId });
                    }}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-brand-500 bg-surface cursor-pointer font-medium"
                  >
                    <option value="CANDIDATE">Ứng viên (Candidate)</option>
                    <option value="CAREER_CONSULTANT">Cố vấn (Consultant)</option>
                    <option value="ADMIN">Quản trị viên (Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-slate-800 block mb-1">
                    Gói dịch vụ
                  </label>
                  <select
                    value={createForm.planId}
                    onChange={(e) => setCreateForm({ ...createForm, planId: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-brand-500 bg-surface cursor-pointer"
                  >
                    <option value="free">Khởi đầu Free (20k tokens)</option>
                    <option value="pro">Chuyên nghiệp Pro (250k tokens)</option>
                    <option value="executive">Executive VIP (1M tokens)</option>
                    <option value="consultant">Consultant Partner (500k tokens)</option>
                    <option value="enterprise">Enterprise Admin (2M tokens)</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-slate-800 block mb-1">
                    Trạng thái kích hoạt
                  </label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-brand-500 bg-surface cursor-pointer"
                  >
                    <option value="ACTIVE">Hoạt động ngay (Active)</option>
                    <option value="PENDING">Chờ xác thực OTP (Pending)</option>
                    <option value="SUSPENDED">Khóa tạm thời (Suspended)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-800 block mb-1">
                  Chức danh / Tiêu đề nghề nghiệp
                </label>
                <input
                  type="text"
                  value={createForm.headline}
                  onChange={(e) => setCreateForm({ ...createForm, headline: e.target.value })}
                  placeholder="Ví dụ: Senior Backend Engineer / HR Consultant"
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="font-medium text-slate-800 block mb-1">
                  Ghi chú nội bộ dành cho Quản trị viên
                </label>
                <textarea
                  rows={2}
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  placeholder="Ghi chú về nguồn gốc tài khoản, lý do tạo hoặc các yêu cầu hỗ trợ..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-brand-500 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="secondary" type="button" onClick={() => setShowCreateModal(false)}>
                  Hủy
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={createMutation.isPending || !createForm.name.trim() || !createForm.email.trim()}
                >
                  {createMutation.isPending ? 'Đang tạo...' : 'Tạo Tài Khoản Ngay'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT USER ACCOUNT                                                */}
      {/* ========================================================================= */}
      {userToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-surface p-6 shadow-sm my-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit size={20} className="text-brand-600" />
                <h3 className="text-lg font-medium text-slate-900">
                  Chỉnh Sửa Tài Khoản: {userToEdit.name} (#{userToEdit.id})
                </h3>
              </div>
              <button
                onClick={() => setUserToEdit(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate({ id: userToEdit.id, payload: editForm });
              }}
              className="space-y-3.5 text-xs text-slate-700"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-800 block mb-1">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-800 block mb-1">
                    Địa chỉ Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-medium text-slate-800 block mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-800 block mb-1">
                    Gói dịch vụ
                  </label>
                  <select
                    value={editForm.planId}
                    onChange={(e) => setEditForm({ ...editForm, planId: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-brand-500 bg-surface cursor-pointer"
                  >
                    <option value="free">Khởi đầu Free</option>
                    <option value="pro">Chuyên nghiệp Pro</option>
                    <option value="executive">Executive VIP</option>
                    <option value="consultant">Consultant Partner</option>
                    <option value="enterprise">Enterprise Admin</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-slate-800 block mb-1">
                    Trạng thái tài khoản
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-brand-500 bg-surface cursor-pointer"
                  >
                    <option value="ACTIVE">Hoạt động (Active)</option>
                    <option value="PENDING">Chờ kích hoạt (Pending)</option>
                    <option value="SUSPENDED">Bị khóa (Suspended)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-800 block mb-1">
                    Địa điểm làm việc
                  </label>
                  <input
                    type="text"
                    value={editForm.location || ''}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-800 block mb-1">
                    Chức danh / Headline
                  </label>
                  <input
                    type="text"
                    value={editForm.headline || ''}
                    onChange={(e) => setEditForm({ ...editForm, headline: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-800 block mb-1">
                  Ghi chú quản trị
                </label>
                <textarea
                  rows={2}
                  value={editForm.notes || ''}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => resetPasswordMutation.mutate(userToEdit.id)}
                  disabled={resetPasswordMutation.isPending}
                  className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:underline cursor-pointer font-semibold"
                >
                  <RefreshCw size={13} />
                  <span>Đặt lại mật khẩu về mặc định</span>
                </button>

                <div className="flex gap-2">
                  <Button variant="secondary" type="button" onClick={() => setUserToEdit(null)}>
                    Hủy
                  </Button>
                  <Button variant="primary" type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: LOCK / UNLOCK USER MODAL                                         */}
      {/* ========================================================================= */}
      {userToLock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              {userToLock.status === 'SUSPENDED' ? <Unlock size={24} /> : <Lock size={24} />}
              <h3 className="text-lg font-medium text-slate-900">
                {userToLock.status === 'SUSPENDED'
                  ? 'Mở Khóa Tài Khoản Người Dùng'
                  : 'Xác Nhận Khóa Tài Khoản Người Dùng'}
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {userToLock.status === 'SUSPENDED'
                ? `Bạn có chắc chắn muốn kích hoạt lại tài khoản "${userToLock.name}" (${userToLock.email}) không? Người dùng sẽ có thể đăng nhập bình thường.`
                : `Khi bị khóa, tài khoản "${userToLock.name}" (${userToLock.email}) sẽ không thể đăng nhập hoặc gọi các dịch vụ AI trên nền tảng.`}
            </p>

            {userToLock.status !== 'SUSPENDED' && (
              <div>
                <label className="font-medium text-slate-800 text-xs block mb-1">
                  Lý do khóa tài khoản (Audit Reason) *
                </label>
                <textarea
                  rows={2}
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  placeholder="Ví dụ: Vi phạm quy định về tần suất gọi API, phát tán nội dung spam, hoặc yêu cầu bảo mật..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-red-500"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
              <Button variant="secondary" onClick={() => setUserToLock(null)}>
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={() =>
                  lockMutation.mutate({
                    id: userToLock.id,
                    status: userToLock.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED',
                    reason: lockReason.trim(),
                  })
                }
                disabled={lockMutation.isPending}
                className={
                  userToLock.status === 'SUSPENDED'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }
              >
                {userToLock.status === 'SUSPENDED' ? 'Mở Khóa Ngay' : 'Xác Nhận Khóa'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ROLE ASSIGNMENT & PERMISSIONS MATRIX                             */}
      {/* ========================================================================= */}
      {userToRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-surface p-6 shadow-sm my-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Shield size={20} className="text-brand-600" />
                <h3 className="text-lg font-medium text-slate-900">
                  Phân Quyền & Vai Trò: {userToRole.name}
                </h3>
              </div>
              <button
                onClick={() => setUserToRole(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              {/* Select Role */}
              <div>
                <label className="font-medium text-slate-900 text-sm block mb-1">
                  1. Chọn Vai Trò Hệ Thống (System Role)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(['CANDIDATE', 'CAREER_CONSULTANT', 'ADMIN'] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        setNewAssignedRole(role);
                        setSelectedPermissions(getDefaultPermissionsForRole(role));
                      }}
                      className={`rounded-xl border p-3 text-left transition cursor-pointer ${newAssignedRole === role
                          ? 'border-brand-600 bg-brand-50/70 shadow-xs'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                        }`}
                    >
                      <span className="font-medium text-slate-900 block text-xs">
                        {role === 'ADMIN'
                          ? 'Quản Trị Viên (Admin)'
                          : role === 'CAREER_CONSULTANT'
                            ? 'Cố Vấn (Consultant)'
                            : 'Ứng Viên (Candidate)'}
                      </span>
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        {role === 'ADMIN'
                          ? 'Toàn quyền kiểm soát hệ thống'
                          : role === 'CAREER_CONSULTANT'
                            ? 'Tư vấn, xem CV & phản hồi'
                            : 'Nộp CV, làm bài test & chat AI'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Permissions Checklist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium text-slate-900 text-sm">
                    2. Ma Trận Quyền Hạn Chi Tiết ({selectedPermissions.length}/{ALL_SYSTEM_PERMISSIONS.length})
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedPermissions(ALL_SYSTEM_PERMISSIONS.map((p) => p.key))
                    }
                    className="text-brand-600 hover:underline font-semibold text-[11px]"
                  >
                    Chọn tất cả quyền
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1 border border-slate-200 rounded-xl p-3 bg-slate-50/30">
                  {ALL_SYSTEM_PERMISSIONS.map((p) => {
                    const isChecked = selectedPermissions.includes(p.key);
                    return (
                      <label
                        key={p.key}
                        className={`flex items-start gap-2.5 rounded-lg border p-2.5 cursor-pointer transition ${isChecked
                            ? 'border-brand-300 bg-brand-50/50'
                            : 'border-slate-200 bg-surface hover:bg-slate-50'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPermissions([...selectedPermissions, p.key]);
                            } else {
                              setSelectedPermissions(selectedPermissions.filter((k) => k !== p.key));
                            }
                          }}
                          className="mt-0.5 rounded accent-brand-600"
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 text-xs">{p.name}</p>
                          <p className="text-[10px] text-slate-500">{p.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setUserToRole(null)}>
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={() =>
                  roleMutation.mutate({
                    id: userToRole.id,
                    role: newAssignedRole,
                    permissions: selectedPermissions,
                  })
                }
                disabled={roleMutation.isPending}
                className="bg-brand-600 hover:bg-brand-700"
              >
                {roleMutation.isPending ? 'Đang cập nhật...' : 'Lưu Phân Quyền'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: QUICK INSPECT USER PROFILE                                       */}
      {/* ========================================================================= */}
      {quickInspectUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-sm my-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-brand-600" />
                <h3 className="text-lg font-medium text-slate-900">
                  Hồ Sơ Người Dùng: {quickInspectUser.name}
                </h3>
              </div>
              <button
                onClick={() => setQuickInspectUser(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="flex items-start gap-3.5 rounded-2xl bg-brand-50/60 p-4 border border-brand-100">
                <img
                  src={quickInspectUser.avatar}
                  alt={quickInspectUser.name}
                  className="h-14 w-14 rounded-xl object-cover border border-slate-200"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-slate-900 text-base">{quickInspectUser.name}</h4>
                    {getRoleBadge(quickInspectUser.role)}
                    {getStatusBadge(quickInspectUser.status)}
                  </div>
                  <p className="text-slate-600 font-medium">{quickInspectUser.headline}</p>
                  <div className="flex items-center gap-3 text-slate-500 pt-0.5">
                    <span className="flex items-center gap-1">
                      <Mail size={12} /> {quickInspectUser.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone size={12} /> {quickInspectUser.phone}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">Gói Đăng Ký</span>
                  <strong className="text-slate-900 text-sm">{quickInspectUser.planName}</strong>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">Token Tháng Này</span>
                  <strong className="text-brand-700 text-sm">
                    {quickInspectUser.tokensUsedThisMonth.toLocaleString()} /{' '}
                    {(quickInspectUser.tokenMonthlyQuota / 1000).toFixed(0)}k
                  </strong>
                </div>
              </div>

              {quickInspectUser.bio && (
                <div className="rounded-xl bg-slate-50 p-3 text-slate-600 italic border border-slate-100">
                  "{quickInspectUser.bio}"
                </div>
              )}

              {/* Recent activities preview */}
              <div>
                <span className="font-medium text-slate-900 uppercase tracking-wider text-[11px] block mb-1.5">
                  Lịch Sử Hoạt Động Gần Nhất
                </span>
                <div className="space-y-1.5">
                  {quickInspectUser.recentActivities.slice(0, 3).map((act) => (
                    <div
                      key={act.id}
                      className="rounded-lg bg-slate-50 p-2.5 border border-slate-100 flex justify-between items-center text-[11px]"
                    >
                      <div>
                        <strong className="text-slate-800 block">{act.action}</strong>
                        <span className="text-slate-500">{act.details}</span>
                      </div>
                      <span className="text-slate-400 font-mono shrink-0 ml-2">{act.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <Button
                variant="secondary"
                onClick={() => {
                  setQuickInspectUser(null);
                  navigate(`/admin/users/${quickInspectUser.id}`);
                }}
                className="gap-1.5 text-xs"
              >
                <span>Xem Toàn Bộ Trang Chi Tiết</span>
                <ArrowRight size={13} />
              </Button>
              <Button variant="primary" onClick={() => setQuickInspectUser(null)} className="text-xs">
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: DELETE CONFIRMATION                                              */}
      {/* ========================================================================= */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-medium text-slate-900">
                Xác Nhận Xóa Tài Khoản Vĩnh Viễn
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa tài khoản <strong>{userToDelete.name}</strong> ({userToDelete.email}) không? Toàn bộ dữ liệu hồ sơ và lịch sử hoạt động liên quan sẽ bị loại bỏ khỏi hệ thống.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
              <Button variant="secondary" onClick={() => setUserToDelete(null)}>
                Hủy bỏ
              </Button>
              <Button
                variant="primary"
                onClick={() => deleteMutation.mutate(userToDelete.id)}
                disabled={deleteMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa Vĩnh Viễn'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
