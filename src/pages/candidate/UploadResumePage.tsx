import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Code,
  Cpu,
  Edit3,
  FileCheck2,
  FileText,
  FileUp,
  FolderOpen,
  Info,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  ScanText,
  Sparkles,
  Trash2,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import { simulateAiCvExtraction, createResume } from '../../mocks/services/mockService';
import type { Resume, WorkExperience, EducationItem, SkillItem } from '../../types/domain';
import { Badge, Button, Card, Input, PageTitle } from '../../components/ui';
import { useTranslation } from '../../i18n';

const SAMPLE_CV_PRESETS = [
  {
    name: 'Alex_Morgan_Senior_Frontend_Architect.pdf',
    size: 1420000,
    label: 'Senior Frontend & AI Platform Engineer',
    language: 'English',
    badge: 'Phổ biến nhất',
  },
  {
    name: 'Nguyen_Van_A_Fullstack_Dev_TiengViet.pdf',
    size: 980000,
    label: 'Full-stack Web Developer (Tiếng Việt)',
    language: 'Vietnamese',
    badge: 'Tiếng Việt',
  },
  {
    name: 'Tech_Lead_Engineering_Manager.docx',
    size: 850000,
    label: 'Engineering Tech Lead / DevOps',
    language: 'English',
    badge: 'DOCX Format',
  },
];

export default function UploadResumePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Flow states: 'upload' -> 'parsing' -> 'review'
  const [flowState, setFlowState] = useState<'upload' | 'parsing' | 'review'>('upload');
  const [parsingStep, setParsingStep] = useState<number>(1);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [selectedFileSize, setSelectedFileSize] = useState<number>(0);
  const [dragOver, setDragOver] = useState(false);
  const [showRawText, setShowRawText] = useState(false);

  // Extracted and editable data
  const [extractedData, setExtractedData] = useState<Partial<Resume>>({});
  const [newSkillInput, setNewSkillInput] = useState('');

  // Handle file selection
  const handleStartParsing = async (fileName: string, fileSize: number) => {
    setSelectedFileName(fileName);
    setSelectedFileSize(fileSize);
    setFlowState('parsing');
    setParsingStep(1);

    // Progressive step simulation for realistic AI feel
    const t1 = setTimeout(() => setParsingStep(2), 350);
    const t2 = setTimeout(() => setParsingStep(3), 700);
    const t3 = setTimeout(() => setParsingStep(4), 1050);
    const t4 = setTimeout(() => setParsingStep(5), 1350);

    try {
      const parsed = await simulateAiCvExtraction({ name: fileName, size: fileSize });
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      setExtractedData(parsed);
      setFlowState('review');
    } catch {
      setFlowState('upload');
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleStartParsing(file.name, file.size);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleStartParsing(file.name, file.size);
    }
  };

  // Mutations to save confirmed CV
  const saveCvMutation = useMutation({
    mutationFn: (data: Partial<Resume>) => createResume(data),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      navigate(`/candidate/resumes/${saved.id}`);
    },
  });

  const handleConfirmAndSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveCvMutation.mutate(extractedData);
  };

  // Skill management in review mode
  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    const current = extractedData.skills || [];
    if (!current.includes(trimmed)) {
      setExtractedData((prev) => ({
        ...prev,
        skills: [...current, trimmed],
      }));
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const current = extractedData.skills || [];
    setExtractedData((prev) => ({
      ...prev,
      skills: current.filter((s) => s !== skillToRemove),
    }));
  };

  // Experience management in review mode
  const handleUpdateExperience = (index: number, field: keyof WorkExperience, value: any) => {
    const list = [...(extractedData.experience || [])];
    if (list[index]) {
      list[index] = { ...list[index], [field]: value };
      setExtractedData((prev) => ({ ...prev, experience: list }));
    }
  };

  const handleAddExperienceItem = () => {
    const newItem: WorkExperience = {
      id: `exp-${Date.now()}`,
      role: 'Vị trí công việc',
      company: 'Tên công ty',
      startDate: '01/2023',
      endDate: 'Hiện tại',
      isCurrent: true,
      description: 'Mô tả trách nhiệm và kết quả đạt được…',
    };
    setExtractedData((prev) => ({
      ...prev,
      experience: [newItem, ...(prev.experience || [])],
    }));
  };

  const handleRemoveExperience = (index: number) => {
    const list = [...(extractedData.experience || [])];
    list.splice(index, 1);
    setExtractedData((prev) => ({ ...prev, experience: list }));
  };

  return (
    <>
      <PageTitle
        title={
          flowState === 'review'
            ? t('resumes.reviewTitle')
            : t('resumes.uploadTitle')
        }
        subtitle={
          flowState === 'review'
            ? t('resumes.reviewSubtitle')
            : t('resumes.uploadSubtitle')
        }
        action={
          <Link to="/candidate/resumes">
            <Button variant="secondary">
              <ArrowLeft size={16} />
              {t('resumes.backToList')}
            </Button>
          </Link>
        }
      />

      {/* STEP 1: FILE UPLOAD ZONE */}
      {flowState === 'upload' && (
        <div className="space-y-8 max-w-4xl mx-auto animate-fade-in">
          {/* Drag & Drop Area */}
          <div
            className={`rounded-2xl border-2 border-dashed p-10 text-center transition-all cursor-pointer bg-white shadow-2xs ${
              dragOver
                ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
                : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/50'
            }`}
            onDragOver={(e: React.DragEvent) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".pdf,.docx,.doc"
              className="hidden"
            />
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
              <FileUp size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">{t('resumes.dropCvHere')}</h3>
            <p className="text-xs text-slate-400 mb-5">{t('resumes.supportedFormats')}</p>
            <Button variant="primary" type="button" className="shadow-xs">
              <FolderOpen size={16} />
              {t('resumes.browseFile')}
            </Button>
          </div>

          {/* Sample CV Presets for instant testing */}
          <div>
            <div className="mb-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                {t('resumes.samplePresetsTitle')}
              </h4>
              <p className="text-xs text-slate-500">{t('resumes.samplePresetsDesc')}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {SAMPLE_CV_PRESETS.map((preset) => (
                <div
                  key={preset.name}
                  onClick={() => handleStartParsing(preset.name, preset.size)}
                  className="group flex flex-col justify-between p-4 rounded-xl border border-slate-200/80 bg-white hover:border-blue-400 hover:shadow-sm cursor-pointer transition"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-600">
                        <FileText size={18} />
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-2xs font-semibold text-slate-600">
                        {preset.badge}
                      </span>
                    </div>
                    <p className="font-semibold text-xs text-slate-800 line-clamp-1 group-hover:text-blue-600 transition">
                      {preset.label}
                    </p>
                    <p className="text-2xs text-slate-400 mt-1 truncate">{preset.name}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-2xs text-blue-600 font-semibold">
                    <span>{t('resumes.useSamplePreset')}</span>
                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: AI PARSING IN PROGRESS SIMULATION */}
      {flowState === 'parsing' && (
        <Card className="max-w-2xl mx-auto my-8 p-8 text-center animate-fade-in border-blue-100 shadow-md">
          <div className="relative mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg">
            <Cpu size={36} className="animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white" />
            </span>
          </div>

          <h3 className="text-xl font-extrabold text-slate-900 mb-1">
            {t('resumes.parsingInProgress')}
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Đang phân tích tệp: <strong className="text-slate-800">{selectedFileName}</strong>
          </p>

          {/* Stepper progress */}
          <div className="space-y-3 text-left max-w-md mx-auto">
            {[
              { step: 1, label: t('resumes.parsingStep1') },
              { step: 2, label: t('resumes.parsingStep2') },
              { step: 3, label: t('resumes.parsingStep3') },
              { step: 4, label: t('resumes.parsingStep4') },
              { step: 5, label: t('resumes.parsingStep5') },
            ].map((s) => {
              const isDone = parsingStep > s.step;
              const isCurrent = parsingStep === s.step;
              return (
                <div
                  key={s.step}
                  className={`flex items-center gap-3 p-2.5 rounded-xl transition ${
                    isCurrent
                      ? 'bg-blue-50 border border-blue-200 text-blue-900 font-semibold'
                      : isDone
                      ? 'text-slate-700'
                      : 'text-slate-400 opacity-60'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 size={18} className="animate-spin text-blue-600 shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-slate-300 shrink-0" />
                  )}
                  <span className="text-xs">{s.label}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* STEP 3: REVIEW EXTRACTED CV INFORMATION & EDIT EXTRACTED INFORMATION */}
      {flowState === 'review' && (
        <form onSubmit={handleConfirmAndSave} className="space-y-6 animate-fade-in">
          {/* AI Banner Verification Notice */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600 p-5 text-white shadow-md">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/20 backdrop-blur-md text-amber-300 border border-white/30">
                <BrainCircuit size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold">
                    AI đã bóc tách thông tin thành công!
                  </h3>
                  <span className="rounded-full bg-emerald-400/90 text-slate-900 px-2.5 py-0.5 text-xs font-black">
                    {extractedData.extractedMeta?.confidenceScore ?? 96}% Chính xác
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-blue-100 max-w-2xl leading-relaxed">
                  Vui lòng kiểm tra và chỉnh sửa lại các thông tin do AI tự động bóc tách từ tệp CV tải lên dưới đây trước khi lưu vào hệ thống.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setFlowState('upload')}
                className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs py-2 px-3"
              >
                <RefreshCw size={13} />
                Tải lại tệp khác
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
            {/* Left: Interactive Editable Form */}
            <div className="space-y-6">
              {/* Basic Info Card */}
              <Card>
                <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">
                    1. Thông tin chung & Liên hệ trích xuất
                  </h4>
                  <Badge tone="blue">AI Extracted</Badge>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">
                      Tên bản CV *
                    </label>
                    <Input
                      required
                      value={extractedData.name || ''}
                      onChange={(e) =>
                        setExtractedData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Tên bản CV"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">
                      Vị trí ứng tuyển mục tiêu *
                    </label>
                    <Input
                      required
                      value={extractedData.position || ''}
                      onChange={(e) =>
                        setExtractedData((prev) => ({ ...prev, position: e.target.value }))
                      }
                      placeholder="Vị trí ứng tuyển"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">
                      Họ và tên ứng viên *
                    </label>
                    <Input
                      required
                      value={extractedData.fullName || ''}
                      onChange={(e) =>
                        setExtractedData((prev) => ({ ...prev, fullName: e.target.value }))
                      }
                      placeholder="Họ và tên"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">
                      Địa chỉ Email *
                    </label>
                    <Input
                      type="email"
                      required
                      value={extractedData.email || ''}
                      onChange={(e) =>
                        setExtractedData((prev) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">
                      Số điện thoại
                    </label>
                    <Input
                      value={extractedData.phone || ''}
                      onChange={(e) =>
                        setExtractedData((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      placeholder="(+84) 912 345 678"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">
                      Địa điểm / Thành phố
                    </label>
                    <Input
                      value={extractedData.location || ''}
                      onChange={(e) =>
                        setExtractedData((prev) => ({ ...prev, location: e.target.value }))
                      }
                      placeholder="Hồ Chí Minh, Việt Nam"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">
                      Tóm tắt chuyên môn (Professional Summary)
                    </label>
                    <textarea
                      rows={3}
                      value={extractedData.summary || ''}
                      onChange={(e) =>
                        setExtractedData((prev) => ({ ...prev, summary: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </Card>

              {/* Skills Extracted Card */}
              <Card>
                <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      2. Kỹ năng chuyên môn trích xuất
                    </h4>
                    <p className="text-xs text-slate-400">
                      Bấm vào dấu × để xoá kỹ năng nhận diện sai, hoặc gõ để thêm kỹ năng còn thiếu.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-blue-600">
                    {extractedData.skills?.length || 0} kỹ năng
                  </span>
                </div>

                {/* Add Skill Bar */}
                <div className="flex gap-2 mb-4">
                  <Input
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill(newSkillInput);
                      }
                    }}
                    placeholder="Nhập kỹ năng bổ sung (VD: Docker, AWS, Next.js...)"
                    className="max-w-md"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleAddSkill(newSkillInput)}
                  >
                    <Plus size={15} /> Thêm
                  </Button>
                </div>

                {/* Extracted Chips */}
                <div className="flex flex-wrap gap-2">
                  {extractedData.skills?.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/60 px-3 py-1.5 text-xs font-semibold text-blue-900"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-blue-500 hover:text-red-600 transition cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </Card>

              {/* Experience Extracted Card */}
              <Card>
                <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      3. Kinh nghiệm làm việc trích xuất
                    </h4>
                    <p className="text-xs text-slate-400">
                      Kiểm tra thời gian, chức danh và mô tả công việc bóc tách được.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddExperienceItem}
                    className="text-xs py-1.5 px-2.5"
                  >
                    <Plus size={13} /> Thêm vị trí
                  </Button>
                </div>

                <div className="space-y-4">
                  {extractedData.experience?.map((exp, idx) => (
                    <div
                      key={exp.id || idx}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 relative space-y-3"
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveExperience(idx)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-red-600 p-1 rounded"
                        title="Xóa mục kinh nghiệm này"
                      >
                        <Trash2 size={15} />
                      </button>

                      <div className="grid gap-3 sm:grid-cols-2 pr-8">
                        <div>
                          <label className="text-2xs font-semibold text-slate-500 mb-1 block">
                            Chức danh / Vị trí
                          </label>
                          <Input
                            value={exp.role}
                            onChange={(e) =>
                              handleUpdateExperience(idx, 'role', e.target.value)
                            }
                            placeholder="Vị trí công việc"
                            className="bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-2xs font-semibold text-slate-500 mb-1 block">
                            Tên công ty
                          </label>
                          <Input
                            value={exp.company}
                            onChange={(e) =>
                              handleUpdateExperience(idx, 'company', e.target.value)
                            }
                            placeholder="Tên công ty"
                            className="bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-2xs font-semibold text-slate-500 mb-1 block">
                            Thời gian bắt đầu
                          </label>
                          <Input
                            value={exp.startDate}
                            onChange={(e) =>
                              handleUpdateExperience(idx, 'startDate', e.target.value)
                            }
                            placeholder="MM/YYYY"
                            className="bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-2xs font-semibold text-slate-500 mb-1 block">
                            Thời gian kết thúc
                          </label>
                          <Input
                            value={exp.endDate}
                            onChange={(e) =>
                              handleUpdateExperience(idx, 'endDate', e.target.value)
                            }
                            placeholder="MM/YYYY hoặc Hiện tại"
                            className="bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-2xs font-semibold text-slate-500 mb-1 block">
                          Mô tả trách nhiệm & Thành tựu
                        </label>
                        <textarea
                          rows={2}
                          value={exp.description}
                          onChange={(e) =>
                            handleUpdateExperience(idx, 'description', e.target.value)
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right: AI Insights & File Metadata */}
            <div className="space-y-6">
              {/* ATS Estimation Card */}
              <Card className="border-emerald-200 bg-gradient-to-br from-white to-emerald-50/40">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-900 text-sm">Điểm ATS ước tính</h4>
                  <Badge tone="green">Đạt chuẩn ATS</Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl border-4 border-emerald-400 bg-white text-2xl font-black text-slate-900 shadow-sm">
                    {extractedData.atsScore ?? 92}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Độ sẵn sàng rất cao</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Tương thích tốt với hệ thống sàng lọc tự động hiện đại.
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Định dạng & Bố cục:</span>
                    <span className="font-semibold text-emerald-600">95%</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Từ khóa chuyên môn:</span>
                    <span className="font-semibold text-emerald-600">90%</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Định lượng thành tích:</span>
                    <span className="font-semibold text-blue-600">88%</span>
                  </div>
                </div>
              </Card>

              {/* Extraction Metadata Card */}
              <Card>
                <h4 className="font-bold text-slate-900 text-sm mb-3">Thông tin tệp bóc tách</h4>
                <div className="space-y-2.5 text-xs text-slate-600">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Tên tệp gốc:</span>
                    <span className="font-medium text-slate-800 truncate max-w-[160px]">
                      {extractedData.extractedMeta?.fileName || selectedFileName}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Kích thước:</span>
                    <span className="font-medium text-slate-800">
                      {extractedData.extractedMeta?.fileSize || '1.2 MB'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Thời gian trích xuất:</span>
                    <span className="font-medium text-slate-800">
                      {extractedData.extractedMeta?.extractedAt || 'Vừa xong'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Mô hình AI:</span>
                    <span className="font-semibold text-indigo-600">Gemini OCR & Semantic Parser</span>
                  </div>
                </div>

                {extractedData.extractedMeta?.extractionWarnings && (
                  <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-2xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertCircle size={13} />
                      Ghi chú từ AI Agent:
                    </div>
                    {extractedData.extractedMeta.extractionWarnings.map((w, i) => (
                      <p key={i}>• {w}</p>
                    ))}
                  </div>
                )}

                {/* Raw OCR Text Toggle */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowRawText(!showRawText)}
                    className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
                  >
                    <ScanText size={13} />
                    {showRawText ? 'Ẩn văn bản thô bóc tách' : 'Xem văn bản thô bóc tách'}
                  </button>
                  {showRawText && (
                    <div className="mt-2 max-h-36 overflow-y-auto rounded-lg bg-slate-900 p-3 text-2xs font-mono text-emerald-400">
                      {extractedData.extractedMeta?.rawTextSnippet || 'Không có dữ liệu thô.'}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* Sticky Bottom Actions Bar */}
          <div className="sticky bottom-4 z-20 flex items-center justify-between gap-4 rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur-md border border-slate-200">
            <span className="text-xs text-slate-500">
              Kiểm tra kỹ các thông tin trước khi xác nhận lưu bản CV.
            </span>
            <div className="flex items-center gap-3">
              <Button type="button" variant="secondary" onClick={() => setFlowState('upload')}>
                {t('resumes.cancel')}
              </Button>
              <Button type="submit" variant="primary" disabled={saveCvMutation.isPending}>
                <CheckCircle2 size={16} />
                {saveCvMutation.isPending ? t('resumes.saving') : t('resumes.confirmAndSave')}
              </Button>
            </div>
          </div>
        </form>
      )}
    </>
  );
}
