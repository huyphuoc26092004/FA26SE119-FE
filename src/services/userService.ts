import type { AdminManagedUser, CreateUserPayload, UpdateUserPayload, UserFilterParams, UserPermission } from '../types/userManagement';
import type { UserRole } from '../types/domain';
import type { UserAccountStatus } from '../types/userManagement';
import { apiClient } from './apiClient';
import { type ApiRow, str } from './candidateMappers';
import { formatDateTime } from './supportService';

export const ALL_SYSTEM_PERMISSIONS: UserPermission[] = [
  // Core
  {
    key: 'upload_resumes',
    name: 'Quản lý & Tải lên CV',
    description: 'Tạo mới, chỉnh sửa và tải lên CV dạng PDF/Word',
    category: 'core',
  },
  {
    key: 'match_jobs',
    name: 'Tìm kiếm & Khớp nối việc làm',
    description: 'Tìm kiếm danh sách việc làm và tính điểm tương thích JD',
    category: 'core',
  },
  {
    key: 'book_consultation',
    name: 'Đặt lịch tư vấn 1-on-1',
    description: 'Gửi yêu cầu và xếp lịch hẹn với Chuyên gia nghề nghiệp',
    category: 'core',
  },
  // AI
  {
    key: 'access_ai_assistant',
    name: 'Sử dụng Trợ lý AI Hướng nghiệp',
    description: 'Tương tác thời gian thực với AI Agent hỏi đáp sự nghiệp',
    category: 'ai',
  },
  {
    key: 'run_ats_audit',
    name: 'Kiểm toán điểm ATS chuyên sâu',
    description: 'Chấm điểm và đề xuất tối ưu từ khóa chuẩn hệ thống ATS',
    category: 'ai',
  },
  {
    key: 'generate_cover_letter',
    name: 'Tạo Thư ứng tuyển thông minh',
    description: 'Tự động tạo Cover Letter cá nhân hóa theo từng công ty',
    category: 'ai',
  },
  // Consultation
  {
    key: 'view_assigned_consultations',
    name: 'Tiếp nhận ca tư vấn được giao',
    description: 'Xem chi tiết các yêu cầu tư vấn và hồ sơ ứng viên phụ trách',
    category: 'consultation',
  },
  {
    key: 'review_candidate_cv',
    name: 'Phân tích & Thẩm định CV ứng viên',
    description: 'Đánh giá 360 độ hồ sơ, kỹ năng và mức độ sẵn sàng của ứng viên',
    category: 'consultation',
  },
  {
    key: 'provide_career_advice',
    name: 'Cung cấp Lời khuyên 4 Trụ cột',
    description: 'Biên soạn khuyến nghị về CV, Định hướng, Lương và Kỹ năng phỏng vấn',
    category: 'consultation',
  },
  // Admin
  {
    key: 'manage_all_users',
    name: 'Quản lý danh sách người dùng',
    description: 'Xem, tạo mới, chỉnh sửa, khóa và xóa tài khoản trên hệ thống',
    category: 'admin',
  },
  {
    key: 'manage_roles_permissions',
    name: 'Phân quyền & Điều chỉnh vai trò',
    description: 'Thay đổi vai trò (Candidate / Consultant / Admin) và cấp quyền đặc biệt',
    category: 'admin',
  },
  {
    key: 'view_system_telemetry',
    name: 'Xem thống kê & Giám sát hệ thống',
    description: 'Truy cập Admin Dashboard, theo dõi tài nguyên hạ tầng và token AI',
    category: 'admin',
  },
  {
    key: 'manage_subscriptions_revenue',
    name: 'Quản lý doanh thu & Gói cước',
    description: 'Theo dõi giao dịch tài chính, biểu đồ MRR và xuất hóa đơn',
    category: 'admin',
  },
  {
    key: 'toggle_maintenance',
    name: 'Điều khiển chế độ bảo trì',
    description: 'Khóa hệ thống để nâng cấp hoặc xóa bộ nhớ đệm cache',
    category: 'admin',
  },
];

export function getDefaultPermissionsForRole(role: UserRole): string[] {
  switch (role) {
    case 'ADMIN':
      return ALL_SYSTEM_PERMISSIONS.map((p) => p.key);
    case 'CAREER_CONSULTANT':
      return [
        'upload_resumes',
        'match_jobs',
        'access_ai_assistant',
        'run_ats_audit',
        'view_assigned_consultations',
        'review_candidate_cv',
        'provide_career_advice',
      ];
    case 'CANDIDATE':
    default:
      return [
        'upload_resumes',
        'match_jobs',
        'book_consultation',
        'access_ai_assistant',
        'run_ats_audit',
        'generate_cover_letter',
      ];
  }
}

const STATUS_FROM_API: Record<string, UserAccountStatus> = { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED', PENDING: 'PENDING' };

/** Một dòng tài khoản từ /admin/users thành người dùng trên trang quản trị. */
export function toManagedUser(row: ApiRow): AdminManagedUser {
  const role = (str(row.role) || 'CANDIDATE') as UserRole;
  return {
    id: str(row.id),
    name: str(row.full_name),
    email: str(row.email),
    phone: '',
    role,
    status: STATUS_FROM_API[str(row.status)] ?? 'SUSPENDED',
    isVerified: Boolean(row.email_verified_at),
    createdAt: formatDateTime(row.created_at),
    lastActiveAt: formatDateTime(row.last_login_at) || '—',
    // Danh sách tài khoản chưa kèm gói và token đã dùng (xem tài liệu API BE cần bổ sung).
    planId: 'free',
    planName: '',
    tokenMonthlyQuota: 0,
    tokensUsedThisMonth: 0,
    permissions: getDefaultPermissionsForRole(role),
    recentActivities: [],
    authProvider: str(row.auth_provider),
    deleted: str(row.status) === 'DELETED',
  };
}

const PAGE_SIZE = 100;

/** Đọc tối đa 500 tài khoản (5 trang) rồi lọc vai trò/trạng thái ở FE vì backend chỉ tìm theo tên/email. */
export async function getManagedUsers(params: UserFilterParams = {}): Promise<AdminManagedUser[]> {
  const all: ApiRow[] = [];
  for (let page = 0; page < 5; page++) {
    const { data } = await apiClient.get<ApiRow[]>('/admin/users', { params: { search: params.search?.trim() ?? '', page, size: PAGE_SIZE } });
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  const users = all
    .map(toManagedUser)
    .filter((u) => !u.deleted)
    .filter((u) => !params.role || params.role === 'ALL' || u.role === params.role)
    .filter((u) => !params.status || params.status === 'ALL' || u.status === params.status);
  if (params.sortBy === 'name_asc') users.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  if (params.sortBy === 'oldest') users.reverse();
  return users;
}

export async function getUserById(id: string): Promise<AdminManagedUser | null> {
  const { data } = await apiClient.get<ApiRow>(`/admin/users/${id}`);
  return toManagedUser(data);
}

export async function createUser(payload: CreateUserPayload): Promise<AdminManagedUser> {
  const { data } = await apiClient.post<ApiRow>('/admin/users', {
    email: payload.email.trim(),
    fullName: payload.name.trim(),
    role: payload.role,
    temporaryPassword: payload.initialPassword && payload.initialPassword.length >= 10 ? payload.initialPassword : 'Ccv@' + crypto.randomUUID().slice(0, 12),
  });
  return toManagedUser(data);
}

/** PUT cần đủ tên, vai trò và trạng thái nên đọc tài khoản hiện tại rồi gộp thay đổi. */
async function putAccount(id: string, changes: { fullName?: string; role?: UserRole; status?: 'ACTIVE' | 'SUSPENDED' }): Promise<AdminManagedUser> {
  const current = await getUserById(id);
  if (!current) throw new Error('Không tìm thấy tài khoản.');
  if (current.status === 'PENDING' && changes.status === 'ACTIVE') throw new Error('Tài khoản chưa xác minh email nên không kích hoạt được.');
  const { data } = await apiClient.put<ApiRow>(`/admin/users/${id}`, {
    fullName: changes.fullName ?? current.name,
    role: changes.role ?? current.role,
    status: changes.status ?? (current.status === 'PENDING' ? 'SUSPENDED' : current.status),
  });
  return toManagedUser(data);
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<AdminManagedUser> {
  return putAccount(id, {
    fullName: payload.name,
    role: payload.role,
    status: payload.status === 'ACTIVE' || payload.status === 'SUSPENDED' ? payload.status : undefined,
  });
}

/** Lý do khóa chưa được backend lưu. */
export async function toggleLockUser(id: string, newStatus: 'ACTIVE' | 'SUSPENDED', reason?: string): Promise<AdminManagedUser> {
  const user = await putAccount(id, { status: newStatus });
  return { ...user, suspendedReason: newStatus === 'SUSPENDED' ? reason : undefined };
}

/** Backend chỉ có vai trò, chưa có quyền chi tiết; quyền hiển thị theo vai trò mặc định. */
export async function updateUserRole(id: string, newRole: UserRole, customPermissions?: string[]): Promise<AdminManagedUser> {
  const user = await putAccount(id, { role: newRole });
  return { ...user, permissions: customPermissions?.length ? customPermissions : user.permissions };
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/admin/users/${id}`);
}

/** Không có API admin đặt lại mật khẩu; gửi link đặt lại mật khẩu tới email của người dùng. */
export async function resetUserPassword(id: string): Promise<string> {
  const user = await getUserById(id);
  if (!user) throw new Error('Không tìm thấy tài khoản.');
  await apiClient.post('/auth/forgot-password', { email: user.email });
  return `đã gửi link đặt lại tới ${user.email}`;
}
