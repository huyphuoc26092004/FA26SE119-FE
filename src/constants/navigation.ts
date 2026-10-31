import {
  House,
  UserRound,
  File,
  BriefcaseBusiness,
  CircleDot,
  Mail,
  MessageSquare,
  CreditCard,
  Activity,
  LifeBuoy,
  Inbox,
  Users,
  Settings,
  Database,
  ScrollText,
  Bell,
  MessagesSquare,
  ChartColumn,
  Wallet,
  LayoutTemplate,
  GraduationCap,
} from 'lucide-react';
import type { ComponentType } from 'react';

export type NavGroup = 'main' | 'apply' | 'grow' | 'account' | 'management' | 'platform' | 'operations';

export interface NavItem {
  label: string;
  /** Vietnamese sidebar label (short form used in the sidebar mockups). */
  labelVi: string;
  translationKey: string;
  /** Path, optionally with a query string (e.g. /admin/users?role=CAREER_CONSULTANT). */
  to: string;
  icon: ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  group: NavGroup;
}

export const navGroupLabels: Record<NavGroup, { vi: string; en: string }> = {
  main: { vi: 'Chung', en: 'General' },
  apply: { vi: 'Ứng tuyển', en: 'Applying' },
  grow: { vi: 'Phát triển', en: 'Growth' },
  account: { vi: 'Tài khoản', en: 'Account' },
  management: { vi: 'Quản lý', en: 'Management' },
  platform: { vi: 'Nền tảng', en: 'Platform' },
  operations: { vi: 'Vận hành & báo cáo', en: 'Operations & reporting' },
};

export const candidateNav: NavItem[] = [
  { label: 'Dashboard', labelVi: 'Bảng điều khiển', translationKey: 'nav.dashboard', to: '/candidate', icon: House, group: 'main' },
  { label: 'Career profile', labelVi: 'Hồ sơ nghề nghiệp', translationKey: 'nav.careerProfile', to: '/candidate/profile', icon: UserRound, group: 'main' },
  { label: 'My CVs', labelVi: 'CV của tôi', translationKey: 'nav.myResumes', to: '/candidate/resumes', icon: File, group: 'main' },
  { label: 'Job discovery', labelVi: 'Khám phá việc làm', translationKey: 'nav.jobDiscovery', to: '/candidate/jobs', icon: BriefcaseBusiness, group: 'main' },
  { label: 'CV fit', labelVi: 'Độ phù hợp CV', translationKey: 'nav.cvJobFit', to: '/candidate/cv-job-fit', icon: CircleDot, group: 'apply' },
  { label: 'Application help', labelVi: 'Hỗ trợ ứng tuyển', translationKey: 'nav.applicationAssistance', to: '/candidate/applications', icon: Mail, group: 'apply' },
  { label: 'Skill assessment', labelVi: 'Đánh giá kỹ năng', translationKey: 'nav.skillAssessment', to: '/candidate/skill-assessment', icon: GraduationCap, group: 'grow' },
  { label: 'Career consultation', labelVi: 'Tư vấn nghề nghiệp', translationKey: 'nav.careerConsultation', to: '/candidate/consultations', icon: MessageSquare, group: 'grow' },
  { label: 'Plans & tokens', labelVi: 'Gói đăng ký & token', translationKey: 'nav.subscription', to: '/candidate/subscription', icon: CreditCard, group: 'account' },
  { label: 'AI usage', labelVi: 'Mức sử dụng AI', translationKey: 'nav.aiUsage', to: '/candidate/usage', icon: Activity, group: 'account' },
  { label: 'Support', labelVi: 'Hỗ trợ', translationKey: 'nav.support', to: '/candidate/support', icon: LifeBuoy, group: 'account' },
];

export const consultantNav: NavItem[] = [
  { label: 'Dashboard', labelVi: 'Bảng điều khiển', translationKey: 'nav.dashboard', to: '/consultant', icon: House, group: 'main' },
  { label: 'Consultation requests', labelVi: 'Yêu cầu tư vấn', translationKey: 'nav.consultationRequests', to: '/consultant/consultations', icon: Inbox, group: 'main' },
  { label: 'Candidates', labelVi: 'Danh sách ứng viên', translationKey: 'nav.candidates', to: '/consultant/candidates', icon: Users, group: 'main' },
];

export const adminNav: NavItem[] = [
  { label: 'Dashboard', labelVi: 'Bảng điều khiển', translationKey: 'nav.dashboard', to: '/admin', icon: House, group: 'main' },
  { label: 'Users', labelVi: 'Người dùng', translationKey: 'nav.users', to: '/admin/users', icon: Users, group: 'management' },
  { label: 'Subscriptions', labelVi: 'Quản lý gói dịch vụ', translationKey: 'nav.subscriptions', to: '/admin/subscriptions', icon: CreditCard, group: 'management' },
  { label: 'Payments', labelVi: 'Lịch sử thanh toán', translationKey: 'nav.payments', to: '/admin/payments', icon: Wallet, group: 'management' },
  { label: 'CV Templates', labelVi: 'Quản lý mẫu CV', translationKey: 'nav.templates', to: '/admin/templates', icon: LayoutTemplate, group: 'management' },
  { label: 'AI configuration', labelVi: 'Cấu hình AI', translationKey: 'nav.aiConfig', to: '/admin/ai', icon: Settings, group: 'platform' },
  { label: 'Job collection', labelVi: 'Thu thập việc làm', translationKey: 'nav.jobProcessing', to: '/admin/jobs', icon: BriefcaseBusiness, group: 'platform' },
  { label: 'Vector database', labelVi: 'Cơ sở dữ liệu Vector', translationKey: 'nav.vectorDatabase', to: '/admin/vector', icon: Database, group: 'platform' },
  { label: 'System logs', labelVi: 'Nhật ký hệ thống', translationKey: 'nav.systemLogs', to: '/admin/logs', icon: ScrollText, group: 'operations' },
  { label: 'Audit logs', labelVi: 'Nhật ký kiểm toán', translationKey: 'nav.auditLogs', to: '/admin/audit', icon: ScrollText, group: 'operations' },
  { label: 'Notifications', labelVi: 'Thông báo', translationKey: 'nav.notifications', to: '/admin/notifications', icon: Bell, group: 'operations' },
  { label: 'Feedback', labelVi: 'Ý kiến phản hồi', translationKey: 'nav.feedback', to: '/admin/feedback', icon: MessagesSquare, group: 'operations' },
  { label: 'Support tickets', labelVi: 'Phiếu hỗ trợ', translationKey: 'nav.supportTickets', to: '/admin/support', icon: LifeBuoy, group: 'operations' },
  { label: 'Analytics', labelVi: 'Phân tích & thống kê', translationKey: 'nav.analytics', to: '/admin/analytics', icon: ChartColumn, group: 'operations' },
];
