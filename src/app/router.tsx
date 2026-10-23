import { Navigate, createBrowserRouter, Outlet, useParams } from 'react-router-dom';
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
import CreateResumePage from '../pages/candidate/CreateResumePage';
import UploadResumePage from '../pages/candidate/UploadResumePage';
import ResumeDetailsPage from '../pages/candidate/ResumeDetailsPage';
import EditResumePage from '../pages/candidate/EditResumePage';
import AiResumeBuilderPage from '../pages/candidate/AiResumeBuilderPage';
import ResumeAnalysisPage from '../pages/candidate/ResumeAnalysisPage';
import JobsPage from '../pages/candidate/JobsPage';
import JobDetailsPage from '../pages/candidate/JobDetailsPage';
import CvJobFitPage from '../pages/candidate/CvJobFitPage';
import AssistantPage from '../pages/candidate/AssistantPage';
import ApplicationAssistancePage from '../pages/candidate/ApplicationAssistancePage';
import SubscriptionPage from '../pages/candidate/SubscriptionPage';
import UsagePage from '../pages/candidate/UsagePage';
import SupportPage from '../pages/candidate/SupportPage';
import SkillAssessmentPage from '../pages/candidate/SkillAssessmentPage';
import ConsultationsPage from '../pages/candidate/ConsultationsPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import UserManagementPage from '../pages/admin/UserManagementPage';
import UserDetailsPage from '../pages/admin/UserDetailsPage';
import SubscriptionQuotaManagementPage from '../pages/admin/SubscriptionQuotaManagementPage';
import PaymentInvoiceManagementPage from '../pages/admin/PaymentInvoiceManagementPage';
import ConsultantDashboardPage from '../pages/consultant/ConsultantDashboardPage';
import ConsultationListPage from '../pages/consultant/ConsultationListPage';
import ConsultationDetailsPage from '../pages/consultant/ConsultationDetailsPage';
import ConsultantCandidatesPage from '../pages/consultant/ConsultantCandidatesPage';
import CandidateCareerAnalysisPage from '../pages/consultant/CandidateCareerAnalysisPage';
import PlaceholderPage from '../pages/shared/PlaceholderPage';
import { NotFoundPage, UnauthorizedPage } from '../pages/errors/ErrorPages';
/** Old job match links now open the CV fit page for the same job. */
function JobMatchRedirect() {
  const { jobId } = useParams();
  return <Navigate to={`/candidate/cv-job-fit${jobId ? `?jobId=${jobId}` : ''}`} replace />;
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
              { path: 'resumes/create', element: <CreateResumePage /> },
              { path: 'resumes/upload', element: <UploadResumePage /> },
              { path: 'resumes/ai-builder', element: <AiResumeBuilderPage /> },
              { path: 'resumes/analysis', element: <ResumeAnalysisPage /> },
              { path: 'resumes/:resumeId', element: <ResumeDetailsPage /> },
              { path: 'resumes/:resumeId/edit', element: <EditResumePage /> },
              { path: 'resumes/:resumeId/analysis', element: <ResumeAnalysisPage /> },
              { path: 'jobs', element: <JobsPage /> },
              { path: 'jobs/:jobId', element: <JobDetailsPage /> },
              // "Khớp nối AI" was merged into the CV fit page.
              { path: 'jobs/:jobId/match', element: <JobMatchRedirect /> },
              { path: 'jobs/:jobId/fit-analysis', element: <CvJobFitPage /> },
              { path: 'cv-job-fit', element: <CvJobFitPage /> },
              { path: 'resumes/:resumeId/job-fit', element: <CvJobFitPage /> },
              { path: 'salary-estimation', element: <Navigate to="/candidate/assessment" replace /> },
              { path: 'career-intelligence', element: <Navigate to="/candidate/assessment" replace /> },
              { path: 'assistant', element: <AssistantPage /> },
              { path: 'applications', element: <ApplicationAssistancePage /> },
              { path: 'application-assistance', element: <ApplicationAssistancePage /> },
              { path: 'cover-letter', element: <ApplicationAssistancePage /> },
              { path: 'subscription', element: <SubscriptionPage /> },
              { path: 'payment', element: <SubscriptionPage /> },
              { path: 'usage', element: <UsagePage /> },
              { path: 'support', element: <SupportPage /> },
              { path: 'assessment', element: <SkillAssessmentPage /> },
              // Skill gap and learning roadmap now live inside the skill assessment flow.
              { path: 'skill-gap', element: <Navigate to="/candidate/assessment" replace /> },
              { path: 'learning', element: <Navigate to="/candidate/assessment" replace /> },
              { path: 'learning/roadmap', element: <Navigate to="/candidate/assessment" replace /> },
              ...placeholders([
                'assessment/:assessmentId',
                'assessment/:assessmentId/result',
              ]),
              { path: 'consultations', element: <ConsultationsPage /> },
              { path: 'consultations/new', element: <ConsultationsPage /> },
              { path: 'consultations/:consultationId', element: <ConsultationsPage /> },
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
              ...placeholders([
                'ai',
                'ai/prompts',
                'ai/embeddings',
                'jobs',
                'vector',
                'logs',
                'audit',
                'notifications',
                'feedback',
                'support',
                'analytics',
              ]),
            ],
          },
        ],
      },
    ],
  },
  { path: '/unauthorized', element: <UnauthorizedPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
