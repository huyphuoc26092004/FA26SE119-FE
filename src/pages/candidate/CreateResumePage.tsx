import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Award,
  BookOpen,
  Briefcase,
  Check,
  CheckCircle2,
  ExternalLink,
  FolderGit2,
  Globe,
  GraduationCap,
  Heart,
  Plus,
  Save,
  Sliders,
  Lightbulb,
  Trash2,
  Trophy,
  User,
  Users,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { createResume } from '../../mocks/services/mockService';
import type {
  Resume,
  WorkExperience,
  EducationItem,
  ProjectItem,
  CertificationItem,
  LanguageItem,
  AwardItem,
  ReferenceItem,
} from '../../types/domain';
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

const POPULAR_INTERESTS = [
  'Đóng góp mã nguồn mở (Open Source)',
  'Đọc sách công nghệ & kiến trúc hệ thống',
  'Chạy bộ Marathon & rèn luyện thể thao',
  'Nhiếp ảnh & Thiết kế đồ họa UI/UX',
  'Tham gia các cuộc thi Hackathon',
  'Viết blog chia sẻ kỹ thuật',
  'Học ngoại ngữ mới',
  'Chơi cờ vua & tư duy chiến thuật',
];

interface EnabledSections {
  projects: boolean;
  certifications: boolean;
  interests: boolean;
  languages: boolean;
  awards: boolean;
  references: boolean;
}

export default function CreateResumePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State to control which optional sections the user wants to include
  const [enabledSections, setEnabledSections] = useState<EnabledSections>({
    projects: true,
    certifications: true,
    interests: true,
    languages: false,
    awards: false,
    references: false,
  });

  const [formData, setFormData] = useState<Partial<Resume>>({
    name: 'CV Chuyên Nghiệp - Huy Phước',
    position: 'Nhân viên thu mua/mua hàng',
    language: 'Vietnamese',
    fullName: 'Huy Phước',
    dob: '26/09/2004',
    email: 'phuocphuoc319@gmail.com',
    phone: '0987625111',
    location: 'Quận 9, TP. Hồ Chí Minh',
    website: 'abcd.1234',
    summary:
      'Với hơn 3 năm kinh nghiệm tại vị trí Nhân viên thu mua/mua hàng, tôi đã xây dựng mạng lưới 150+ nhà cung cấp, giúp tối ưu hóa quy trình thu mua và giảm chi phí trung bình xuống 10%. Ngoài ra, tôi còn giao tiếp thành thạo tiếng Anh (IELTS 7.5), tiếng Trung (HSK 5) và sở hữu chứng chỉ CIPS. Tôi tin rằng với kiến thức chuyên môn và kinh nghiệm thực chiến đã tích lũy được sẽ giúp tôi hoàn thành tốt vị trí Nhân viên mua hàng tại Quý công ty. Mục tiêu của tôi trong 3 năm tới là trở thành Chuyên viên thu mua/mua hàng.',
    skills: [
      'Kỹ năng giao tiếp',
      'Kỹ năng đàm phán',
      'Kỹ năng giải quyết vấn đề',
      'Quản lý chuỗi cung ứng',
      'Thương lượng giá & Hợp đồng',
      'Đánh giá nhà cung cấp',
      'Thủ tục xuất nhập khẩu & Hải quan',
      'Phần mềm ERP / SAP',
    ],
    experience: [
      {
        id: 'exp-1',
        role: 'Nhân viên thu mua/mua hàng',
        company: 'SVT Investment & Development Co., Ltd',
        location: 'TP. Hồ Chí Minh',
        startDate: '01/2023',
        endDate: 'Hiện tại',
        isCurrent: true,
        description:
          'Chịu trách nhiệm toàn diện khảo sát thị trường, phát triển mạng lưới nhà cung ứng, đàm phán hợp đồng mua sắm và quản lý chuỗi cung ứng dự án.',
        highlights: [
          'Khảo sát thị trường để tìm kiếm và xây dựng mạng lưới 150+ nhà cung cấp phục vụ cho việc triển khai dự án.',
          'Lập danh sách các nhà cung cấp uy tín, theo dõi và đánh giá hoạt động của nhà cung cấp, lập các đề mục tiêu chuẩn để lựa chọn nhà cung cấp phù hợp với yêu cầu của công ty và từng dự án.',
          'Liên hệ với nhà cung cấp để đàm phán, thương lượng về các điều kiện mua hàng như giá cả, chi phí, điều khoản hợp đồng, tiến độ giao hàng, chất lượng sản phẩm/dịch vụ, v.vv.. giúp tiết kiệm 15% chi phí mua hàng so với ngân sách dự kiến.',
          'Tiếp nhận nhu cầu đặt hàng và tiến hành mua hàng theo quy trình của công ty.',
          'Theo dõi tiến độ quá trình của các đơn hàng để đảm bảo 90% đơn hàng được giao đúng hạn, chất lượng.',
          'Kiểm soát các chứng từ mua bán, nhập khẩu, tờ khai hải quan, giấy phép liên quan đến sản phẩm.',
        ],
      },
      {
        id: 'exp-2',
        role: 'Thực tập sinh mua hàng',
        company: 'MW Joint Stock Company',
        location: 'TP. Hồ Chí Minh',
        startDate: '06/2022',
        endDate: '12/2022',
        isCurrent: false,
        description:
          'Hỗ trợ nghiệp vụ bộ phận Thu mua trong việc khảo sát giá, tạo đơn hàng, hợp đồng và đối chiếu công nợ nhà cung cấp.',
        highlights: [
          'Hỗ trợ bộ phận Thu mua trong việc tìm kiếm, khảo sát và lựa chọn nhà cung cấp.',
          'Hỗ trợ thu thập thông tin, so sánh giá cả, chất lượng sản phẩm từ các nhà cung cấp.',
          'Hỗ trợ xử lý yêu cầu đặt hàng, tạo đơn hàng, hợp đồng và theo dõi tiến độ, tình trạng đơn hàng, đảm bảo các đơn hàng được giao đúng hạn.',
          'Kiểm tra và đối chiếu các hóa đơn, chứng từ thanh toán của nhà cung cấp.',
          'Tham gia nghiên cứu thị trường nhằm tìm kiếm, đánh giá các nguồn cung ứng tiềm năng.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        school: 'Đại học TopCV',
        degree: 'Chuyên ngành: Logistics và Quản trị cung ứng',
        field: 'Logistics và Quản trị cung ứng',
        startDate: '08/2019',
        endDate: '04/2023',
        gpa: '3.4 (Giỏi)',
      },
    ],
    projects: [
      {
        id: 'proj-1',
        name: 'Mô hình chuẩn hóa quản trị 150+ nhà cung cấp SVT',
        role: 'Chủ trì dự án thu mua',
        techStack: ['SAP ERP', 'Vendor Scoring', 'Procurement Analytics'],
        link: 'https://abcd.1234',
        description:
          'Xây dựng quy trình đánh giá định kỳ và phân hạng nhà cung cấp, giúp giảm 15% chi phí mua sắm và đạt 90% giao hàng đúng hạn.',
      },
    ],
    certifications: [
      {
        id: 'cert-1',
        name: 'CIPS (Chartered Institute of Procurement & Supply)',
        issuer: 'Chartered Institute of Procurement & Supply',
        date: '2024',
        link: 'https://www.cips.org/qualifications',
      },
      {
        id: 'cert-2',
        name: 'CPP (Certified Purchasing Professional)',
        issuer: 'American Purchasing Society',
        date: '2024',
        link: 'https://american-purchasing.com/cpp',
      },
    ],
    interests: ['Đóng góp mã nguồn mở (Open Source)', 'Đọc sách công nghệ & chuỗi cung ứng', 'Chạy bộ Marathon'],
    languages: [
      { id: 'lang-1', name: 'Tiếng Anh', level: 'IELTS 7.5' },
      { id: 'lang-2', name: 'Tiếng Trung', level: 'HSK 5' },
      { id: 'lang-3', name: 'Tiếng Việt', level: 'Bản ngữ (Native)' },
    ],
    awards: [
      {
        id: 'award-1',
        title: 'Employee of the Year Award',
        issuer: 'SVT Investment & Development Co., Ltd',
        year: '2024',
        description: 'Vinh danh nhân viên xuất sắc với thành tích tiết kiệm 15% chi phí mua hàng và mở rộng mạng lưới 150+ nhà cung cấp.',
      },
      {
        id: 'award-2',
        title: 'Top Performer of the Year',
        issuer: 'MW Joint Stock Company',
        year: '2022',
        description: 'Thực tập sinh xuất sắc trong công tác xử lý đơn hàng và nghiên cứu thị trường cung ứng.',
      },
    ],
    references: [
      {
        id: 'ref-1',
        fullName: 'Đỗ Quỳnh Mai',
        company: 'SVT Investment & Development Co., Ltd',
        position: 'HR Director',
        phone: '(024) 6680 5588',
      },
    ],
  });

  const [newSkillInput, setNewSkillInput] = useState('');
  const [newInterestInput, setNewInterestInput] = useState('');

  // Toggle optional section
  const toggleSection = (section: keyof EnabledSections) => {
    setEnabledSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Dynamic ATS Score Estimator
  const calculateEstimatedAts = () => {
    let score = 50;
    if (formData.name && formData.position) score += 5;
    if (formData.summary && formData.summary.length > 40) score += 10;
    if (formData.experience && formData.experience.length >= 1) score += 10;
    if (formData.experience && formData.experience.length >= 2) score += 5;
    if (formData.skills && formData.skills.length >= 5) score += 8;
    if (formData.education && formData.education.length >= 1) score += 5;

    // Optional sections bonuses
    if (enabledSections.projects && formData.projects && formData.projects.length >= 1) {
      score += 6;
      // Bonus if any project contains an accessible recruiter link
      if (formData.projects.some((p) => p.link && p.link.startsWith('http'))) {
        score += 3;
      }
    }
    if (enabledSections.certifications && formData.certifications && formData.certifications.length >= 1) {
      score += 5;
    }
    if (enabledSections.languages && formData.languages && formData.languages.length >= 1) {
      score += 3;
    }
    if (enabledSections.awards && formData.awards && formData.awards.length >= 1) {
      score += 2;
    }
    if (enabledSections.interests && formData.interests && formData.interests.length >= 2) {
      score += 2;
    }

    return Math.min(score, 98);
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
    // Only persist items from active/enabled sections
    const payload: Partial<Resume> = {
      ...formData,
      projects: enabledSections.projects
        ? (formData.projects || []).filter((p) => p.name?.trim())
        : [],
      certifications: enabledSections.certifications
        ? (formData.certifications || []).filter((c) => c.name?.trim())
        : [],
      interests: enabledSections.interests
        ? (formData.interests || []).filter((i) => i.trim())
        : [],
      languages: enabledSections.languages
        ? (formData.languages || []).filter((l) => l.name?.trim())
        : [],
      awards: enabledSections.awards
        ? (formData.awards || []).filter((a) => a.title?.trim())
        : [],
      references: enabledSections.references
        ? (formData.references || []).filter((r) => r.fullName?.trim())
        : [],
      status,
      atsScore: estimatedScore,
    };

    createMutation.mutate(payload);
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

  // Interest management
  const handleAddInterest = (interest: string) => {
    const trimmed = interest.trim();
    if (!trimmed) return;
    const current = formData.interests || [];
    if (!current.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, interests: [...current, trimmed] }));
    }
    setNewInterestInput('');
  };

  const handleRemoveInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: (prev.interests || []).filter((i) => i !== interest),
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

  // Projects management
  const handleAddProject = () => {
    const newItem: ProjectItem = {
      id: `proj-${Date.now()}`,
      name: '',
      role: '',
      techStack: [],
      link: '',
      description: '',
    };
    setFormData((prev) => ({
      ...prev,
      projects: [...(prev.projects || []), newItem],
    }));
  };

  const handleUpdateProject = (index: number, field: keyof ProjectItem, val: any) => {
    const list = [...(formData.projects || [])];
    if (list[index]) {
      list[index] = { ...list[index], [field]: val };
      setFormData((prev) => ({ ...prev, projects: list }));
    }
  };

  const handleRemoveProject = (index: number) => {
    const list = [...(formData.projects || [])];
    list.splice(index, 1);
    setFormData((prev) => ({ ...prev, projects: list }));
  };

  // Certifications management
  const handleAddCertification = () => {
    const newItem: CertificationItem = {
      id: `cert-${Date.now()}`,
      name: '',
      issuer: '',
      date: '',
      link: '',
    };
    setFormData((prev) => ({
      ...prev,
      certifications: [...(prev.certifications || []), newItem],
    }));
  };

  const handleUpdateCertification = (index: number, field: keyof CertificationItem, val: any) => {
    const list = [...(formData.certifications || [])];
    if (list[index]) {
      list[index] = { ...list[index], [field]: val };
      setFormData((prev) => ({ ...prev, certifications: list }));
    }
  };

  const handleRemoveCertification = (index: number) => {
    const list = [...(formData.certifications || [])];
    list.splice(index, 1);
    setFormData((prev) => ({ ...prev, certifications: list }));
  };

  // Languages management
  const handleAddLanguage = () => {
    const newItem: LanguageItem = {
      id: `lang-${Date.now()}`,
      name: '',
      level: 'Thành thạo (C1/C2)',
    };
    setFormData((prev) => ({
      ...prev,
      languages: [...(prev.languages || []), newItem],
    }));
  };

  const handleUpdateLanguage = (index: number, field: keyof LanguageItem, val: any) => {
    const list = [...(formData.languages || [])];
    if (list[index]) {
      list[index] = { ...list[index], [field]: val };
      setFormData((prev) => ({ ...prev, languages: list }));
    }
  };

  const handleRemoveLanguage = (index: number) => {
    const list = [...(formData.languages || [])];
    list.splice(index, 1);
    setFormData((prev) => ({ ...prev, languages: list }));
  };

  // Awards management
  const handleAddAward = () => {
    const newItem: AwardItem = {
      id: `award-${Date.now()}`,
      title: '',
      issuer: '',
      year: new Date().getFullYear().toString(),
      description: '',
    };
    setFormData((prev) => ({
      ...prev,
      awards: [...(prev.awards || []), newItem],
    }));
  };

  const handleUpdateAward = (index: number, field: keyof AwardItem, val: any) => {
    const list = [...(formData.awards || [])];
    if (list[index]) {
      list[index] = { ...list[index], [field]: val };
      setFormData((prev) => ({ ...prev, awards: list }));
    }
  };

  const handleRemoveAward = (index: number) => {
    const list = [...(formData.awards || [])];
    list.splice(index, 1);
    setFormData((prev) => ({ ...prev, awards: list }));
  };

  // References management
  const handleAddReference = () => {
    const newItem: ReferenceItem = {
      id: `ref-${Date.now()}`,
      fullName: '',
      company: '',
      position: '',
      email: '',
      phone: '',
    };
    setFormData((prev) => ({
      ...prev,
      references: [...(prev.references || []), newItem],
    }));
  };

  const handleUpdateReference = (index: number, field: keyof ReferenceItem, val: any) => {
    const list = [...(formData.references || [])];
    if (list[index]) {
      list[index] = { ...list[index], [field]: val };
      setFormData((prev) => ({ ...prev, references: list }));
    }
  };

  const handleRemoveReference = (index: number) => {
    const list = [...(formData.references || [])];
    list.splice(index, 1);
    setFormData((prev) => ({ ...prev, references: list }));
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
          {/* SECTION PICKER / CHECKLIST */}
          <Card className="border-brand-200 bg-brand-50/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-600 text-white">
                  <Sliders size={15} />
                </span>
                <div>
                  <h3 className="text-sm font-medium text-slate-900">
                    Tùy chọn mục bổ sung cho CV
                  </h3>
                  <p className="text-2xs text-slate-500">
                    Tick chọn các phần bạn muốn hiển thị và điền vào bản CV của mình
                  </p>
                </div>
              </div>
              <span className="text-2xs font-semibold text-brand-700 bg-brand-100/70 px-2 py-0.5 rounded-full">
                {Object.values(enabledSections).filter(Boolean).length}/6 mục đang chọn
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
              {/* Projects Toggle */}
              <button
                type="button"
                onClick={() => toggleSection('projects')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  enabledSections.projects
                    ? 'border-brand-500 bg-brand-50/80 shadow-2xs'
                    : 'border-slate-200 bg-surface hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-lg text-xs ${
                      enabledSections.projects
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <FolderGit2 size={13} />
                  </span>
                  <div
                    className={`h-4 w-4 rounded-md border flex items-center justify-center transition ${
                      enabledSections.projects
                        ? 'bg-brand-600 border-brand-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {enabledSections.projects && <Check size={11} strokeWidth={3} />}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-900">Dự án nổi bật</p>
                  <p className="text-2xs text-slate-500 mt-0.5">Gắn link Demo / GitHub</p>
                </div>
              </button>

              {/* Certifications Toggle */}
              <button
                type="button"
                onClick={() => toggleSection('certifications')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  enabledSections.certifications
                    ? 'border-brand-500 bg-brand-50/80 shadow-2xs'
                    : 'border-slate-200 bg-surface hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-lg text-xs ${
                      enabledSections.certifications
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Award size={13} />
                  </span>
                  <div
                    className={`h-4 w-4 rounded-md border flex items-center justify-center transition ${
                      enabledSections.certifications
                        ? 'bg-brand-600 border-brand-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {enabledSections.certifications && <Check size={11} strokeWidth={3} />}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-900">Chứng chỉ & Bằng</p>
                  <p className="text-2xs text-slate-500 mt-0.5">Chứng chỉ xác thực</p>
                </div>
              </button>

              {/* Interests Toggle */}
              <button
                type="button"
                onClick={() => toggleSection('interests')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  enabledSections.interests
                    ? 'border-rose-500 bg-rose-50/80 shadow-2xs'
                    : 'border-slate-200 bg-surface hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-lg text-xs ${
                      enabledSections.interests
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Heart size={13} />
                  </span>
                  <div
                    className={`h-4 w-4 rounded-md border flex items-center justify-center transition ${
                      enabledSections.interests
                        ? 'bg-rose-600 border-rose-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {enabledSections.interests && <Check size={11} strokeWidth={3} />}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-900">Sở thích cá nhân</p>
                  <p className="text-2xs text-slate-500 mt-0.5">Văn hóa & cá tính</p>
                </div>
              </button>

              {/* Languages Toggle */}
              <button
                type="button"
                onClick={() => toggleSection('languages')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  enabledSections.languages
                    ? 'border-amber-500 bg-amber-50/80 shadow-2xs'
                    : 'border-slate-200 bg-surface hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-lg text-xs ${
                      enabledSections.languages
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Globe size={13} />
                  </span>
                  <div
                    className={`h-4 w-4 rounded-md border flex items-center justify-center transition ${
                      enabledSections.languages
                        ? 'bg-amber-600 border-amber-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {enabledSections.languages && <Check size={11} strokeWidth={3} />}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-900">Ngoại ngữ</p>
                  <p className="text-2xs text-slate-500 mt-0.5">Trình độ & chứng chỉ</p>
                </div>
              </button>

              {/* Awards Toggle */}
              <button
                type="button"
                onClick={() => toggleSection('awards')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  enabledSections.awards
                    ? 'border-emerald-500 bg-emerald-50/80 shadow-2xs'
                    : 'border-slate-200 bg-surface hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-lg text-xs ${
                      enabledSections.awards
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Trophy size={13} />
                  </span>
                  <div
                    className={`h-4 w-4 rounded-md border flex items-center justify-center transition ${
                      enabledSections.awards
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {enabledSections.awards && <Check size={11} strokeWidth={3} />}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-900">Giải thưởng</p>
                  <p className="text-2xs text-slate-500 mt-0.5">Thành tích & vinh danh</p>
                </div>
              </button>

              {/* References Toggle */}
              <button
                type="button"
                onClick={() => toggleSection('references')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  enabledSections.references
                    ? 'border-brand-500 bg-brand-50/80 shadow-2xs'
                    : 'border-slate-200 bg-surface hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-lg text-xs ${
                      enabledSections.references
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Users size={13} />
                  </span>
                  <div
                    className={`h-4 w-4 rounded-md border flex items-center justify-center transition ${
                      enabledSections.references
                        ? 'bg-brand-600 border-brand-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {enabledSections.references && <Check size={11} strokeWidth={3} />}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-900">Người tham chiếu</p>
                  <p className="text-2xs text-slate-500 mt-0.5">Bảo chứng uy tín</p>
                </div>
              </button>
            </div>
          </Card>

          {/* Section 1: Thông tin chung & Liên hệ */}
          <Card>
            <div className="border-b border-slate-100 pb-3 mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-brand-600">
                  <User size={15} />
                </span>
                <h3 className="text-base font-medium text-slate-900">
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
                  className="w-full rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand-500"
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
                  className="w-full rounded-xl border border-slate-200 bg-surface p-3 text-xs outline-none focus:border-brand-500"
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
                <h3 className="text-base font-medium text-slate-900">
                  2. Kinh nghiệm làm việc (Work Experience)
                </h3>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddExperience}
                className="text-xs py-1.5 px-3"
              >
                <Plus size={13} />
                {t('resumes.addExperience')}
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
                    className="absolute right-3 top-3 text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                    title="Xóa kinh nghiệm này"
                  >
                    <Trash2 size={15} />
                  </button>

                  <div className="grid gap-3 sm:grid-cols-2 pr-8">
                    <div>
                      <label className="text-2xs font-semibold text-slate-500 mb-1 block">
                        Chức danh
                      </label>
                      <Input
                        value={exp.role}
                        onChange={(e) => handleUpdateExperience(idx, 'role', e.target.value)}
                        placeholder="Ví dụ: Senior Frontend Engineer"
                        className="bg-surface"
                      />
                    </div>
                    <div>
                      <label className="text-2xs font-semibold text-slate-500 mb-1 block">
                        Tên công ty
                      </label>
                      <Input
                        value={exp.company}
                        onChange={(e) => handleUpdateExperience(idx, 'company', e.target.value)}
                        placeholder="Ví dụ: Nexus Tech Global"
                        className="bg-surface"
                      />
                    </div>
                    <div>
                      <label className="text-2xs font-semibold text-slate-500 mb-1 block">
                        Từ ngày (MM/YYYY)
                      </label>
                      <Input
                        value={exp.startDate}
                        onChange={(e) => handleUpdateExperience(idx, 'startDate', e.target.value)}
                        placeholder="03/2022"
                        className="bg-surface"
                      />
                    </div>
                    <div>
                      <label className="text-2xs font-semibold text-slate-500 mb-1 block">
                        Đến ngày
                      </label>
                      <Input
                        value={exp.endDate}
                        onChange={(e) => handleUpdateExperience(idx, 'endDate', e.target.value)}
                        placeholder="Hiện tại hoặc MM/YYYY"
                        className="bg-surface"
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
                      placeholder="Mô tả công việc và các số liệu thành tích cụ thể..."
                      className="w-full rounded-xl border border-slate-200 bg-surface p-2.5 text-xs outline-none focus:border-brand-500"
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
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-brand-600">
                  <GraduationCap size={15} />
                </span>
                <h3 className="text-base font-medium text-slate-900">
                  3. Học vấn & Bằng cấp (Education)
                </h3>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddEducation}
                className="text-xs py-1.5 px-3"
              >
                <Plus size={13} />
                {t('resumes.addEducation')}
              </Button>
            </div>

            <div className="space-y-4">
              {formData.education?.map((edu, idx) => (
                <div
                  key={edu.id || idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 relative space-y-3"
                >
                  <button
                    type="button"
                    onClick={() => handleRemoveEducation(idx)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                    title="Xóa học vấn này"
                  >
                    <Trash2 size={15} />
                  </button>

                  <div className="grid gap-3 sm:grid-cols-2 pr-8">
                    <div>
                      <label className="text-2xs font-semibold text-slate-500 mb-1 block">
                        Trường đại học / Cơ sở đào tạo
                      </label>
                      <Input
                        value={edu.school}
                        onChange={(e) => handleUpdateEducation(idx, 'school', e.target.value)}
                        placeholder="Ví dụ: Đại học Bách Khoa"
                        className="bg-surface"
                      />
                    </div>
                    <div>
                      <label className="text-2xs font-semibold text-slate-500 mb-1 block">
                        Bằng cấp & Chuyên ngành
                      </label>
                      <Input
                        value={edu.degree}
                        onChange={(e) => handleUpdateEducation(idx, 'degree', e.target.value)}
                        placeholder="Ví dụ: Cử nhân Khoa học Máy tính"
                        className="bg-surface"
                      />
                    </div>
                    <div>
                      <label className="text-2xs font-semibold text-slate-500 mb-1 block">
                        Niên khóa (VD: 2016 - 2020)
                      </label>
                      <Input
                        value={`${edu.startDate || ''} - ${edu.endDate || ''}`}
                        onChange={(e) => {
                          const parts = e.target.value.split('-');
                          handleUpdateEducation(idx, 'startDate', parts[0]?.trim());
                          handleUpdateEducation(idx, 'endDate', parts[1]?.trim());
                        }}
                        placeholder="2016 - 2020"
                        className="bg-surface"
                      />
                    </div>
                    <div>
                      <label className="text-2xs font-semibold text-slate-500 mb-1 block">
                        Điểm GPA / Xếp loại
                      </label>
                      <Input
                        value={edu.gpa || ''}
                        onChange={(e) => handleUpdateEducation(idx, 'gpa', e.target.value)}
                        placeholder="Ví dụ: 3.6 / 4.0 (Giỏi)"
                        className="bg-surface"
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
                <h3 className="text-base font-medium text-slate-900">
                  4. Kỹ năng chuyên môn (Skills & Tools)
                </h3>
              </div>
              <span className="text-xs font-medium text-brand-600">
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
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleAddSkill(newSkillInput)}
              >
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
                        has
                          ? 'bg-slate-100 text-slate-400'
                          : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
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
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-surface px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs"
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

          {/* DYNAMIC SECTION 5: DỰ ÁN NỔI BẬT (PROJECTS WITH RECRUITER LINK) */}
          {enabledSections.projects && (
            <Card className="border-brand-100">
              <div className="border-b border-slate-100 pb-3 mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-brand-600">
                    <FolderGit2 size={15} />
                  </span>
                  <div>
                    <h3 className="text-base font-medium text-slate-900 flex items-center gap-2">
                      5. Dự án nổi bật (Key Projects)
                      <span className="text-2xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                        +9 điểm ATS & Gắn link
                      </span>
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddProject}
                    className="text-xs py-1.5 px-3"
                  >
                    <Plus size={13} />
                    Thêm dự án
                  </Button>
                  <button
                    type="button"
                    onClick={() => toggleSection('projects')}
                    className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 cursor-pointer"
                    title="Ẩn mục này"
                  >
                    Ẩn mục
                  </button>
                </div>
              </div>

              <div className="mb-4 rounded-xl bg-brand-50/60 p-3 text-2xs text-brand-800 border border-brand-100 flex items-start gap-2">
                <Lightbulb size={14} className="text-brand-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Mẹo phỏng vấn:</strong> Hãy gắn đường dẫn (link) trang web live demo hoặc
                  kho lưu trữ GitHub của dự án. Nhà tuyển dụng có thể nhấp trực tiếp vào xem sản phẩm
                  thực tế để đánh giá tư duy kiến trúc và kỹ năng lập trình của bạn!
                </span>
              </div>

              <div className="space-y-4">
                {(formData.projects || []).map((proj, idx) => (
                  <div
                    key={proj.id || idx}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 relative space-y-3"
                  >
                    <button
                      type="button"
                      onClick={() => handleRemoveProject(idx)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                      title="Xóa dự án này"
                    >
                      <Trash2 size={15} />
                    </button>

                    <div className="grid gap-3 sm:grid-cols-2 pr-8">
                      <div>
                        <label className="text-2xs font-semibold text-slate-600 mb-1 block">
                          Tên dự án *
                        </label>
                        <Input
                          value={proj.name}
                          onChange={(e) => handleUpdateProject(idx, 'name', e.target.value)}
                          placeholder="Ví dụ: AI Career Intelligence Portal"
                          className="bg-surface"
                        />
                      </div>
                      <div>
                        <label className="text-2xs font-semibold text-slate-600 mb-1 block">
                          Vai trò trong dự án
                        </label>
                        <Input
                          value={proj.role || ''}
                          onChange={(e) => handleUpdateProject(idx, 'role', e.target.value)}
                          placeholder="Ví dụ: Lead Frontend Developer / Contributor"
                          className="bg-surface"
                        />
                      </div>

                      {/* Project Link with Live Preview button */}
                      <div className="sm:col-span-2">
                        <label className="text-2xs font-semibold text-slate-600 mb-1 block">
                          Đường dẫn dự án / Live Demo / GitHub (dành cho bên tuyển dụng xem)
                        </label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={proj.link || ''}
                            onChange={(e) => handleUpdateProject(idx, 'link', e.target.value)}
                            placeholder="https://github.com/username/project hoặc https://my-demo-app.com"
                            className="bg-surface font-mono text-xs"
                          />
                          {proj.link && (
                            <a
                              href={proj.link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 shrink-0 rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-100 border border-brand-200 transition"
                            >
                              <ExternalLink size={13} />
                              Mở xem thử
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-2xs font-semibold text-slate-600 mb-1 block">
                          Công nghệ sử dụng (ngăn cách bằng dấu phẩy)
                        </label>
                        <Input
                          value={
                            Array.isArray(proj.techStack)
                              ? proj.techStack.join(', ')
                              : proj.techStack || ''
                          }
                          onChange={(e) =>
                            handleUpdateProject(
                              idx,
                              'techStack',
                              e.target.value
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean)
                            )
                          }
                          placeholder="React, TypeScript, Tailwind CSS, REST APIs"
                          className="bg-surface"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-2xs font-semibold text-slate-600 mb-1 block">
                        Mô tả tóm tắt giải pháp & thành tựu đạt được
                      </label>
                      <textarea
                        rows={2}
                        value={proj.description}
                        onChange={(e) => handleUpdateProject(idx, 'description', e.target.value)}
                        placeholder="Nêu tóm tắt mục tiêu dự án, giải pháp kỹ thuật và kết quả (VD: phục vụ 10,000+ người dùng, tăng tốc độ xử lý 40%)..."
                        className="w-full rounded-xl border border-slate-200 bg-surface p-2.5 text-xs outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>
                ))}

                {(formData.projects || []).length === 0 && (
                  <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="text-xs text-slate-500 mb-2">Chưa có dự án nào được thêm.</p>
                    <Button type="button" variant="secondary" onClick={handleAddProject} className="text-xs">
                      <Plus size={13} /> Thêm dự án đầu tiên
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* DYNAMIC SECTION 6: CHỨNG CHỈ & BẰNG CẤP (CERTIFICATIONS) */}
          {enabledSections.certifications && (
            <Card className="border-brand-100">
              <div className="border-b border-slate-100 pb-3 mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-brand-600">
                    <Award size={15} />
                  </span>
                  <div>
                    <h3 className="text-base font-medium text-slate-900 flex items-center gap-2">
                      6. Chứng chỉ & Chứng nhận (Certifications)
                      <span className="text-2xs font-semibold bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full border border-brand-200">
                        +5 điểm ATS
                      </span>
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddCertification}
                    className="text-xs py-1.5 px-3"
                  >
                    <Plus size={13} />
                    Thêm chứng chỉ
                  </Button>
                  <button
                    type="button"
                    onClick={() => toggleSection('certifications')}
                    className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 cursor-pointer"
                    title="Ẩn mục này"
                  >
                    Ẩn mục
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {(formData.certifications || []).map((cert, idx) => (
                  <div
                    key={cert.id || idx}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 relative space-y-3"
                  >
                    <button
                      type="button"
                      onClick={() => handleRemoveCertification(idx)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                      title="Xóa chứng chỉ này"
                    >
                      <Trash2 size={15} />
                    </button>

                    <div className="grid gap-3 sm:grid-cols-2 pr-8">
                      <div>
                        <label className="text-2xs font-semibold text-slate-600 mb-1 block">
                          Tên chứng chỉ *
                        </label>
                        <Input
                          value={cert.name}
                          onChange={(e) => handleUpdateCertification(idx, 'name', e.target.value)}
                          placeholder="Ví dụ: AWS Certified Solutions Architect"
                          className="bg-surface"
                        />
                      </div>
                      <div>
                        <label className="text-2xs font-semibold text-slate-600 mb-1 block">
                          Tổ chức cấp bằng *
                        </label>
                        <Input
                          value={cert.issuer}
                          onChange={(e) => handleUpdateCertification(idx, 'issuer', e.target.value)}
                          placeholder="Ví dụ: Amazon Web Services / Meta"
                          className="bg-surface"
                        />
                      </div>
                      <div>
                        <label className="text-2xs font-semibold text-slate-600 mb-1 block">
                          Năm / Thời gian cấp
                        </label>
                        <Input
                          value={cert.date}
                          onChange={(e) => handleUpdateCertification(idx, 'date', e.target.value)}
                          placeholder="Ví dụ: 2023 hoặc 08/2023"
                          className="bg-surface"
                        />
                      </div>
                      <div>
                        <label className="text-2xs font-semibold text-slate-600 mb-1 block">
                          Đường dẫn xác thực (Credential URL)
                        </label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={cert.link || ''}
                            onChange={(e) => handleUpdateCertification(idx, 'link', e.target.value)}
                            placeholder="https://credly.com/badges/..."
                            className="bg-surface font-mono text-xs"
                          />
                          {cert.link && (
                            <a
                              href={cert.link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 shrink-0 rounded-xl bg-brand-50 px-2.5 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-100 border border-brand-200 transition"
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {(formData.certifications || []).length === 0 && (
                  <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="text-xs text-slate-500 mb-2">Chưa có chứng chỉ nào được thêm.</p>
                    <Button type="button" variant="secondary" onClick={handleAddCertification} className="text-xs">
                      <Plus size={13} /> Thêm chứng chỉ đầu tiên
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* DYNAMIC SECTION 7: SỞ THÍCH CÁ NHÂN (INTERESTS) */}
          {enabledSections.interests && (
            <Card className="border-rose-100">
              <div className="border-b border-slate-100 pb-3 mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-rose-50 text-rose-600">
                    <Heart size={15} />
                  </span>
                  <div>
                    <h3 className="text-base font-medium text-slate-900 flex items-center gap-2">
                      7. Sở thích & Điểm mạnh cá nhân (Interests)
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSection('interests')}
                  className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 cursor-pointer"
                  title="Ẩn mục này"
                >
                  Ẩn mục
                </button>
              </div>

              <div className="flex gap-2 mb-3">
                <Input
                  value={newInterestInput}
                  onChange={(e) => setNewInterestInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddInterest(newInterestInput);
                    }
                  }}
                  placeholder="Nhập sở thích hoặc điểm mạnh cá nhân và nhấn Enter..."
                  className="max-w-md"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleAddInterest(newInterestInput)}
                >
                  <Plus size={15} /> Thêm
                </Button>
              </div>

              {/* Suggestions */}
              <div className="mb-4">
                <p className="text-2xs text-slate-500 font-medium mb-1.5">Gợi ý nhanh:</p>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_INTERESTS.map((item) => {
                    const has = (formData.interests || []).includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        disabled={has}
                        onClick={() => handleAddInterest(item)}
                        className={`rounded-md px-2.5 py-1 text-2xs font-medium transition cursor-pointer ${
                          has
                            ? 'bg-slate-100 text-slate-400'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        + {item}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tag List */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                {(formData.interests || []).map((interest) => (
                  <span
                    key={interest}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/50 px-3 py-1.5 text-xs font-semibold text-rose-900 shadow-2xs"
                  >
                    <span>{interest}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveInterest(interest)}
                      className="text-rose-400 hover:text-rose-700 transition cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
                {(formData.interests || []).length === 0 && (
                  <span className="text-xs text-slate-400 italic">
                    Chưa thêm sở thích nào. Hãy chọn từ gợi ý hoặc gõ sở thích của bạn vào ô trên.
                  </span>
                )}
              </div>
            </Card>
          )}

          {/* DYNAMIC SECTION 8: NGOẠI NGỮ (LANGUAGES) */}
          {enabledSections.languages && (
            <Card className="border-amber-100">
              <div className="border-b border-slate-100 pb-3 mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-50 text-amber-600">
                    <Globe size={15} />
                  </span>
                  <div>
                    <h3 className="text-base font-medium text-slate-900 flex items-center gap-2">
                      8. Trình độ ngoại ngữ (Languages)
                      <span className="text-2xs font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                        +3 điểm ATS
                      </span>
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddLanguage}
                    className="text-xs py-1.5 px-3"
                  >
                    <Plus size={13} />
                    Thêm ngoại ngữ
                  </Button>
                  <button
                    type="button"
                    onClick={() => toggleSection('languages')}
                    className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 cursor-pointer"
                    title="Ẩn mục này"
                  >
                    Ẩn mục
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {(formData.languages || []).map((lang, idx) => (
                  <div
                    key={lang.id || idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 relative flex items-center gap-3 pr-10"
                  >
                    <div className="flex-1">
                      <label className="text-2xs font-semibold text-slate-600 mb-1 block">
                        Ngôn ngữ *
                      </label>
                      <Input
                        value={lang.name}
                        onChange={(e) => handleUpdateLanguage(idx, 'name', e.target.value)}
                        placeholder="Tiếng Anh, Tiếng Nhật, Tiếng Trung..."
                        className="bg-surface"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-2xs font-semibold text-slate-600 mb-1 block">
                        Trình độ / Bằng cấp
                      </label>
                      <Input
                        value={lang.level}
                        onChange={(e) => handleUpdateLanguage(idx, 'level', e.target.value)}
                        placeholder="Bản ngữ, Thành thạo (C1), IELTS 7.5, JLPT N2..."
                        className="bg-surface"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLanguage(idx)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                      title="Xóa ngoại ngữ này"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}

                {(formData.languages || []).length === 0 && (
                  <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="text-xs text-slate-500 mb-2">Chưa có ngoại ngữ nào được thêm.</p>
                    <Button type="button" variant="secondary" onClick={handleAddLanguage} className="text-xs">
                      <Plus size={13} /> Thêm ngoại ngữ đầu tiên
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* DYNAMIC SECTION 9: GIẢI THƯỞNG & THÀNH TỰU (AWARDS) */}
          {enabledSections.awards && (
            <Card className="border-emerald-100">
              <div className="border-b border-slate-100 pb-3 mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Trophy size={15} />
                  </span>
                  <div>
                    <h3 className="text-base font-medium text-slate-900 flex items-center gap-2">
                      9. Giải thưởng & Thành tựu (Awards & Honors)
                      <span className="text-2xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                        +2 điểm ATS
                      </span>
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddAward}
                    className="text-xs py-1.5 px-3"
                  >
                    <Plus size={13} />
                    Thêm giải thưởng
                  </Button>
                  <button
                    type="button"
                    onClick={() => toggleSection('awards')}
                    className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 cursor-pointer"
                    title="Ẩn mục này"
                  >
                    Ẩn mục
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {(formData.awards || []).map((award, idx) => (
                  <div
                    key={award.id || idx}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 relative space-y-3"
                  >
                    <button
                      type="button"
                      onClick={() => handleRemoveAward(idx)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                      title="Xóa giải thưởng này"
                    >
                      <Trash2 size={15} />
                    </button>

                    <div className="grid gap-3 sm:grid-cols-2 pr-8">
                      <div>
                        <label className="text-2xs font-semibold text-slate-600 mb-1 block">
                          Tên giải thưởng / Danh hiệu *
                        </label>
                        <Input
                          value={award.title}
                          onChange={(e) => handleUpdateAward(idx, 'title', e.target.value)}
                          placeholder="Ví dụ: Giải Nhất Hackathon Web AI"
                          className="bg-surface"
                        />
                      </div>
                      <div>
                        <label className="text-2xs font-semibold text-slate-600 mb-1 block">
                          Đơn vị trao giải
                        </label>
                        <Input
                          value={award.issuer}
                          onChange={(e) => handleUpdateAward(idx, 'issuer', e.target.value)}
                          placeholder="Ví dụ: Google Developers / Bộ GD&ĐT"
                          className="bg-surface"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-2xs font-semibold text-slate-600 mb-1 block">
                          Năm đạt giải
                        </label>
                        <Input
                          value={award.year}
                          onChange={(e) => handleUpdateAward(idx, 'year', e.target.value)}
                          placeholder="2023"
                          className="bg-surface max-w-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-2xs font-semibold text-slate-600 mb-1 block">
                        Mô tả tóm tắt giải thưởng
                      </label>
                      <textarea
                        rows={2}
                        value={award.description || ''}
                        onChange={(e) => handleUpdateAward(idx, 'description', e.target.value)}
                        placeholder="Mô tả cuộc thi, số lượng đội tham gia hoặc điểm nổi bật của giải pháp..."
                        className="w-full rounded-xl border border-slate-200 bg-surface p-2.5 text-xs outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>
                ))}

                {(formData.awards || []).length === 0 && (
                  <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="text-xs text-slate-500 mb-2">Chưa có giải thưởng nào được thêm.</p>
                    <Button type="button" variant="secondary" onClick={handleAddAward} className="text-xs">
                      <Plus size={13} /> Thêm giải thưởng đầu tiên
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* DYNAMIC SECTION 10: NGƯỜI THAM CHIẾU (REFERENCES) */}
          {enabledSections.references && (
            <Card className="border-brand-100">
              <div className="border-b border-slate-100 pb-3 mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-brand-600">
                    <Users size={15} />
                  </span>
                  <div>
                    <h3 className="text-base font-medium text-slate-900 flex items-center gap-2">
                      10. Người tham chiếu (References)
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddReference}
                    className="text-xs py-1.5 px-3"
                  >
                    <Plus size={13} />
                    Thêm người tham chiếu
                  </Button>
                  <button
                    type="button"
                    onClick={() => toggleSection('references')}
                    className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 cursor-pointer"
                    title="Ẩn mục này"
                  >
                    Ẩn mục
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {(formData.references || []).map((refItem, idx) => (
                  <div
                    key={refItem.id || idx}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 relative space-y-3"
                  >
                    <button
                      type="button"
                      onClick={() => handleRemoveReference(idx)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                      title="Xóa người tham chiếu này"
                    >
                      <Trash2 size={15} />
                    </button>

                    <div className="grid gap-3 sm:grid-cols-2 pr-8">
                      <div>
                        <label className="text-2xs font-semibold text-slate-600 mb-1 block">
                          Họ và tên người tham chiếu *
                        </label>
                        <Input
                          value={refItem.fullName}
                          onChange={(e) => handleUpdateReference(idx, 'fullName', e.target.value)}
                          placeholder="Ví dụ: Trần Minh Đức"
                          className="bg-surface"
                        />
                      </div>
                      <div>
                        <label className="text-2xs font-semibold text-slate-600 mb-1 block">
                          Chức vụ & Tổ chức / Công ty
                        </label>
                        <Input
                          value={refItem.position}
                          onChange={(e) => handleUpdateReference(idx, 'position', e.target.value)}
                          placeholder="Ví dụ: Engineering Director tại Nexus Tech"
                          className="bg-surface"
                        />
                      </div>
                      <div>
                        <label className="text-2xs font-semibold text-slate-600 mb-1 block">
                          Email liên hệ
                        </label>
                        <Input
                          value={refItem.email || ''}
                          onChange={(e) => handleUpdateReference(idx, 'email', e.target.value)}
                          placeholder="duc.tran@company.com"
                          className="bg-surface"
                        />
                      </div>
                      <div>
                        <label className="text-2xs font-semibold text-slate-600 mb-1 block">
                          Số điện thoại
                        </label>
                        <Input
                          value={refItem.phone || ''}
                          onChange={(e) => handleUpdateReference(idx, 'phone', e.target.value)}
                          placeholder="(+84) 903 888 999"
                          className="bg-surface"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {(formData.references || []).length === 0 && (
                  <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="text-xs text-slate-500 mb-2">Chưa có người tham chiếu nào.</p>
                    <Button type="button" variant="secondary" onClick={handleAddReference} className="text-xs">
                      <Plus size={13} /> Thêm người tham chiếu đầu tiên
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Right: Live ATS Score Preview & Dynamic Checklist */}
        <div className="space-y-6">
          <Card className="border-brand-100 bg-surface sticky top-24">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-slate-900 text-sm flex items-center gap-1.5">
                <Lightbulb size={16} className="text-amber-500" />
                Ước tính điểm chuẩn ATS
              </h4>
              <Badge tone={estimatedScore >= 80 ? 'green' : 'amber'}>
                {estimatedScore >= 80 ? 'Rất tốt' : 'Khá'}
              </Badge>
            </div>

            <div className="my-5 flex items-center gap-4">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl border-4 border-emerald-400 bg-surface text-3xl font-semibold text-slate-800 shadow-sm">
                {estimatedScore}
              </div>
              <div>
                <p className="font-medium text-slate-800 text-sm">Điểm tối ưu hóa CV</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Cập nhật theo thời gian thực dựa trên các trường thông tin và mục bổ sung bạn vừa chọn.
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

              {/* Dynamic checklist rows based on selection */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2
                    size={14}
                    className={
                      enabledSections.projects &&
                      formData.projects &&
                      formData.projects.length > 0
                        ? 'text-emerald-500'
                        : 'text-slate-300'
                    }
                  />
                  Dự án & Link Demo
                </span>
                <span className="font-semibold text-slate-700">
                  {enabledSections.projects
                    ? `${formData.projects?.length || 0} dự án`
                    : 'Chưa bật'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2
                    size={14}
                    className={
                      enabledSections.certifications &&
                      formData.certifications &&
                      formData.certifications.length > 0
                        ? 'text-emerald-500'
                        : 'text-slate-300'
                    }
                  />
                  Chứng chỉ chuyên môn
                </span>
                <span className="font-semibold text-slate-700">
                  {enabledSections.certifications
                    ? `${formData.certifications?.length || 0} chứng chỉ`
                    : 'Chưa bật'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2
                    size={14}
                    className={
                      enabledSections.interests &&
                      formData.interests &&
                      formData.interests.length > 0
                        ? 'text-emerald-500'
                        : 'text-slate-300'
                    }
                  />
                  Sở thích cá nhân
                </span>
                <span className="font-semibold text-slate-700">
                  {enabledSections.interests
                    ? `${formData.interests?.length || 0} sở thích`
                    : 'Chưa bật'}
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
