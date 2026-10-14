import { useState } from 'react';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Award,
  GraduationCap,
  Building,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { demoResumes, type DemoCvData } from './guestTrialData';
import { Badge, Button, Card } from '../ui';
import { useTranslation } from '../../i18n';

interface GuestCvDemoTabProps {
  onSelectTemplateForBuilder?: (template: 'modern' | 'tech' | 'classic', cv: DemoCvData) => void;
}

export function GuestCvDemoTab({ onSelectTemplateForBuilder }: GuestCvDemoTabProps) {
  const { isVietnamese } = useTranslation();
  const [selectedCvId, setSelectedCvId] = useState<string>(demoResumes[0].id);

  const currentCv = demoResumes.find((cv) => cv.id === selectedCvId) ?? demoResumes[0];

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-white to-blue-50/70 border border-indigo-100 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100/70 px-3 py-1 text-xs font-semibold text-indigo-800">
            <Sparkles size={13} className="text-indigo-600" />
            {isVietnamese ? 'Bộ Sưu Tập CV Demo Chuẩn ATS' : 'ATS-Optimized Demo CV Showcase'}
          </span>
          <h3 className="mt-2 text-lg font-bold text-slate-900 md:text-xl">
            {isVietnamese
              ? 'Khám phá các mẫu CV thực chiến đạt điểm ATS cao (>85/100)'
              : 'Inspect battle-tested CVs with high ATS scores (>85/100)'}
          </h3>
          <p className="mt-1 text-xs text-slate-600 md:text-sm">
            {isVietnamese
              ? 'Xem cấu trúc câu từ hành động, cách lượng hoá thành tích và bộ từ khoá chuyên ngành được các chuyên gia tuyển dụng đánh giá cao.'
              : 'Learn from high-converting phrasing, quantified impact, and keyword placement vetted by recruiters.'}
          </p>
        </div>
      </div>

      {/* Select Demo CV Pills */}
      <div className="grid gap-3 sm:grid-cols-3">
        {demoResumes.map((cv) => {
          const isSelected = cv.id === currentCv.id;
          return (
            <button
              key={cv.id}
              onClick={() => setSelectedCvId(cv.id)}
              className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/40 shadow-sm ring-2 ring-blue-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
              }`}
            >
              <div
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl font-bold ${
                  isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <FileText size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-bold text-slate-900 truncate">{cv.name}</span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                    ATS {cv.atsScore}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">{cv.title}</p>
                <span className="mt-2 inline-block text-[11px] font-medium text-blue-600">
                  {isVietnamese ? `Mẫu: ${cv.template.toUpperCase()}` : `Template: ${cv.template.toUpperCase()}`}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detailed CV Showcase Grid */}
      <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
        {/* Left: Rendered Resume Document */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 space-y-6">
          {/* Header of Resume */}
          <div className="border-b border-slate-100 pb-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  {currentCv.name}
                </h2>
                <p className="text-base font-semibold text-blue-600 sm:text-lg mt-0.5">
                  {currentCv.title}
                </p>
              </div>
              <Badge tone="green">
                <ShieldCheck size={14} className="mr-1" />
                ATS {currentCv.atsScore}/100
              </Badge>
            </div>

            <div className="mt-4 flex flex-wrap gap-y-2 gap-x-4 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Mail size={13} className="text-slate-400" />
                {currentCv.email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Phone size={13} className="text-slate-400" />
                {currentCv.phone}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={13} className="text-slate-400" />
                {currentCv.location}
              </span>
            </div>
          </div>

          {/* Professional Summary */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isVietnamese ? 'Tóm Tắt Chuyên Nghiệp' : 'Professional Summary'}
            </h4>
            <p className="mt-2 text-sm leading-6 text-slate-700 bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
              {currentCv.summary}
            </p>
          </div>

          {/* Core Competencies / Skills */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isVietnamese ? 'Kỹ Năng Trọng Tâm' : 'Core Competencies'}
            </h4>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {currentCv.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-100"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Work Experience */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isVietnamese ? 'Kinh Nghiệm Làm Việc' : 'Professional Experience'}
            </h4>
            <div className="mt-3 space-y-4">
              {currentCv.experience.map((exp, idx) => (
                <div key={idx} className="relative pl-5 border-l-2 border-blue-200">
                  <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-blue-600" />
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="text-sm font-bold text-slate-900">{exp.role}</span>
                    <span className="text-xs font-medium text-slate-400">{exp.period}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 inline-flex items-center gap-1 mt-0.5">
                    <Building size={12} className="text-slate-400" />
                    {exp.company}
                  </p>
                  <ul className="mt-2 space-y-1.5 list-disc list-inside text-xs leading-5 text-slate-600">
                    {exp.highlights.map((h, hIdx) => (
                      <li key={hIdx}>{h}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isVietnamese ? 'Học Vấn & Bằng Cấp' : 'Education'}
            </h4>
            <div className="mt-2 space-y-2">
              {currentCv.education.map((edu, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs">
                  <GraduationCap size={16} className="text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900">{edu.degree}</span>
                    <p className="text-slate-500">
                      {edu.school} · {edu.period}
                    </p>
                    {edu.honors && <p className="text-emerald-700 font-medium mt-0.5">{edu.honors}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: ATS Analysis & Action Insights */}
        <div className="space-y-5">
          {/* ATS Score Card */}
          <Card className="bg-gradient-to-br from-white to-slate-50/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {isVietnamese ? 'Đánh Giá ATS Máy Quét' : 'ATS Evaluation Score'}
              </span>
              <TrendingUp size={16} className="text-emerald-600" />
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-slate-900">{currentCv.atsScore}</span>
              <span className="text-sm font-semibold text-slate-400">/ 100</span>
              <span className="ml-auto rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                {isVietnamese ? 'Xuất sắc' : 'Excellent'}
              </span>
            </div>

            <div className="mt-5 space-y-3 border-t border-slate-100 pt-4 text-xs">
              <div>
                <div className="flex justify-between text-slate-600 font-medium mb-1">
                  <span>{isVietnamese ? 'Cấu trúc & Định dạng chuẩn' : 'Structure & Formatting'}</span>
                  <span className="font-bold text-slate-900">{currentCv.atsBreakdown.formatting}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${currentCv.atsBreakdown.formatting}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 font-medium mb-1">
                  <span>{isVietnamese ? 'Mật độ từ khoá chuyên ngành' : 'Keyword Density'}</span>
                  <span className="font-bold text-slate-900">{currentCv.atsBreakdown.keywords}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-600"
                    style={{ width: `${currentCv.atsBreakdown.keywords}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 font-medium mb-1">
                  <span>{isVietnamese ? 'Chỉ số đo lường thành tích' : 'Quantified Impact Metrics'}</span>
                  <span className="font-bold text-slate-900">{currentCv.atsBreakdown.impact}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-600"
                    style={{ width: `${currentCv.atsBreakdown.impact}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* ATS Strengths Highlight */}
          <Card className="border-emerald-200/80 bg-emerald-50/30">
            <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800">
              <Award size={15} />
              {isVietnamese ? 'Điểm Cộng Vượt Trội Của CV Này' : 'Key ATS Strengths'}
            </h4>
            <ul className="mt-3 space-y-2 text-xs text-slate-700">
              {currentCv.atsStrengths.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Action CTA */}
          <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md">
            <h4 className="font-bold text-base">
              {isVietnamese ? 'Muốn tạo một CV tương tự?' : 'Want a similar CV?'}
            </h4>
            <p className="mt-1 text-xs text-blue-100 leading-relaxed">
              {isVietnamese
                ? 'Sử dụng AI Resume Builder dùng thử để tạo CV của riêng bạn với mẫu này chỉ trong 2 phút.'
                : 'Use our Guest Trial AI Resume Builder to craft your own CV using this layout in 2 minutes.'}
            </p>
            <Button
              variant="secondary"
              className="mt-4 w-full bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold"
              onClick={() => onSelectTemplateForBuilder?.(currentCv.template, currentCv)}
            >
              {isVietnamese ? 'Tạo CV với mẫu này ngay' : 'Build CV with this template'}
              <ArrowRight size={14} />
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
