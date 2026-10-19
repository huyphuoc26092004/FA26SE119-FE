import type {
  AdminManagedUser,
  CreateUserPayload,
  UpdateUserPayload,
  UserFilterParams,
  UserPermission,
} from '../types/userManagement';
import type { UserRole } from '../types/domain';

const MANAGED_USERS_KEY = 'careerpilot-managed-users';
const MOCK_USERS_KEY = 'careerpilot-mock-users';
const PASSWORDS_KEY = 'careerpilot-mock-passwords';

const delay = (ms = 250) => new Promise<void>((resolve) => setTimeout(resolve, ms));

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

const initialSeedUsers: AdminManagedUser[] = [
  {
    id: '1',
    name: 'Alex Morgan',
    email: 'candidate@example.com',
    phone: '0912 345 678',
    role: 'CANDIDATE',
    status: 'ACTIVE',
    isVerified: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    createdAt: '10/08/2026',
    lastActiveAt: '10 phút trước',
    planId: 'pro',
    planName: 'Chuyên nghiệp Pro',
    tokenMonthlyQuota: 250000,
    tokensUsedThisMonth: 64200,
    location: 'TP. Hồ Chí Minh',
    headline: 'Senior Frontend Engineer | React & Architecture',
    bio: 'Kỹ sư phần mềm hơn 4 năm kinh nghiệm chuyên sâu về React 19, Next.js và tối ưu hóa trải nghiệm web tốc độ cao.',
    notes: 'Ứng viên năng nổ, đã hoàn tất 3 bài kiểm tra trắc nghiệm với điểm A+.',
    permissions: getDefaultPermissionsForRole('CANDIDATE'),
    recentActivities: [
      {
        id: 'act-1',
        timestamp: '19/10/2026 15:20',
        action: 'Đăng nhập vào hệ thống',
        ipAddress: '113.161.72.45',
        details: 'Đăng nhập thành công từ trình duyệt Chrome (Windows 11)',
      },
      {
        id: 'act-2',
        timestamp: '19/10/2026 14:10',
        action: 'Thực hiện phân tích CV–Job Fit',
        ipAddress: '113.161.72.45',
        details: 'Khớp nối CV với vị trí Tech Lead tại MoMo (Điểm 88%)',
      },
      {
        id: 'act-3',
        timestamp: '18/10/2026 16:00',
        action: 'Gia hạn gói Chuyên nghiệp Pro',
        ipAddress: '113.161.72.45',
        details: 'Thanh toán thành công 199,000đ qua VietQR',
      },
    ],
  },
  {
    id: '2',
    name: 'Taylor Lee',
    email: 'consultant@example.com',
    phone: '0988 776 655',
    role: 'CAREER_CONSULTANT',
    status: 'ACTIVE',
    isVerified: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    createdAt: '01/08/2026',
    lastActiveAt: '5 phút trước',
    planId: 'consultant',
    planName: 'Consultant Partner',
    tokenMonthlyQuota: 500000,
    tokensUsedThisMonth: 128000,
    location: 'Hà Nội',
    headline: 'Principal Career Consultant & Tech HR Strategist',
    bio: 'Chuyên gia tư vấn định hướng công nghệ hơn 8 năm kinh nghiệm, từng là Head of Engineering tại các kỳ lân Đông Nam Á.',
    notes: 'Đánh giá chuyên môn đạt 4.95/5 sao, đã hỗ trợ thành công hơn 38 ứng viên.',
    permissions: getDefaultPermissionsForRole('CAREER_CONSULTANT'),
    recentActivities: [
      {
        id: 'act-4',
        timestamp: '19/10/2026 14:42',
        action: 'Bàn giao Lời khuyên 4 Trụ Cột',
        ipAddress: '14.241.118.90',
        details: 'Hoàn tất buổi tư vấn mã CR-2026-081 cho ứng viên Alex Morgan',
      },
      {
        id: 'act-5',
        timestamp: '19/10/2026 11:15',
        action: 'Xác nhận lịch tư vấn trực tuyến',
        ipAddress: '14.241.118.90',
        details: 'Tiếp nhận yêu cầu từ ứng viên Nguyễn Đức',
      },
    ],
  },
  {
    id: '3',
    name: 'Jordan Kim',
    email: 'admin@example.com',
    phone: '0903 112 233',
    role: 'ADMIN',
    status: 'ACTIVE',
    isVerified: true,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    createdAt: '15/07/2026',
    lastActiveAt: 'Đang online',
    planId: 'enterprise',
    planName: 'Enterprise Admin',
    tokenMonthlyQuota: 2000000,
    tokensUsedThisMonth: 215000,
    location: 'TP. Hồ Chí Minh',
    headline: 'Platform Operations & System Administrator',
    bio: 'Chịu trách nhiệm bảo đảm an ninh, điều phối tài nguyên máy chủ và vận hành cổng thanh toán nền tảng CareerPilot.',
    notes: 'Tài khoản Quản trị viên cấp cao (Root Privilege).',
    permissions: getDefaultPermissionsForRole('ADMIN'),
    recentActivities: [
      {
        id: 'act-6',
        timestamp: '19/10/2026 15:10',
        action: 'Cập nhật cấu hình mô hình AI',
        ipAddress: '113.161.72.45',
        details: 'Điều chỉnh hạn mức token mặc định',
      },
      {
        id: 'act-7',
        timestamp: '19/10/2026 09:00',
        action: 'Đăng nhập vào bảng điều khiển quản trị',
        ipAddress: '113.161.72.45',
        details: 'Đăng nhập từ IP quản trị nội bộ',
      },
    ],
  },
  {
    id: '4',
    name: 'Nguyễn Minh Đức',
    email: 'duc.nguyen@example.com',
    phone: '0934 567 890',
    role: 'CANDIDATE',
    status: 'ACTIVE',
    isVerified: true,
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&q=80',
    createdAt: '12/09/2026',
    lastActiveAt: '25 phút trước',
    planId: 'executive',
    planName: 'Executive VIP',
    tokenMonthlyQuota: 1000000,
    tokensUsedThisMonth: 142000,
    location: 'Đà Nẵng',
    headline: 'Data Engineering Lead | Big Data & Cloud',
    bio: 'Kỹ sư trưởng mảng dữ liệu với kinh nghiệm xây dựng hệ thống xử lý thời gian thực trên AWS và GCP.',
    notes: 'Khách hàng VIP đăng ký gói 1 năm.',
    permissions: getDefaultPermissionsForRole('CANDIDATE'),
    recentActivities: [
      {
        id: 'act-8',
        timestamp: '19/10/2026 14:32',
        action: 'Thanh toán thành công gói Executive VIP',
        ipAddress: '42.115.88.12',
        details: 'Thanh toán 4,790,000đ qua VietQR',
      },
    ],
  },
  {
    id: '5',
    name: 'Phạm Hoàng Yến',
    email: 'yen.pham@example.com',
    phone: '0977 123 456',
    role: 'CANDIDATE',
    status: 'ACTIVE',
    isVerified: true,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80',
    createdAt: '28/09/2026',
    lastActiveAt: '1 giờ trước',
    planId: 'pro',
    planName: 'Chuyên nghiệp Pro',
    tokenMonthlyQuota: 250000,
    tokensUsedThisMonth: 89500,
    location: 'Hà Nội',
    headline: 'Senior Product Designer (UI/UX) & Design System',
    bio: 'Nhà thiết kế sản phẩm số tập trung vào khả năng tiếp cận (Accessibility) và hệ sinh thái trải nghiệm mượt mà.',
    notes: 'Hồ sơ có Portfolio xuất sắc, cần tư vấn đàm phán mức lương cấp Senior.',
    permissions: getDefaultPermissionsForRole('CANDIDATE'),
    recentActivities: [
      {
        id: 'act-9',
        timestamp: '19/10/2026 13:15',
        action: 'Gia hạn gói Chuyên nghiệp Pro',
        ipAddress: '14.162.20.7',
        details: 'Thanh toán 199,000đ qua MoMo',
      },
    ],
  },
  {
    id: '6',
    name: 'Đặng Thanh Tùng',
    email: 'tung.dang@example.com',
    phone: '0945 987 654',
    role: 'CANDIDATE',
    status: 'ACTIVE',
    isVerified: true,
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80',
    createdAt: '05/10/2026',
    lastActiveAt: '2 giờ trước',
    planId: 'executive',
    planName: 'Executive VIP',
    tokenMonthlyQuota: 1000000,
    tokensUsedThisMonth: 198000,
    location: 'TP. Hồ Chí Minh',
    headline: 'Backend Architect | Go, Microservices & High-Scale',
    bio: 'Chuyên gia kiến trúc hệ thống phân tán chịu tải lớn hơn 100,000 RPS với nền tảng Golang và Kubernetes.',
    notes: 'Đã hoàn tất phỏng vấn thử và nhận offer thành công.',
    permissions: getDefaultPermissionsForRole('CANDIDATE'),
    recentActivities: [
      {
        id: 'act-10',
        timestamp: '19/10/2026 11:45',
        action: 'Kích hoạt gói Executive VIP tháng',
        ipAddress: '118.69.182.4',
        details: 'Thanh toán 499,000đ qua VietQR',
      },
    ],
  },
  {
    id: '7',
    name: 'Vũ Quốc Khánh',
    email: 'khanh.vu@example.com',
    phone: '0966 332 211',
    role: 'CANDIDATE',
    status: 'PENDING',
    isVerified: false,
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=256&q=80',
    createdAt: '18/10/2026',
    lastActiveAt: '12 giờ trước',
    planId: 'free',
    planName: 'Khởi đầu Free',
    tokenMonthlyQuota: 20000,
    tokensUsedThisMonth: 4200,
    location: 'Cần Thơ',
    headline: 'Junior Web Developer (React / Node.js)',
    bio: 'Mới tốt nghiệp ngành Công nghệ thông tin, đam mê phát triển web hiện đại.',
    notes: 'Tài khoản chưa hoàn tất bước nhập mã OTP xác thực email.',
    permissions: getDefaultPermissionsForRole('CANDIDATE'),
    recentActivities: [
      {
        id: 'act-11',
        timestamp: '18/10/2026 21:10',
        action: 'Đăng ký tài khoản mới',
        ipAddress: '27.78.14.92',
        details: 'Đã gửi mã OTP kích hoạt đến email',
      },
    ],
  },
  {
    id: '8',
    name: 'Trần Quang Huy',
    email: 'huy.tran@example.com',
    phone: '0919 887 766',
    role: 'CANDIDATE',
    status: 'SUSPENDED',
    isVerified: true,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80',
    createdAt: '02/09/2026',
    lastActiveAt: '3 ngày trước',
    planId: 'free',
    planName: 'Khởi đầu Free',
    tokenMonthlyQuota: 20000,
    tokensUsedThisMonth: 19800,
    suspendedReason: 'Vi phạm chính sách: Lạm dụng gọi tự động API tạo Cover Letter hơn 50 lần/phút.',
    suspendedAt: '16/10/2026 14:00',
    location: 'Hải Phòng',
    headline: 'Full-stack Engineer',
    bio: 'Kỹ sư phần mềm độc lập.',
    notes: 'Tài khoản bị cắm cờ tự động bởi hệ thống bảo vệ WAF.',
    permissions: getDefaultPermissionsForRole('CANDIDATE'),
    recentActivities: [
      {
        id: 'act-12',
        timestamp: '16/10/2026 14:00',
        action: 'Tài khoản bị khóa bởi Hệ thống',
        ipAddress: '10.0.4.1',
        details: 'Khóa tự động do phát hiện lưu lượng bất thường',
      },
    ],
  },
  {
    id: '9',
    name: 'Mai Phương Linh',
    email: 'linh.mai@example.com',
    phone: '0922 445 566',
    role: 'CAREER_CONSULTANT',
    status: 'ACTIVE',
    isVerified: true,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    createdAt: '20/08/2026',
    lastActiveAt: '4 giờ trước',
    planId: 'consultant',
    planName: 'Consultant Partner',
    tokenMonthlyQuota: 500000,
    tokensUsedThisMonth: 86400,
    location: 'TP. Hồ Chí Minh',
    headline: 'Executive Recruiter & Tech HR Advisor',
    bio: 'Cố vấn nghề nghiệp mảng SRE/DevOps và Cloud Infrastructure.',
    notes: 'Đã hoàn tất chứng nhận Chuyên gia nghề nghiệp của Hiệp hội HR Quốc tế.',
    permissions: getDefaultPermissionsForRole('CAREER_CONSULTANT'),
    recentActivities: [
      {
        id: 'act-13',
        timestamp: '19/10/2026 10:30',
        action: 'Hoàn tất phiên tư vấn Mock Interview',
        ipAddress: '113.161.90.12',
        details: 'Đã gửi bản nhận xét chuẩn STAR cho ứng viên',
      },
    ],
  },
];

function getStoredManagedUsers(): AdminManagedUser[] {
  try {
    const raw = localStorage.getItem(MANAGED_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  // Initialize with seed
  saveStoredManagedUsers(initialSeedUsers);
  return [...initialSeedUsers];
}

function saveStoredManagedUsers(users: AdminManagedUser[]): void {
  try {
    localStorage.setItem(MANAGED_USERS_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }
}

/**
 * Sync user with global mock users to allow immediate login
 */
function syncWithMockLoginUsers(user: AdminManagedUser, password = 'password123'): void {
  try {
    const raw = localStorage.getItem(MOCK_USERS_KEY);
    let list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];

    const existingIdx = list.findIndex((u: { email: string }) => u.email.toLowerCase() === user.email.toLowerCase());
    const simpleUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      avatar: user.avatar,
    };

    if (existingIdx !== -1) {
      list[existingIdx] = simpleUser;
    } else {
      list.push(simpleUser);
    }
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(list));

    // Save initial password
    const passRaw = localStorage.getItem(PASSWORDS_KEY);
    const passMap = passRaw ? JSON.parse(passRaw) : {};
    passMap[user.email.toLowerCase()] = password;
    localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passMap));
  } catch {
    // ignore
  }
}

export async function getManagedUsers(params: UserFilterParams = {}): Promise<AdminManagedUser[]> {
  await delay(250);
  let list = getStoredManagedUsers();

  const { search, role, status, planId, sortBy = 'newest' } = params;

  if (role && role !== 'ALL') {
    list = list.filter((u) => u.role === role);
  }

  if (status && status !== 'ALL') {
    list = list.filter((u) => u.status === status);
  }

  if (planId && planId !== 'ALL') {
    list = list.filter((u) => u.planId === planId);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        u.id.toLowerCase().includes(q) ||
        u.planName.toLowerCase().includes(q) ||
        (u.headline && u.headline.toLowerCase().includes(q))
    );
  }

  // Sorting
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
    // Default newest
    return Number(b.id) - Number(a.id);
  });

  return list;
}

export async function getUserById(id: string): Promise<AdminManagedUser | null> {
  await delay(200);
  const list = getStoredManagedUsers();
  const found = list.find((u) => u.id === id);
  return found ? { ...found } : null;
}

export async function createUser(payload: CreateUserPayload): Promise<AdminManagedUser> {
  await delay(350);
  const list = getStoredManagedUsers();

  const existingEmail = list.find((u) => u.email.toLowerCase() === payload.email.trim().toLowerCase());
  if (existingEmail) {
    throw new Error(`Email "${payload.email}" đã tồn tại trên hệ thống. Vui lòng chọn email khác.`);
  }

  const newId = String(Date.now()).slice(-6);
  const now = new Date();
  const dateFormatted = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${now.getFullYear()}`;

  const planId = payload.planId || (payload.role === 'ADMIN' ? 'enterprise' : payload.role === 'CAREER_CONSULTANT' ? 'consultant' : 'pro');
  const planName =
    planId === 'enterprise'
      ? 'Enterprise Admin'
      : planId === 'consultant'
      ? 'Consultant Partner'
      : planId === 'executive'
      ? 'Cao cấp Executive VIP'
      : planId === 'pro'
      ? 'Chuyên nghiệp Pro'
      : 'Khởi đầu Free';

  const newUser: AdminManagedUser = {
    id: newId,
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    phone: payload.phone?.trim() || '0900 000 000',
    role: payload.role,
    status: payload.status || 'ACTIVE',
    isVerified: payload.isVerified ?? true,
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(payload.name.trim())}&backgroundColor=2563eb`,
    createdAt: dateFormatted,
    lastActiveAt: 'Vừa tạo',
    planId,
    planName,
    tokenMonthlyQuota: planId === 'enterprise' ? 2000000 : planId === 'executive' ? 1000000 : planId === 'pro' ? 250000 : 20000,
    tokensUsedThisMonth: 0,
    location: payload.location || 'Việt Nam',
    headline: payload.headline || `${payload.role === 'ADMIN' ? 'Quản trị viên' : payload.role === 'CAREER_CONSULTANT' ? 'Cố vấn sự nghiệp' : 'Ứng viên'} mới gia nhập`,
    notes: payload.notes || 'Tài khoản được tạo thủ công bởi Quản trị viên.',
    permissions: payload.permissions || getDefaultPermissionsForRole(payload.role),
    recentActivities: [
      {
        id: `act-${Date.now()}`,
        timestamp: `${dateFormatted} ${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
        action: 'Tạo tài khoản thành công',
        ipAddress: '10.0.4.1 (Admin Dashboard)',
        details: `Quản trị viên tạo tài khoản với vai trò ${payload.role}.`,
      },
    ],
  };

  list.unshift(newUser);
  saveStoredManagedUsers(list);

  // Sync with auth store mock users
  syncWithMockLoginUsers(newUser, payload.initialPassword || 'password123');

  return newUser;
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<AdminManagedUser> {
  await delay(300);
  const list = getStoredManagedUsers();
  const idx = list.findIndex((u) => u.id === id);

  if (idx === -1) {
    throw new Error(`Người dùng #${id} không tồn tại.`);
  }

  const current = list[idx];

  // If email changes, ensure uniqueness
  if (payload.email && payload.email.toLowerCase() !== current.email.toLowerCase()) {
    const duplicate = list.find((u) => u.id !== id && u.email.toLowerCase() === payload.email!.trim().toLowerCase());
    if (duplicate) {
      throw new Error(`Email "${payload.email}" đã được sử dụng bởi người dùng khác.`);
    }
  }

  const now = new Date();
  const nowFormatted = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${now.getFullYear()} ${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

  const updated: AdminManagedUser = {
    ...current,
    ...payload,
    name: payload.name ? payload.name.trim() : current.name,
    email: payload.email ? payload.email.trim().toLowerCase() : current.email,
    permissions: payload.permissions || (payload.role && payload.role !== current.role ? getDefaultPermissionsForRole(payload.role) : current.permissions),
    recentActivities: [
      {
        id: `act-${Date.now()}`,
        timestamp: nowFormatted,
        action: 'Cập nhật thông tin tài khoản',
        ipAddress: '10.0.4.1 (Admin Action)',
        details: 'Quản trị viên đã chỉnh sửa thông tin hồ sơ/vai trò.',
      },
      ...current.recentActivities,
    ],
  };

  list[idx] = updated;
  saveStoredManagedUsers(list);
  syncWithMockLoginUsers(updated);

  return updated;
}

export async function toggleLockUser(
  id: string,
  newStatus: 'ACTIVE' | 'SUSPENDED',
  reason?: string
): Promise<AdminManagedUser> {
  await delay(300);
  const list = getStoredManagedUsers();
  const idx = list.findIndex((u) => u.id === id);

  if (idx === -1) {
    throw new Error(`Người dùng #${id} không tồn tại.`);
  }

  const current = list[idx];
  const now = new Date();
  const nowFormatted = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${now.getFullYear()} ${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

  const isLocking = newStatus === 'SUSPENDED';

  const updated: AdminManagedUser = {
    ...current,
    status: newStatus,
    suspendedReason: isLocking ? reason || 'Khóa tài khoản bởi Quản trị viên hệ thống.' : undefined,
    suspendedAt: isLocking ? nowFormatted : undefined,
    recentActivities: [
      {
        id: `act-${Date.now()}`,
        timestamp: nowFormatted,
        action: isLocking ? 'Khóa tài khoản người dùng' : 'Mở khóa tài khoản người dùng',
        ipAddress: '10.0.4.1 (Admin Dashboard)',
        details: isLocking
          ? `Lý do khóa: ${reason || 'Vi phạm điều khoản hệ thống'}`
          : 'Đã kích hoạt lại trạng thái hoạt động bình thường.',
      },
      ...current.recentActivities,
    ],
  };

  list[idx] = updated;
  saveStoredManagedUsers(list);

  return updated;
}

export async function updateUserRole(
  id: string,
  newRole: UserRole,
  customPermissions?: string[]
): Promise<AdminManagedUser> {
  await delay(300);
  const list = getStoredManagedUsers();
  const idx = list.findIndex((u) => u.id === id);

  if (idx === -1) throw new Error('Không tìm thấy người dùng.');

  const current = list[idx];
  const now = new Date();
  const nowFormatted = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${now.getFullYear()} ${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

  const permissions = customPermissions && customPermissions.length > 0 ? customPermissions : getDefaultPermissionsForRole(newRole);

  const updated: AdminManagedUser = {
    ...current,
    role: newRole,
    permissions,
    recentActivities: [
      {
        id: `act-${Date.now()}`,
        timestamp: nowFormatted,
        action: 'Chuyển đổi vai trò & phân quyền',
        ipAddress: '10.0.4.1 (Admin Action)',
        details: `Vai trò thay đổi từ ${current.role} sang ${newRole}. Đã gán ${permissions.length} quyền hệ thống.`,
      },
      ...current.recentActivities,
    ],
  };

  list[idx] = updated;
  saveStoredManagedUsers(list);
  syncWithMockLoginUsers(updated);

  return updated;
}

export async function deleteUser(id: string): Promise<void> {
  await delay(300);
  let list = getStoredManagedUsers();
  const found = list.find((u) => u.id === id);

  if (!found) throw new Error('Không tìm thấy người dùng cần xóa.');

  if (found.email === 'admin@example.com') {
    throw new Error('Không thể xóa tài khoản Quản trị viên mặc định của hệ thống.');
  }

  list = list.filter((u) => u.id !== id);
  saveStoredManagedUsers(list);
}

export async function resetUserPassword(id: string, newPassword = 'password123'): Promise<string> {
  await delay(250);
  const list = getStoredManagedUsers();
  const user = list.find((u) => u.id === id);
  if (!user) throw new Error('Không tìm thấy người dùng.');

  syncWithMockLoginUsers(user, newPassword);
  return newPassword;
}
