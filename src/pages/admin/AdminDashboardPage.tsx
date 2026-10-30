import { useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Loading, ErrorState } from '../../components/ui';
import {
  EmptyRow,
  InfoRow,
  Modal,
  SectionHead,
  SegmentLinks,
  StatRow,
  ThinBar,
  Toast,
  UnderlineTabs,
  brandLink,
  dangerButton,
  formatMillions,
  outlineButton,
  pad2,
  primaryButton,
  textLink,
  underlineInput,
  underlineSelect,
} from '../../components/admin/AdminKit';
import {
  getAdminDashboardData,
  toggleMaintenanceMode,
  purgeSystemCache,
  toggleUserStatus,
} from '../../services/adminService';
import { getManagedUsers } from '../../services/userService';
import { assignConsultant, getConsultationRequests } from '../../services/consultationService';
import { getAdminPaymentTransactions } from '../../services/paymentManagementService';
import type { AdminDashboardData } from '../../types/admin';
import type { UserRole } from '../../types/domain';
import type { ConsultationRequest, ConsultationStatus } from '../../types/consultation';
import { useTranslation } from '../../i18n';

type TimeRange = '24h' | '7d' | '30d' | '90d';
type DetailTab = 'system' | 'ai' | 'revenue' | 'users';
type Lang = 'vi' | 'en';

const copy = {
  vi: {
    eyebrow: 'Bảng điều khiển quản trị',
    title: 'Tổng quan hệ thống.',
    stable: 'Hệ thống hoạt động ổn định.',
    maintenance: 'Hệ thống đang bảo trì.',
    ranges: { '24h': '24 giờ', '7d': '7 ngày', '30d': '30 ngày', '90d': '90 ngày' } as Record<TimeRange, string>,
    stats: {
      newUsers: 'Người dùng mới',
      newUsersDetail: (p: number) => `+${p.toLocaleString('vi-VN')}% so với kỳ trước`,
      consultations: 'Yêu cầu tư vấn',
      consultationsDetail: (n: number) => (n > 0 ? `${n} đang chờ tiếp nhận` : 'Không có yêu cầu chờ'),
      revenue: 'Doanh thu',
      revenueDetail: (p: number) => `+${p.toLocaleString('vi-VN')}% so với tháng trước`,
      tokens: 'Token đã dùng',
      tokensDetail: (f: string) => `${f} dùng nhiều nhất`,
    },
    todo: 'Cần xử lý ngay',
    todoEmpty: 'Không có việc nào cần xử lý. Mọi thứ đang ổn.',
    todos: {
      pendingConsult: (n: number) => `${n} yêu cầu tư vấn chờ tiếp nhận`,
      pendingConsultDetail: (u: number) =>
        u > 0 ? `${u} yêu cầu khẩn cấp, chưa có cố vấn nhận.` : 'Cố vấn cần tiếp nhận và xếp lịch cho ứng viên.',
      pendingConsultAction: 'Xem yêu cầu',
      failedTx: (n: number) => `${n} giao dịch thanh toán thất bại`,
      failedTxDetail: 'Cần kiểm tra lại với cổng thanh toán.',
      pendingTx: (n: number) => `${n} giao dịch chờ xác nhận`,
      pendingTxDetail: 'Chuyển khoản cần đối soát trước khi kích hoạt gói.',
      txAction: 'Xem giao dịch',
      lockedUsers: (n: number) => `${n} tài khoản bị khoá hoặc chờ kích hoạt`,
      lockedUsersDetail: 'Xem lại lý do khoá và trạng thái xác thực OTP.',
      usersAction: 'Xem người dùng',
      warn: 'Cảnh báo bảo mật gần nhất',
      warnAction: 'Xem nhật ký',
      maintenanceOn: 'Chế độ bảo trì đang bật',
      maintenanceOnDetail: 'Người dùng chưa thể tạo CV, chat AI hay thanh toán.',
      maintenanceAction: 'Mở lại hệ thống',
    },
    chart: 'Lượt dùng AI',
    chartMeta: (n: number, d: number) => `${n.toLocaleString('vi-VN')} lượt trong ${d} ngày`,
    consultants: 'Cố vấn',
    consultantLine: (active: number, done: number) => `${active} yêu cầu đang xử lý · ${done} đã hoàn tất`,
    noRating: 'Chưa có đánh giá',
    manageConsultants: 'Quản lý cố vấn',
    noConsultants: 'Chưa có tài khoản cố vấn.',
    plans: 'Gói đăng ký',
    tokenUsed: 'Token đã dùng',
    planLink: 'Xem gói và bảng quy đổi token',
    planNames: { free: 'Miễn phí', pro: 'Pro', executive: 'Premium' } as Record<string, string>,
    operations: 'Vận hành chi tiết',
    actions: {
      refresh: 'Làm mới',
      refreshing: 'Đang làm mới…',
      purge: 'Xoá cache',
      export: 'Xuất báo cáo',
      maintenance: 'Bật bảo trì',
      maintenanceOff: 'Tắt bảo trì',
    },
    tabs: { system: 'Hệ thống', ai: 'AI & token', revenue: 'Doanh thu', users: 'Người dùng' } as Record<DetailTab, string>,
    updated: (t: string) => `Cập nhật lúc ${t}`,
    toastPurge: (k: number, mb: number) => `Đã xoá ${k} khoá bộ nhớ đệm, giải phóng ${mb} MB RAM.`,
    toastUser: (id: string, s: string) => `Đã cập nhật người dùng #${id} sang ${s === 'ACTIVE' ? 'Hoạt động' : 'Bị khoá'}.`,
    toastExport: 'Đã tải file báo cáo quản trị CSV.',
    system: {
      status: 'Trạng thái',
      operational: 'Hoạt động bình thường',
      maintenance: 'Đang bảo trì',
      uptime: (p: number, d: number) => `${p}% uptime · chạy liên tục ${d} ngày`,
      services: 'Dịch vụ',
      latency: 'Độ trễ',
      resources: 'Tài nguyên',
      cpu: 'CPU',
      ram: 'Bộ nhớ RAM',
      disk: 'Lưu trữ',
      db: 'Kết nối CSDL',
      queues: 'Hàng đợi xử lý nền',
      waiting: 'Đang chờ',
      processed: 'Đã xử lý hôm nay',
      failed: 'Lỗi',
      audit: 'Nhật ký kiểm toán',
      by: 'Thực hiện bởi',
    },
    ai: {
      requests: 'Lượt gọi',
      tokens: 'Token',
      cost: 'Chi phí ước tính',
      saved: 'Tiết kiệm nhờ cache',
      hit: (p: number) => `${p}% trúng cache`,
      latency: (ms: number) => `Phản hồi TB ${ms} ms`,
      models: 'Theo mô hình',
      features: 'Theo tính năng',
      reqUnit: 'lượt',
      days: 'Theo ngày',
    },
    revenue: {
      mrr: 'Doanh thu định kỳ (MRR)',
      arr: 'Quy mô năm (ARR)',
      arpu: 'TB / người trả phí',
      conversion: 'Tỉ lệ trả phí',
      conversionDetail: (a: number, b: number) => `${a} / ${b.toLocaleString('vi-VN')} tài khoản`,
      monthly: '6 tháng gần nhất',
      tx: 'GD',
      gateways: 'Cổng thanh toán',
      recent: 'Giao dịch gần nhất',
      receipt: 'Biên lai',
      status: { success: 'Thành công', pending: 'Chờ xác nhận', failed: 'Thất bại', refunded: 'Đã hoàn tiền' } as Record<string, string>,
      free: 'Miễn phí',
    },
    users: {
      candidates: 'Ứng viên',
      consultants: 'Cố vấn',
      stickiness: 'Độ gắn kết (DAU/MAU)',
      verified: 'Đã xác thực OTP',
      churn: (p: number) => `Tỉ lệ rời bỏ ${p}%`,
      search: 'Tìm theo tên, email, gói…',
      allRoles: 'Tất cả vai trò',
      verifiedYes: 'Đã xác minh',
      verifiedNo: 'Chờ OTP',
      tokens: 'token',
      view: 'Xem',
      lock: 'Khoá',
      unlock: 'Mở khoá',
      empty: 'Không có người dùng phù hợp.',
    },
    roles: { CANDIDATE: 'Ứng viên', CAREER_CONSULTANT: 'Cố vấn', ADMIN: 'Quản trị viên' } as Record<UserRole, string>,
    userStatus: { ACTIVE: 'Hoạt động', SUSPENDED: 'Bị khoá', PENDING: 'Chờ kích hoạt' } as Record<string, string>,
    receipt: {
      title: 'Biên lai giao dịch',
      order: 'Mã đơn',
      customer: 'Khách hàng',
      email: 'Email',
      plan: 'Gói đăng ký',
      amount: 'Số tiền',
      method: 'Cổng thanh toán',
      status: 'Trạng thái',
      time: 'Thời gian',
      close: 'Đóng',
    },
    quick: {
      title: 'Thông tin tài khoản',
      plan: 'Gói đăng ký',
      tokens: 'Token đã dùng',
      created: 'Ngày tạo',
      status: 'Trạng thái',
      lock: 'Khoá tài khoản này',
      unlock: 'Mở khoá tài khoản',
      detail: 'Mở trang chi tiết',
      close: 'Đóng',
    },
    maintenanceModal: {
      title: 'Chế độ bảo trì',
      enableText:
        'Khi bật chế độ bảo trì, các tính năng tạo CV, chat AI và thanh toán sẽ tạm thời bị khoá với người dùng thông thường để phục vụ nâng cấp hệ thống.',
      disableText: 'Tắt chế độ bảo trì và mở lại toàn bộ hệ thống cho ứng viên và cố vấn?',
      cancel: 'Huỷ',
      enable: 'Bật bảo trì ngay',
      disable: 'Mở lại hệ thống',
    },
    consult: {
      eyebrow: 'Yêu cầu tư vấn',
      title: 'Yêu cầu tư vấn.',
      line2: (n: number) => (n > 0 ? `${n} yêu cầu đang chờ tiếp nhận.` : 'Không có yêu cầu nào đang chờ.'),
      intro: 'Theo dõi yêu cầu ứng viên gửi cho cố vấn, mức độ ưu tiên và lịch hẹn của từng phiên.',
      total: 'Tổng yêu cầu',
      pending: 'Chờ tiếp nhận',
      active: 'Đang xử lý',
      done: 'Đã hoàn tất',
      search: 'Tìm theo mã, ứng viên, chủ đề…',
      all: 'Tất cả',
      status: {
        PENDING: 'Chờ tiếp nhận',
        SCHEDULED: 'Đã xếp lịch',
        IN_PROGRESS: 'Đang tư vấn',
        COMPLETED: 'Hoàn tất',
        CANCELLED: 'Đã huỷ',
      } as Record<ConsultationStatus, string>,
      priority: { URGENT: 'Khẩn cấp', HIGH: 'Ưu tiên cao', NORMAL: 'Bình thường' } as Record<string, string>,
      cols: { request: 'Yêu cầu', consultant: 'Cố vấn', meeting: 'Lịch hẹn', status: 'Trạng thái' },
      empty: 'Không có yêu cầu nào ở mục này.',
      back: 'Về tổng quan',
      requested: 'Gửi lúc',
    },
  },
  en: {
    eyebrow: 'Admin dashboard',
    title: 'System overview.',
    stable: 'Everything is running smoothly.',
    maintenance: 'The platform is in maintenance.',
    ranges: { '24h': '24 hours', '7d': '7 days', '30d': '30 days', '90d': '90 days' } as Record<TimeRange, string>,
    stats: {
      newUsers: 'New users',
      newUsersDetail: (p: number) => `+${p}% vs previous period`,
      consultations: 'Consultation requests',
      consultationsDetail: (n: number) => (n > 0 ? `${n} awaiting a consultant` : 'Nothing waiting'),
      revenue: 'Revenue',
      revenueDetail: (p: number) => `+${p}% vs last month`,
      tokens: 'Tokens used',
      tokensDetail: (f: string) => `${f} uses the most`,
    },
    todo: 'Needs attention',
    todoEmpty: 'Nothing needs your attention right now.',
    todos: {
      pendingConsult: (n: number) => `${n} consultation requests waiting`,
      pendingConsultDetail: (u: number) =>
        u > 0 ? `${u} urgent requests have no consultant yet.` : 'Consultants need to accept and schedule them.',
      pendingConsultAction: 'View requests',
      failedTx: (n: number) => `${n} failed payments`,
      failedTxDetail: 'Check them against the payment gateway.',
      pendingTx: (n: number) => `${n} payments awaiting confirmation`,
      pendingTxDetail: 'Bank transfers must be reconciled before plans activate.',
      txAction: 'View payments',
      lockedUsers: (n: number) => `${n} accounts suspended or pending`,
      lockedUsersDetail: 'Review suspension reasons and OTP verification.',
      usersAction: 'View users',
      warn: 'Latest security warning',
      warnAction: 'View logs',
      maintenanceOn: 'Maintenance mode is on',
      maintenanceOnDetail: 'Users cannot create CVs, chat with AI or pay.',
      maintenanceAction: 'Reopen platform',
    },
    chart: 'AI requests',
    chartMeta: (n: number, d: number) => `${n.toLocaleString('en-US')} requests in ${d} days`,
    consultants: 'Consultants',
    consultantLine: (active: number, done: number) => `${active} open requests · ${done} completed`,
    noRating: 'No ratings yet',
    manageConsultants: 'Manage consultants',
    noConsultants: 'No consultant accounts yet.',
    plans: 'Subscriptions',
    tokenUsed: 'Tokens used',
    planLink: 'See plans and token pricing',
    planNames: { free: 'Free', pro: 'Pro', executive: 'Premium' } as Record<string, string>,
    operations: 'Operations',
    actions: {
      refresh: 'Refresh',
      refreshing: 'Refreshing…',
      purge: 'Purge cache',
      export: 'Export report',
      maintenance: 'Enable maintenance',
      maintenanceOff: 'Disable maintenance',
    },
    tabs: { system: 'System', ai: 'AI & tokens', revenue: 'Revenue', users: 'Users' } as Record<DetailTab, string>,
    updated: (t: string) => `Updated at ${t}`,
    toastPurge: (k: number, mb: number) => `Purged ${k} cache keys, freed ${mb} MB RAM.`,
    toastUser: (id: string, s: string) => `User #${id} is now ${s === 'ACTIVE' ? 'active' : 'suspended'}.`,
    toastExport: 'Downloaded the admin CSV report.',
    system: {
      status: 'Status',
      operational: 'Operational',
      maintenance: 'Maintenance',
      uptime: (p: number, d: number) => `${p}% uptime · running for ${d} days`,
      services: 'Services',
      latency: 'Latency',
      resources: 'Resources',
      cpu: 'CPU',
      ram: 'Memory',
      disk: 'Storage',
      db: 'DB connections',
      queues: 'Background queues',
      waiting: 'Waiting',
      processed: 'Processed today',
      failed: 'Failed',
      audit: 'Audit log',
      by: 'By',
    },
    ai: {
      requests: 'Requests',
      tokens: 'Tokens',
      cost: 'Estimated cost',
      saved: 'Saved by cache',
      hit: (p: number) => `${p}% cache hits`,
      latency: (ms: number) => `Avg latency ${ms} ms`,
      models: 'By model',
      features: 'By feature',
      reqUnit: 'requests',
      days: 'By day',
    },
    revenue: {
      mrr: 'Monthly recurring (MRR)',
      arr: 'Annual run rate',
      arpu: 'Per paying user',
      conversion: 'Paid conversion',
      conversionDetail: (a: number, b: number) => `${a} / ${b.toLocaleString('en-US')} accounts`,
      monthly: 'Last 6 months',
      tx: 'tx',
      gateways: 'Payment gateways',
      recent: 'Recent payments',
      receipt: 'Receipt',
      status: { success: 'Success', pending: 'Pending', failed: 'Failed', refunded: 'Refunded' } as Record<string, string>,
      free: 'Free',
    },
    users: {
      candidates: 'Candidates',
      consultants: 'Consultants',
      stickiness: 'Stickiness (DAU/MAU)',
      verified: 'OTP verified',
      churn: (p: number) => `Churn ${p}%`,
      search: 'Search name, email, plan…',
      allRoles: 'All roles',
      verifiedYes: 'Verified',
      verifiedNo: 'Awaiting OTP',
      tokens: 'tokens',
      view: 'View',
      lock: 'Suspend',
      unlock: 'Activate',
      empty: 'No matching users.',
    },
    roles: { CANDIDATE: 'Candidate', CAREER_CONSULTANT: 'Consultant', ADMIN: 'Administrator' } as Record<UserRole, string>,
    userStatus: { ACTIVE: 'Active', SUSPENDED: 'Suspended', PENDING: 'Pending' } as Record<string, string>,
    receipt: {
      title: 'Payment receipt',
      order: 'Order',
      customer: 'Customer',
      email: 'Email',
      plan: 'Plan',
      amount: 'Amount',
      method: 'Gateway',
      status: 'Status',
      time: 'Time',
      close: 'Close',
    },
    quick: {
      title: 'Account details',
      plan: 'Plan',
      tokens: 'Tokens used',
      created: 'Created',
      status: 'Status',
      lock: 'Suspend this account',
      unlock: 'Activate account',
      detail: 'Open full profile',
      close: 'Close',
    },
    maintenanceModal: {
      title: 'Maintenance mode',
      enableText: 'Enabling maintenance mode temporarily locks CV creation, AI queries and payments for regular users.',
      disableText: 'Disable maintenance mode and reopen the platform to candidates and consultants?',
      cancel: 'Cancel',
      enable: 'Enable maintenance',
      disable: 'Reopen platform',
    },
    consult: {
      eyebrow: 'Consultation requests',
      title: 'Consultation requests.',
      line2: (n: number) => (n > 0 ? `${n} waiting for a consultant.` : 'Nothing is waiting.'),
      intro: 'Follow the requests candidates send to consultants, their priority and each session’s schedule.',
      total: 'Total requests',
      pending: 'Awaiting review',
      active: 'In progress',
      done: 'Completed',
      search: 'Search by id, candidate, topic…',
      all: 'All',
      status: {
        PENDING: 'Awaiting review',
        SCHEDULED: 'Scheduled',
        IN_PROGRESS: 'In session',
        COMPLETED: 'Completed',
        CANCELLED: 'Cancelled',
      } as Record<ConsultationStatus, string>,
      priority: { URGENT: 'Urgent', HIGH: 'High', NORMAL: 'Normal' } as Record<string, string>,
      cols: { request: 'Request', consultant: 'Consultant', meeting: 'Meeting', status: 'Status' },
      empty: 'No requests here.',
      back: 'Back to overview',
      requested: 'Sent',
    },
  },
};

type Copy = (typeof copy)['vi'];

const WEEKDAYS: Record<Lang, string[]> = {
  vi: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

/** "13/10" → weekday label, using the dashboard's demo year. */
function weekdayOf(ddmm: string, lang: Lang) {
  const [d, m] = ddmm.split('/').map(Number);
  if (!d || !m) return ddmm;
  return WEEKDAYS[lang][new Date(2026, m - 1, d).getDay()];
}

function compactNumber(n: number, lang: Lang) {
  const locale = lang === 'vi' ? 'vi-VN' : 'en-US';
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString(locale, { maximumFractionDigits: 1 })}M`;
  return n.toLocaleString(locale);
}

const ACTIVE_CONSULT: ConsultationStatus[] = ['PENDING', 'SCHEDULED', 'IN_PROGRESS'];

export default function AdminDashboardPage() {
  const { isVietnamese } = useTranslation();
  const lang: Lang = isVietnamese ? 'vi' : 'en';
  const c = copy[lang];
  const locale = isVietnamese ? 'vi-VN' : 'en-US';
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('tab') === 'consultations' ? 'consultations' : 'overview';

  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [activeTab, setActiveTab] = useState<DetailTab>('system');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User table search & filter state
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [selectedUser, setSelectedUser] = useState<AdminDashboardData['userMetrics']['userList'][0] | null>(null);

  // Selected Transaction Receipt Modal
  const [selectedTx, setSelectedTx] = useState<AdminDashboardData['revenueMetrics']['recentTransactions'][0] | null>(null);

  // Maintenance Confirmation Modal
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const {
    data: dashboardData,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['admin-dashboard', timeRange],
    queryFn: () => getAdminDashboardData(timeRange),
  });

  // Read-only lists that feed the overview sections.
  const { data: managedUsers = [] } = useQuery({
    queryKey: ['admin-managed-users'],
    queryFn: () => getManagedUsers(),
  });
  const { data: consultations = [] } = useQuery({
    queryKey: ['admin-consultations'],
    queryFn: () => getConsultationRequests(),
  });
  const { data: paymentTx = [] } = useQuery({
    queryKey: ['admin-payment-transactions'],
    queryFn: () => getAdminPaymentTransactions(),
  });

  // Maintenance mutation
  const maintenanceMutation = useMutation({
    mutationFn: (enable: boolean) => toggleMaintenanceMode(enable),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setShowMaintenanceModal(false);
      showToast(res.message);
    },
  });

  // Purge cache mutation
  const purgeCacheMutation = useMutation({
    mutationFn: () => purgeSystemCache(),
    onSuccess: (res) => {
      showToast(c.toastPurge(res.clearedKeysCount, res.freedMemoryMB));
    },
  });

  // Toggle user status
  const userStatusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: 'ACTIVE' | 'SUSPENDED' }) =>
      toggleUserStatus(userId, status),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      showToast(c.toastUser(res.userId, res.status));
      if (selectedUser && selectedUser.id === res.userId) {
        setSelectedUser({ ...selectedUser, status: res.status });
      }
    },
  });

  const consultantRows = useMemo(
    () =>
      managedUsers
        .filter((u) => u.role === 'CAREER_CONSULTANT')
        .map((u) => {
          const mine = consultations.filter((r) => r.consultantId === u.id);
          const ratings = mine.map((r) => r.ratingByCandidate?.stars).filter((s): s is number => typeof s === 'number');
          return {
            user: u,
            active: mine.filter((r) => ACTIVE_CONSULT.includes(r.status)).length,
            done: mine.filter((r) => r.status === 'COMPLETED').length,
            rating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
          };
        })
        .sort((a, b) => b.active - a.active),
    [managedUsers, consultations]
  );

  if (isLoading) return <Loading />;
  if (isError || !dashboardData) return <ErrorState />;

  const { systemHealth, aiMetrics, revenueMetrics, userMetrics } = dashboardData;
  const isMaintenance = systemHealth.overallStatus === 'MAINTENANCE';

  if (view === 'consultations') {
    return (
      <ConsultationsView
        c={c}
        lang={lang}
        consultations={consultations}
        consultants={managedUsers.filter((u) => u.role === 'CAREER_CONSULTANT' && u.status === 'ACTIVE')}
        onAssigned={() => void queryClient.invalidateQueries({ queryKey: ['admin-consultations'] })}
        onBack={() => setSearchParams({})}
      />
    );
  }

  // Filtered users
  const filteredUsers = userMetrics.userList.filter((u) => {
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    const matchesSearch =
      !userSearch.trim() ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.planName.toLowerCase().includes(userSearch.toLowerCase());
    return matchesRole && matchesSearch;
  });

  // Export report as CSV
  const handleExportReport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent(
        `BÁO CÁO TỔNG QUAN QUẢN TRỊ HỆ THỐNG - CAREERPILOT\n` +
          `Thời gian xuất: ${new Date().toLocaleString('vi-VN')}\n` +
          `Khung thời gian: ${timeRange}\n\n` +
          `1. HẠ TẦNG KỸ THUẬT\n` +
          `Trạng thái: ${systemHealth.overallStatus}\n` +
          `Uptime: ${systemHealth.uptimePercentage}%\n` +
          `CPU: ${systemHealth.resources.cpuUsagePercent}%\n` +
          `RAM: ${systemHealth.resources.memoryUsedGB}GB / ${systemHealth.resources.memoryTotalGB}GB\n\n` +
          `2. SỬ DỤNG AI\n` +
          `Tổng yêu cầu: ${aiMetrics.totalRequests}\n` +
          `Tổng tokens: ${aiMetrics.totalTokens}\n` +
          `Chi phí ước tính USD: $${aiMetrics.totalCostUSD}\n` +
          `Chi phí ước tính VND: ${aiMetrics.totalCostVND.toLocaleString()} đ\n\n` +
          `3. DOANH THU & GÓI CƯỚC\n` +
          `Tổng doanh thu: ${revenueMetrics.totalRevenueVND.toLocaleString()} đ\n` +
          `MRR: ${revenueMetrics.mrrVND.toLocaleString()} đ\n` +
          `Khách hàng trả phí: ${revenueMetrics.paidSubscribersCount}\n\n` +
          `4. NGƯỜI DÙNG\n` +
          `Tổng tài khoản: ${userMetrics.totalUsers}\n` +
          `Ứng viên: ${userMetrics.candidateCount}\n` +
          `Cố vấn: ${userMetrics.consultantCount}\n` +
          `Quản trị viên: ${userMetrics.adminCount}\n`
      );

    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', csvContent);
    downloadAnchor.setAttribute('download', `careerpilot-admin-report-${timeRange}-${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast(c.toastExport);
  };

  // ─── Derived overview data ───────────────────────────────────────────────
  const pendingConsults = consultations.filter((r) => r.status === 'PENDING');
  const urgentPending = pendingConsults.filter((r) => r.priority === 'URGENT').length;
  const failedTx = paymentTx.filter((t) => t.status === 'failed').length;
  const pendingTx = paymentTx.filter((t) => t.status === 'pending').length;
  const lockedUsers = managedUsers.filter((u) => u.status !== 'ACTIVE').length;
  const warnLog = systemHealth.auditLogs.find((l) => l.severity === 'WARN' || l.severity === 'CRITICAL');
  const topFeature = [...aiMetrics.featureBreakdown].sort((a, b) => b.tokenCount - a.tokenCount)[0];

  const todos: { title: string; detail: string; action: ReactNode; tone?: 'warning' }[] = [];
  if (isMaintenance) {
    todos.push({
      title: c.todos.maintenanceOn,
      detail: c.todos.maintenanceOnDetail,
      action: (
        <button type="button" onClick={() => setShowMaintenanceModal(true)} className={brandLink}>
          {c.todos.maintenanceAction}
        </button>
      ),
    });
  }
  if (pendingConsults.length > 0) {
    todos.push({
      title: c.todos.pendingConsult(pendingConsults.length),
      detail: c.todos.pendingConsultDetail(urgentPending),
      action: (
        <Link to="/admin?tab=consultations" className={brandLink}>
          {c.todos.pendingConsultAction}
        </Link>
      ),
    });
  }
  if (failedTx > 0) {
    todos.push({
      title: c.todos.failedTx(failedTx),
      detail: c.todos.failedTxDetail,
      action: (
        <Link to="/admin/payments" className={brandLink}>
          {c.todos.txAction}
        </Link>
      ),
    });
  }
  if (pendingTx > 0) {
    todos.push({
      title: c.todos.pendingTx(pendingTx),
      detail: c.todos.pendingTxDetail,
      action: (
        <Link to="/admin/payments" className={brandLink}>
          {c.todos.txAction}
        </Link>
      ),
    });
  }
  if (lockedUsers > 0) {
    todos.push({
      title: c.todos.lockedUsers(lockedUsers),
      detail: c.todos.lockedUsersDetail,
      action: (
        <Link to="/admin/users" className={brandLink}>
          {c.todos.usersAction}
        </Link>
      ),
    });
  }
  if (warnLog) {
    todos.push({
      title: `${c.todos.warn}: ${warnLog.action}`,
      detail: warnLog.details,
      action: (
        <button
          type="button"
          onClick={() => {
            setActiveTab('system');
            document.getElementById('admin-operations')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className={brandLink}
        >
          {c.todos.warnAction}
        </button>
      ),
    });
  }

  const trend = aiMetrics.dailyTrend;
  const maxReq = Math.max(1, ...trend.map((p) => p.totalRequests));
  const trendTotal = trend.reduce((a, p) => a + p.totalRequests, 0);

  return (
    <div>
      <Toast message={toastMessage} />

      {/* Header */}
      <header>
        <div className="mb-[clamp(1.25rem,2.5vw,2rem)] flex flex-wrap items-center justify-between gap-4">
          <p className="text-[13px] text-brand">{c.eyebrow}</p>
          <SegmentLinks
            options={(['24h', '7d', '30d', '90d'] as const).map((r) => ({ value: r, label: c.ranges[r] }))}
            value={timeRange}
            onChange={setTimeRange}
          />
        </div>
        <h1 className="text-[clamp(2.25rem,4.6vw,4rem)] font-normal leading-[1.08] tracking-[-0.03em] text-ink">
          {c.title}
          <span className={`block ${isMaintenance ? 'text-orange-600' : 'text-brand'}`}>
            {isMaintenance ? c.maintenance : c.stable}
          </span>
        </h1>
      </header>

      <div className="mt-[clamp(2rem,4vw,3rem)]">
        <StatRow
          items={[
            {
              label: c.stats.newUsers,
              value: userMetrics.newUsersThisMonth.toLocaleString(locale),
              detail: c.stats.newUsersDetail(userMetrics.growthPercent),
              detailTone: 'brand',
            },
            {
              label: c.stats.consultations,
              value: consultations.length.toLocaleString(locale),
              detail: c.stats.consultationsDetail(pendingConsults.length),
              detailTone: pendingConsults.length > 0 ? 'warning' : 'muted',
            },
            {
              label: c.stats.revenue,
              value: formatMillions(revenueMetrics.totalRevenueVND, lang),
              detail: c.stats.revenueDetail(revenueMetrics.growthPercentMoM),
              detailTone: 'brand',
            },
            {
              label: c.stats.tokens,
              value: compactNumber(aiMetrics.totalTokens, lang),
              detail: topFeature ? c.stats.tokensDetail(topFeature.featureName) : undefined,
            },
          ]}
        />
      </div>

      {/* 01 Needs attention */}
      <section className="mt-[clamp(3rem,6vw,4.5rem)]">
        <SectionHead index="01" title={c.todo} />
        {todos.length === 0 ? (
          <EmptyRow>{c.todoEmpty}</EmptyRow>
        ) : (
          <ul>
            {todos.map((t, i) => (
              <li
                key={i}
                className="flex flex-col gap-3 border-b border-border py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8"
              >
                <div className="min-w-0">
                  <p className="text-[15px] font-medium text-ink">{t.title}</p>
                  <p className="mt-1 text-[13px] text-slate-600">{t.detail}</p>
                </div>
                <div className="shrink-0">{t.action}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 02 Chart */}
      <section className="mt-[clamp(3rem,6vw,4.5rem)]">
        <SectionHead index="02" title={c.chart} meta={c.chartMeta(trendTotal, trend.length)} />
        <div className="mt-6 flex h-[clamp(9rem,14vw,11rem)] items-end gap-[clamp(0.375rem,1vw,0.75rem)]" role="img" aria-label={c.chart}>
          {trend.map((p) => (
            <div key={p.date} className="group relative flex h-full flex-1 flex-col justify-end">
              <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] tabular-nums text-slate-600 opacity-0 transition-opacity group-hover:opacity-100">
                {p.totalRequests.toLocaleString(locale)}
              </span>
              <div
                className="w-full bg-brand transition-colors group-hover:bg-brand-800"
                style={{ height: `${Math.max(4, Math.round((p.totalRequests / maxReq) * 100))}%` }}
                title={`${p.date}: ${p.totalRequests.toLocaleString(locale)}`}
              />
            </div>
          ))}
        </div>
        <div className="mt-2.5 flex gap-[clamp(0.375rem,1vw,0.75rem)]">
          {trend.map((p) => (
            <span key={p.date} className="flex-1 text-center text-[11px] text-slate-500" title={p.date}>
              {weekdayOf(p.date, lang)}
            </span>
          ))}
        </div>
      </section>

      {/* 03 Consultants + 04 Plans */}
      <div className="mt-[clamp(3rem,6vw,4.5rem)] grid gap-x-[clamp(2rem,5vw,3.25rem)] gap-y-14 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <section>
          <SectionHead index="03" title={c.consultants} />
          {consultantRows.length === 0 ? (
            <EmptyRow>{c.noConsultants}</EmptyRow>
          ) : (
            <ul>
              {consultantRows.slice(0, 4).map(({ user, active, done, rating }) => (
                <li key={user.id} className="flex items-center justify-between gap-6 border-b border-border py-4">
                  <div className="min-w-0">
                    <Link to={`/admin/users/${user.id}`} className="text-[15px] font-medium text-ink hover:text-brand">
                      {user.name}
                    </Link>
                    <p className="mt-0.5 text-[13px] text-slate-600">{c.consultantLine(active, done)}</p>
                  </div>
                  <span className={`shrink-0 text-[15px] tabular-nums ${rating ? 'text-brand' : 'text-[13px] text-slate-500'}`}>
                    {rating ? `${rating.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} / 5` : c.noRating}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/admin/users?role=CAREER_CONSULTANT" className={`${textLink} mt-5 text-ink`}>
            {c.manageConsultants}
          </Link>
        </section>

        <section>
          <SectionHead index="04" title={c.plans} />
          <ul>
            {revenueMetrics.activeSubscriptionsByPlan.map((plan) => (
              <li key={plan.planId} className="pt-4">
                <div className="flex items-baseline justify-between gap-4 text-sm">
                  <span className="text-ink">{c.planNames[plan.planId] ?? plan.planName}</span>
                  <span className="tabular-nums text-slate-600">
                    {plan.activeCount.toLocaleString(locale)} ({plan.percentage.toLocaleString(locale)}%)
                  </span>
                </div>
                <div className="mt-2.5">
                  <ThinBar value={plan.percentage} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-slate-600">
            {c.tokenUsed}: <span className="text-ink">{aiMetrics.totalTokens.toLocaleString(locale)}</span>
          </p>
          <Link to="/admin/subscriptions?tab=tokens" className={`${textLink} mt-2 text-ink`}>
            {c.planLink}
          </Link>
        </section>
      </div>

      {/* 05 Operations detail */}
      <section id="admin-operations" className="mt-[clamp(3.5rem,7vw,5.5rem)] scroll-mt-10">
        <SectionHead
          index="05"
          title={c.operations}
          meta={c.updated(dashboardData.lastUpdated)}
        />
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 text-ink">
          <button type="button" onClick={() => refetch()} disabled={isFetching} className={textLink}>
            {isFetching ? c.actions.refreshing : c.actions.refresh}
          </button>
          <button
            type="button"
            onClick={() => purgeCacheMutation.mutate()}
            disabled={purgeCacheMutation.isPending}
            className={textLink}
          >
            {c.actions.purge}
          </button>
          <button type="button" onClick={handleExportReport} className={textLink}>
            {c.actions.export}
          </button>
          <button
            type="button"
            onClick={() => setShowMaintenanceModal(true)}
            className={`${textLink} ${isMaintenance ? 'text-orange-600' : ''}`}
          >
            {isMaintenance ? c.actions.maintenanceOff : c.actions.maintenance}
          </button>
        </div>

        <UnderlineTabs
          className="mt-6"
          tabs={(['system', 'ai', 'revenue', 'users'] as const).map((t) => ({ value: t, label: c.tabs[t] }))}
          value={activeTab}
          onChange={setActiveTab}
          label={c.operations}
        />

        {/* System */}
        {activeTab === 'system' && (
          <div className="mt-8 space-y-12">
            <dl>
              <InfoRow label={c.system.status} tone={isMaintenance ? 'warning' : 'brand'}>
                {isMaintenance ? c.system.maintenance : c.system.operational}
                <span className="ml-2 text-[13px] text-slate-500">
                  {c.system.uptime(systemHealth.uptimePercentage, systemHealth.uptimeDays)}
                </span>
              </InfoRow>
            </dl>

            <div>
              <h3 className="border-b border-ink pb-2 text-[15px] font-medium">{c.system.services}</h3>
              <ul>
                {systemHealth.microservices.map((svc) => (
                  <li key={svc.key} className="grid gap-1 border-b border-border py-3.5 sm:grid-cols-[minmax(0,1fr)_6rem_6rem] sm:items-baseline sm:gap-6">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-[15px] text-ink">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${svc.status === 'HEALTHY' ? 'bg-brand' : 'bg-orange-500'}`} aria-hidden />
                        {svc.name}
                      </p>
                      <p className="mt-0.5 pl-3.5 text-[13px] text-slate-500">{svc.details}</p>
                    </div>
                    <span className="pl-3.5 text-[13px] tabular-nums text-slate-600 sm:pl-0 sm:text-right">{svc.latencyMs} ms</span>
                    <span className="pl-3.5 text-[13px] tabular-nums text-slate-600 sm:pl-0 sm:text-right">{svc.uptimePercent}%</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="border-b border-ink pb-2 text-[15px] font-medium">{c.system.resources}</h3>
              <div className="grid gap-x-10 sm:grid-cols-2">
                {[
                  { label: `${c.system.cpu} (${systemHealth.resources.cpuCores} cores)`, value: `${systemHealth.resources.cpuUsagePercent}%`, pct: systemHealth.resources.cpuUsagePercent },
                  { label: c.system.ram, value: `${systemHealth.resources.memoryUsedGB} / ${systemHealth.resources.memoryTotalGB} GB`, pct: systemHealth.resources.memoryUsagePercent },
                  { label: c.system.disk, value: `${systemHealth.resources.diskUsedGB} / ${systemHealth.resources.diskTotalGB} GB`, pct: systemHealth.resources.diskUsagePercent },
                  {
                    label: c.system.db,
                    value: `${systemHealth.resources.dbPoolActive} / ${systemHealth.resources.dbPoolMax}`,
                    pct: Math.round((systemHealth.resources.dbPoolActive / systemHealth.resources.dbPoolMax) * 100),
                  },
                ].map((r) => (
                  <div key={r.label} className="border-b border-border py-4">
                    <div className="flex items-baseline justify-between gap-4 text-sm">
                      <span className="text-ink">{r.label}</span>
                      <span className="tabular-nums text-slate-600">{r.value}</span>
                    </div>
                    <div className="mt-2.5">
                      <ThinBar value={r.pct} tone={r.pct > 85 ? 'warning' : 'brand'} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="border-b border-ink pb-2 text-[15px] font-medium">{c.system.queues}</h3>
              <ul>
                {systemHealth.backgroundQueues.map((q) => (
                  <li key={q.queueName} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border py-3.5">
                    <span className="flex items-center gap-2 text-[15px] text-ink">
                      <span className={`h-1.5 w-1.5 rounded-full ${q.status === 'active' ? 'bg-brand' : q.status === 'congested' ? 'bg-orange-500' : 'bg-slate-400'}`} aria-hidden />
                      {q.queueName}
                    </span>
                    <span className="text-[13px] tabular-nums text-slate-600">
                      {c.system.waiting} {q.pendingJobs} · {c.system.processed} {q.processedToday.toLocaleString(locale)} · {c.system.failed} {q.failedToday}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="flex items-baseline justify-between border-b border-ink pb-2 text-[15px] font-medium">
                {c.system.audit}
                <span className="text-[13px] font-normal text-slate-500">{systemHealth.auditLogs.length}</span>
              </h3>
              <ul>
                {systemHealth.auditLogs.map((log) => (
                  <li key={log.id} className="grid gap-1 border-b border-border py-4 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-6">
                    <span className="text-[13px] tabular-nums text-slate-500">{log.timestamp}</span>
                    <div className="min-w-0">
                      <p className="text-[15px] text-ink">
                        {log.action}
                        {(log.severity === 'WARN' || log.severity === 'CRITICAL') && (
                          <span className="ml-2 text-[13px] text-orange-600">{log.severity}</span>
                        )}
                      </p>
                      <p className="mt-0.5 text-[13px] text-slate-600">{log.details}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {c.system.by} {log.actorName} ({log.actorEmail}) · IP {log.ipAddress}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* AI */}
        {activeTab === 'ai' && (
          <div className="mt-8 space-y-12">
            <StatRow
              items={[
                { label: c.ai.requests, value: aiMetrics.totalRequests.toLocaleString(locale), detail: c.ai.latency(aiMetrics.avgLatencyMs) },
                { label: c.ai.tokens, value: compactNumber(aiMetrics.totalTokens, lang) },
                { label: c.ai.cost, value: `$${aiMetrics.totalCostUSD}`, detail: `≈ ${aiMetrics.totalCostVND.toLocaleString(locale)}đ` },
                { label: c.ai.saved, value: `$${aiMetrics.costSavedUSD}`, detail: c.ai.hit(aiMetrics.cacheHitRatioPercent), detailTone: 'brand' },
              ]}
            />
            <div>
              <h3 className="border-b border-ink pb-2 text-[15px] font-medium">{c.ai.models}</h3>
              <ul>
                {aiMetrics.modelBreakdown.map((m) => (
                  <li key={m.modelName} className="border-b border-border py-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                      <span className="text-[15px] text-ink">{m.modelName}</span>
                      <span className="text-[13px] tabular-nums text-slate-600">
                        {(m.totalTokens / 1_000_000).toLocaleString(locale, { maximumFractionDigits: 2 })}M token · {m.requestCount.toLocaleString(locale)} {c.ai.reqUnit} · {m.avgLatencyMs} ms · ${m.estimatedCostUSD}
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-center gap-4">
                      <div className="flex-1">
                        <ThinBar value={m.sharePercentage} />
                      </div>
                      <span className="w-10 text-right text-[13px] tabular-nums text-ink">{m.sharePercentage}%</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="border-b border-ink pb-2 text-[15px] font-medium">{c.ai.features}</h3>
              <ul>
                {aiMetrics.featureBreakdown.map((f) => (
                  <li key={f.featureKey} className="border-b border-border py-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                      <span className="text-[15px] text-ink">{f.featureName}</span>
                      <span className="text-[13px] tabular-nums text-slate-600">
                        {f.requestCount.toLocaleString(locale)} {c.ai.reqUnit} · {(f.tokenCount / 1_000_000).toLocaleString(locale, { maximumFractionDigits: 2 })}M token
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-center gap-4">
                      <div className="flex-1">
                        <ThinBar value={f.percentage} />
                      </div>
                      <span className="w-10 text-right text-[13px] tabular-nums text-ink">{f.percentage}%</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="border-b border-ink pb-2 text-[15px] font-medium">{c.ai.days}</h3>
              <ul>
                {trend.map((p) => (
                  <li key={p.date} className="flex items-baseline justify-between gap-6 border-b border-border py-3 text-sm">
                    <span className="text-ink">
                      {weekdayOf(p.date, lang)} <span className="text-slate-500">{p.date}</span>
                    </span>
                    <span className="tabular-nums text-slate-600">
                      {(p.totalTokens / 1_000_000).toLocaleString(locale, { maximumFractionDigits: 2 })}M token · {p.totalRequests.toLocaleString(locale)} {c.ai.reqUnit} · ${p.estimatedCostUSD}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Revenue */}
        {activeTab === 'revenue' && (
          <div className="mt-8 space-y-12">
            <StatRow
              items={[
                {
                  label: c.revenue.mrr,
                  value: formatMillions(revenueMetrics.mrrVND, lang),
                  detail: `+${revenueMetrics.growthPercentMoM}%`,
                  detailTone: 'brand',
                },
                { label: c.revenue.arr, value: formatMillions(revenueMetrics.arrVND, lang) },
                { label: c.revenue.arpu, value: `${revenueMetrics.arpuVND.toLocaleString(locale)}đ` },
                {
                  label: c.revenue.conversion,
                  value: `${revenueMetrics.conversionRatePercent}%`,
                  detail: c.revenue.conversionDetail(revenueMetrics.paidSubscribersCount, userMetrics.totalUsers),
                },
              ]}
            />
            <div className="grid gap-x-12 gap-y-12 lg:grid-cols-2">
              <div>
                <h3 className="border-b border-ink pb-2 text-[15px] font-medium">{c.revenue.monthly}</h3>
                {(() => {
                  const maxRev = Math.max(1, ...revenueMetrics.monthlyRevenueTrend.map((m) => m.revenueVND));
                  return (
                    <ul>
                      {revenueMetrics.monthlyRevenueTrend.map((m) => (
                        <li key={m.month} className="border-b border-border py-3.5">
                          <div className="flex items-baseline justify-between gap-4 text-sm">
                            <span className="text-ink">{m.month}</span>
                            <span className="tabular-nums text-slate-600">
                              {m.transactionsCount} {c.revenue.tx} · <span className="text-ink">{m.revenueVND.toLocaleString(locale)}đ</span>
                            </span>
                          </div>
                          <div className="mt-2.5">
                            <ThinBar value={(m.revenueVND / maxRev) * 100} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  );
                })()}
              </div>
              <div>
                <h3 className="border-b border-ink pb-2 text-[15px] font-medium">{c.revenue.gateways}</h3>
                <ul>
                  {revenueMetrics.paymentMethodDistribution.map((gw) => (
                    <li key={gw.method} className="border-b border-border py-3.5">
                      <div className="flex items-baseline justify-between gap-4 text-sm">
                        <span className="text-ink">{gw.label}</span>
                        <span className="tabular-nums text-slate-600">
                          {gw.amountVND.toLocaleString(locale)}đ ({gw.percentage}%)
                        </span>
                      </div>
                      <div className="mt-2.5">
                        <ThinBar value={gw.percentage} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div>
              <h3 className="border-b border-ink pb-2 text-[15px] font-medium">{c.revenue.recent}</h3>
              <ul>
                {revenueMetrics.recentTransactions.map((tx) => (
                  <li
                    key={tx.id}
                    className="grid gap-x-6 gap-y-1 border-b border-border py-4 sm:grid-cols-[minmax(0,1fr)_8rem_7.5rem_7rem_4.5rem] sm:items-center"
                  >
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium text-ink">{tx.planName}</p>
                      <p className="mt-0.5 text-[13px] text-slate-600">
                        {tx.orderCode} · {tx.candidateName} · {tx.createdAt}
                      </p>
                    </div>
                    <span className="text-sm text-slate-700">{tx.paymentMethod}</span>
                    <span className="text-[15px] tabular-nums text-ink sm:text-right">{tx.amountVND.toLocaleString(locale)}đ</span>
                    <span className={`text-sm ${txTone(tx.status)}`}>{c.revenue.status[tx.status]}</span>
                    <span className="sm:text-right">
                      <button type="button" onClick={() => setSelectedTx(tx)} className={brandLink}>
                        {c.revenue.receipt}
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Users */}
        {activeTab === 'users' && (
          <div className="mt-8 space-y-10">
            <StatRow
              items={[
                { label: c.users.candidates, value: userMetrics.candidateCount.toLocaleString(locale) },
                { label: c.users.consultants, value: userMetrics.consultantCount.toLocaleString(locale) },
                {
                  label: c.users.stickiness,
                  value: `${userMetrics.stickinessRatio}%`,
                  detail: `DAU ${userMetrics.dau} · MAU ${userMetrics.mau}`,
                },
                {
                  label: c.users.verified,
                  value: `${userMetrics.verifiedPercent}%`,
                  detail: c.users.churn(userMetrics.churnRatePercent),
                },
              ]}
            />
            <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_14rem]">
              <label className="relative block">
                <span className="sr-only">{c.users.search}</span>
                <Search size={15} className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder={c.users.search}
                  className={`${underlineInput} pl-6`}
                />
              </label>
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value as UserRole | 'ALL')}
                className={underlineSelect}
                aria-label={c.users.allRoles}
              >
                <option value="ALL">{c.users.allRoles}</option>
                <option value="CANDIDATE">{c.roles.CANDIDATE}</option>
                <option value="CAREER_CONSULTANT">{c.roles.CAREER_CONSULTANT}</option>
                <option value="ADMIN">{c.roles.ADMIN}</option>
              </select>
            </div>
            {filteredUsers.length === 0 ? (
              <EmptyRow>{c.users.empty}</EmptyRow>
            ) : (
              <ul className="border-t border-ink">
                {filteredUsers.map((u) => (
                  <li
                    key={u.id}
                    className="grid gap-x-6 gap-y-1 border-b border-border py-4 md:grid-cols-[minmax(0,1fr)_7rem_8rem_7rem_8.5rem] md:items-center"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium text-ink">{u.name}</p>
                      <p className="truncate text-[13px] text-slate-600">
                        {u.email} · {u.isVerified ? c.users.verifiedYes : c.users.verifiedNo} · {u.lastActiveAt}
                      </p>
                    </div>
                    <span className="text-sm text-ink">{c.roles[u.role]}</span>
                    <span className="text-sm text-slate-600">
                      {u.planName}
                      <span className="block text-xs text-slate-500">
                        {u.tokensUsed.toLocaleString(locale)} {c.users.tokens}
                      </span>
                    </span>
                    <span className={`text-sm ${u.status === 'ACTIVE' ? 'text-brand' : 'text-danger'}`}>{c.userStatus[u.status]}</span>
                    <span className="flex items-center gap-5 md:justify-end">
                      <button type="button" onClick={() => setSelectedUser(u)} className={brandLink}>
                        {c.users.view}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          userStatusMutation.mutate({
                            userId: u.id,
                            status: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
                          })
                        }
                        className={u.status === 'ACTIVE' ? `${textLink} text-danger` : brandLink}
                      >
                        {u.status === 'ACTIVE' ? c.users.lock : c.users.unlock}
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* Receipt modal */}
      {selectedTx && (
        <Modal
          title={c.receipt.title}
          eyebrow={selectedTx.orderCode}
          onClose={() => setSelectedTx(null)}
          width="max-w-lg"
          footer={
            <button type="button" onClick={() => setSelectedTx(null)} className={primaryButton}>
              {c.receipt.close}
            </button>
          }
        >
          <dl>
            <InfoRow label={c.receipt.customer}>{selectedTx.candidateName}</InfoRow>
            <InfoRow label={c.receipt.email}>{selectedTx.candidateEmail}</InfoRow>
            <InfoRow label={c.receipt.plan}>{selectedTx.planName}</InfoRow>
            <InfoRow label={c.receipt.method}>{selectedTx.paymentMethod}</InfoRow>
            <InfoRow label={c.receipt.status}>
              <span className={txTone(selectedTx.status)}>{c.revenue.status[selectedTx.status]}</span>
            </InfoRow>
            <InfoRow label={c.receipt.time}>{selectedTx.createdAt}</InfoRow>
          </dl>
          <div className="mt-6 flex items-baseline justify-between border-t border-ink pt-4">
            <span className="text-sm text-slate-600">{c.receipt.amount}</span>
            <span className="text-[clamp(1.5rem,2.5vw,2rem)] tabular-nums text-brand">
              {selectedTx.amountVND.toLocaleString(locale)}đ
            </span>
          </div>
        </Modal>
      )}

      {/* Quick user modal */}
      {selectedUser && (
        <Modal
          title={selectedUser.name}
          eyebrow={c.quick.title}
          onClose={() => setSelectedUser(null)}
          width="max-w-lg"
          footer={
            <>
              <button
                type="button"
                onClick={() =>
                  userStatusMutation.mutate({
                    userId: selectedUser.id,
                    status: selectedUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
                  })
                }
                className={selectedUser.status === 'ACTIVE' ? `${textLink} text-danger` : brandLink}
              >
                {selectedUser.status === 'ACTIVE' ? c.quick.lock : c.quick.unlock}
              </button>
              <Link to={`/admin/users/${selectedUser.id}`} className={`${textLink} text-ink`}>
                {c.quick.detail}
              </Link>
              <button type="button" onClick={() => setSelectedUser(null)} className={primaryButton}>
                {c.quick.close}
              </button>
            </>
          }
        >
          <p className="text-sm text-slate-600">
            {selectedUser.email} · {c.roles[selectedUser.role]}
          </p>
          <dl className="mt-4">
            <InfoRow label={c.quick.plan}>{selectedUser.planName}</InfoRow>
            <InfoRow label={c.quick.tokens}>{selectedUser.tokensUsed.toLocaleString(locale)}</InfoRow>
            <InfoRow label={c.quick.created}>{selectedUser.createdAt}</InfoRow>
            <InfoRow label={c.quick.status} tone={selectedUser.status === 'ACTIVE' ? 'brand' : 'danger'}>
              {c.userStatus[selectedUser.status]}
            </InfoRow>
          </dl>
        </Modal>
      )}

      {/* Maintenance modal */}
      {showMaintenanceModal && (
        <Modal
          title={c.maintenanceModal.title}
          onClose={() => setShowMaintenanceModal(false)}
          width="max-w-lg"
          footer={
            <>
              <button type="button" onClick={() => setShowMaintenanceModal(false)} className={outlineButton}>
                {c.maintenanceModal.cancel}
              </button>
              <button
                type="button"
                onClick={() => maintenanceMutation.mutate(!isMaintenance)}
                disabled={maintenanceMutation.isPending}
                className={isMaintenance ? primaryButton : dangerButton}
              >
                {isMaintenance ? c.maintenanceModal.disable : c.maintenanceModal.enable}
              </button>
            </>
          }
        >
          <p className="text-[15px] leading-7 text-slate-700">
            {isMaintenance ? c.maintenanceModal.disableText : c.maintenanceModal.enableText}
          </p>
        </Modal>
      )}
    </div>
  );
}

function txTone(status: string) {
  if (status === 'success') return 'text-brand';
  if (status === 'pending') return 'text-orange-600';
  return 'text-slate-500';
}

// ─── Consultation requests view (sidebar item 04) ───────────────────────────

function ConsultationsView({
  c,
  lang,
  consultations,
  consultants,
  onAssigned,
  onBack,
}: {
  c: Copy;
  lang: Lang;
  consultations: ConsultationRequest[];
  consultants: { id: string; name: string }[];
  onAssigned: () => void;
  onBack: () => void;
}) {
  const [status, setStatus] = useState<ConsultationStatus | 'ALL'>('ALL');
  const [assignError, setAssignError] = useState('');
  const assignMutation = useMutation({
    mutationFn: ({ id, consultantId }: { id: string; consultantId: string }) => assignConsultant(id, consultantId),
    onSuccess: () => {
      setAssignError('');
      onAssigned();
    },
    onError: (err: Error) => setAssignError(err.message),
  });
  const [query, setQuery] = useState('');
  const locale = lang === 'vi' ? 'vi-VN' : 'en-US';

  const count = (s: ConsultationStatus) => consultations.filter((r) => r.status === s).length;
  const q = query.trim().toLowerCase();
  const rows = consultations
    .filter((r) => status === 'ALL' || r.status === status)
    .filter(
      (r) =>
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.candidate.name.toLowerCase().includes(q) ||
        r.topicLabel.toLowerCase().includes(q) ||
        r.consultantName.toLowerCase().includes(q)
    )
    .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  };

  const statusTone = (s: ConsultationStatus) =>
    s === 'PENDING' ? 'text-orange-600' : s === 'COMPLETED' ? 'text-ink' : s === 'CANCELLED' ? 'text-slate-500' : 'text-brand';

  return (
    <div>
      <div className="mb-[clamp(1.25rem,2.5vw,2rem)] flex flex-wrap items-center justify-between gap-4">
        <p className="text-[13px] text-brand">{c.consult.eyebrow}</p>
        <button type="button" onClick={onBack} className={`${textLink} text-slate-600`}>
          ← {c.consult.back}
        </button>
      </div>
      <h1 className="text-[clamp(2.25rem,4.6vw,4rem)] font-normal leading-[1.08] tracking-[-0.03em] text-ink">
        {c.consult.title}
        <span className="block text-brand">{c.consult.line2(count('PENDING'))}</span>
      </h1>
      <p className="mt-[clamp(1rem,2vw,1.5rem)] max-w-[40rem] text-[clamp(1rem,1.25vw,1.0625rem)] leading-8 text-slate-600">
        {c.consult.intro}
      </p>

      <div className="mt-[clamp(2rem,4vw,3rem)]">
        <StatRow
          items={[
            { label: c.consult.total, value: consultations.length },
            { label: c.consult.pending, value: count('PENDING'), valueTone: count('PENDING') > 0 ? 'warning' : 'ink' },
            { label: c.consult.active, value: count('SCHEDULED') + count('IN_PROGRESS'), valueTone: 'brand' },
            { label: c.consult.done, value: count('COMPLETED') },
          ]}
        />
      </div>

      <UnderlineTabs
        className="mt-12"
        tabs={[
          { value: 'ALL' as const, label: c.consult.all, count: consultations.length },
          ...(['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const).map((s) => ({
            value: s,
            label: c.consult.status[s],
            count: count(s),
          })),
        ]}
        value={status}
        onChange={setStatus}
      />

      <label className="relative mt-6 block max-w-md">
        <span className="sr-only">{c.consult.search}</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={c.consult.search}
          className={underlineInput}
        />
      </label>

      <div className="mt-8 hidden border-y border-b-border border-t-ink py-3 text-[13px] text-slate-500 md:grid md:grid-cols-[minmax(0,1fr)_9rem_9rem_8rem] md:gap-6">
        <span>{c.consult.cols.request}</span>
        <span>{c.consult.cols.consultant}</span>
        <span>{c.consult.cols.meeting}</span>
        <span>{c.consult.cols.status}</span>
      </div>
      {assignError && <p role="alert" className="mt-4 text-[15px] text-danger">{assignError}</p>}
      {rows.length === 0 ? (
        <EmptyRow>{c.consult.empty}</EmptyRow>
      ) : (
        <ul className="border-t border-ink md:border-t-0">
          {rows.map((r) => (
            <li
              key={r.id}
              className="grid gap-x-6 gap-y-1 border-b border-border py-4 md:grid-cols-[minmax(0,1fr)_9rem_9rem_8rem] md:items-center"
            >
              <div className="min-w-0">
                <p className="text-[15px] font-medium text-ink">
                  {r.candidate.name} · {r.topicLabel}
                </p>
                <p className="mt-0.5 text-[13px] text-slate-600">
                  {r.id} · {c.consult.requested} {fmt(r.requestedAt)}
                  {r.priority !== 'NORMAL' && (
                    <span className={r.priority === 'URGENT' ? 'text-danger' : 'text-orange-600'}>
                      {' '}
                      · {c.consult.priority[r.priority]}
                    </span>
                  )}
                </p>
              </div>
              {r.status === 'COMPLETED' ? (
                <span className="text-sm text-ink">{r.consultantName || '—'}</span>
              ) : (
                <label className="block">
                  <span className="sr-only">{lang === 'vi' ? 'Phân công cố vấn' : 'Assign consultant'}</span>
                  <select
                    value={r.consultantId}
                    disabled={assignMutation.isPending}
                    onChange={(e) => e.target.value && assignMutation.mutate({ id: r.id, consultantId: e.target.value })}
                    className={underlineSelect}
                  >
                    <option value="">{lang === 'vi' ? 'Chọn cố vấn…' : 'Pick a consultant…'}</option>
                    {consultants.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <span className="text-sm tabular-nums text-slate-600">{fmt(r.meeting.scheduledAt)}</span>
              <span className={`text-sm ${statusTone(r.status)}`}>{c.consult.status[r.status]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
