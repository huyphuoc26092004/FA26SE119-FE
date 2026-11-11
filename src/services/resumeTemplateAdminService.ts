import { apiClient } from './apiClient';
import type {
  ResumeTemplateAdmin,
  ResumeTemplateInput,
  TemplateFilterState,
  TemplateImportResponse,
} from '../types/resumeTemplate';


// ============================================================================
// Default Pre-seeded Templates (Full HTML/CSS with standard slots)
// ============================================================================

export const SEED_TEMPLATES: ResumeTemplateAdmin[] = [
  {
    id: '30000000-0000-0000-0000-000000000001',
    name: 'Tối Giản Chuẩn ATS (Harvard / Tech Minimalist)',
    career_path: 'Kỹ thuật / Công nghệ / Quản lý',
    language: 'vi',
    description: 'Bố cục 1 cột kinh điển chuẩn ATS quốc tế, phân cấp thị giác rõ nét, căn lề tối ưu, dễ đọc và tối ưu hóa hệ thống lọc hồ sơ tự động.',
    is_active: true,
    is_trial_enabled: true,
    created_at: '2026-10-20T08:00:00Z',
    updated_at: '2026-10-24T14:30:00Z',
    html_content: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 15mm 18mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      line-height: 1.5;
      margin: 0;
      padding: 32px 36px;
      background: #ffffff;
    }
    .cv-header {
      text-align: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 14px;
      margin-bottom: 16px;
    }
    h1[data-cv-field="fullName"] {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #0f172a;
      margin: 0 0 4px 0;
    }
    p[data-cv-field="headline"] {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #2563eb;
      margin: 0 0 6px 0;
    }
    p[data-cv-field="contact"] {
      font-size: 12px;
      color: #475569;
      margin: 0;
      letter-spacing: 0.01em;
    }
    .cv-section {
      margin-bottom: 15px;
    }
    .cv-section h2 {
      font-size: 12.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #0f172a;
      border-bottom: 1.5px solid #0f172a;
      padding-bottom: 3px;
      margin: 0 0 9px 0;
    }
    .cv-entry { margin-bottom: 11px; }
    .cv-entry-title { font-size: 13.5px; font-weight: 700; color: #0f172a; }
    .cv-entry-subtitle { font-size: 12.5px; color: #475569; font-weight: 600; }
    .cv-entry-period { font-size: 11.5px; color: #64748b; font-weight: 500; }
    .cv-entry-text { font-size: 12.5px; color: #334155; }
    .cv-skill-pill {
      background: #f8fafc;
      color: #0f172a;
      border: 1px solid #cbd5e1;
    }
  </style>
</head>
<body>
  <div class="cv-header">
    <h1 data-cv-field="fullName">NGUYỄN VĂN AN</h1>
    <p data-cv-field="headline">Senior Full-Stack Engineer / Tech Lead</p>
    <p data-cv-field="contact">an.nguyen@example.com • 0912 345 678 • TP. Hồ Chí Minh • linkedin.com/in/an-nguyen</p>
  </div>
  <section class="cv-section">
    <h2>Tóm tắt chuyên môn</h2>
    <div data-cv-section="summary"></div>
  </section>
  <section class="cv-section">
    <h2>Kinh nghiệm làm việc</h2>
    <div data-cv-section="experience"></div>
  </section>
  <section class="cv-section">
    <h2>Học vấn & Bằng cấp</h2>
    <div data-cv-section="education"></div>
  </section>
  <section class="cv-section">
    <h2>Kỹ năng chuyên môn</h2>
    <div data-cv-section="skills"></div>
  </section>
  <section class="cv-section">
    <h2>Dự án nổi bật</h2>
    <div data-cv-section="projects"></div>
  </section>
  <section class="cv-section">
    <h2>Chứng chỉ & Giải thưởng</h2>
    <div data-cv-section="certifications"></div>
  </section>
</body>
</html>`,
  },
  {
    id: '30000000-0000-0000-0000-000000000002',
    name: 'Chuyên Viên Hai Cột (Modern Executive Two-Column)',
    career_path: 'Quản trị / Kinh doanh / Marketing / Tech',
    language: 'vi',
    description: 'Thiết kế 2 cột hiện đại với thanh bên thông tin tinh tế, cột chính nhấn mạnh thành tích sự nghiệp, các dự án và tóm tắt năng lực.',
    is_active: true,
    is_trial_enabled: true,
    created_at: '2026-10-21T09:15:00Z',
    updated_at: '2026-10-25T11:00:00Z',
    html_content: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 0;
      background: #ffffff;
      display: grid;
      grid-template-columns: 32% 68%;
      min-height: 100vh;
    }
    .cv-sidebar {
      background: #f8fafc;
      border-right: 1px solid #e2e8f0;
      padding: 30px 22px;
      color: #1e293b;
    }
    .cv-avatar {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 800;
      margin-bottom: 18px;
      box-shadow: 0 4px 12px rgba(15, 118, 110, 0.2);
    }
    .cv-sidebar h2 {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #0f766e;
      border-bottom: 1.5px solid #ccfbf1;
      padding-bottom: 3px;
      margin: 18px 0 9px 0;
    }
    .cv-sidebar h2:first-of-type {
      margin-top: 0;
    }
    .cv-main {
      padding: 30px 28px;
      background: #ffffff;
    }
    .cv-main-header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    h1[data-cv-field="fullName"] {
      font-size: 25px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 3px 0;
      letter-spacing: -0.02em;
    }
    p[data-cv-field="headline"] {
      font-size: 13.5px;
      font-weight: 600;
      color: #0f766e;
      margin: 0;
      letter-spacing: 0.02em;
    }
    p[data-cv-field="contact"] {
      font-size: 12px;
      color: #475569;
      line-height: 1.6;
      margin: 0;
    }
    .cv-main h2 {
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #0f172a;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 4px;
      margin: 16px 0 11px 0;
    }
    .cv-skill-pill {
      background: #ffffff !important;
      color: #0f766e !important;
      border: 1px solid #99f6e4 !important;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }
  </style>
</head>
<body>
  <aside class="cv-sidebar">
    <div class="cv-avatar">CV</div>
    <h2>Thông tin liên hệ</h2>
    <p data-cv-field="contact">Email • Điện thoại • Địa chỉ liên hệ</p>
    <h2>Kỹ năng chuyên môn</h2>
    <div data-cv-section="skills"></div>
    <h2>Học vấn & Bằng cấp</h2>
    <div data-cv-section="education"></div>
    <h2>Chứng chỉ nghề nghiệp</h2>
    <div data-cv-section="certifications"></div>
  </aside>
  <main class="cv-main">
    <div class="cv-main-header">
      <h1 data-cv-field="fullName">HỌ VÀ TÊN ỨNG VIÊN</h1>
      <p data-cv-field="headline">Chức danh / Vị trí mục tiêu</p>
    </div>
    <section class="cv-section">
      <h2>Tóm tắt chuyên môn</h2>
      <div data-cv-section="summary"></div>
    </section>
    <section class="cv-section">
      <h2>Kinh nghiệm làm việc</h2>
      <div data-cv-section="experience"></div>
    </section>
    <section class="cv-section">
      <h2>Dự án nổi bật</h2>
      <div data-cv-section="projects"></div>
    </section>
  </main>
</body>
</html>`,
  },
  {
    id: '30000000-0000-0000-0000-000000000003',
    name: 'Sinh Viên Năng Động (Campus & Tech Entry)',
    career_path: 'Sinh viên / Thực tập sinh / Fresher IT / Entry-Level',
    language: 'vi',
    description: 'Mẫu CV hiện đại chuyên biệt cho sinh viên và kỹ sư mới tốt nghiệp. Thiết kế thẻ thương hiệu sang trọng, làm nổi bật học vấn xuất sắc, điểm GPA, đồ án tốt nghiệp và các dự án thực tế.',
    is_active: true,
    is_trial_enabled: true,
    created_at: '2026-10-22T08:30:00Z',
    updated_at: '2026-10-27T10:00:00Z',
    html_content: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 12mm 15mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      line-height: 1.5;
      margin: 0;
      padding: 28px 32px;
      background: #ffffff;
    }
    .cv-header-card {
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
      color: #ffffff;
      border-radius: 10px;
      padding: 20px 24px;
      margin-bottom: 18px;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.15);
    }
    h1[data-cv-field="fullName"] {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.01em;
      text-transform: uppercase;
      color: #ffffff;
      margin: 0 0 4px 0;
    }
    p[data-cv-field="headline"] {
      font-size: 13.5px;
      font-weight: 600;
      letter-spacing: 0.04em;
      color: #bfdbfe;
      text-transform: uppercase;
      margin: 0 0 10px 0;
    }
    p[data-cv-field="contact"] {
      font-size: 11.5px;
      color: #f8fafc;
      margin: 0;
      line-height: 1.5;
      opacity: 0.95;
    }
    .cv-section {
      margin-bottom: 15px;
    }
    .cv-section h2 {
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #1e3a8a;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1.5px solid #dbeafe;
      padding-bottom: 4px;
      margin: 0 0 10px 0;
    }
    .cv-section h2::before {
      content: "";
      display: inline-block;
      width: 4px;
      height: 14px;
      background: #2563eb;
      border-radius: 2px;
    }
    .cv-skill-pill {
      background: #eff6ff !important;
      color: #1e40af !important;
      border: 1px solid #bfdbfe !important;
      font-weight: 600 !important;
    }
  </style>
</head>
<body>
  <div class="cv-header-card">
    <h1 data-cv-field="fullName">NGUYỄN VĂN AN</h1>
    <p data-cv-field="headline">Software Engineering Intern / Tech Entry</p>
    <p data-cv-field="contact">an.nguyen@example.com • 0912 345 678 • TP. Hồ Chí Minh • linkedin.com/in/an-nguyen</p>
  </div>
  <section class="cv-section">
    <h2>Mục tiêu nghề nghiệp</h2>
    <div data-cv-section="summary"></div>
  </section>
  <section class="cv-section">
    <h2>Học vấn & Thành tích</h2>
    <div data-cv-section="education"></div>
  </section>
  <section class="cv-section">
    <h2>Dự án nổi bật & Đồ án tốt nghiệp</h2>
    <div data-cv-section="projects"></div>
  </section>
  <section class="cv-section">
    <h2>Kinh nghiệm làm việc & Thực tập</h2>
    <div data-cv-section="experience"></div>
  </section>
  <section class="cv-section">
    <h2>Kỹ năng chuyên môn</h2>
    <div data-cv-section="skills"></div>
  </section>
  <section class="cv-section">
    <h2>Chứng chỉ & Hoạt động</h2>
    <div data-cv-section="certifications"></div>
  </section>
</body>
</html>`,
  },
  {
    id: '30000000-0000-0000-0000-000000000004',
    name: 'Kỹ Sư Công Nghệ Cao (Silicon Valley Tech Specialist)',
    career_path: 'Kỹ sư phần mềm / DevOps / Data Engineer',
    language: 'vi',
    description: 'Thiết kế hiện đại mang phong cách kỹ sư Silicon Valley, làm nổi bật năng lực công nghệ cốt lõi, dự án thực chiến và các số liệu thành tích cụ thể.',
    is_active: true,
    is_trial_enabled: true,
    created_at: '2026-10-23T14:00:00Z',
    updated_at: '2026-10-27T09:45:00Z',
    html_content: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 15mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 28px 32px;
      background: #ffffff;
      border-top: 5px solid #2563eb;
    }
    .cv-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 14px;
      margin-bottom: 16px;
    }
    h1[data-cv-field="fullName"] {
      font-size: 25px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 4px 0;
      letter-spacing: -0.02em;
    }
    p[data-cv-field="headline"] {
      font-size: 13.5px;
      font-weight: 600;
      color: #2563eb;
      margin: 0;
      letter-spacing: 0.02em;
    }
    .cv-contact-box {
      text-align: right;
    }
    p[data-cv-field="contact"] {
      font-size: 12px;
      color: #64748b;
      line-height: 1.6;
      margin: 0;
    }
    .cv-section {
      margin-bottom: 15px;
    }
    .cv-section h2 {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1.5px solid #f1f5f9;
      padding-bottom: 4px;
      margin: 0 0 10px 0;
    }
    .cv-section h2::before {
      content: "";
      display: inline-block;
      width: 3px;
      height: 14px;
      background: #2563eb;
      border-radius: 2px;
    }
    .cv-skill-pill {
      background: #eff6ff !important;
      color: #1d4ed8 !important;
      border: 1px solid #bfdbfe !important;
    }
  </style>
</head>
<body>
  <div class="cv-header">
    <div>
      <h1 data-cv-field="fullName">HỌ VÀ TÊN KỸ SƯ</h1>
      <p data-cv-field="headline">Senior Full-Stack Engineer / Cloud Architect</p>
    </div>
    <div class="cv-contact-box">
      <p data-cv-field="contact">email@example.com • 0912 345 678 • TP. Hồ Chí Minh • github.com/username</p>
    </div>
  </div>
  <section class="cv-section">
    <h2>Tóm tắt năng lực</h2>
    <div data-cv-section="summary"></div>
  </section>
  <section class="cv-section">
    <h2>Kinh nghiệm làm việc & Dự án công nghệ</h2>
    <div data-cv-section="experience"></div>
  </section>
  <section class="cv-section">
    <h2>Dự án tiêu biểu & Đóng góp mã nguồn mở</h2>
    <div data-cv-section="projects"></div>
  </section>
  <section class="cv-section">
    <h2>Kỹ năng công nghệ (Tech Stack)</h2>
    <div data-cv-section="skills"></div>
  </section>
  <section class="cv-section">
    <h2>Học vấn & Bằng cấp</h2>
    <div data-cv-section="education"></div>
  </section>
  <section class="cv-section">
    <h2>Chứng chỉ chuyên môn</h2>
    <div data-cv-section="certifications"></div>
  </section>
</body>
</html>`,
  },
  {
    id: '30000000-0000-0000-0000-000000000005',
    name: 'Lãnh Đạo & Quản Trị Cấp Cao (Executive Serif Prestige)',
    career_path: 'Giám đốc / Lãnh đạo / Cố vấn chiến lược',
    language: 'en',
    description: 'Phong cách cổ điển trang nhã với phông chữ Serif, điểm nhấn vàng kim và than chì, lý tưởng cho vị trí cấp quản lý và chuyên gia tư vấn.',
    is_active: true,
    is_trial_enabled: false,
    created_at: '2026-10-22T10:00:00Z',
    updated_at: '2026-10-26T16:20:00Z',
    html_content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    body {
      font-family: "Georgia", "Times New Roman", serif;
      color: #1c1917;
      line-height: 1.55;
      margin: 0;
      padding: 32px 38px;
      background: #ffffff;
    }
    .cv-top {
      text-align: center;
      border-bottom: 2px solid #292524;
      padding-bottom: 14px;
      margin-bottom: 18px;
    }
    h1[data-cv-field="fullName"] {
      font-size: 26px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #1c1917;
      margin: 0 0 5px 0;
    }
    p[data-cv-field="headline"] {
      font-size: 13.5px;
      font-style: italic;
      color: #78350f;
      letter-spacing: 0.04em;
      margin: 0 0 7px 0;
    }
    p[data-cv-field="contact"] {
      font-size: 12px;
      color: #78716c;
      margin: 0;
      letter-spacing: 0.02em;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .cv-section { margin-bottom: 16px; }
    .cv-section h2 {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.09em;
      text-transform: uppercase;
      color: #292524;
      border-bottom: 1px solid #d6d3d1;
      padding-bottom: 3px;
      margin: 0 0 9px 0;
    }
    .cv-entry-title { font-family: "Georgia", serif; font-size: 14px; font-weight: 700; color: #1c1917; }
    .cv-entry-subtitle { font-style: italic; color: #57534e; font-size: 12.5px; }
    .cv-skill-pill {
      background: #fafaf9 !important;
      border: 1px solid #d6d3d1 !important;
      color: #292524 !important;
    }
  </style>
</head>
<body>
  <div class="cv-top">
    <h1 data-cv-field="fullName">ALEXANDER MORGAN</h1>
    <p data-cv-field="headline">Executive Director & Strategic Leadership</p>
    <p data-cv-field="contact">alex.morgan@example.com • +1 (415) 555-0199 • San Francisco, CA • linkedin.com/in/alexmorgan</p>
  </div>
  <section class="cv-section">
    <h2>Executive Summary</h2>
    <div data-cv-section="summary"></div>
  </section>
  <section class="cv-section">
    <h2>Leadership Experience & Career Milestones</h2>
    <div data-cv-section="experience"></div>
  </section>
  <section class="cv-section">
    <h2>Key Strategic Initiatives</h2>
    <div data-cv-section="projects"></div>
  </section>
  <section class="cv-section">
    <h2>Education & Credentials</h2>
    <div data-cv-section="education"></div>
  </section>
  <section class="cv-section">
    <h2>Core Competencies</h2>
    <div data-cv-section="skills"></div>
  </section>
  <section class="cv-section">
    <h2>Certifications & Honors</h2>
    <div data-cv-section="certifications"></div>
  </section>
</body>
</html>`,
  },
];

// ============================================================================
// Service API Methods (ResumeTemplateAdminController). Backend là nguồn dữ liệu duy nhất:
// không lưu tạm ở trình duyệt, lỗi API được báo lên giao diện. Backend không có API xoá mẫu,
// chỉ bật/tắt (PATCH /status).
// ============================================================================

const writeBody = (payload: ResumeTemplateInput) => ({
  name: payload.name.trim(),
  careerPath: payload.careerPath?.trim() || null,
  language: payload.language,
  description: payload.description.trim(),
  active: payload.active,
  trialEnabled: payload.trialEnabled,
  htmlContent: payload.htmlContent,
});

export async function getAdminResumeTemplates(filter?: Partial<TemplateFilterState>): Promise<ResumeTemplateAdmin[]> {
  const res = await apiClient.get<ResumeTemplateAdmin[]>('/admin/resume-templates', { params: { limit: 100, offset: 0 } });
  return applyFilters(Array.isArray(res.data) ? res.data : [], filter);
}

export async function getAdminResumeTemplateById(id: string): Promise<ResumeTemplateAdmin> {
  const res = await apiClient.get<ResumeTemplateAdmin>(`/admin/resume-templates/${encodeURIComponent(id)}`);
  return res.data;
}

export async function createAdminResumeTemplate(payload: ResumeTemplateInput): Promise<ResumeTemplateAdmin> {
  const res = await apiClient.post<ResumeTemplateAdmin>('/admin/resume-templates', writeBody(payload));
  return res.data;
}

export async function updateAdminResumeTemplate(id: string, payload: ResumeTemplateInput): Promise<ResumeTemplateAdmin> {
  const res = await apiClient.put<ResumeTemplateAdmin>(`/admin/resume-templates/${encodeURIComponent(id)}`, writeBody(payload));
  return res.data;
}

export async function toggleResumeTemplateStatus(id: string, active: boolean): Promise<ResumeTemplateAdmin> {
  const res = await apiClient.patch<ResumeTemplateAdmin>(`/admin/resume-templates/${encodeURIComponent(id)}/status`, { active });
  return res.data;
}

export async function duplicateResumeTemplate(id: string): Promise<ResumeTemplateAdmin> {
  const original = await getAdminResumeTemplateById(id);
  return createAdminResumeTemplate({
    name: `${original.name} (Bản sao)`,
    careerPath: original.career_path ?? '',
    language: original.language,
    description: original.description ?? '',
    active: false,
    trialEnabled: false,
    htmlContent: original.html_content,
  });
}

export async function importResumeTemplateDocument(file: File, language: 'vi' | 'en' = 'vi'): Promise<TemplateImportResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('language', language);
  const res = await apiClient.post<TemplateImportResponse>('/admin/resume-templates/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120_000,
  });
  return res.data;
}

export function exportResumeTemplateHtml(template: ResumeTemplateAdmin): void {
  const blob = new Blob([template.html_content], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${template.name.toLowerCase().replace(/[^a-z0-9]/gi, '_')}_template.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Internal Filter Utility
// ============================================================================

function applyFilters(
  list: ResumeTemplateAdmin[],
  filter?: Partial<TemplateFilterState>
): ResumeTemplateAdmin[] {
  if (!filter) return list;

  let result = [...list];

  if (filter.search?.trim()) {
    const q = filter.search.toLowerCase().trim();
    result = result.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.career_path && t.career_path.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q))
    );
  }

  if (filter.status && filter.status !== 'all') {
    result = result.filter((t) => (filter.status === 'active' ? t.is_active : !t.is_active));
  }

  if (filter.language && filter.language !== 'all') {
    result = result.filter((t) => t.language === filter.language);
  }

  if (filter.trial && filter.trial !== 'all') {
    result = result.filter((t) =>
      filter.trial === 'trial' ? t.is_trial_enabled : !t.is_trial_enabled
    );
  }

  if (filter.careerPath?.trim()) {
    const cp = filter.careerPath.toLowerCase().trim();
    result = result.filter((t) => t.career_path && t.career_path.toLowerCase().includes(cp));
  }

  if (filter.sort) {
    switch (filter.sort) {
      case 'newest':
        result.sort(
          (a, b) =>
            new Date(b.created_at || b.updated_at || 0).getTime() -
            new Date(a.created_at || a.updated_at || 0).getTime()
        );
        break;
      case 'oldest':
        result.sort(
          (a, b) =>
            new Date(a.created_at || a.updated_at || 0).getTime() -
            new Date(b.created_at || b.updated_at || 0).getTime()
        );
        break;
      case 'name_asc':
        result.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
        break;
      case 'name_desc':
        result.sort((a, b) => b.name.localeCompare(a.name, 'vi'));
        break;
    }
  }

  return result;
}
