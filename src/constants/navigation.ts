import {
  LayoutDashboard,
  UserRound,
  FileText,
  BriefcaseBusiness,
  BrainCircuit,
  ClipboardCheck,
  Route,
  Bot,
  MessagesSquare,
  CreditCard,
  Activity,
  LifeBuoy,
  Users,
  Settings,
  Database,
  ScrollText,
  ChartColumn,
  Bell,
  Wallet,
  Target,
  Coins,
  GitBranch,
} from 'lucide-react';
import type { ComponentType } from 'react';

export interface NavItem {
  label: string;
  translationKey: string;
  to: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}

export const candidateNav: NavItem[] = [
  { label: 'Dashboard', translationKey: 'nav.dashboard', to: '/candidate', icon: LayoutDashboard },
  { label: 'Career Profile', translationKey: 'nav.careerProfile', to: '/candidate/profile', icon: UserRound },
  { label: 'My CVs', translationKey: 'nav.myResumes', to: '/candidate/resumes', icon: FileText },
  { label: 'Job Discovery', translationKey: 'nav.jobDiscovery', to: '/candidate/jobs', icon: BriefcaseBusiness },
  { label: 'CV–Job Fit', translationKey: 'nav.cvJobFit', to: '/candidate/cv-job-fit', icon: Target },
  { label: 'Salary Estimation', translationKey: 'nav.salaryEstimation', to: '/candidate/salary-estimation', icon: Coins },
  { label: 'Career Intelligence', translationKey: 'nav.careerIntelligence', to: '/candidate/career-intelligence', icon: BrainCircuit },
  { label: 'Skill Assessment', translationKey: 'nav.skillAssessment', to: '/candidate/assessment', icon: ClipboardCheck },
  { label: 'Skill Gap Analysis', translationKey: 'nav.skillGapAnalysis', to: '/candidate/skill-gap', icon: GitBranch },
  { label: 'Learning Roadmap', translationKey: 'nav.learningRoadmap', to: '/candidate/learning', icon: Route },
  { label: 'AI Career Assistant', translationKey: 'nav.aiCareerAssistant', to: '/candidate/assistant', icon: Bot },
  { label: 'Career Consultation', translationKey: 'nav.careerConsultation', to: '/candidate/consultations', icon: MessagesSquare },
  { label: 'Subscription', translationKey: 'nav.subscription', to: '/candidate/subscription', icon: CreditCard },
  { label: 'AI Usage', translationKey: 'nav.aiUsage', to: '/candidate/usage', icon: Activity },
  { label: 'Support', translationKey: 'nav.support', to: '/candidate/support', icon: LifeBuoy },
];

export const consultantNav: NavItem[] = [
  { label: 'Dashboard', translationKey: 'nav.dashboard', to: '/consultant', icon: LayoutDashboard },
  { label: 'Consultation Requests', translationKey: 'nav.consultationRequests', to: '/consultant/consultations', icon: MessagesSquare },
  { label: 'Candidates', translationKey: 'nav.candidates', to: '/consultant/candidates', icon: Users },
];

export const adminNav: NavItem[] = [
  { label: 'Dashboard', translationKey: 'nav.dashboard', to: '/admin', icon: LayoutDashboard },
  { label: 'Users', translationKey: 'nav.users', to: '/admin/users', icon: Users },
  { label: 'Subscriptions', translationKey: 'nav.subscriptions', to: '/admin/subscriptions', icon: CreditCard },
  { label: 'Payments', translationKey: 'nav.payments', to: '/admin/payments', icon: Wallet },
  { label: 'AI Configuration', translationKey: 'nav.aiConfig', to: '/admin/ai', icon: Settings },
  { label: 'Job Processing', translationKey: 'nav.jobProcessing', to: '/admin/jobs', icon: BriefcaseBusiness },
  { label: 'Vector Database', translationKey: 'nav.vectorDatabase', to: '/admin/vector', icon: Database },
  { label: 'System Logs', translationKey: 'nav.systemLogs', to: '/admin/logs', icon: ScrollText },
  { label: 'Audit Logs', translationKey: 'nav.auditLogs', to: '/admin/audit', icon: ScrollText },
  { label: 'Notifications', translationKey: 'nav.notifications', to: '/admin/notifications', icon: Bell },
  { label: 'Feedback', translationKey: 'nav.feedback', to: '/admin/feedback', icon: MessagesSquare },
  { label: 'Support Tickets', translationKey: 'nav.supportTickets', to: '/admin/support', icon: LifeBuoy },
  { label: 'Analytics', translationKey: 'nav.analytics', to: '/admin/analytics', icon: ChartColumn },
];
