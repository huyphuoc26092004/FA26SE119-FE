import type { AdminManagedUser, CreateUserPayload, UpdateUserPayload, UserFilterParams, UserPermission } from '../types/userManagement';
import type { UserRole } from '../types/domain';
import { pending, notConnected } from './apiPending';

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

// TODO(api): GET /api/v1/admin/users
export async function getManagedUsers(params: UserFilterParams = {}): Promise<AdminManagedUser[]> {
  return pending([], 'GET /api/v1/admin/users', params);
}

// TODO(api): GET /api/v1/admin/users/{id}
export async function getUserById(id: string): Promise<AdminManagedUser | null> {
  return pending(null, 'GET /api/v1/admin/users/{id}', id);
}

// TODO(api): POST /api/v1/admin/users
export async function createUser(payload: CreateUserPayload): Promise<AdminManagedUser> {
  return notConnected('POST /api/v1/admin/users', payload);
}

// TODO(api): PUT /api/v1/admin/users/{id}
export async function updateUser(id: string, payload: UpdateUserPayload): Promise<AdminManagedUser> {
  return notConnected('PUT /api/v1/admin/users/{id}', id, payload);
}

// TODO(api): PUT /api/v1/admin/users/{id}
export async function toggleLockUser(id: string, newStatus: 'ACTIVE' | 'SUSPENDED', reason?: string): Promise<AdminManagedUser> {
  return notConnected('PUT /api/v1/admin/users/{id}', id, newStatus, reason);
}

// TODO(api): PUT /api/v1/admin/users/{id}
export async function updateUserRole(id: string, newRole: UserRole, customPermissions?: string[]): Promise<AdminManagedUser> {
  return notConnected('PUT /api/v1/admin/users/{id}', id, newRole, customPermissions);
}

// TODO(api): DELETE /api/v1/admin/users/{id}
export async function deleteUser(id: string): Promise<void> {
  return notConnected('DELETE /api/v1/admin/users/{id}', id);
}

// TODO(api): BE chưa có API
export async function resetUserPassword(id: string, newPassword = 'password123'): Promise<string> {
  return notConnected('BE chưa có API', id, newPassword);
}
