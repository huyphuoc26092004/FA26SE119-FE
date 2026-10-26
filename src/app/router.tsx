import type { ReactElement } from 'react';
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
import { IS_APP } from '../utils/platform';
import MobileLogin from '../mobile/screens/MobileLogin';
import MobileConsultantHome from '../mobile/screens/MobileConsultantHome';
import MobileConsultantRequests from '../mobile/screens/MobileConsultantRequests';
import MobileConsultationDetail from '../mobile/screens/MobileConsultationDetail';
import MobileConsultantCandidates from '../mobile/screens/MobileConsultantCandidates';
import MobileCandidateAnalysis from '../mobile/screens/MobileCandidateAnalysis';
import MobileStaffAccount from '../mobile/screens/MobileStaffAccount';
import MobileAdminHome from '../mobile/screens/MobileAdminHome';
import MobileAdminUsers from '../mobile/screens/MobileAdminUsers';
import MobileAdminUserDetail from '../mobile/screens/MobileAdminUserDetail';
import MobileAdminPlans from '../mobile/screens/MobileAdminPlans';
import MobileAdminPayments from '../mobile/screens/MobileAdminPayments';
import { adminNav, consultantNav } from '../constants/navigation';
import MobileHome from '../mobile/screens/MobileHome';
import MobileJobs from '../mobile/screens/MobileJobs';
import MobileJobDetail from '../mobile/screens/MobileJobDetail';
import MobileResumes from '../mobile/screens/MobileResumes';
import MobileResumeDetail from '../mobile/screens/MobileResumeDetail';
import MobileConsultations from '../mobile/screens/MobileConsultations';
import MobileAccount from '../mobile/screens/MobileAccount';

/** Inside the mobile app (see utils/platform.ts) some routes render an app-only screen. */
const app = (web: ReactElement, mobile: ReactElement) => (IS_APP ? mobile : web);
// Pages that already have a tab in the app; the account screen lists the rest.
const CONSULTANT_TABS = ['/consultant', '/consultant/consultations', '/consultant/candidates'];
const ADMIN_TABS = ['/admin', '/admin/users', '/admin/subscriptions', '/admin/payments'];
/** Old job match links now open the CV fit page for the same job. */
function JobMatchRedirect() {
  const { jobId } = useParams();
  return <Navigate to={`/candidate/cv-job-fit${jobId ? `?jobId=${jobId}` : ''}`} replace />;
}

export function ProtectedRoute() {
  const authenticated = useAuthStore((s) => s.isAuthenticated);
  return authenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
export function RoleRoute({ role }: { role: UserRole }) {
  const current = useAuthStore((s) => s.role);
  return current === role ? <Outlet /> : <Navigate to="/unauthorized" replace />;
}
const placeholders = (paths: string[]) =>
  paths.map((path) => ({ path, element: <PlaceholderPage /> }));
export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/guest-trial', element: <GuestTrialPage /> },
      { path: '/trial', element: <Navigate to="/guest-trial" replace /> },
      { path: '/jobs', element: <JobsPage /> },
      { path: '/jobs/:jobId', element: <JobDetailsPage /> },
      { path: '/login', element: app(<LoginPage />, <MobileLogin />) },
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
              { index: true, element: app(<DashboardPage />, <MobileHome />) },
              {
                path: 'account',
                element: app(<Navigate to="/candidate/profile" replace />, <MobileAccount />),
              },
              { path: 'profile', element: <ProfilePage /> },
              { path: 'profile/edit', element: <ProfilePage isEditMode={true} /> },
              { path: 'resumes', element: app(<ResumesPage />, <MobileResumes />) },
              { path: 'resumes/create', element: <CreateResumePage /> },
              { path: 'resumes/upload', element: <UploadResumePage /> },
              { path: 'resumes/ai-builder', element: <AiResumeBuilderPage /> },
              { path: 'resumes/analysis', element: <ResumeAnalysisPage /> },
              {
                path: 'resumes/:resumeId',
                element: app(<ResumeDetailsPage />, <MobileResumeDetail />),
              },
              { path: 'resumes/:resumeId/edit', element: <EditResumePage /> },
              { path: 'resumes/:resumeId/analysis', element: <ResumeAnalysisPage /> },
              { path: 'jobs', element: app(<JobsPage />, <MobileJobs />) },
              { path: 'jobs/:jobId', element: app(<JobDetailsPage />, <MobileJobDetail />) },
              // "Khớp nối AI" was merged into the CV fit page.
              { path: 'jobs/:jobId/match', element: <JobMatchRedirect /> },
              { path: 'jobs/:jobId/fit-analysis', element: <CvJobFitPage /> },
              { path: 'cv-job-fit', element: <CvJobFitPage /> },
              { path: 'resumes/:resumeId/job-fit', element: <CvJobFitPage /> },
              {
                path: 'salary-estimation',
                element: <Navigate to="/candidate/assessment" replace />,
              },
              {
                path: 'career-intelligence',
                element: <Navigate to="/candidate/assessment" replace />,
              },
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
              {
                path: 'learning/roadmap',
                element: <Navigate to="/candidate/assessment" replace />,
              },
              ...placeholders(['assessment/:assessmentId', 'assessment/:assessmentId/result']),
              {
                path: 'consultations',
                element: app(<ConsultationsPage />, <MobileConsultations />),
              },
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
              { index: true, element: app(<ConsultantDashboardPage />, <MobileConsultantHome />) },
              {
                path: 'consultations',
                element: app(<ConsultationListPage />, <MobileConsultantRequests />),
              },
              {
                path: 'consultations/:id',
                element: app(<ConsultationDetailsPage />, <MobileConsultationDetail />),
              },
              {
                path: 'candidates',
                element: app(<ConsultantCandidatesPage />, <MobileConsultantCandidates />),
              },
              {
                path: 'candidates/:candidateId',
                element: app(<CandidateCareerAnalysisPage />, <MobileCandidateAnalysis />),
              },
              {
                path: 'account',
                element: app(
                  <Navigate to="/consultant" replace />,
                  <MobileStaffAccount
                    role="consultant"
                    nav={consultantNav}
                    tabs={CONSULTANT_TABS}
                  />,
                ),
              },
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
              { index: true, element: app(<AdminDashboardPage />, <MobileAdminHome />) },
              { path: 'users', element: app(<UserManagementPage />, <MobileAdminUsers />) },
              { path: 'users/:id', element: app(<UserDetailsPage />, <MobileAdminUserDetail />) },
              {
                path: 'subscriptions',
                element: app(<SubscriptionQuotaManagementPage />, <MobileAdminPlans />),
              },
              {
                path: 'payments',
                element: app(<PaymentInvoiceManagementPage />, <MobileAdminPayments />),
              },
              {
                path: 'account',
                element: app(
                  <Navigate to="/admin" replace />,
                  <MobileStaffAccount role="admin" nav={adminNav} tabs={ADMIN_TABS} />,
                ),
              },
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
