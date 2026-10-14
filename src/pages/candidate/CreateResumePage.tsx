import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  FolderGit2,
  GraduationCap,
  Plus,
  Save,
  Sparkles,
  Trash2,
  User,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { createResume } from '../../mocks/services/mockService';
import type { Resume, WorkExperience, EducationItem, ProjectItem, CertificationItem } from '../../types/domain';
import { Badge, Button, Card, Input, PageTitle } from '../../components/ui';
import { useTranslation } from '../../i18n';

const POPULAR_SKILLS = [
  'React',
  'TypeScript',
  'Next.js',
  'Node.js',
  'Tailwind CSS',
  'Python',
  'Docker',
  'GraphQL',
  'PostgreSQL',
  'REST APIs',
  'CI/CD Pipelines',
];

export default function CreateResumePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<Partial<Resume>>({
    name: 'Frontend Engineer CV - Chuẩn ATS',
    position: 'Senior Frontend Engineer',
    language: 'English',
    fullName: 'Alex Morgan',
    email: 'candidate@example.com',
    phone: '(+84) 912 345 678',
    location: 'Hồ Chí Minh, Việt Nam',
    website: 'https://alexmorgan.dev',
    linkedin: 'https://linkedin.com/in/alex-morgan-dev',
    github: 'https://github.com/alexmorgan-fe',
    summary:
      'Kỹ sư Frontend với hơn 4 năm kinh nghiệm chuyên sâu về React, TypeScript, Next.js và tối ưu hóa hiệu năng ứng dụng web. Đam mê xây dựng trải nghiệm người dùng hiện đại và tích hợp các giải pháp AI.',
    skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Node.js', 'REST APIs'],
    experience: [
      {
        id: 'exp-1',
        role: 'Senior Frontend Engineer',
        company: 'Nexus Tech Global',
        location: 'Hồ Chí Minh',
        startDate: '03/2022',
        endDate: 'Hiện tại',
        isCurrent: true,
        description:
          'Chịu trách nhiệm kiến trúc giao diện người dùng và tối ưu hiệu năng cho hệ thống SaaS với 200,000+ người dùng.',
        highlights: [
          'Giảm thời gian tải trang (LCP) từ 2.8s xuống 0.9s.',
          'Dẫn dắt đội ngũ 5 lập trình viên xây dựng Design System dùng chung.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'Đại học Bách Khoa (HCMUT)',
        degree: 'Cử nhân Kỹ thuật',
        field: 'Khoa học Máy tính',
        startDate: '2016',
        endDate: '2020',
        gpa: '3.6 / 4.0',
      },
    ],
    projects: [
      {
        id: 'proj-1',
        name: 'AI Career Intelligence Portal',
        role: 'Lead Developer',
        techStack: ['React', 'TypeScript', 'Tailwind CSS', 'AI Matching API'],
        link: 'https://github.com/alexmorgan-fe/career-agent-ui',
        description: 'Nền tảng đối sánh CV và gợi ý việc làm tự động bằng mô hình AI.',
      },
    ],
    certifications: [
      {
        id: 'cert-1',
        name: 'Meta Front-End Developer Professional Certificate',
        issuer: 'Meta (Coursera)',
        date: '2023',
      },
    ],
  });

  const [newSkillInput, setNewSkillInput] = useState('');

  // Dynamic ATS Score Estimator
  const calculateEstimatedAts = () => {
    let score = 55;
    if (formData.name && formData.position) score += 5;
    if (formData.summary && formData.summary.length > 40) score += 10;
    if (formData.experience && formData.experience.length >= 1) score += 12;
    if (formData.experience && formData.experience.length >= 2) score += 5;
    if (formData.skills && formData.skills.length >= 5) score += 8;
    if (formData.education && formData.education.length >= 1) score += 5;
    return Math.min(score, 96);
  };

  const estimatedScore = calculateEstimatedAts();

  const createMutation = useMutation({
    mutationFn: (data: Partial<Resume>) => createResume(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      navigate(`/candidate/resumes/${created.id}`);
    },
  });

  const handleSubmit = (status: 'Ready' | 'Draft') => {
    createMutation.mutate({
      ...formData,
      status,
      atsScore: estimatedScore,
    });
  };

  // Skill management
  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    const current = formData.skills || [];
    if (!current.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, skills: [...current, trimmed] }));
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: (prev.skills || []).filter((s) => s !== skill),
    }));
  };

  // Experience management
  const handleAddExperience = () => {
    const newItem: WorkExperience = {
      id: `exp-${Date.now()}`,
      role: '',
      company: '',
      location: '',
      startDate: '',
      endDate: 'Hiện tại',
      isCurrent: true,
      description: '',
    };
    setFormData((prev) => ({
      ...prev,
      experience: [newItem, ...(prev.experience || [])],
    }));
  };

  const handleUpdateExperience = (index: number, field: keyof WorkExperience, val: any) => {
    const list = [...(formData.experience || [])];
    if (list[index]) {
      list[index] = { ...list[index], [field]: val };
      setFormData((prev) => ({ ...prev, experience: list }));
    }
  };

  const handleRemoveExperience = (index: number) => {
    const list = [...(formData.experience || [])];
    list.splice(index, 1);
    setFormData((prev) => ({ ...prev, experience: list }));
  };

  // Education management
  const handleAddEducation = () => {
    const newItem: EducationItem = {
      id: `edu-${Date.now()}`,
      school: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      gpa: '',
    };
    setFormData((prev) => ({
      ...prev,
      education: [newItem, ...(prev.education || [])],
    }));
  };

  const handleUpdateEducation = (index: number, field: keyof EducationItem, val: any) => {
    const list = [...(formData.education || [])];
    if (list[index]) {
      list[index] = { ...list[index], [field]: val };
      setFormData((prev) => ({ ...prev, education: list }));
    }
  };

  const handleRemoveEducation = (index: number) => {
    const list = [...(formData.education || [])];
    list.splice(index, 1);
    setFormData((prev) => ({ ...prev, education: list }));
  };

  return (
    <>
      <PageTitle
        title={t('resumes.createTitle')}
        subtitle={t('resumes.createSubtitle')}
        action={
          <div className="flex items-center gap-3">
            <Link to="/candidate/resumes">
              <Button variant="secondary">
                <ArrowLeft size={16} />
                {t('resumes.cancel')}
              </Button>
            </Link>
            <Button
              variant="secondary"
              type="button"
              onClick={() => handleSubmit('Draft')}
              disabled={createMutation.isPending}
            >
              Lưu bản nháp
            </Button>
            <Button
              variant="primary"
              type="button"
              onClick={() => handleSubmit('Ready')}
              disabled={createMutation.isPending}
            >
              <Save size={16} />
              {createMutation.isPending ? t('resumes.saving') : 'Hoàn tất & Đánh giá ATS'}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
        {/* Form Sections */}
        <div className="space-y-6">
          {/* Section 1: Thông tin chung & Liên hệ */}
          <Card>
            <div className="border-b border-slate-100 pb-3 mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-50 text-blue-600">
                  <User size={15} />
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  1. Thông tin bản CV & Liên hệ
                </h3>
              </div>
              <span className="text-xs text-slate-400">* Bắt buộc</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Tên bản CV *
                </label>
                <Input
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ví dụ: Senior Frontend Engineer CV"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Vị trí ứng tuyển mục tiêu *
                </label>
                <Input
                  required
                  value={formData.position || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, position: e.target.value }))}
                  placeholder="Ví dụ: Frontend Engineer / Tech Lead"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Ngôn ngữ CV
                </label>
                <select
                  value={formData.language || 'English'}
                  onChange={(e) => setFormData((prev) => ({ ...prev, language: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value="English">English (Tiếng Anh)</option>
                  <option value="Vietnamese">Tiếng Việt (Vietnamese)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Họ và tên ứng viên *
                </label>
                <Input
                  required
                  value={formData.fullName || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Alex Morgan"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Địa chỉ Email *
                </label>
                <Input
                  type="email"
                  required
                  value={formData.email || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="alex.morgan@example.com"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Số điện thoại
                </label>
                <Input
                  value={formData.phone || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="(+84) 912 345 678"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Địa điểm / Nơi cư trú
                </label>
                <Input
                  value={formData.location || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="Hồ Chí Minh, Việt Nam"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Tóm tắt chuyên môn (Professional Summary)
                </label>
                <textarea
                  rows={3}
                  value={formData.summary || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, summary: e.target.value }))}
                  placeholder="Mô tả ngắn gọn về kinh nghiệm, thế mạnh công nghệ và giá trị bạn mang lại cho doanh nghiệp…"
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </Card>

          {/* Section 2: Kinh nghiệm làm việc */}
          <Card>
            <div className="border-b border-slate-100 pb-3 mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Briefcase size={15} />
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  2. Kinh nghiệm làm việc (Work Experience)
                </h3>
              </div>
              <Button type="button" variant="secondary" onClick={handleAddExperience} className="text-xs py-1.5 px-3">
                <Plus size={13} />
                {t('resumes.addExperience')}
              </Button>
            </div>

            <div className="space-y-4">
              {formData.experience?.map((exp, idx) => (
                <div key={exp.id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 relative space-y-3">
                  <button
                    type="button"
                    onClick={() => handleRemoveExperience(idx)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-red-600 p-1"
                    title="Xóa kinh nghiệm này"
                  >
                    <Trash2 size={15} />
                  </button>

                  <div className="grid gap-3 sm:grid-cols-2 pr-8">
                    <div>
                      <label className="text-2xs font-semibold text-slate-500 mb-1 block">Chức danh</label>
                      <Input
                        value={exp.role}
                        onChange={(e) => handleUpdateExperience(idx, 'role', e.target.value)}
                        placeholder="Ví dụ: Senior Frontend Engineer"
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-2xs font-semibold text-slate-500 mb-1 block">Tên công ty</label>
                      <Input
                        value={exp.company}
                        onChange={(e) => handleUpdateExperience(idx, 'company', e.target.value)}
                        placeholder="Ví dụ: Nexus Tech Global"
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-2xs font-semibold text-slate-500 mb-1 block">Từ ngày (MM/YYYY)</label>
                      <Input
                        value={exp.startDate}
                        onChange={(e) => handleUpdateExperience(idx, 'startDate', e.target.value)}
                        placeholder="03/2022"
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-2xs font-semibold text-slate-500 mb-1 block">Đến ngày</label>
                      <Input
                        value={exp.endDate}
                        onChange={(e) => handleUpdateExperience(idx, 'endDate', e.target.value)}
                        placeholder="Hiện tại hoặc MM/YYYY"
                        className="bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-2xs font-semibold text-slate-500 mb-1 block">Mô tả trách nhiệm & thành tích</label>
                    <textarea
                      rows={2}
                      value={exp.description}
                      onChange={(e) => handleUpdateExperience(idx, 'description', e.target.value)}
                      placeholder="Mô tả công việc và các số liệu thành tích cụ thể..."
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Section 3: Học vấn */}
          <Card>
            <div className="border-b border-slate-100 pb-3 mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                  <GraduationCap size={15} />
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  3. Học vấn & Bằng cấp (Education)
                </h3>
              </div>
              <Button type="button" variant="secondary" onClick={handleAddEducation} className="text-xs py-1.5 px-3">
                <Plus size={13} />
                {t('resumes.addEducation')}
              </Button>
            </div>

            <div className="space-y-4">
              {formData.education?.map((edu, idx) => (
                <div key={edu.id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 relative space-y-3">
                  <button
                    type="button"
                    onClick={() => handleRemoveEducation(idx)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-red-600 p-1"
                    title="Xóa học vấn này"
                  >
                    <Trash2 size={15} />
                  </button>

                  <div className="grid gap-3 sm:grid-cols-2 pr-8">
                    <div>
                      <label className="text-2xs font-semibold text-slate-500 mb-1 block">Trường đại học / Cơ sở đào tạo</label>
                      <Input
                        value={edu.school}
                        onChange={(e) => handleUpdateEducation(idx, 'school', e.target.value)}
                        placeholder="Ví dụ: Đại học Bách Khoa"
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-2xs font-semibold text-slate-500 mb-1 block">Bằng cấp & Chuyên ngành</label>
                      <Input
                        value={edu.degree}
                        onChange={(e) => handleUpdateEducation(idx, 'degree', e.target.value)}
                        placeholder="Ví dụ: Cử nhân Khoa học Máy tính"
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-2xs font-semibold text-slate-500 mb-1 block">Niên khóa (VD: 2016 - 2020)</label>
                      <Input
                        value={`${edu.startDate || ''} - ${edu.endDate || ''}`}
                        onChange={(e) => {
                          const parts = e.target.value.split('-');
                          handleUpdateEducation(idx, 'startDate', parts[0]?.trim());
                          handleUpdateEducation(idx, 'endDate', parts[1]?.trim());
                        }}
                        placeholder="2016 - 2020"
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-2xs font-semibold text-slate-500 mb-1 block">Điểm GPA / Xếp loại</label>
                      <Input
                        value={edu.gpa || ''}
                        onChange={(e) => handleUpdateEducation(idx, 'gpa', e.target.value)}
                        placeholder="Ví dụ: 3.6 / 4.0 (Giỏi)"
                        className="bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Section 4: Kỹ năng chuyên môn */}
          <Card>
            <div className="border-b border-slate-100 pb-3 mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-50 text-amber-600">
                  <Wrench size={15} />
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  4. Kỹ năng chuyên môn (Skills & Tools)
                </h3>
              </div>
              <span className="text-xs font-bold text-blue-600">
                {formData.skills?.length || 0} kỹ năng
              </span>
            </div>

            <div className="flex gap-2 mb-3">
              <Input
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill(newSkillInput);
                  }
                }}
                placeholder="Nhập kỹ năng mới và nhấn Enter (VD: Tailwind, GraphQL...)"
                className="max-w-md"
              />
              <Button type="button" variant="secondary" onClick={() => handleAddSkill(newSkillInput)}>
                <Plus size={15} /> Thêm
              </Button>
            </div>

            {/* Quick Suggestions */}
            <div className="mb-4">
              <p className="text-2xs text-slate-500 font-medium mb-1.5">Gợi ý kỹ năng phổ biến:</p>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_SKILLS.map((skill) => {
                  const has = (formData.skills || []).includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      disabled={has}
                      onClick={() => handleAddSkill(skill)}
                      className={`rounded-md px-2.5 py-1 text-2xs font-medium transition cursor-pointer ${
                        has ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      }`}
                    >
                      + {skill}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Skills List */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              {formData.skills?.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs"
                >
                  <span>{s}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(s)}
                    className="text-slate-400 hover:text-red-600 transition cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Live ATS Score Preview */}
        <div className="space-y-6">
          <Card className="border-blue-100 bg-gradient-to-br from-white via-white to-blue-50/40 sticky top-24">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Sparkles size={16} className="text-amber-500" />
                Ước tính điểm chuẩn ATS
              </h4>
              <Badge tone={estimatedScore >= 80 ? 'green' : 'amber'}>
                {estimatedScore >= 80 ? 'Rất tốt' : 'Khá'}
              </Badge>
            </div>

            <div className="my-5 flex items-center gap-4">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl border-4 border-emerald-400 bg-white text-3xl font-black text-slate-800 shadow-sm">
                {estimatedScore}
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">Điểm tối ưu hóa CV</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Cập nhật theo thời gian thực dựa trên các trường thông tin bạn vừa điền.
                </p>
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2
                    size={14}
                    className={formData.name ? 'text-emerald-500' : 'text-slate-300'}
                  />
                  Tiêu đề & Chức danh
                </span>
                <span className="font-semibold text-slate-700">Đạt</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2
                    size={14}
                    className={
                      formData.summary && formData.summary.length > 30
                        ? 'text-emerald-500'
                        : 'text-slate-300'
                    }
                  />
                  Tóm tắt chuyên môn
                </span>
                <span className="font-semibold text-slate-700">
                  {formData.summary && formData.summary.length > 30 ? 'Đạt' : 'Chưa đủ'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2
                    size={14}
                    className={
                      formData.experience && formData.experience.length > 0
                        ? 'text-emerald-500'
                        : 'text-slate-300'
                    }
                  />
                  Kinh nghiệm thực tế
                </span>
                <span className="font-semibold text-slate-700">
                  {formData.experience?.length || 0} mục
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2
                    size={14}
                    className={
                      formData.skills && formData.skills.length >= 5
                        ? 'text-emerald-500'
                        : 'text-slate-300'
                    }
                  />
                  Kỹ năng công nghệ
                </span>
                <span className="font-semibold text-slate-700">
                  {formData.skills?.length || 0}/5 kỹ năng
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
              <Button
                variant="primary"
                type="button"
                className="w-full justify-center shadow-xs"
                onClick={() => handleSubmit('Ready')}
                disabled={createMutation.isPending}
              >
                <Save size={16} />
                Hoàn tất & Lưu bản CV
              </Button>
              <Button
                variant="secondary"
                type="button"
                className="w-full justify-center text-xs"
                onClick={() => handleSubmit('Draft')}
                disabled={createMutation.isPending}
              >
                Lưu làm bản nháp
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
