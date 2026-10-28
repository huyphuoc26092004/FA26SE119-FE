import type { TemplateSlotDef } from '../types/resumeTemplate';

export const TEMPLATE_SLOT_DEFS: TemplateSlotDef[] = [
  {
    key: 'fullName',
    type: 'field',
    labelVi: 'Họ và tên',
    labelEn: 'Full Name',
    attribute: 'data-cv-field="fullName"',
    snippet: '<h1 data-cv-field="fullName">HỌ VÀ TÊN ỨNG VIÊN</h1>',
    required: true,
  },
  {
    key: 'headline',
    type: 'field',
    labelVi: 'Chức danh / Mục tiêu',
    labelEn: 'Target Position',
    attribute: 'data-cv-field="headline"',
    snippet: '<p data-cv-field="headline">Chức danh nghề nghiệp / Vị trí mục tiêu</p>',
  },
  {
    key: 'contact',
    type: 'field',
    labelVi: 'Thông tin liên hệ',
    labelEn: 'Contact Info',
    attribute: 'data-cv-field="contact"',
    snippet: '<p data-cv-field="contact">email@example.com • 0912 345 678 • TP. Hồ Chí Minh</p>',
  },
  {
    key: 'summary',
    type: 'section',
    labelVi: 'Tóm tắt chuyên môn',
    labelEn: 'Professional Summary',
    attribute: 'data-cv-section="summary"',
    snippet: '<section class="cv-section">\n  <h2>Giới thiệu bản thân</h2>\n  <div data-cv-section="summary"></div>\n</section>',
  },
  {
    key: 'experience',
    type: 'section',
    labelVi: 'Kinh nghiệm làm việc',
    labelEn: 'Work Experience',
    attribute: 'data-cv-section="experience"',
    snippet: '<section class="cv-section">\n  <h2>Kinh nghiệm làm việc</h2>\n  <div data-cv-section="experience"></div>\n</section>',
  },
  {
    key: 'education',
    type: 'section',
    labelVi: 'Học vấn & Bằng cấp',
    labelEn: 'Education',
    attribute: 'data-cv-section="education"',
    snippet: '<section class="cv-section">\n  <h2>Học vấn & Bằng cấp</h2>\n  <div data-cv-section="education"></div>\n</section>',
  },
  {
    key: 'skills',
    type: 'section',
    labelVi: 'Kỹ năng chuyên môn',
    labelEn: 'Skills',
    attribute: 'data-cv-section="skills"',
    snippet: '<section class="cv-section">\n  <h2>Kỹ năng chuyên môn</h2>\n  <div data-cv-section="skills"></div>\n</section>',
  },
  {
    key: 'projects',
    type: 'section',
    labelVi: 'Dự án nổi bật',
    labelEn: 'Key Projects',
    attribute: 'data-cv-section="projects"',
    snippet: '<section class="cv-section">\n  <h2>Dự án tiêu biểu</h2>\n  <div data-cv-section="projects"></div>\n</section>',
  },
  {
    key: 'certifications',
    type: 'section',
    labelVi: 'Chứng chỉ chuyên môn',
    labelEn: 'Certifications',
    attribute: 'data-cv-section="certifications"',
    snippet: '<section class="cv-section">\n  <h2>Chứng chỉ & Giải thưởng</h2>\n  <div data-cv-section="certifications"></div>\n</section>',
  },
];

export const SAMPLE_CV_DATA_VI = {
  fullName: 'NGUYỄN VĂN AN',
  headline: 'Senior Full-Stack Engineer / Tech Lead',
  contact: 'an.nguyen@example.com • (84) 912 345 678 • TP. Hồ Chí Minh • linkedin.com/in/an-nguyen',
  summary:
    'Kỹ sư phần mềm với hơn 5 năm kinh nghiệm chuyên sâu về kiến trúc Web quy mô lớn, vi dịch vụ (Microservices) và tối ưu hóa trải nghiệm người dùng. Đã từng dẫn dắt đội ngũ kỹ thuật 8 thành viên phát triển nền tảng xử lý 2 triệu yêu cầu mỗi ngày, tối ưu 35% chi phí hạ tầng điện toán đám mây.',
  experience: [
    {
      title: 'Senior Technical Lead',
      subtitle: 'Nexus Tech Global • TP. Hồ Chí Minh',
      period: '03/2023 – Hiện tại',
      text: 'Chịu trách nhiệm thiết kế kiến trúc vi dịch vụ phân tán, tối ưu hóa hệ thống backend Spring Boot và giao diện React. Đạt chuẩn bảo mật và giảm độ trễ API xuống dưới 80ms.',
      bullets: [
        'Tái cấu trúc hệ thống thanh toán và phân quyền, nâng cao năng lực chịu tải gấp 3 lần.',
        'Thiết lập quy trình CI/CD tự động và triển khai mô hình kiểm thử toàn diện, giảm 40% lỗi production.',
        'Cố vấn kỹ thuật và định hướng thăng tiến cho 6 kỹ sư trẻ trong phòng công nghệ.',
      ],
    },
    {
      title: 'Full-Stack Developer',
      subtitle: 'Innovate Solutions JSC • Hà Nội',
      period: '08/2020 – 02/2023',
      text: 'Tham gia phát triển các sản phẩm SaaS phục vụ doanh nghiệp bán lẻ và thương mại điện tử.',
      bullets: [
        'Xây dựng 12+ module phân tích dữ liệu bán hàng thời gian thực sử dụng React và Node.js.',
        'Tích hợp các cổng thanh toán nội địa và quốc tế: VNPay, Momo, Stripe.',
      ],
    },
  ],
  education: [
    {
      title: 'Cử nhân Khoa học Máy tính (B.Sc. in Computer Science)',
      subtitle: 'Đại học Bách Khoa TP. Hồ Chí Minh (HCMUT)',
      period: '2016 – 2020',
      text: 'Tốt nghiệp loại Giỏi (GPA 3.65/4.0). Đạt học bổng sinh viên tài năng 3 năm liên tiếp.',
    },
  ],
  skills: [
    'React',
    'TypeScript',
    'Spring Boot',
    'Java 21/25',
    'PostgreSQL',
    'Redis',
    'Docker & K8s',
    'AWS Cloud',
    'REST & GraphQL',
    'CI/CD Pipelines',
    'Quản trị đội nhóm',
    'Tư duy giải pháp',
  ],
  projects: [
    {
      title: 'Hệ thống Khớp nối Ứng viên & Việc làm Thông minh (AI Career Agent)',
      subtitle: 'Lead Architect & Core Developer',
      period: '2024',
      text: 'Ứng dụng thuật toán Vector Search (pgvector) và mô hình ngôn ngữ lớn để phân tích mức độ phù hợp giữa CV và Bản mô tả công việc (JD). Đạt độ chính xác 92%.',
    },
    {
      title: 'Cổng Quản trị Thương mại Đa kênh OmniHub',
      subtitle: 'Senior Engineer',
      period: '2022',
      text: 'Nền tảng đồng bộ hàng tồn kho và đơn hàng trên 4 sàn TMĐT lớn với độ trễ dưới 2 giây.',
    },
  ],
  certifications: [
    {
      title: 'AWS Certified Solutions Architect – Associate',
      subtitle: 'Amazon Web Services (AWS)',
      period: '2024',
      text: 'Mã xác thực: AWS-PSA-948123',
    },
    {
      title: 'Professional Scrum Master I (PSM I)',
      subtitle: 'Scrum.org',
      period: '2023',
      text: 'Chứng chỉ quản trị dự án phần mềm linh hoạt',
    },
  ],
};

export const SAMPLE_CV_DATA_EN = {
  fullName: 'ALEXANDER MORGAN',
  headline: 'Senior Full-Stack Engineer / Solutions Architect',
  contact: 'alex.morgan@example.com • +1 (415) 555-0199 • San Francisco, CA • github.com/alexmorgan',
  summary:
    'Results-driven Software Engineer with 6+ years of experience in architecting distributed systems, cloud-native applications, and high-performance Web APIs. Proven track record of scaling consumer-facing platforms to 5M+ active users while driving continuous engineering excellence.',
  experience: [
    {
      title: 'Staff Software Engineer',
      subtitle: 'CloudVanguard Inc. • San Francisco, CA',
      period: '2023 – Present',
      text: 'Lead the architecture of enterprise microservices and real-time streaming pipelines processing over 10TB of analytics daily.',
      bullets: [
        'Designed multi-tenant data ingestion engine reducing query latency by 55%.',
        'Spearheaded transition to Kubernetes-based container orchestration with 99.99% uptime.',
        'Mentored 10+ junior and mid-level engineers across product squads.',
      ],
    },
    {
      title: 'Full-Stack Software Engineer',
      subtitle: 'Apex Global Tech • Austin, TX',
      period: '2020 – 2023',
      text: 'Developed customer-facing dashboard apps using React, TypeScript, and Go microservices.',
      bullets: [
        'Built automated ATS resume parsing engine with 90%+ extraction accuracy.',
        'Decreased cloud infrastructure cost by 28% through efficient caching strategies.',
      ],
    },
  ],
  education: [
    {
      title: 'B.S. in Computer Science & Engineering',
      subtitle: 'University of California, Berkeley',
      period: '2016 – 2020',
      text: 'Graduated Magna Cum Laude. Dean’s Honors List (all semesters).',
    },
  ],
  skills: [
    'React & Next.js',
    'TypeScript',
    'Java & Spring Boot',
    'Go (Golang)',
    'PostgreSQL / pgvector',
    'Docker & Kubernetes',
    'AWS / GCP',
    'GraphQL & REST APIs',
    'Distributed Systems',
    'System Architecture',
  ],
  projects: [
    {
      title: 'AI Resume Intelligence & Job Fit Engine',
      subtitle: 'Lead Developer',
      period: '2024',
      text: 'Integrated vector embeddings and semantic search to match candidate skill graphs against job requirements with sub-second response times.',
    },
  ],
  certifications: [
    {
      title: 'AWS Certified Solutions Architect – Professional',
      subtitle: 'Amazon Web Services',
      period: '2024',
      text: 'Credential ID: AWS-SAP-774012',
    },
  ],
};

/**
 * Validates template HTML against rules:
 * - Must contain [data-cv-field="fullName"]
 * - Must contain at least one valid [data-cv-section]
 * - Must not contain script, iframe, onload, javascript: urls
 * - Must not exceed 200,000 characters
 */
export function validateTemplateHtml(html: string): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  hasFullName: boolean;
  sections: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!html || !html.trim()) {
    return {
      isValid: false,
      errors: ['Nội dung HTML không được để trống.'],
      warnings: [],
      hasFullName: false,
      sections: [],
    };
  }

  if (html.length > 200000) {
    errors.push(`Kích thước HTML (${html.length.toLocaleString('vi-VN')} ký tự) vượt quá giới hạn 200,000 ký tự.`);
  }

  // Security checks
  const lower = html.toLowerCase();
  if (lower.includes('<script')) {
    errors.push('Không được chứa thẻ <script>.');
  }
  if (lower.includes('<iframe') || lower.includes('<object') || lower.includes('<embed')) {
    errors.push('Không được chứa thẻ nhúng <iframe/object/embed>.');
  }
  if (lower.includes('javascript:') || lower.includes('onerror=') || lower.includes('onclick=')) {
    errors.push('Không được chứa thuộc tính xử lý sự kiện Javascript hoặc URL javascript:.');
  }

  // Check required fullName slot
  const hasFullName =
    html.includes('data-cv-field="fullName"') ||
    html.includes("data-cv-field='fullName'") ||
    html.includes('data-cv-field=fullName');

  if (!hasFullName) {
    errors.push('Bắt buộc phải có vị trí họ tên: data-cv-field="fullName".');
  }

  // Check sections
  const validSections = ['summary', 'experience', 'education', 'skills', 'projects', 'certifications'];
  const detectedSections: string[] = [];

  for (const sec of validSections) {
    if (
      html.includes(`data-cv-section="${sec}"`) ||
      html.includes(`data-cv-section='${sec}'`) ||
      html.includes(`data-cv-section=${sec}`)
    ) {
      detectedSections.push(sec);
    }
  }

  if (detectedSections.length === 0) {
    errors.push('Phải có ít nhất 1 slot mục CV hợp lệ: data-cv-section="summary|experience|education|skills|projects|certifications".');
  }

  // Check warnings
  if (!html.includes('data-cv-field="headline"')) {
    warnings.push('Chưa có vị trí chức danh mục tiêu: data-cv-field="headline".');
  }
  if (!html.includes('data-cv-field="contact"')) {
    warnings.push('Chưa có vị trí thông tin liên hệ: data-cv-field="contact".');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    hasFullName,
    sections: detectedSections,
  };
}

/**
 * Injects sample candidate data into the template HTML for safe live preview.
 */
export function renderTemplateWithSampleData(html: string, lang: 'vi' | 'en' = 'vi'): string {
  if (!html) return '';
  const data = lang === 'en' ? SAMPLE_CV_DATA_EN : SAMPLE_CV_DATA_VI;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Helper to safely populate section content without wiping preexisting h1-h4 headings
    const fillSection = (selector: string, contentHtml: string) => {
      const sectionEl = doc.querySelector(selector);
      if (!sectionEl) return;
      const existingHeading = sectionEl.querySelector('h1, h2, h3, h4');
      if (existingHeading) {
        sectionEl.innerHTML = existingHeading.outerHTML + contentHtml;
      } else {
        sectionEl.innerHTML = contentHtml;
      }
    };

    // 1. Fill fields
    const fullNameEl = doc.querySelector('[data-cv-field="fullName"]');
    if (fullNameEl) fullNameEl.textContent = data.fullName;

    const headlineEl = doc.querySelector('[data-cv-field="headline"]');
    if (headlineEl) headlineEl.textContent = data.headline;

    const contactEl = doc.querySelector('[data-cv-field="contact"]');
    if (contactEl) contactEl.textContent = data.contact;

    // 2. Fill summary
    fillSection(
      '[data-cv-section="summary"]',
      `<p class="cv-entry-text" style="margin: 0; line-height: 1.6; font-size: 13px;">${data.summary}</p>`
    );

    // 3. Fill experience
    fillSection(
      '[data-cv-section="experience"]',
      data.experience
        .map(
          (item) => `
        <div class="cv-entry" style="margin-bottom: 13px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 8px;">
            <span class="cv-entry-title" style="font-size: 13.5px; font-weight: 700; color: inherit;">${item.title}</span>
            <span class="cv-entry-period" style="font-size: 11.5px; font-weight: 600; opacity: 0.8; white-space: nowrap; font-variant-numeric: tabular-nums;">${item.period}</span>
          </div>
          <div class="cv-entry-subtitle" style="font-size: 12.5px; font-weight: 600; opacity: 0.85; margin: 1px 0 3px 0;">${item.subtitle}</div>
          <p class="cv-entry-text" style="margin: 0 0 4px 0; font-size: 12.5px; line-height: 1.55; opacity: 0.9;">${item.text}</p>
          <ul class="cv-entry-items" style="margin: 0; padding-left: 18px; font-size: 12.5px; line-height: 1.5; opacity: 0.9;">
            ${item.bullets.map((b) => `<li style="margin-bottom: 2.5px;">${b}</li>`).join('')}
          </ul>
        </div>
      `
        )
        .join('')
    );

    // 4. Fill education
    fillSection(
      '[data-cv-section="education"]',
      data.education
        .map(
          (item) => `
        <div class="cv-entry" style="margin-bottom: 11px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 8px;">
            <span class="cv-entry-title" style="font-size: 13.5px; font-weight: 700; color: inherit;">${item.title}</span>
            <span class="cv-entry-period" style="font-size: 11.5px; font-weight: 600; opacity: 0.8; white-space: nowrap; font-variant-numeric: tabular-nums;">${item.period}</span>
          </div>
          <div class="cv-entry-subtitle" style="font-size: 12.5px; font-weight: 600; opacity: 0.85; margin-top: 1px;">${item.subtitle}</div>
          <p class="cv-entry-text" style="margin: 2px 0 0 0; font-size: 12.5px; line-height: 1.5; opacity: 0.85;">${item.text}</p>
        </div>
      `
        )
        .join('')
    );

    // 5. Fill skills
    fillSection(
      '[data-cv-section="skills"]',
      `
      <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 4px;">
        ${data.skills
          .map(
            (s) => `
          <span class="cv-skill-pill" style="display: inline-flex; align-items: center; padding: 2.5px 8px; font-size: 11px; font-weight: 500; border-radius: 4px; border: 1px solid currentColor; opacity: 0.9;">
            ${s}
          </span>
        `
          )
          .join('')}
      </div>
    `
    );

    // 6. Fill projects
    fillSection(
      '[data-cv-section="projects"]',
      data.projects
        .map(
          (item) => `
        <div class="cv-entry" style="margin-bottom: 11px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 8px;">
            <span class="cv-entry-title" style="font-size: 13.5px; font-weight: 700; color: inherit;">${item.title}</span>
            <span class="cv-entry-period" style="font-size: 11.5px; font-weight: 600; opacity: 0.8; white-space: nowrap; font-variant-numeric: tabular-nums;">${item.period}</span>
          </div>
          <div class="cv-entry-subtitle" style="font-size: 12.5px; font-weight: 600; opacity: 0.85; margin: 1px 0 2px 0;">${item.subtitle}</div>
          <p class="cv-entry-text" style="margin: 0; font-size: 12.5px; line-height: 1.5; opacity: 0.9;">${item.text}</p>
        </div>
      `
        )
        .join('')
    );

    // 7. Fill certifications
    fillSection(
      '[data-cv-section="certifications"]',
      data.certifications
        .map(
          (item) => `
        <div class="cv-entry" style="margin-bottom: 9px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 8px;">
            <span class="cv-entry-title" style="font-size: 13px; font-weight: 700; color: inherit;">${item.title}</span>
            <span class="cv-entry-period" style="font-size: 11.5px; font-weight: 600; opacity: 0.8; white-space: nowrap; font-variant-numeric: tabular-nums;">${item.period}</span>
          </div>
          <div class="cv-entry-subtitle" style="font-size: 12px; opacity: 0.85; margin-top: 1px;">${item.subtitle}</div>
          ${item.text ? `<p class="cv-entry-text" style="margin: 1.5px 0 0 0; font-size: 11.5px; opacity: 0.75;">${item.text}</p>` : ''}
        </div>
      `
        )
        .join('')
    );

    // Prepend basic reset style so the template's own CSS takes precedence
    let head = doc.head;
    if (!head) {
      head = doc.createElement('head');
      doc.documentElement.insertBefore(head, doc.body);
    }
    const style = doc.createElement('style');
    style.textContent = `
      *, *::before, *::after { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; }
      body {
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
      }
    `;
    head.insertBefore(style, head.firstChild);

    return doc.documentElement.outerHTML;
  } catch (err) {
    console.error('Failed to parse template HTML:', err);
    return html;
  }
}
