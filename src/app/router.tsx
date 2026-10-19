import { Navigate, createBrowserRouter, Outlet } from 'react-router-dom';
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
import JobMatchPage from '../pages/candidate/JobMatchPage';
import CvJobFitPage from '../pages/candidate/CvJobFitPage';
import SalaryEstimationPage from '../pages/candidate/SalaryEstimationPage';
import AssistantPage from '../pages/candidate/AssistantPage';
import SkillAssessmentPage from '../pages/candidate/SkillAssessmentPage';
import SkillGapPage from '../pages/candidate/SkillGapPage';
import LearningRoadmapPage from '../pages/candidate/LearningRoadmapPage';
import { AdminDashboard } from '../pages/shared/RoleDashboards';
import ConsultantDashboardPage from '../pages/consultant/ConsultantDashboardPage';
import ConsultationListPage from '../pages/consultant/ConsultationListPage';
import ConsultationDetailsPage from '../pages/consultant/ConsultationDetailsPage';
import PlaceholderPage from '../pages/shared/PlaceholderPage';
import { NotFoundPage, UnauthorizedPage } from '../pages/errors/ErrorPages';
export function ProtectedRoute(){const authenticated=useAuthStore(s=>s.isAuthenticated);return authenticated?<Outlet/>:<Navigate to="/login" replace/>;}
export function RoleRoute({role}:{role:UserRole}){const current=useAuthStore(s=>s.role);return current===role?<Outlet/>:<Navigate to="/unauthorized" replace/>;}
const placeholders=(paths:string[])=>paths.map(path=>({path,element:<PlaceholderPage/>}));
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
              { path: 'jobs/:jobId/match', element: <JobMatchPage /> },
              { path: 'jobs/:jobId/fit-analysis', element: <CvJobFitPage /> },
              { path: 'cv-job-fit', element: <CvJobFitPage /> },
              { path: 'resumes/:resumeId/job-fit', element: <CvJobFitPage /> },
              { path: 'salary-estimation', element: <SalaryEstimationPage /> },
              { path: 'career-intelligence', element: <SalaryEstimationPage /> },
              { path: 'assistant', element: <AssistantPage /> },
              { path: 'assessment', element: <SkillAssessmentPage /> },
              { path: 'skill-gap', element: <SkillGapPage /> },
              { path: 'learning', element: <LearningRoadmapPage /> },
              { path: 'learning/roadmap', element: <LearningRoadmapPage /> },
              ...placeholders([
                'assessment/:assessmentId',
                'assessment/:assessmentId/result',
                'consultations',
                'consultations/new',
                'consultations/:consultationId',
                'subscription',
                'payment',
                'usage',
                'support',
              ]),
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
              ...placeholders([
                'candidates',
                'candidates/:candidateId',
              ]),
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
              { index: true, element: <AdminDashboard /> },
              ...placeholders([
                'users',
                'users/:id',
                'subscriptions',
                'payments',
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
