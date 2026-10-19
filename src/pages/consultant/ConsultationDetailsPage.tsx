import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Clock,
  Video,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  FileText,
  Compass,
  DollarSign,
  Route,
  User,
  Phone,
  Mail,
  MapPin,
  Send,
  Plus,
  Trash2,
  Save,
  Star,
  Sparkles,
  MessageSquare,
  Lock,
  X,
} from 'lucide-react';
import { Card, Badge, Button, Loading, ErrorState } from '../../components/ui';
import {
  getConsultationRequestById,
  updateConsultationStatus,
  saveConsultantPrivateNotes,
  saveConsultantFeedback,
  sendConsultationMessage,
} from '../../services/consultationService';
import type {
  ConsultationStatus,
  ConsultationTopic,
  ActionChecklistItem,
  RecommendedResource,
} from '../../types/consultation';
import { useTranslation } from '../../i18n';

export default function ConsultationDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, isVietnamese } = useTranslation();
  const queryClient = useQueryClient();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);

  // Consultant private notes form state
  const [privateNotes, setPrivateNotes] = useState<string>('');
  const [notesInitialized, setNotesInitialized] = useState(false);
  const [rubric, setRubric] = useState({
    cvQuality: 8,
    technicalDepth: 8,
    communication: 8,
    marketReadiness: 8,
  });

  // Feedback form state
  const [feedbackSummary, setFeedbackSummary] = useState('');
  const [strengths, setStrengths] = useState<string[]>([]);
  const [newStrength, setNewStrength] = useState('');
  const [improvements, setImprovements] = useState<string[]>([]);
  const [newImprovement, setNewImprovement] = useState('');
  const [checklist, setChecklist] = useState<ActionChecklistItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [feedbackInitialized, setFeedbackInitialized] = useState(false);

  // Discussion message input
  const [messageContent, setMessageContent] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const {
    data: request,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['consultation-detail', id],
    queryFn: () => getConsultationRequestById(id || ''),
    enabled: !!id,
  });

  // Sync state once request is loaded
  if (request && !notesInitialized) {
    setPrivateNotes(request.consultantPrivateNotes || '');
    if (request.evaluationRubric) {
      setRubric(request.evaluationRubric);
    }
    setNotesInitialized(true);
  }

  if (request && !feedbackInitialized) {
    if (request.feedback) {
      setFeedbackSummary(request.feedback.summary || '');
      setStrengths(request.feedback.strengths || []);
      setImprovements(request.feedback.improvements || []);
      setChecklist(request.feedback.actionChecklist || []);
    } else {
      // Defaults based on topic
      setFeedbackSummary(
        isVietnamese
          ? `Ứng viên ${request.candidate.name} có nền tảng tốt cho vị trí ${request.candidate.targetRole}. Đã hướng dẫn chi tiết các điểm cần hoàn thiện để nâng cao năng lực cạnh tranh.`
          : `Candidate ${request.candidate.name} demonstrates a solid background for ${request.candidate.targetRole}. Provided detailed strategic recommendations.`
      );
      setStrengths([
        isVietnamese ? 'Nền tảng kỹ thuật và kiến trúc tốt' : 'Solid technical & architectural foundation',
        isVietnamese ? 'Thái độ cầu tiến, chủ động chuẩn bị câu hỏi' : 'Proactive mindset & well-prepared questions',
      ]);
      setImprovements([
        isVietnamese ? 'Bổ sung số liệu định lượng (STAR formula)' : 'Quantify achievements using STAR formula',
        isVietnamese ? 'Tối ưu từ khóa kỹ thuật theo chuẩn ATS' : 'Optimize technical keywords for ATS algorithms',
      ]);
      setChecklist([
        {
          id: 'ac-def-1',
          task: isVietnamese ? 'Viết lại 3 dự án trọng điểm theo cấu trúc STAR' : 'Rewrite 3 key projects using STAR method',
          completed: false,
        },
        {
          id: 'ac-def-2',
          task: isVietnamese ? 'Cập nhật lại phần tóm tắt (Executive Summary) định vị rõ Senior' : 'Update executive summary positioning for Senior role',
          completed: false,
        },
      ]);
    }
    setFeedbackInitialized(true);
  }

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: ({ status, note }: { status: ConsultationStatus; note?: string }) =>
      updateConsultationStatus(id!, status, note),
    onSuccess: (updated) => {
      queryClient.setQueryData(['consultation-detail', id], updated);
      queryClient.invalidateQueries({ queryKey: ['consultation-requests'] });
      queryClient.invalidateQueries({ queryKey: ['consultant-stats'] });
      showToast(isVietnamese ? `Cập nhật trạng thái sang ${updated.status} thành công!` : `Status updated to ${updated.status}!`);
    },
  });

  // Save notes mutation
  const notesMutation = useMutation({
    mutationFn: () => saveConsultantPrivateNotes(id!, privateNotes, rubric),
    onSuccess: (updated) => {
      queryClient.setQueryData(['consultation-detail', id], updated);
      showToast(t('consultation.notesSavedSuccess'));
    },
  });

  // Save feedback mutation
  const feedbackMutation = useMutation({
    mutationFn: () => {
      const defaultResources: RecommendedResource[] = [
        {
          title: isVietnamese ? 'Cẩm nang Chuẩn hóa CV ATS cho Kỹ sư Công nghệ' : 'ATS Resume Blueprint for Tech Engineers',
          type: 'Article',
          url: 'https://careerpilot.demo/resources/ats-guide',
          provider: 'CareerPilot Editorial',
        },
        {
          title: isVietnamese ? 'Framework Phỏng vấn System Design Chuyên sâu' : 'System Design Technical Interview Mastery',
          type: 'Course',
          url: 'https://careerpilot.demo/resources/system-design',
          provider: 'Engineering Academy',
        },
      ];

      return saveConsultantFeedback(id!, {
        summary: feedbackSummary,
        overallRating: 9,
        strengths,
        improvements,
        actionChecklist: checklist,
        recommendedResources: request?.feedback?.recommendedResources || defaultResources,
      });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['consultation-detail', id], updated);
      queryClient.invalidateQueries({ queryKey: ['consultation-requests'] });
      queryClient.invalidateQueries({ queryKey: ['consultant-stats'] });
      showToast(t('consultation.feedbackSavedSuccess'));
    },
  });

  // Send message mutation
  const messageMutation = useMutation({
    mutationFn: (content: string) => sendConsultationMessage(id!, content, 'CAREER_CONSULTANT'),
    onSuccess: () => {
      setMessageContent('');
      queryClient.invalidateQueries({ queryKey: ['consultation-detail', id] });
    },
  });

  const handleCopyLink = () => {
    if (request?.meeting.meetingUrl) {
      navigator.clipboard.writeText(request.meeting.meetingUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleAddStrength = () => {
    if (newStrength.trim()) {
      setStrengths([...strengths, newStrength.trim()]);
      setNewStrength('');
    }
  };

  const handleRemoveStrength = (index: number) => {
    setStrengths(strengths.filter((_, i) => i !== index));
  };

  const handleAddImprovement = () => {
    if (newImprovement.trim()) {
      setImprovements([...improvements, newImprovement.trim()]);
      setNewImprovement('');
    }
  };

  const handleRemoveImprovement = (index: number) => {
    setImprovements(improvements.filter((_, i) => i !== index));
  };

  const handleAddChecklist = () => {
    if (newChecklistItem.trim()) {
      setChecklist([
        ...checklist,
        {
          id: `ac-${Date.now()}`,
          task: newChecklistItem.trim(),
          completed: false,
        },
      ]);
      setNewChecklistItem('');
    }
  };

  const handleToggleChecklist = (itemIndex: number) => {
    setChecklist(
      checklist.map((item, i) => (i === itemIndex ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleRemoveChecklist = (itemIndex: number) => {
    setChecklist(checklist.filter((_, i) => i !== itemIndex));
  };

  if (isLoading) return <Loading />;
  if (isError || !request) {
    return (
      <div className="py-12 text-center">
        <ErrorState />
        <div className="mt-4">
          <Button variant="secondary" onClick={() => navigate('/consultant/consultations')}>
            {t('consultation.backToList')}
          </Button>
        </div>
      </div>
    );
  }

  const getTopicIcon = (topic: ConsultationTopic) => {
    switch (topic) {
      case 'CV_REVIEW':
        return <FileText size={18} className="text-blue-600" />;
      case 'CAREER_ORIENTATION':
        return <Compass size={18} className="text-amber-600" />;
      case 'MOCK_INTERVIEW':
        return <Video size={18} className="text-emerald-600" />;
      case 'SALARY_NEGOTIATION':
        return <DollarSign size={18} className="text-purple-600" />;
      case 'SKILL_ROADMAP':
        return <Route size={18} className="text-pink-600" />;
      default:
        return <FileText size={18} className="text-blue-600" />;
    }
  };

  const getStatusBadge = (status: ConsultationStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge tone="amber">{t('consultation.pending')}</Badge>;
      case 'SCHEDULED':
        return <Badge tone="blue">{t('consultation.scheduled')}</Badge>;
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {t('consultation.inProgress')}
          </span>
        );
      case 'COMPLETED':
        return <Badge tone="green">{t('consultation.completed')}</Badge>;
      case 'CANCELLED':
        return <Badge tone="gray">{t('consultation.cancelled')}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl animate-fade-in border border-slate-700">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/consultant/consultations"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft size={14} />
          <span>{t('consultation.backToList')}</span>
        </Link>

        <span className="text-xs text-slate-400 font-mono">
          ID: {request.id} · {new Date(request.requestedAt).toLocaleDateString('vi-VN')}
        </span>
      </div>

      {/* Top Banner & Status Workflow Actions */}
      <Card className="border-slate-200/90 shadow-sm bg-gradient-to-r from-white via-white to-blue-50/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <img
              src={request.candidate.avatar}
              alt={request.candidate.name}
              className="h-16 w-16 shrink-0 rounded-2xl object-cover border border-slate-200 shadow-xs"
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{request.candidate.name}</h1>
                {getStatusBadge(request.status)}
                {request.priority === 'URGENT' && (
                  <span className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700 border border-red-200">
                    {t('consultation.urgent')}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600">
                <span className="font-semibold text-slate-800">{request.candidate.currentTitle}</span>
                {' → '}
                <span className="font-bold text-blue-700">{request.candidate.targetRole}</span>
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{request.topicLabel}</span>
                <span>•</span>
                <span>
                  {new Date(request.meeting.scheduledAt).toLocaleString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Workflow Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-end lg:self-center border-t lg:border-t-0 pt-3 lg:pt-0 w-full lg:w-auto justify-end">
            {request.status === 'PENDING' && (
              <button
                onClick={() =>
                  statusMutation.mutate({
                    status: 'SCHEDULED',
                    note: 'Chuyên gia đã duyệt lịch tư vấn.',
                  })
                }
                disabled={statusMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer disabled:opacity-50"
              >
                <Check size={14} />
                <span>{t('consultation.acceptRequest')}</span>
              </button>
            )}

            {request.status === 'SCHEDULED' && (
              <button
                onClick={() =>
                  statusMutation.mutate({
                    status: 'IN_PROGRESS',
                    note: 'Bắt đầu phòng tư vấn trực tuyến.',
                  })
                }
                disabled={statusMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50"
              >
                <Video size={14} />
                <span>{t('consultation.startConsultation')}</span>
              </button>
            )}

            {(request.status === 'SCHEDULED' || request.status === 'IN_PROGRESS') && (
              <a
                href={request.meeting.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition cursor-pointer"
              >
                <Video size={14} />
                <span>{t('consultation.joinRoomNow')}</span>
                <ExternalLink size={12} />
              </a>
            )}

            {request.status === 'IN_PROGRESS' && (
              <button
                onClick={() =>
                  statusMutation.mutate({
                    status: 'COMPLETED',
                    note: 'Hoàn tất phiên tư vấn.',
                  })
                }
                disabled={statusMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 size={14} />
                <span>{t('consultation.finishConsultation')}</span>
              </button>
            )}

            {request.status !== 'CANCELLED' && request.status !== 'COMPLETED' && (
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      isVietnamese
                        ? 'Bạn có chắc chắn muốn hủy yêu cầu tư vấn này không?'
                        : 'Are you sure you want to cancel this consultation?'
                    )
                  ) {
                    statusMutation.mutate({
                      status: 'CANCELLED',
                      note: 'Chuyên gia đã hủy lịch tư vấn.',
                    });
                  }
                }}
                disabled={statusMutation.isPending}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
              >
                <X size={14} />
                <span>{t('consultation.cancelRequest')}</span>
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Main Two-Column Layout */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1.5fr]">
        {/* LEFT COLUMN: Candidate Profile, Request Info, Meeting Room & Timeline */}
        <div className="space-y-6">
          {/* Candidate Profile Details */}
          <Card>
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <User size={18} className="text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">
                  {t('consultation.candidateProfile')}
                </h2>
              </div>
              <Badge tone="blue">{request.candidate.experienceLevel}</Badge>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail size={14} className="text-slate-400" />
                  <span className="truncate">{request.candidate.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone size={14} className="text-slate-400" />
                  <span>{request.candidate.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin size={14} className="text-slate-400" />
                  <span>{request.candidate.location}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock size={14} className="text-slate-400" />
                  <span>{request.candidate.yearsOfExperience} năm kinh nghiệm</span>
                </div>
              </div>

              {/* Skills Tags */}
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  {t('consultation.topSkills')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {request.candidate.topSkills.map((sk) => (
                    <span
                      key={sk}
                      className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bio */}
              {request.candidate.bio && (
                <div className="rounded-xl bg-slate-50 p-3 text-slate-600 italic border border-slate-100">
                  "{request.candidate.bio}"
                </div>
              )}

              {/* Attached CV Preview Box */}
              {request.candidate.attachedResumeName && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-white">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-xs truncate">
                        {request.candidate.attachedResumeName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-bold text-emerald-700 text-[11px] bg-emerald-100/70 px-1.5 py-0.2 rounded">
                          ATS {request.candidate.attachedResumeScore}/100
                        </span>
                        <span className="text-[11px] text-slate-400">PDF Document</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    className="px-3 py-1.5 text-xs shrink-0"
                    onClick={() => setShowResumeModal(true)}
                  >
                    {t('consultation.viewResume')}
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Consultation Request Content */}
          <Card>
            <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
              {getTopicIcon(request.topic)}
              <h2 className="text-base font-bold text-slate-900">
                {t('consultation.requestInfo')}
              </h2>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                  {t('consultation.targetGoal')}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {request.targetGoal}
                </p>
              </div>

              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                  {t('consultation.candidateNotes')}
                </p>
                <p className="mt-1 text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                  {request.candidateNotes}
                </p>
              </div>

              {request.candidateQuestions.length > 0 && (
                <div>
                  <p className="font-bold text-slate-500 uppercase tracking-wider text-[11px] mb-1.5">
                    {t('consultation.candidateQuestions')}
                  </p>
                  <ul className="space-y-2">
                    {request.candidateQuestions.map((q, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 rounded-xl bg-blue-50/40 p-2.5 text-slate-800 border border-blue-100/60"
                      >
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-200 text-blue-800 font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="leading-snug">{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {request.currentObstacles && (
                <div>
                  <p className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                    {t('consultation.currentObstacles')}
                  </p>
                  <p className="mt-1 text-red-800 bg-red-50/60 p-2.5 rounded-xl border border-red-100">
                    {request.currentObstacles}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Online Meeting Room Details */}
          <Card className="border-blue-100 bg-gradient-to-br from-white via-white to-blue-50/30">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Video size={18} className="text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">
                  {t('consultation.meetingInfo')}
                </h2>
              </div>
              <Badge tone="blue">{request.meeting.platform}</Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">
                    {t('consultation.scheduledTime')}
                  </span>
                  <span className="font-bold text-slate-800 text-xs">
                    {new Date(request.meeting.scheduledAt).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">
                    {t('consultation.durationMinutes')}
                  </span>
                  <span className="font-bold text-slate-800 text-xs">
                    {request.meeting.durationMinutes} phút
                  </span>
                </div>
              </div>

              {/* Meeting Link with Copy */}
              <div className="rounded-xl border border-slate-200 bg-white p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Link phòng họp trực tuyến
                  </span>
                  <span className="font-mono text-xs text-blue-600 truncate block">
                    {request.meeting.meetingUrl}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  >
                    {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span>{copiedLink ? t('consultation.copied') : t('consultation.copyLink')}</span>
                  </button>
                  <a
                    href={request.meeting.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition cursor-pointer shadow-xs"
                  >
                    <Video size={14} />
                    <span>{t('consultation.joinRoomNow')}</span>
                  </a>
                </div>
              </div>
            </div>
          </Card>

          {/* Timeline of Lifecycle */}
          <Card>
            <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Clock size={18} className="text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">
                {t('consultation.timelineTitle')}
              </h2>
            </div>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 text-xs">
              {request.timeline.map((event) => (
                <div key={event.id} className="relative">
                  <span className="absolute -left-6 top-1 grid h-5 w-5 place-items-center rounded-full bg-blue-600 text-white ring-4 ring-white">
                    <Check size={11} />
                  </span>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{event.title}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(event.timestamp).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="mt-0.5 text-slate-600">{event.description}</p>
                    <span className="text-[10px] text-slate-400">Thực hiện bởi: {event.actor}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Interactive Consultant Workspace */}
        <div className="space-y-6">
          {/* Section 1: Consultant Private Notes & Evaluation */}
          <Card className="border-amber-200/80 bg-gradient-to-br from-amber-50/20 via-white to-white">
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Lock size={18} className="text-amber-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {t('consultation.privateNotesTitle')}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {t('consultation.privateNotesSubtitle')}
                  </p>
                </div>
              </div>
              <Badge tone="amber">Private</Badge>
            </div>

            <div className="space-y-3">
              {/* Rubric Evaluation Sliders */}
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {t('consultation.rubricEvaluationTitle')}
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-600 font-medium">Chất lượng CV:</span>
                      <span className="font-bold text-blue-700">{rubric.cvQuality}/10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={rubric.cvQuality}
                      onChange={(e) => setRubric({ ...rubric, cvQuality: Number(e.target.value) })}
                      className="w-full cursor-pointer accent-blue-600"
                    />
                  </div>

                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-600 font-medium">Chiều sâu kỹ thuật:</span>
                      <span className="font-bold text-blue-700">{rubric.technicalDepth}/10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={rubric.technicalDepth}
                      onChange={(e) => setRubric({ ...rubric, technicalDepth: Number(e.target.value) })}
                      className="w-full cursor-pointer accent-blue-600"
                    />
                  </div>

                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-600 font-medium">Kỹ năng giao tiếp:</span>
                      <span className="font-bold text-blue-700">{rubric.communication}/10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={rubric.communication}
                      onChange={(e) => setRubric({ ...rubric, communication: Number(e.target.value) })}
                      className="w-full cursor-pointer accent-blue-600"
                    />
                  </div>

                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-600 font-medium">Độ sẵn sàng thị trường:</span>
                      <span className="font-bold text-blue-700">{rubric.marketReadiness}/10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={rubric.marketReadiness}
                      onChange={(e) => setRubric({ ...rubric, marketReadiness: Number(e.target.value) })}
                      className="w-full cursor-pointer accent-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Private Notes Textarea */}
              <div>
                <textarea
                  rows={4}
                  value={privateNotes}
                  onChange={(e) => setPrivateNotes(e.target.value)}
                  placeholder={t('consultation.privateNotesPlaceholder')}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 outline-none focus:border-amber-500 transition leading-relaxed"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  onClick={() => notesMutation.mutate()}
                  disabled={notesMutation.isPending}
                  className="gap-1.5 text-xs py-2 px-3.5"
                >
                  <Save size={14} />
                  <span>{t('consultation.saveNotesButton')}</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* Section 2: Official Consultant Feedback & Action Plan Form */}
          <Card className="border-blue-200 shadow-xs">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-blue-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {t('consultation.feedbackTitle')}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {t('consultation.feedbackSubtitle')}
                  </p>
                </div>
              </div>
              <Badge tone="green">Deliverable</Badge>
            </div>

            <div className="space-y-4 text-xs">
              {/* Summary Evaluation */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {t('consultation.summaryEvaluation')}
                </label>
                <textarea
                  rows={3}
                  value={feedbackSummary}
                  onChange={(e) => setFeedbackSummary(e.target.value)}
                  placeholder={t('consultation.summaryPlaceholder')}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 transition leading-relaxed"
                />
              </div>

              {/* Strengths List */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {t('consultation.strengthsTitle')}
                </label>
                <div className="space-y-1.5 mb-2">
                  {strengths.map((str, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg bg-emerald-50 px-2.5 py-1.5 text-emerald-900 border border-emerald-100"
                    >
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                        <span>{str}</span>
                      </span>
                      <button
                        onClick={() => handleRemoveStrength(idx)}
                        className="text-emerald-600 hover:text-red-600 cursor-pointer p-0.5"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newStrength}
                    onChange={(e) => setNewStrength(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddStrength();
                      }
                    }}
                    placeholder="Thêm điểm mạnh..."
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-blue-500"
                  />
                  <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={handleAddStrength}>
                    <Plus size={13} />
                  </Button>
                </div>
              </div>

              {/* Improvements List */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {t('consultation.improvementsTitle')}
                </label>
                <div className="space-y-1.5 mb-2">
                  {improvements.map((imp, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg bg-amber-50 px-2.5 py-1.5 text-amber-900 border border-amber-100"
                    >
                      <span className="flex items-center gap-1.5">
                        <AlertCircle size={13} className="text-amber-600 shrink-0" />
                        <span>{imp}</span>
                      </span>
                      <button
                        onClick={() => handleRemoveImprovement(idx)}
                        className="text-amber-600 hover:text-red-600 cursor-pointer p-0.5"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newImprovement}
                    onChange={(e) => setNewImprovement(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddImprovement();
                      }
                    }}
                    placeholder="Thêm điểm cần cải thiện..."
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-blue-500"
                  />
                  <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={handleAddImprovement}>
                    <Plus size={13} />
                  </Button>
                </div>
              </div>

              {/* Action Checklist for Candidate */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700 block">
                    {t('consultation.actionChecklistTitle')}
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {checklist.filter((c) => c.completed).length}/{checklist.length} hoàn thành
                  </span>
                </div>
                <div className="space-y-1.5 mb-2">
                  {checklist.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5"
                    >
                      <label className="flex items-center gap-2 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => handleToggleChecklist(idx)}
                          className="rounded text-blue-600"
                        />
                        <span
                          className={`text-xs ${
                            item.completed ? 'line-through text-slate-400' : 'text-slate-800'
                          }`}
                        >
                          {item.task}
                        </span>
                      </label>
                      <button
                        onClick={() => handleRemoveChecklist(idx)}
                        className="text-slate-400 hover:text-red-600 cursor-pointer p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddChecklist();
                      }
                    }}
                    placeholder={t('consultation.addTaskPlaceholder')}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                  />
                  <Button variant="secondary" className="px-3 py-2 text-xs" onClick={handleAddChecklist}>
                    <Plus size={14} />
                    <span>{t('consultation.addTaskButton')}</span>
                  </Button>
                </div>
              </div>

              {/* Submit Feedback Action */}
              <div className="border-t border-slate-100 pt-3 flex justify-end">
                <Button
                  variant="primary"
                  onClick={() => feedbackMutation.mutate()}
                  disabled={feedbackMutation.isPending}
                  className="gap-2 text-xs py-2.5 px-4"
                >
                  <CheckCircle2 size={15} />
                  <span>{t('consultation.saveFeedbackButton')}</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* Section 3: Live Discussion / Message Thread */}
          <Card>
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">
                  {t('consultation.discussionTitle')}
                </h2>
              </div>
              <span className="text-xs text-slate-400">{request.messages.length} tin nhắn</span>
            </div>

            <div className="space-y-3">
              {/* Messages Container */}
              <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1">
                {request.messages.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400 italic">
                    Chưa có tin nhắn trao đổi. Hãy gửi lời chào mở đầu tới ứng viên!
                  </p>
                ) : (
                  request.messages.map((msg) => {
                    const isConsultant = msg.senderRole === 'CAREER_CONSULTANT';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isConsultant ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5">
                          <span className="font-semibold text-slate-700">{msg.senderName}</span>
                          <span>•</span>
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div
                          className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                            isConsultant
                              ? 'bg-blue-600 text-white rounded-tr-xs'
                              : 'bg-slate-100 text-slate-800 rounded-tl-xs'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input Box */}
              <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
                <input
                  type="text"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && messageContent.trim()) {
                      e.preventDefault();
                      messageMutation.mutate(messageContent);
                    }
                  }}
                  placeholder={t('consultation.typeMessagePlaceholder')}
                  className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-blue-500"
                />
                <Button
                  variant="primary"
                  className="px-3.5 py-2 text-xs gap-1.5"
                  onClick={() => {
                    if (messageContent.trim()) messageMutation.mutate(messageContent);
                  }}
                  disabled={!messageContent.trim() || messageMutation.isPending}
                >
                  <Send size={13} />
                  <span>{t('consultation.sendMessageButton')}</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* Section 4: Candidate Testimonial / Review (if completed and reviewed) */}
          {request.ratingByCandidate && (
            <Card className="border-amber-200 bg-amber-50/40">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <Star size={16} className="text-amber-500 fill-amber-500" />
                  <span>{t('consultation.candidateReviewTitle')}</span>
                </h3>
                <span className="text-amber-600 font-bold text-sm">
                  {'★'.repeat(request.ratingByCandidate.stars)}
                </span>
              </div>
              <p className="text-xs text-slate-700 italic">
                "{request.ratingByCandidate.comment}"
              </p>
              <span className="text-[10px] text-slate-400 mt-2 block font-mono">
                {new Date(request.ratingByCandidate.createdAt).toLocaleDateString('vi-VN')}
              </span>
            </Card>
          )}
        </div>
      </div>

      {/* Resume Preview Modal */}
      {showResumeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  {request.candidate.attachedResumeName || t('consultation.viewModalResumeTitle')}
                </h3>
              </div>
              <button
                onClick={() => setShowResumeModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Resume Summary Details */}
            <div className="space-y-4 text-xs text-slate-700">
              <div className="flex items-center justify-between rounded-xl bg-blue-50 p-3">
                <div>
                  <p className="font-bold text-slate-800 text-sm">{request.candidate.name}</p>
                  <p className="text-slate-600">{request.candidate.currentTitle}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md">
                    ATS Score: {request.candidate.attachedResumeScore}/100
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">
                  1. Mục Tiêu Nghề Nghiệp (Professional Summary)
                </h4>
                <p className="rounded-lg bg-slate-50 p-2.5 leading-relaxed">
                  {request.candidate.bio ||
                    'Kỹ sư phần mềm tận tụy với hơn 4 năm kinh nghiệm phát triển các hệ thống web quy mô lớn, hướng đến vị trí Senior / Tech Lead.'}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">
                  2. Kỹ Năng Chuyên Môn (Core Competencies)
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {request.candidate.topSkills.map((s) => (
                    <span
                      key={s}
                      className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">
                  3. Góp Ý Chuyên Môn Nhanh từ Hệ thống AI ATS
                </h4>
                <div className="space-y-1.5 rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-[11px]">
                  <p className="font-semibold text-blue-900 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-blue-600" />
                    Định dạng cột đơn (Single-column) đạt chuẩn ATS, phông chữ chuẩn hóa.
                  </p>
                  <p className="font-semibold text-amber-900 flex items-center gap-1.5">
                    <AlertCircle size={13} className="text-amber-600" />
                    Cần bổ sung thêm các số liệu % tăng tốc (Impact Metrics) trong phần kinh nghiệm làm việc.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button variant="primary" onClick={() => setShowResumeModal(false)}>
                Đóng xem trước
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
