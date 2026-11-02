import { Navigate, createBrowserRouter, Outlet, useParams, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import type { UserRole } from '../types/domain';
import PublicLayout from '../layouts/PublicLayout';
import CandidateLayout from '../layouts/CandidateLayout';
import ConsultantLayout from '../layouts/ConsultantLayout';
import AdminLayout from '../layouts/AdminLayout';
import HomePage from '../pages/public/HomePage';
import GuestTrialPage from '../pages/public/GuestTrialPage';
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  VerifyOtpPage,
  ResetPasswordPage,
} from '../pages/public/AuthPages';
import DashboardPage from '../pages/candidate/DashboardPage';
import ProfilePage from '../pages/candidate/ProfilePage';
import ResumesPage from '../pages/candidate/ResumesPage';
import ResumeTemplatePickerPage from '../pages/candidate/ResumeTemplatePickerPage';
import ResumeBuilderPage from '../pages/candidate/ResumeBuilderPage';
import UploadResumePage from '../pages/candidate/UploadResumePage';
import ResumeDetailsPage from '../pages/candidate/ResumeDetailsPage';
import ResumeAnalysisPage from '../pages/candidate/ResumeAnalysisPage';
import JobsPage from '../pages/candidate/JobsPage';
import JobDetailsPage from '../pages/candidate/JobDetailsPage';
import SkillAssessmentPage from '../pages/candidate/SkillAssessmentPage';
import LearningPathPage from '../pages/candidate/LearningPathPage';
import CvJobFitPage from '../pages/candidate/CvJobFitPage';
import AssistantPage from '../pages/candidate/AssistantPage';
import ApplicationAssistancePage from '../pages/candidate/ApplicationAssistancePage';
import SubscriptionPage from '../pages/candidate/SubscriptionPage';
import UsagePage from '../pages/candidate/UsagePage';
import SupportPage from '../pages/candidate/SupportPage';
import ConsultationsPage from '../pages/candidate/ConsultationsPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import UserManagementPage from '../pages/admin/UserManagementPage';
import UserDetailsPage from '../pages/admin/UserDetailsPage';
import SubscriptionQuotaManagementPage from '../pages/admin/SubscriptionQuotaManagementPage';
import PaymentInvoiceManagementPage from '../pages/admin/PaymentInvoiceManagementPage';
import ResumeTemplateManagementPage from '../pages/admin/ResumeTemplateManagementPage';
import JobCrawlManagementPage from '../pages/admin/JobCrawlManagementPage';
import ConsultantDashboardPage from '../pages/consultant/ConsultantDashboardPage';
import ConsultationListPage from '../pages/consultant/ConsultationListPage';
import ConsultationDetailsPage from '../pages/consultant/ConsultationDetailsPage';
import ConsultantCandidatesPage from '../pages/consultant/ConsultantCandidatesPage';
import CandidateCareerAnalysisPage from '../pages/consultant/CandidateCareerAnalysisPage';
import PlaceholderPage from '../pages/shared/PlaceholderPage';
import AccountPage from '../pages/shared/AccountPage';
import NotificationsPage from '../pages/shared/NotificationsPage';
import AiConfigPage from '../pages/admin/AiConfigPage';
import KnowledgeBasePage from '../pages/admin/KnowledgeBasePage';
import AnnouncementsPage from '../pages/admin/AnnouncementsPage';
import AdminSupportPage from '../pages/admin/AdminSupportPage';
import SystemLogsPage from '../pages/admin/SystemLogsPage';
import { NotFoundPage, UnauthorizedPage } from '../pages/errors/ErrorPages';
/** Old job match links now open the CV fit page for the same job. */
function JobMatchRedirect() {
  const { jobId } = useParams();
  return <Navigate to={`/candidate/cv-job-fit${jobId ? `?jobId=${jobId}` : ''}`} replace />;
}

/** Old skill test / learning path / assessment links open the skill assessment page; keep ?jobId=. */
function SkillAssessmentRedirect() {
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('jobId');
  return <Navigate to={`/candidate/skill-assessment${jobId ? `?jobId=${encodeURIComponent(jobId)}` : ''}`} replace />;
}

export function ProtectedRoute() { const authenticated = useAuthStore(s => s.isAuthenticated); return authenticated ? <Outlet /> : <Navigate to="/login" replace />; }
export function RoleRoute({ role }: { role: UserRole }) { const current = useAuthStore(s => s.role); return current === role ? <Outlet /> : <Navigate to="/unauthorized" replace />; }
const placeholders = (paths: string[]) => paths.map(path => ({ path, element: <PlaceholderPage /> }));
export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/guest-trial', element: <GuestTrialPage /> },
      { path: '/trial', element: <Navigate to="/guest-trial" replace /> },
      { path: '/jobs', element: <JobsPage /> },
      { path: '/jobs/:jobId', element: <JobDetailsPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/verify-otp', element: <VerifyOtpPage /> },
      { path: '/verify-email', element: <VerifyOtpPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <RoleRoute role="CANDIDATE" />,
        children: [
          {
            path: '/candidate',
            element: <CandidateLayout />,
            children: [
              { index: true, element: <DashboardPage /> },
              { path: 'profile', element: <ProfilePage /> },
              { path: 'profile/edit', element: <ProfilePage isEditMode={true} /> },
              { path: 'resumes', element: <ResumesPage /> },
              // CV is built by hand: pick a template, then fill the form with a live preview.
              { path: 'resumes/create', element: <ResumeTemplatePickerPage /> },
              { path: 'resumes/create/:templateId', element: <ResumeBuilderPage /> },
              { path: 'resumes/upload', element: <UploadResumePage /> },
              // The AI CV builder was dropped; old links open the template picker.
              { path: 'resumes/ai-builder', element: <Navigate to="/candidate/resumes/create" replace /> },
              { path: 'resumes/analysis', element: <ResumeAnalysisPage /> },
              { path: 'resumes/:resumeId', element: <ResumeDetailsPage /> },
              { path: 'resumes/:resumeId/edit', element: <ResumeBuilderPage /> },
              { path: 'resumes/:resumeId/analysis', element: <ResumeAnalysisPage /> },
              { path: 'jobs', element: <JobsPage /> },
              { path: 'jobs/:jobId', element: <JobDetailsPage /> },
              // "Khớp nối AI" was merged into the CV fit page.
              { path: 'jobs/:jobId/match', element: <JobMatchRedirect /> },
              { path: 'jobs/:jobId/fit-analysis', element: <CvJobFitPage /> },
              { path: 'cv-job-fit', element: <CvJobFitPage /> },
              { path: 'resumes/:resumeId/job-fit', element: <CvJobFitPage /> },
              { path: 'salary-estimation', element: <SkillAssessmentRedirect /> },
              { path: 'career-intelligence', element: <SkillAssessmentRedirect /> },
              { path: 'assistant', element: <AssistantPage /> },
              { path: 'applications', element: <ApplicationAssistancePage /> },
              { path: 'application-assistance', element: <ApplicationAssistancePage /> },
              { path: 'cover-letter', element: <ApplicationAssistancePage /> },
              { path: 'subscription', element: <SubscriptionPage /> },
              { path: 'payment', element: <SubscriptionPage /> },
              { path: 'usage', element: <UsagePage /> },
              { path: 'support', element: <SupportPage /> },
              // Skill assessment by JD (no CV needed) with its learning path, on one page.
              { path: 'skill-assessment', element: <SkillAssessmentPage /> },
              { path: 'skill-test', element: <SkillAssessmentRedirect /> },
              // Learning path straight from a job's JD (no CV, no test); opened from Job discovery.
              { path: 'learning-path', element: <LearningPathPage /> },
              { path: 'assessment', element: <SkillAssessmentRedirect /> },
              { path: 'assessment/*', element: <SkillAssessmentRedirect /> },
              { path: 'skill-gap', element: <SkillAssessmentRedirect /> },
              { path: 'learning', element: <LearningPathPage /> },
              { path: 'learning/roadmap', element: <LearningPathPage /> },
              { path: 'consultations', element: <ConsultationsPage /> },
              { path: 'consultations/new', element: <ConsultationsPage /> },
              { path: 'consultations/:consultationId', element: <ConsultationsPage /> },
              { path: 'account', element: <AccountPage /> },
              { path: 'inbox', element: <NotificationsPage /> },
            ],
          },
        ],
      },
      {
        element: <RoleRoute role="CAREER_CONSULTANT" />,
        children: [
          {
            path: '/consultant',
            element: <ConsultantLayout />,
            children: [
              { index: true, element: <ConsultantDashboardPage /> },
              { path: 'consultations', element: <ConsultationListPage /> },
              { path: 'consultations/:id', element: <ConsultationDetailsPage /> },
              { path: 'candidates', element: <ConsultantCandidatesPage /> },
              { path: 'candidates/:candidateId', element: <CandidateCareerAnalysisPage /> },
              { path: 'account', element: <AccountPage /> },
              { path: 'inbox', element: <NotificationsPage /> },
            ],
          },
        ],
      },
      {
        element: <RoleRoute role="ADMIN" />,
        children: [
          {
            path: '/admin',
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminDashboardPage /> },
              { path: 'users', element: <UserManagementPage /> },
              { path: 'users/:id', element: <UserDetailsPage /> },
              { path: 'subscriptions', element: <SubscriptionQuotaManagementPage /> },
              { path: 'payments', element: <PaymentInvoiceManagementPage /> },
              { path: 'templates', element: <ResumeTemplateManagementPage /> },
              { path: 'resume-templates', element: <Navigate to="/admin/templates" replace /> },
              { path: 'jobs', element: <JobCrawlManagementPage /> },
              { path: 'ai', element: <AiConfigPage /> },
              { path: 'ai/prompts', element: <AiConfigPage /> },
              { path: 'vector', element: <KnowledgeBasePage /> },
              { path: 'logs', element: <SystemLogsPage /> },
              { path: 'audit', element: <SystemLogsPage /> },
              { path: 'notifications', element: <AnnouncementsPage /> },
              { path: 'support', element: <AdminSupportPage /> },
              { path: 'account', element: <AccountPage /> },
              { path: 'inbox', element: <NotificationsPage /> },
              // BE chưa có API cho các màn này (xem tài liệu API BE cần bổ sung).
              ...placeholders(['ai/embeddings', 'feedback', 'analytics']),
            ],
          },
        ],
      },
    ],
  },
  { path: '/unauthorized', element: <UnauthorizedPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
