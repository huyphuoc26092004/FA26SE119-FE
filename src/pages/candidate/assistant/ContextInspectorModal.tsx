import {
  X,
  User,
  FileText,
  Briefcase,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CandidateProfile, Job, Resume } from '../../../types/domain';
import { Badge, Button } from '../../../components/ui';
import { useTranslation } from '../../../i18n';

interface ContextInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: CandidateProfile;
  selectedCv?: Resume;
  selectedJob?: Job;
}

export function ContextInspectorModal({
  isOpen,
  onClose,
  profile,
  selectedCv,
  selectedJob,
}: ContextInspectorModalProps) {
  const { isVietnamese } = useTranslation();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <Sparkles size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isVietnamese ? 'Dữ liệu ngữ cảnh thời gian thực của AI' : 'Active AI Context Inspector'}
              </h3>
              <p className="text-xs text-slate-500">
                {isVietnamese
                  ? 'Toàn bộ thông tin được cung cấp cho mô hình AI để cá nhân hóa câu trả lời'
                  : 'Contextual snapshot provided to the LLM for hyper-personalized advisory'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-5 space-y-5">
          {/* Section 1: Candidate Profile */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <User size={18} className="text-blue-600" />
              <h4 className="text-sm font-bold text-slate-800">
                {isVietnamese ? '1. Hồ sơ ứng viên cơ bản' : '1. Candidate Profile Context'}
              </h4>
              <Badge tone="blue">
                {profile?.completion ? `${profile.completion}% Hoàn thiện` : 'Verified'}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">
                  {isVietnamese ? 'Họ và tên:' : 'Full Name:'}
                </span>
                <span className="font-semibold text-slate-800">{profile?.name || 'Alex Morgan'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">
                  {isVietnamese ? 'Vị trí mục tiêu:' : 'Target Position:'}
                </span>
                <span className="font-semibold text-slate-800">
                  {profile?.targetPosition || 'Senior Frontend Engineer'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">
                  {isVietnamese ? 'Cấp bậc & Kinh nghiệm:' : 'Seniority Level:'}
                </span>
                <span className="font-semibold text-slate-800">
                  {profile?.experienceLevel || 'Senior (4+ năm)'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">
                  {isVietnamese ? 'Mức lương kỳ vọng:' : 'Salary Expectation:'}
                </span>
                <span className="font-semibold text-emerald-700">
                  {profile?.expectedSalary || '$2,200 – $3,200 / month'}
                </span>
              </div>
            </div>

            {profile?.skills && profile.skills.length > 0 && (
              <div className="mt-3 border-t border-slate-200/60 pt-2.5">
                <span className="text-xs text-slate-500 block mb-1.5">
                  {isVietnamese ? 'Kỹ năng hồ sơ đã đăng ký:' : 'Registered Profile Skills:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200 shadow-2xs"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Attached CV */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-800">
                  {isVietnamese ? '2. Bản CV đang đính kèm' : '2. Attached Resume Context'}
                </h4>
              </div>
              {selectedCv && (
                <Link
                  to={`/candidate/resumes/${selectedCv.id}`}
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  {isVietnamese ? 'Xem CV' : 'View CV'} <ExternalLink size={12} />
                </Link>
              )}
            </div>

            {selectedCv ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-slate-200">
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">{selectedCv.name}</h5>
                    <p className="text-slate-500">
                      {selectedCv.position} · {selectedCv.language}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">ATS Score</span>
                    <span className="text-lg font-black text-blue-600">{selectedCv.atsScore}/100</span>
                  </div>
                </div>

                {selectedCv.atsBreakdown && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="rounded-lg bg-white p-2 border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Định dạng</span>
                      <span className="font-bold text-slate-800">
                        {selectedCv.atsBreakdown.formatting}%
                      </span>
                    </div>
                    <div className="rounded-lg bg-white p-2 border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Từ khóa</span>
                      <span className="font-bold text-slate-800">
                        {selectedCv.atsBreakdown.keywords}%
                      </span>
                    </div>
                    <div className="rounded-lg bg-white p-2 border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Định lượng</span>
                      <span className="font-bold text-slate-800">
                        {selectedCv.atsBreakdown.impactMetrics}%
                      </span>
                    </div>
                    <div className="rounded-lg bg-white p-2 border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Cấu trúc</span>
                      <span className="font-bold text-slate-800">
                        {selectedCv.atsBreakdown.structure}%
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-slate-500 block mb-1">
                    {isVietnamese ? 'Kỹ năng trong CV:' : 'Skills in Resume:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCv.skills?.map((s) => (
                      <span
                        key={s}
                        className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 border border-blue-100"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-white p-3 border border-slate-200/80 text-xs text-slate-500 flex items-center gap-2">
                <AlertCircle size={15} className="text-amber-500 shrink-0" />
                <span>
                  {isVietnamese
                    ? 'Hiện chưa gắn CV cụ thể nào. Bạn có thể chọn bản CV ở thanh trên để nhận tư vấn ATS chi tiết hơn.'
                    : 'No specific CV attached yet. You can attach one from the top bar for granular ATS feedback.'}
                </span>
              </div>
            )}
          </div>

          {/* Section 3: Target Job */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Briefcase size={18} className="text-emerald-600" />
                <h4 className="text-sm font-bold text-slate-800">
                  {isVietnamese ? '3. Việc làm mục tiêu đang đính kèm' : '3. Target Job Opportunity'}
                </h4>
              </div>
              {selectedJob && (
                <Link
                  to={`/candidate/jobs/${selectedJob.id}`}
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  {isVietnamese ? 'Xem việc làm' : 'View Job'} <ExternalLink size={12} />
                </Link>
              )}
            </div>

            {selectedJob ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-start justify-between bg-white rounded-xl p-3 border border-slate-200">
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">{selectedJob.title}</h5>
                    <p className="text-slate-600 font-medium">{selectedJob.company}</p>
                    <p className="text-slate-400 mt-0.5">
                      {selectedJob.location} · {selectedJob.type}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-600 block">{selectedJob.salary}</span>
                    <span className="text-[10px] text-blue-600 font-semibold mt-1 inline-block bg-blue-50 px-2 py-0.5 rounded-full">
                      Match: {selectedJob.match}%
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block mb-1">
                    {isVietnamese ? 'Yêu cầu kỹ năng công việc:' : 'Required Job Skills:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.skills.map((s) => (
                      <span
                        key={s}
                        className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 border border-emerald-100"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-white p-3 border border-slate-200/80 text-xs text-slate-500 flex items-center gap-2">
                <AlertCircle size={15} className="text-slate-400 shrink-0" />
                <span>
                  {isVietnamese
                    ? 'Chưa gắn công việc mục tiêu. Gắn việc làm sẽ giúp AI dự đoán câu hỏi phỏng vấn và tính điểm tương thích CV–Job Fit.'
                    : 'No target job attached. Attaching one enables customized interview questions and CV–Job fit calculation.'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
          <Button onClick={onClose} variant="primary">
            {isVietnamese ? 'Đã hiểu' : 'Got it'}
          </Button>
        </div>
      </div>
    </div>
  );
}
