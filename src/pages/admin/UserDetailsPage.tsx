import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Users,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Edit,
  Lock,
  Unlock,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  CreditCard,
  Zap,
  Check,
  Save,
  X,
  Layers,
  History,
} from 'lucide-react';
import { Card, PageTitle, Badge, Button, Loading, ErrorState } from '../../components/ui';
import {
  getUserById,
  updateUser,
  toggleLockUser,
  updateUserRole,
  resetUserPassword,
  deleteUser,
  ALL_SYSTEM_PERMISSIONS,
  getDefaultPermissionsForRole,
} from '../../services/userService';
import type { AdminManagedUser, UpdateUserPayload } from '../../types/userManagement';
import type { UserRole } from '../../types/domain';
import { useTranslation } from '../../i18n';

export default function UserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isVietnamese } = useTranslation();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'profile' | 'permissions' | 'subscription' | 'activities'>('profile');
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
      showToast(isVietnamese ? 'Cập nhật thông tin thành công!' : 'Updated user details successfully!');
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
      showToast(
        updated.status === 'SUSPENDED'
          ? isVietnamese
            ? 'Đã khóa tài khoản thành công!'
            : 'Suspended user account!'
          : isVietnamese
          ? 'Đã kích hoạt lại tài khoản!'
          : 'Activated user account!'
      );
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
      showToast(
        isVietnamese
          ? `Đã chuyển vai trò sang ${updated.role} thành công!`
          : `Role changed to ${updated.role} successfully!`
      );
    },
    onError: (err: Error) => showToast(err.message),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: () => resetUserPassword(id!),
    onSuccess: (pwd) => {
      showToast(
        isVietnamese
          ? `Đã đặt lại mật khẩu về mặc định: "${pwd}"`
          : `Password reset to default: "${pwd}"`
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteUser(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-managed-users'] });
      navigate('/admin/users');
      showToast(isVietnamese ? 'Đã xóa tài khoản vĩnh viễn!' : 'Deleted user permanently!');
    },
    onError: (err: Error) => showToast(err.message),
  });

  if (isLoading) return <Loading />;
  if (isError || !user) {
    return (
      <div className="py-12 text-center">
        <ErrorState />
        <div className="mt-4">
          <Button variant="secondary" onClick={() => navigate('/admin/users')}>
            Quay lại danh sách người dùng
          </Button>
        </div>
      </div>
    );
  }

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 border border-rose-200">
            <ShieldAlert size={13} />
            <span>Administrator</span>
          </span>
        );
      case 'CAREER_CONSULTANT':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 border border-purple-200">
            <ShieldCheck size={13} />
            <span>Career Consultant</span>
          </span>
        );
      case 'CANDIDATE':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
            <Users size={13} />
            <span>Job Candidate</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status: AdminManagedUser['status']) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Hoạt động (Active)</span>
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 border border-red-200">
            <Lock size={12} />
            <span>Đã bị khóa (Suspended)</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
            <Clock size={12} />
            <span>Chờ kích hoạt (Pending)</span>
          </span>
        );
    }
  };

  const tokenUsagePercent = Math.min(
    100,
    Math.round((user.tokensUsedThisMonth / user.tokenMonthlyQuota) * 100)
  );

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl animate-fade-in border border-slate-700">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft size={14} />
          <span>{isVietnamese ? 'Quay lại danh sách người dùng' : 'Back to Users'}</span>
        </Link>

        <span className="text-xs text-slate-400 font-mono">
          ID: #{user.id} · Tham gia: {user.createdAt}
        </span>
      </div>

      {/* Profile Header Hero Card */}
      <Card className="border-slate-200 shadow-sm bg-gradient-to-r from-white via-white to-blue-50/30 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <img
              src={user.avatar}
              alt={user.name}
              className="h-20 w-20 shrink-0 rounded-2xl object-cover border-2 border-white shadow-md ring-2 ring-blue-100"
            />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{user.name}</h1>
                {getRoleBadge(user.role)}
                {getStatusBadge(user.status)}
                {user.isVerified ? (
                  <span className="font-semibold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Đã xác thực OTP
                  </span>
                ) : (
                  <span className="font-semibold text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Chờ xác thực
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                {user.headline || 'Người dùng nền tảng CareerPilot'}
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <Mail size={13} className="text-slate-400" />
                  <span>{user.email}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Phone size={13} className="text-slate-400" />
                  <span>{user.phone}</span>
                </span>
                {user.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-slate-400" />
                    <span>{user.location}</span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock size={13} className="text-slate-400" />
                  <span>Hoạt động: {user.lastActiveAt}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons Column */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 self-end lg:self-center border-t lg:border-t-0 pt-3 lg:pt-0 w-full lg:w-auto justify-end">
            {/* Edit */}
            <Button
              variant="secondary"
              onClick={() => setShowEditModal(true)}
              className="text-xs py-2 px-3 gap-1.5"
            >
              <Edit size={14} />
              <span>Sửa thông tin</span>
            </Button>

            {/* Role & Permissions */}
            <Button
              variant="secondary"
              onClick={() => {
                setNewRole(user.role);
                setSelectedPermissions(user.permissions || getDefaultPermissionsForRole(user.role));
                setShowRoleModal(true);
              }}
              className="text-xs py-2 px-3 gap-1.5 border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"
            >
              <Shield size={14} />
              <span>Phân quyền (Role)</span>
            </Button>

            {/* Lock / Unlock */}
            <button
              onClick={() => {
                setLockReason(user.suspendedReason || '');
                setShowLockModal(true);
              }}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer ${
                user.status === 'SUSPENDED'
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              {user.status === 'SUSPENDED' ? <Unlock size={14} /> : <Lock size={14} />}
              <span>{user.status === 'SUSPENDED' ? 'Mở khóa' : 'Khóa tài khoản'}</span>
            </button>

            {/* Reset Password */}
            <button
              onClick={() => resetPasswordMutation.mutate()}
              disabled={resetPasswordMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              title="Đặt lại mật khẩu mặc định"
            >
              <RefreshCw size={13} className={resetPasswordMutation.isPending ? 'animate-spin' : ''} />
              <span>Reset mật khẩu</span>
            </button>

            {/* Delete */}
            {user.email !== 'admin@example.com' && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                title="Xóa tài khoản"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Reason for suspension banner if suspended */}
      {user.status === 'SUSPENDED' && (
        <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4 text-xs text-red-900 flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-red-800 text-sm">Tài khoản này đang bị khóa bởi Quản trị viên</h4>
            <p className="mt-0.5">
              Lý do: <strong>{user.suspendedReason || 'Vi phạm điều khoản sử dụng hệ thống'}</strong>
            </p>
            {user.suspendedAt && <span className="text-[11px] text-red-700 mt-1 block">Thời gian khóa: {user.suspendedAt}</span>}
          </div>
        </div>
      )}

      {/* Main Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto space-x-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'profile'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users size={16} />
          <span>Thông Tin Hồ Sơ</span>
        </button>

        <button
          onClick={() => setActiveTab('permissions')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'permissions'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield size={16} />
          <span>Ma Trận Quyền Hạn ({user.permissions?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('subscription')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'subscription'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard size={16} />
          <span>Gói Cước & Token AI</span>
        </button>

        <button
          onClick={() => setActiveTab('activities')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'activities'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History size={16} />
          <span>Lịch Sử Hoạt Động & Kiểm Toán</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PROFILE & INFORMATION                                              */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="grid gap-6 lg:grid-cols-[1.8fr_1.2fr]">
          <div className="space-y-6">
            {/* Bio / Summary */}
            <Card>
              <h3 className="font-bold text-sm text-slate-900 mb-2 border-b border-slate-100 pb-2">
                Giới Thiệu Bản Thân
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                {user.bio || 'Chưa cập nhật phần giới thiệu cá nhân.'}
              </p>
            </Card>

            {/* Basic Information Grid */}
            <Card>
              <h3 className="font-bold text-sm text-slate-900 mb-3 border-b border-slate-100 pb-2">
                Thông Tin Chi Tiết Tài Khoản
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">Họ và tên đầy đủ:</span>
                  <strong className="text-slate-900 text-sm">{user.name}</strong>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">Email đăng nhập:</span>
                  <strong className="text-slate-900 text-sm font-mono">{user.email}</strong>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">Số điện thoại:</span>
                  <strong className="text-slate-900">{user.phone}</strong>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">Địa điểm làm việc:</span>
                  <strong className="text-slate-900">{user.location || 'Chưa cập nhật'}</strong>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">Ngày tạo tài khoản:</span>
                  <strong className="text-slate-900">{user.createdAt}</strong>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">Lần hoạt động gần nhất:</span>
                  <strong className="text-emerald-700">{user.lastActiveAt}</strong>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Admin Notes & Security Card */}
          <div className="space-y-6">
            {/* Admin Private Notes */}
            <Card className="border-amber-200 bg-gradient-to-br from-amber-50/20 via-white to-white">
              <div className="flex items-center justify-between mb-2 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900">
                  <Sparkles size={16} className="text-amber-500" />
                  <span>Ghi Chú Quản Trị Viên</span>
                </div>
                <Badge tone="amber">Private</Badge>
              </div>
              <textarea
                rows={4}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Nhập ghi chú riêng của ban quản trị về ứng viên/cố vấn này..."
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-amber-500 bg-white leading-relaxed"
              />
              <div className="flex justify-end mt-2">
                <Button
                  variant="secondary"
                  onClick={() => updateMutation.mutate({ notes: adminNotes })}
                  disabled={updateMutation.isPending}
                  className="text-xs py-1.5 px-3 gap-1"
                >
                  <Save size={13} />
                  <span>Lưu ghi chú</span>
                </Button>
              </div>
            </Card>

            {/* Quick Security Status */}
            <Card>
              <h3 className="font-bold text-sm text-slate-900 mb-3 border-b border-slate-100 pb-2">
                Bảo Mật & Tuân Thủ
              </h3>
              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Mã hóa mật khẩu:</span>
                  <span className="font-bold text-emerald-700">PBKDF2 SHA-256</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Xác thực 2 bước (OTP):</span>
                  <span className="font-bold text-emerald-700">Đã kích hoạt</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Lần đổi mật khẩu cuối:</span>
                  <span className="text-slate-400">10 ngày trước</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Địa chỉ IP truy cập gần nhất:</span>
                  <span className="font-mono text-slate-500">113.161.72.45</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ROLE & PERMISSIONS MATRIX                                          */}
      {/* ========================================================================= */}
      {activeTab === 'permissions' && (
        <Card className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shield size={18} className="text-purple-600" />
                <span>Danh Sách Quyền Hạn Của Tài Khoản</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Đang áp dụng bộ quyền hạn của vai trò: <strong>{user.role}</strong>
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => {
                setNewRole(user.role);
                setSelectedPermissions(user.permissions || getDefaultPermissionsForRole(user.role));
                setShowRoleModal(true);
              }}
              className="text-xs py-2 px-3.5 gap-1.5 bg-purple-600 hover:bg-purple-700"
            >
              <Shield size={14} />
              <span>Chỉnh sửa phân quyền</span>
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
            {ALL_SYSTEM_PERMISSIONS.map((p) => {
              const hasPermission = user.permissions?.includes(p.key);
              return (
                <div
                  key={p.key}
                  className={`rounded-xl border p-3.5 space-y-1 transition ${
                    hasPermission
                      ? 'border-purple-200 bg-purple-50/40 text-purple-950'
                      : 'border-slate-200/60 bg-slate-50/50 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{p.name}</span>
                    {hasPermission ? (
                      <span className="inline-flex items-center gap-1 rounded bg-purple-100 px-1.5 py-0.2 text-[10px] font-bold text-purple-800">
                        <Check size={11} /> Cấp quyền
                      </span>
                    ) : (
                      <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-medium text-slate-500">
                        Chưa cấp
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{p.description}</p>
                  <span className="text-[10px] text-slate-400 font-mono block mt-1">Key: {p.key}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SUBSCRIPTION & AI TOKEN QUOTA                                      */}
      {/* ========================================================================= */}
      {activeTab === 'subscription' && (
        <div className="space-y-6">
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50/50 via-white to-purple-50/40 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white font-bold shadow-sm">
                  <CreditCard size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-900">{user.planName}</h3>
                    <Badge tone="blue">{user.planId.toUpperCase()}</Badge>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Hạn mức token tháng: <strong>{user.tokenMonthlyQuota.toLocaleString()} AI Tokens</strong>
                  </p>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Chu kỳ: Hàng tháng (Tự động gia hạn)
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-white p-4 text-center shrink-0 min-w-[200px] shadow-2xs">
                <span className="text-[11px] uppercase font-bold text-slate-400 block">
                  Đã sử dụng tháng này
                </span>
                <span className="text-2xl font-black text-blue-700">
                  {user.tokensUsedThisMonth.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 block mt-0.5">
                  ({tokenUsagePercent}% hạn mức)
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-5 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-600 font-medium">
                <span>0 Tokens</span>
                <span className="text-blue-700 font-bold">
                  Còn lại: {(user.tokenMonthlyQuota - user.tokensUsedThisMonth).toLocaleString()} Tokens
                </span>
                <span>{user.tokenMonthlyQuota.toLocaleString()} Tokens</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    tokenUsagePercent > 80 ? 'bg-red-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${tokenUsagePercent}%` }}
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: AUDIT TRAIL & RECENT ACTIVITIES                                    */}
      {/* ========================================================================= */}
      {activeTab === 'activities' && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <History size={18} className="text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">
                Lịch Sử Kiểm Toán & Hoạt Động Của Người Dùng
              </h3>
            </div>
            <span className="text-xs text-slate-400">{user.recentActivities.length} sự kiện</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {user.recentActivities.map((act) => (
              <div key={act.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                <div>
                  <strong className="text-slate-900 text-sm block">{act.action}</strong>
                  <p className="text-slate-600">{act.details}</p>
                  <span className="text-[11px] text-slate-400">IP: {act.ipAddress}</span>
                </div>
                <span className="text-slate-400 font-mono text-[11px] shrink-0 self-end sm:self-center">
                  {act.timestamp}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Sửa thông tin: {user.name}</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                <X size={18} />
              </button>
            </div>
            <form
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
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold block mb-1">Họ và tên *</label>
                <input name="name" defaultValue={user.name} required className="w-full rounded-xl border p-2.5 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="font-bold block mb-1">Email *</label>
                <input name="email" type="email" defaultValue={user.email} required className="w-full rounded-xl border p-2.5 outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Số điện thoại</label>
                  <input name="phone" defaultValue={user.phone} className="w-full rounded-xl border p-2.5 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="font-bold block mb-1">Địa điểm</label>
                  <input name="location" defaultValue={user.location} className="w-full rounded-xl border p-2.5 outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="font-bold block mb-1">Chức danh / Headline</label>
                <input name="headline" defaultValue={user.headline} className="w-full rounded-xl border p-2.5 outline-none focus:border-blue-500" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button variant="secondary" type="button" onClick={() => setShowEditModal(false)}>Hủy</Button>
                <Button variant="primary" type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lock Modal */}
      {showLockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {user.status === 'SUSPENDED' ? 'Mở Khóa Tài Khoản' : 'Khóa Tài Khoản Người Dùng'}
            </h3>
            <p className="text-xs text-slate-600">
              {user.status === 'SUSPENDED'
                ? `Kích hoạt lại tài khoản "${user.name}"?`
                : `Khóa tài khoản "${user.name}" sẽ ngăn chặn đăng nhập và gọi AI.`}
            </p>
            {user.status !== 'SUSPENDED' && (
              <textarea
                rows={2}
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
                placeholder="Nhập lý do khóa tài khoản..."
                className="w-full rounded-xl border p-2.5 text-xs outline-none focus:border-red-500"
              />
            )}
            <div className="flex justify-end gap-2 pt-3 border-t text-xs">
              <Button variant="secondary" onClick={() => setShowLockModal(false)}>Hủy</Button>
              <Button
                variant="primary"
                onClick={() =>
                  lockMutation.mutate({
                    status: user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED',
                    reason: lockReason.trim(),
                  })
                }
                className={user.status === 'SUSPENDED' ? 'bg-emerald-600' : 'bg-red-600'}
              >
                {user.status === 'SUSPENDED' ? 'Mở Khóa' : 'Xác Nhận Khóa'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl my-8 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Phân Quyền Vai Trò (Roles)</h3>
              <button onClick={() => setShowRoleModal(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Chọn vai trò chính</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['CANDIDATE', 'CAREER_CONSULTANT', 'ADMIN'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setNewRole(r);
                        setSelectedPermissions(getDefaultPermissionsForRole(r));
                      }}
                      className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer ${
                        newRole === r ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-slate-200'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button variant="secondary" onClick={() => setShowRoleModal(false)}>Hủy</Button>
              <Button
                variant="primary"
                onClick={() => roleMutation.mutate({ role: newRole, permissions: selectedPermissions })}
                disabled={roleMutation.isPending}
                className="bg-purple-600"
              >
                Lưu Phân Quyền
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-red-600">Xóa Tài Khoản Vĩnh Viễn</h3>
            <p className="text-xs text-slate-600">
              Bạn có chắc chắn muốn xóa tài khoản <strong>{user.name}</strong> không? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t text-xs">
              <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Hủy</Button>
              <Button variant="primary" onClick={() => deleteMutation.mutate()} className="bg-red-600">
                Xác Nhận Xóa
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
