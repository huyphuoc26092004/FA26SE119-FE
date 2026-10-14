import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  GraduationCap,
  Plus,
  Save,
  Sparkles,
  Trash2,
  User,
  Wrench,
  X,
} from 'lucide-react';
import { getResumeById, updateResume } from '../../mocks/services/mockService';
import type { Resume, WorkExperience, EducationItem } from '../../types/domain';
import { Badge, Button, Card, ErrorState, Input, Loading, PageTitle } from '../../components/ui';
import { useTranslation } from '../../i18n';

export default function EditResumePage() {
  const { resumeId } = useParams<{ resumeId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<Partial<Resume>>({});
  const [newSkillInput, setNewSkillInput] = useState('');

  const { data: cv, isPending, isError } = useQuery({
    queryKey: ['resume', resumeId],
    queryFn: () => getResumeById(resumeId || ''),
    enabled: !!resumeId,
  });

  useEffect(() => {
    if (cv) {
      setFormData({
        ...cv,
        experience: cv.experience ? [...cv.experience] : [],
        education: cv.education ? [...cv.education] : [],
        skills: cv.skills ? [...cv.skills] : [],
      });
    }
  }, [cv]);

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<Resume>) => updateResume(resumeId || '', updates),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      queryClient.invalidateQueries({ queryKey: ['resume', resumeId] });
      navigate(`/candidate/resumes/${updated.id}`);
    },
  });

  if (isPending) return <Loading />;
  if (isError || !cv) return <ErrorState />;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

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

  const handleAddExperience = () => {
    const newItem: WorkExperience = {
      id: `exp-${Date.now()}`,
      role: '',
      company: '',
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

  return (
    <>
      <PageTitle
        title={t('resumes.editTitle')}
        subtitle={`${t('resumes.editSubtitle')} · ${cv.name}`}
        action={
          <div className="flex items-center gap-3">
            <Link to={`/candidate/resumes/${cv.id}`}>
              <Button variant="secondary">
                <ArrowLeft size={16} />
                {t('resumes.cancel')}
              </Button>
            </Link>
            <Button
              variant="primary"
              type="button"
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              <Save size={16} />
              {updateMutation.isPending ? t('resumes.saving') : t('resumes.saveCv')}
            </Button>
          </div>
        }
      />

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl animate-fade-in">
        {/* Section 1: Basic Info */}
        <Card>
          <div className="border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-50 text-blue-600">
              <User size={15} />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Thông tin chung & Liên hệ
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Tên bản CV *</label>
              <Input
                required
                value={formData.name || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Vị trí ứng tuyển *</label>
              <Input
                required
                value={formData.position || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, position: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Họ và tên *</label>
              <Input
                required
                value={formData.fullName || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Địa chỉ Email *</label>
              <Input
                type="email"
                required
                value={formData.email || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Số điện thoại</label>
              <Input
                value={formData.phone || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Địa điểm</label>
              <Input
                value={formData.location || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-600 mb-1 block">
                Tóm tắt chuyên môn (Summary)
              </label>
              <textarea
                rows={3}
                value={formData.summary || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, summary: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </Card>

        {/* Section 2: Skills */}
        <Card>
          <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-50 text-amber-600">
                <Wrench size={15} />
              </span>
              <h3 className="text-base font-bold text-slate-900">Kỹ năng chuyên môn</h3>
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
              placeholder="Nhập kỹ năng mới (VD: Kubernetes, GraphQL...)"
              className="max-w-md"
            />
            <Button type="button" variant="secondary" onClick={() => handleAddSkill(newSkillInput)}>
              <Plus size={15} /> Thêm
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
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

        {/* Section 3: Work Experience */}
        <Card>
          <div className="border-b border-slate-100 pb-3 mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                <Briefcase size={15} />
              </span>
              <h3 className="text-base font-bold text-slate-900">Kinh nghiệm làm việc</h3>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddExperience}
              className="text-xs py-1.5 px-3"
            >
              <Plus size={13} /> Thêm vị trí
            </Button>
          </div>

          <div className="space-y-4">
            {formData.experience?.map((exp, idx) => (
              <div
                key={exp.id || idx}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 relative space-y-3"
              >
                <button
                  type="button"
                  onClick={() => handleRemoveExperience(idx)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-red-600 p-1"
                  title="Xóa mục này"
                >
                  <Trash2 size={15} />
                </button>

                <div className="grid gap-3 sm:grid-cols-2 pr-8">
                  <div>
                    <label className="text-2xs font-semibold text-slate-500 mb-1 block">Chức danh</label>
                    <Input
                      value={exp.role}
                      onChange={(e) => handleUpdateExperience(idx, 'role', e.target.value)}
                      placeholder="Chức danh"
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-2xs font-semibold text-slate-500 mb-1 block">Tên công ty</label>
                    <Input
                      value={exp.company}
                      onChange={(e) => handleUpdateExperience(idx, 'company', e.target.value)}
                      placeholder="Tên công ty"
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-2xs font-semibold text-slate-500 mb-1 block">Từ ngày</label>
                    <Input
                      value={exp.startDate}
                      onChange={(e) => handleUpdateExperience(idx, 'startDate', e.target.value)}
                      placeholder="MM/YYYY"
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-2xs font-semibold text-slate-500 mb-1 block">Đến ngày</label>
                    <Input
                      value={exp.endDate}
                      onChange={(e) => handleUpdateExperience(idx, 'endDate', e.target.value)}
                      placeholder="Hiện tại"
                      className="bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-2xs font-semibold text-slate-500 mb-1 block">
                    Mô tả trách nhiệm & thành tích
                  </label>
                  <textarea
                    rows={2}
                    value={exp.description}
                    onChange={(e) => handleUpdateExperience(idx, 'description', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Sticky Actions Bar */}
        <div className="sticky bottom-4 z-20 flex items-center justify-between gap-4 rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur-md border border-slate-200">
          <span className="text-xs text-slate-500">
            Lưu các cập nhật để đồng bộ điểm chuẩn ATS và hồ sơ ứng tuyển.
          </span>
          <div className="flex items-center gap-3">
            <Link to={`/candidate/resumes/${cv.id}`}>
              <Button type="button" variant="secondary">
                {t('resumes.cancel')}
              </Button>
            </Link>
            <Button type="submit" variant="primary" disabled={updateMutation.isPending}>
              <Save size={16} />
              {updateMutation.isPending ? t('resumes.saving') : t('resumes.saveCv')}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}
