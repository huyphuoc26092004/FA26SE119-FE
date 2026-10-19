import type {
  ApplicationDraft,
  ApplicationReviewScore,
  GenerateApplicationParams,
  RefineApplicationParams,
} from '../types/domain';

const STORAGE_KEY = 'careerpilot-saved-applications';

const delay = (ms = 700) => new Promise((resolve) => setTimeout(resolve, ms));

function formatDate(date = new Date()): string {
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${date.getFullYear()}`;
}

// Initial demo drafts
function getInitialDrafts(): ApplicationDraft[] {
  return [
    {
      id: 'draft-vng-cover-letter',
      title: 'Cover Letter - Senior Frontend Engineer @ VNG Corporation',
      contentType: 'cover_letter',
      tone: 'impactful',
      language: 'Vietnamese',
      focus: 'tech_depth',
      jobId: 'job-101',
      jobTitle: 'Senior Frontend Engineer',
      company: 'VNG Corporation',
      cvId: 'cv-1',
      cvName: 'Alex Morgan - Senior Frontend CV',
      recipientName: 'Ban Tuyển dụng Kỹ thuật & Hiring Manager',
      content: `Kính gửi Ban Tuyển dụng Kỹ thuật & Hiring Manager VNG Corporation,

Tôi viết thư này để bày tỏ nguyện vọng ứng tuyển cho vị trí Senior Frontend Engineer tại VNG Corporation. Với hơn 4 năm kinh nghiệm chuyên sâu trong việc phát triển các ứng dụng web quy mô lớn và tối ưu hóa hiệu năng trải nghiệm người dùng trên nền tảng React, TypeScript và Next.js, tôi tin rằng năng lực kỹ thuật và tư duy kiến trúc của mình sẽ đóng góp trực tiếp vào sự phát triển của hệ sinh thái giải trí và công nghệ tại VNG.

Tại vai trò Senior Frontend gần đây nhất, tôi đã:
- Dẫn dắt đội ngũ 6 kỹ sư frontend chuyển đổi thành công kiến trúc ứng dụng sang Next.js App Router và Micro-frontends, giúp tăng tốc độ phát triển tính năng mới lên 40% và giảm thời gian tải trang (LCP) từ 3.2s xuống 1.1s (tối ưu hơn 65%).
- Trực tiếp thiết kế hệ thống Design System chuẩn Accessibility (WCAG 2.1) dùng chung cho 4 sản phẩm nội bộ, đảm bảo tính đồng nhất giao diện và độ bao phủ kiểm thử tự động đạt trên 85%.
- Xử lý các bài toán tương tác dữ liệu lớn và tối ưu hóa bộ nhớ trình duyệt, phục vụ ổn định cho hơn 200,000 người dùng hoạt động hàng tháng.

Tôi luôn theo dõi và ấn tượng sâu sắc với những bước tiến công nghệ của VNG trong việc phục vụ hàng chục triệu người dùng Việt Nam và quốc tế. Tôi rất mong có cơ hội được trao đổi trực tiếp trong buổi phỏng vấn để chia sẻ chi tiết hơn về cách thức tôi có thể giải quyết các thách thức kỹ thuật hiện tại của đội ngũ.

Xin chân thành cảm ơn Quý công ty đã dành thời gian xem xét hồ sơ của tôi.

Trân trọng,
Alex Morgan
Số điện thoại: (+84) 912 345 678 | Email: candidate@example.com
LinkedIn: linkedin.com/in/alex-morgan-dev | GitHub: github.com/alexmorgan-fe`,
      reviewScore: {
        overallScore: 95,
        relevanceScore: 96,
        persuasivenessScore: 94,
        clarityScore: 97,
        toneScore: 95,
        strengths: [
          'Có số liệu định lượng thành tích thực tế rất ấn tượng (LCP giảm từ 3.2s xuống 1.1s, 200K MAU).',
          'Khớp 100% các từ khóa công nghệ trọng tâm của VNG: React, TypeScript, Next.js, Micro-frontends.',
          'Bố cục thư chuẩn 4 đoạn kinh điển của Harvard Career Guide.',
        ],
        improvements: [
          'Có thể nhắc thêm 1 sản phẩm cụ thể của VNG mà bạn yêu thích (Zalo, ZaloPay, Game portal).',
        ],
        matchedKeywords: ['React', 'TypeScript', 'Next.js', 'Micro-frontends', 'Performance', 'Design System'],
        recommendedAdditions: ['WebSockets / Realtime', 'CI/CD Pipelines'],
        wordCount: 295,
        readingTimeMinutes: 1.2,
      },
      createdAt: '18/10/2026',
      updatedAt: '18/10/2026',
      isSaved: true,
    },
    {
      id: 'draft-techcombank-email',
      title: 'Email ứng tuyển - Senior Fullstack / Web Lead @ Techcombank',
      contentType: 'application_email',
      tone: 'professional',
      language: 'Vietnamese',
      focus: 'leadership',
      jobId: 'job-103',
      jobTitle: 'Senior Fullstack Engineer',
      company: 'Techcombank Digital',
      cvId: 'cv-1',
      cvName: 'Alex Morgan - Senior Frontend CV',
      recipientName: 'Bộ phận Tuyển dụng Techcombank Digital',
      subject: '[Ứng Tuyển] Vị trí Senior Fullstack Engineer - Alex Morgan - 4+ Năm Kinh Nghiệm',
      content: `Kính gửi Bộ phận Tuyển dụng Techcombank Digital,

Tôi là Alex Morgan, Kỹ sư Phần mềm với hơn 4 năm kinh nghiệm thực chiến trong phát triển các nền tảng số hóa và giao dịch tài chính. Tôi được biết Techcombank đang tìm kiếm vị trí Senior Fullstack Engineer cho dự án Ngân hàng số thế hệ mới, và tôi tin rằng kinh nghiệm của mình rất phù hợp với tiêu chí của đội ngũ.

Một số điểm nổi bật từ hồ sơ của tôi:
• Kiến trúc & Hiệu năng: Có chuyên môn sâu về React, Node.js, TypeScript và kiến trúc Micro-services, từng tối ưu hóa ứng dụng thanh toán trực tuyến đạt chuẩn bảo mật 2FA/OTP với độ trễ phản hồi < 200ms.
• Kinh nghiệm dẫn dắt: Đã dẫn dắt đội ngũ kỹ thuật 6 thành viên, chủ trì quy trình code review chuẩn mực và thiết lập pipeline tự động hóa CI/CD.
• Tư duy sản phẩm: Tốt nghiệp loại Giỏi ĐH Bách Khoa và đạt chứng chỉ AWS Certified Cloud Practitioner.

Tôi xin gửi đính kèm bản CV chi tiết và đường dẫn Portfolio cá nhân để Quý ngân hàng tiện tham khảo:
- Portfolio & Dự án: https://alexmorgan.dev
- Hồ sơ LinkedIn: https://linkedin.com/in/alex-morgan-dev

Tôi rất mong có cơ hội trao đổi trực tiếp để hiểu rõ hơn về các mục tiêu công nghệ mà Techcombank đang hướng tới.

Kính chúc Quý ngân hàng một tuần làm việc hiệu quả!

Trân trọng,
Alex Morgan
(+84) 912 345 678 | candidate@example.com`,
      reviewScore: {
        overallScore: 93,
        relevanceScore: 92,
        persuasivenessScore: 94,
        clarityScore: 95,
        toneScore: 93,
        strengths: [
          'Tiêu đề email chuẩn quy ước tuyển dụng, đầy đủ họ tên và số năm kinh nghiệm.',
          'Các gạch đầu dòng nhấn mạnh chuẩn bảo mật và chứng chỉ AWS phù hợp ngành Fintech / Banking.',
          'Độ dài ngắn gọn, dễ đọc lướt trên điện thoại di động của nhà tuyển dụng.',
        ],
        improvements: [
          'Có thể bổ sung link GitHub trực tiếp nếu có các repository mã nguồn mở tiêu biểu.',
        ],
        matchedKeywords: ['Fullstack', 'Node.js', 'React', 'TypeScript', 'AWS', 'Security'],
        recommendedAdditions: ['Docker', 'Kafka'],
        wordCount: 220,
        readingTimeMinutes: 0.9,
      },
      createdAt: '19/10/2026',
      updatedAt: '19/10/2026',
      isSaved: true,
    },
    {
      id: 'draft-inmail-pitch',
      title: 'LinkedIn InMail Pitch - Lead Frontend Architect',
      contentType: 'linkedin_inmail',
      tone: 'concise',
      language: 'English',
      focus: 'business_impact',
      recipientName: 'Hiring Director / Talent Acquisition Lead',
      subject: 'Inquiry: Lead Frontend Engineer Role | 4+ yrs React/TypeScript Architect',
      content: `Hi [Hiring Manager Name],

I came across your opening for the Senior / Lead Frontend role at [Company Name] and wanted to reach out directly.

Over the past 4 years, I have spearheaded modern web architectures using React, TypeScript, and Next.js, scaling SaaS platforms to 200K+ monthly active users while reducing page load times (LCP) by 65%. Given your team's current focus on expanding digital products, I believe my hands-on background in micro-frontends and team mentorship could deliver immediate value.

I would love to connect and learn more about your engineering roadmap for the upcoming quarter. Would you be open to a brief 10-minute chat this week?

Best regards,
Alex Morgan
Portfolio: https://alexmorgan.dev | GitHub: https://github.com/alexmorgan-fe`,
      reviewScore: {
        overallScore: 94,
        relevanceScore: 93,
        persuasivenessScore: 96,
        clarityScore: 98,
        toneScore: 95,
        strengths: [
          'High response rate hook: concise, under 150 words.',
          'Clear call-to-action (10-minute chat) reduces friction for busy hiring managers.',
          'Strong metrics-driven value proposition.',
        ],
        improvements: [
          'Personalize the specific company achievement before sending.',
        ],
        matchedKeywords: ['React', 'TypeScript', 'Next.js', 'Architect', 'Performance'],
        recommendedAdditions: ['Scalability'],
        wordCount: 125,
        readingTimeMinutes: 0.5,
      },
      createdAt: '19/10/2026',
      updatedAt: '19/10/2026',
      isSaved: true,
    },
  ];
}

export function getStoredApplications(): ApplicationDraft[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  const initial = getInitialDrafts();
  saveStoredApplications(initial);
  return initial;
}

export function saveStoredApplications(drafts: ApplicationDraft[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  } catch {
    // ignore
  }
}

export function getApplicationById(id: string): ApplicationDraft | undefined {
  const drafts = getStoredApplications();
  return drafts.find((d) => d.id === id);
}

export function saveApplicationDraft(draft: ApplicationDraft): ApplicationDraft {
  const drafts = getStoredApplications();
  const index = drafts.findIndex((d) => d.id === draft.id);
  const updatedDraft = {
    ...draft,
    updatedAt: formatDate(),
    isSaved: true,
  };

  if (index !== -1) {
    drafts[index] = updatedDraft;
  } else {
    drafts.unshift(updatedDraft);
  }

  saveStoredApplications(drafts);
  return updatedDraft;
}

export function deleteApplicationDraft(id: string): void {
  const drafts = getStoredApplications();
  const filtered = drafts.filter((d) => d.id !== id);
  saveStoredApplications(filtered);
}

// -------------------------------------------------------------
// AI Generator & Review Engine
// -------------------------------------------------------------
export async function generateApplicationContent(
  params: GenerateApplicationParams
): Promise<ApplicationDraft> {
  await delay(850); // Simulate realistic LLM generation

  const isVi = params.language === 'Vietnamese';
  const candidateName = params.candidateName || 'Alex Morgan';
  const candidateRole = params.candidateRole || 'Senior Frontend Engineer';
  const company = params.company || (isVi ? 'Quý Công ty' : 'your company');
  const jobTitle = params.jobTitle || 'Senior Software Engineer';
  const recipient =
    params.recipientName ||
    (isVi ? `Ban Tuyển dụng & Đội ngũ Kỹ thuật ${company}` : `Hiring Team at ${company}`);

  const skillsSnippet =
    params.candidateSkills && params.candidateSkills.length > 0
      ? params.candidateSkills.slice(0, 5).join(', ')
      : 'React, TypeScript, Next.js, Web Performance, Micro-frontends';

  let subject = '';
  let content = '';

  if (params.contentType === 'cover_letter') {
    if (isVi) {
      subject = '';
      content = `Kính gửi ${recipient},

Tôi viết thư này để bày tỏ sự quan tâm sâu sắc đối với vị trí ${jobTitle} tại ${company}. Với hơn 4 năm kinh nghiệm thực chiến phát triển các giải pháp web quy mô lớn và tối ưu hóa trải nghiệm kỹ thuật số trên nền tảng ${skillsSnippet}, tôi tin rằng nền tảng chuyên môn cùng tinh thần trách nhiệm của mình sẽ mang lại giá trị gia tăng thiết thực cho đội ngũ của Quý công ty.

Trong các dự án trước đây, tôi luôn đặt trọng tâm vào chất lượng mã nguồn và hiệu quả kinh doanh của sản phẩm:
- Kiến trúc & Tối ưu hóa: Dẫn dắt việc nâng cấp cấu trúc giao diện sang Next.js và Micro-frontends, giúp tăng tốc độ tải trang lên hơn 60% và duy trì sự ổn định cho hàng trăm nghìn người dùng hàng tháng.
- Xây dựng chuẩn mực kỹ thuật: Thiết kế và duy trì thư viện thành phần dùng chung (Design System), đảm bảo tính tái sử dụng cao và độ phủ kiểm thử tự động đạt trên 85%.
- Tinh thần đồng đội & Dẫn dắt: Phối hợp chặt chẽ với Product Managers và các kỹ sư backend để chuyển giao tính năng đúng hạn theo phương pháp Agile/Scrum.

Tôi đặc biệt ấn tượng với định hướng phát triển sản phẩm của ${company} và mong muốn được đóng góp năng lực để cùng công ty chinh phục các mục tiêu tăng trưởng mới.

Rất mong có cơ hội được trao đổi chi tiết hơn với Quý công ty trong buổi phỏng vấn sắp tới.

Xin chân thành cảm ơn Quý công ty đã dành thời gian quý báu để xem xét hồ sơ của tôi.

Trân trọng,
${candidateName}
SĐT: (+84) 912 345 678 | Email: candidate@example.com
Portfolio: https://alexmorgan.dev | LinkedIn: linkedin.com/in/alex-morgan-dev`;
    } else {
      subject = '';
      content = `Dear ${recipient},

I am writing to express my strong interest in the ${jobTitle} position at ${company}. With over 4 years of proven hands-on experience designing and building scalable, high-performance web platforms utilizing ${skillsSnippet}, I am confident in my ability to make an immediate, meaningful contribution to your engineering team.

Throughout my software engineering career, I have consistently aligned technical decisions with user satisfaction and core business metrics:
- Scalable Architecture & Performance: Spearheaded the transition to Next.js App Router and modular frontends, slashing Core Web Vitals (LCP) by over 60% and supporting 200,000+ monthly active users.
- Design Systems & Quality Standards: Built an accessible, reusable component design system that accelerated sprint development speed while maintaining 85%+ test coverage with Jest and RTL.
- Cross-functional Leadership: Mentored junior/mid engineers and collaborated closely with product managers and backend architects to deliver complex features on schedule.

I have long admired ${company}'s culture of technical innovation and user-centric products. I would welcome the opportunity to discuss how my skill set and background align with your team's objectives.

Thank you very much for your time and consideration.

Sincerely,
${candidateName}
Phone: (+84) 912 345 678 | Email: candidate@example.com
Portfolio: https://alexmorgan.dev | LinkedIn: linkedin.com/in/alex-morgan-dev`;
    }
  } else if (params.contentType === 'application_email') {
    if (isVi) {
      subject = `[Ứng Tuyển] Vị trí ${jobTitle} - ${candidateName} - 4+ Năm Kinh Nghiệm`;
      content = `Kính gửi ${recipient},

Tôi là ${candidateName}, Kỹ sư Phần mềm chuyên môn cao về ${skillsSnippet}. Tôi được biết ${company} hiện đang mở đợt tuyển dụng cho vị trí ${jobTitle}, và tôi nhận thấy kinh nghiệm thực tế của mình rất tương đồng với định hướng của Quý công ty.

Một số điểm nhấn nổi bật trong hồ sơ của tôi:
• Chuyên môn kỹ thuật sâu: Hơn 4 năm làm việc với hệ sinh thái web hiện đại, chuyên sâu về tối ưu hóa hiệu năng và thiết kế hệ thống tương tác cao.
• Thành tích định lượng: Đã từng tối ưu tốc độ tải trang tăng 65%, phục vụ ổn định cho 200,000+ người dùng hoạt động hàng tháng.
• Năng lực tự chủ: Có kinh nghiệm dẫn dắt kỹ thuật, làm việc nhóm hiệu quả và am hiểu quy trình CI/CD.

Tôi xin gửi đính kèm bản CV cập nhật mới nhất cùng thông tin tham khảo trực tuyến:
- Portfolio cá nhân: https://alexmorgan.dev
- Trang GitHub: https://github.com/alexmorgan-fe
- Hồ sơ LinkedIn: https://linkedin.com/in/alex-morgan-dev

Rất mong có cơ hội được tham gia phỏng vấn và trao đổi sâu hơn với đội ngũ tuyển dụng của ${company}.

Kính chúc Quý công ty luôn phát triển và thành công!

Trân trọng,
${candidateName}
(+84) 912 345 678 | candidate@example.com`;
    } else {
      subject = `[Application] ${jobTitle} - ${candidateName} - 4+ Years Experience`;
      content = `Dear ${recipient},

My name is ${candidateName}, and I am an experienced software engineer specializing in ${skillsSnippet}. I am writing to formally submit my application for the ${jobTitle} role at ${company}.

Key highlights from my background:
• Strong Technical Foundation: 4+ years architecting reliable web platforms with modern frameworks, micro-frontends, and cloud integration.
• Measurable Business Impact: Boosted page load performance by 65% and scaled architectures serving 200,000+ monthly active users.
• Leadership & Collaboration: Experienced in mentoring engineers, leading agile sprints, and upholding clean code standards.

I have attached my updated resume for your review. You may also explore my work online:
- Portfolio: https://alexmorgan.dev
- GitHub: https://github.com/alexmorgan-fe
- LinkedIn: https://linkedin.com/in/alex-morgan-dev

I would love the chance to connect and discuss how my expertise can support ${company}'s upcoming milestones.

Thank you for your time and consideration!

Best regards,
${candidateName}
(+84) 912 345 678 | candidate@example.com`;
    }
  } else if (params.contentType === 'linkedin_inmail') {
    if (isVi) {
      subject = `Trao đổi về cơ hội vị trí ${jobTitle} tại ${company}`;
      content = `Chào ${recipient},

Tôi là ${candidateName}, hiện là ${candidateRole} với hơn 4 năm kinh nghiệm về ${skillsSnippet}.

Tôi biết ${company} đang mở rộng đội ngũ kỹ thuật cho vị trí ${jobTitle}. Qua tìm hiểu về các sản phẩm mà công ty đang phát triển, tôi nhận thấy thế mạnh của mình trong việc xây dựng hệ thống web chịu tải cao và tối ưu hiệu năng có thể đóng góp hiệu quả ngay cho team.

Tôi rất mong có dịp kết nối và trao đổi nhanh khoảng 10-15 phút cùng anh/chị về định hướng của vị trí này. 

Trân trọng và chúc anh/chị một tuần làm việc nhiều năng lượng!
${candidateName}
Portfolio: https://alexmorgan.dev`;
    } else {
      subject = `Inquiry: ${jobTitle} Opportunity at ${company}`;
      content = `Hi ${recipient},

I am ${candidateName}, a ${candidateRole} with 4+ years of hands-on experience in ${skillsSnippet}.

I noticed ${company} is currently looking for a ${jobTitle}. Having tracked your recent product expansion, I believe my background in high-performance frontend architectures and scaling web applications could add immediate value to your engineering initiatives.

I would love to connect and see if my background aligns with what your team needs. Would you be open to a brief 10-minute introductory conversation this week?

Best regards,
${candidateName}
Portfolio: https://alexmorgan.dev`;
    }
  } else {
    // follow_up_email
    if (isVi) {
      subject = `Follow-up: Đơn ứng tuyển vị trí ${jobTitle} - ${candidateName}`;
      content = `Kính gửi ${recipient},

Tôi viết thư này để hỏi thăm tình trạng xử lý hồ sơ ứng tuyển vị trí ${jobTitle} mà tôi đã gửi đến Quý công ty vào tuần trước.

Tôi vẫn rất hào hứng với cơ hội được gia nhập và cống hiến cho ${company}. Với nền tảng vững vàng về ${skillsSnippet} và kinh nghiệm tối ưu hóa các ứng dụng quy mô lớn, tôi tin rằng mình sẽ thích ứng nhanh chóng và hoàn thành xuất sắc các mục tiêu công việc.

Nếu Quý công ty cần thêm bất kỳ thông tin hoặc tài liệu bổ sung nào, xin vui lòng phản hồi qua email này hoặc liên hệ với tôi qua số điện thoại (+84) 912 345 678.

Xin cảm ơn Quý công ty và chúc đội ngũ có một tuần làm việc hiệu quả!

Trân trọng,
${candidateName}`;
    } else {
      subject = `Follow-up on Application for ${jobTitle} - ${candidateName}`;
      content = `Dear ${recipient},

I hope you are having a productive week.

I am writing to politely follow up on my recent application for the ${jobTitle} role at ${company}, submitted last week. 

I remain very excited about this opportunity and would love to reiterate my strong enthusiasm for joining ${company}. With my background in ${skillsSnippet} and proven track record of optimizing user-facing architectures, I am eager to contribute to your team's ongoing success.

Please let me know if you need any additional materials or details from my end.

Thank you very much for your time and follow-up.

Sincerely,
${candidateName}
(+84) 912 345 678 | candidate@example.com`;
    }
  }

  // Calculate dynamic review score
  const wordCount = content.trim().split(/\s+/).length;
  const reviewScore: ApplicationReviewScore = {
    overallScore: 94,
    relevanceScore: 95,
    persuasivenessScore: 93,
    clarityScore: 96,
    toneScore: 94,
    strengths: [
      isVi
        ? 'Dẫn chứng kinh nghiệm và kỹ năng sát với yêu cầu của vị trí.'
        : 'Strong alignment with core technical requirements.',
      isVi
        ? 'Bố cục chuẩn mực, cách hành văn trang trọng, tự tin và mạch lạc.'
        : 'Professional executive tone with clear formatting.',
      isVi
        ? 'Có sẵn thông tin liên hệ và liên kết portfolio/GitHub tạo độ tin cậy cao.'
        : 'Includes verifiable portfolio & LinkedIn verification links.',
    ],
    improvements: [
      isVi
        ? 'Hãy kiểm tra lại tên cụ thể của người nhận thư trước khi bấm gửi.'
        : 'Double-check the exact hiring manager name before sending.',
    ],
    matchedKeywords: params.jobSkills?.slice(0, 5) || ['React', 'TypeScript', 'Next.js', 'Performance'],
    recommendedAdditions: ['CI/CD', 'Automated Testing'],
    wordCount,
    readingTimeMinutes: Math.max(0.5, parseFloat((wordCount / 220).toFixed(1))),
  };

  const newDraft: ApplicationDraft = {
    id: `draft-${Date.now()}`,
    title: `${params.contentType === 'cover_letter' ? 'Cover Letter' : params.contentType === 'application_email' ? 'Email ứng tuyển' : 'Thư giới thiệu'} - ${jobTitle} @ ${company}`,
    contentType: params.contentType,
    tone: params.tone,
    language: params.language,
    focus: params.focus,
    jobId: params.jobId,
    jobTitle: params.jobTitle,
    company: params.company,
    cvId: params.cvId,
    cvName: params.cvName,
    recipientName: params.recipientName,
    subject,
    content,
    reviewScore,
    createdAt: formatDate(),
    updatedAt: formatDate(),
    isSaved: false,
  };

  return newDraft;
}

// AI Refinement Function
export async function refineApplicationContent(
  params: RefineApplicationParams
): Promise<{ content: string; subject?: string; scoreDelta: number }> {
  await delay(600);

  let updatedContent = params.currentContent;
  let updatedSubject = params.currentSubject;

  if (params.action === 'make_shorter') {
    // Trim down paragraphs
    const paragraphs = updatedContent.split('\n\n');
    if (paragraphs.length > 3) {
      updatedContent = [paragraphs[0], paragraphs[1], paragraphs[paragraphs.length - 1]].join('\n\n');
    }
  } else if (params.action === 'add_metrics') {
    // Enhance with quantified impact metrics
    updatedContent = updatedContent
      .replace(
        /tối ưu hóa hiệu năng/gi,
        'tối ưu hóa hiệu năng giúp giảm 65% thời gian tải trang (LCP 1.1s)'
      )
      .replace(
        /các ứng dụng web quy mô lớn/gi,
        'các ứng dụng web quy mô lớn phục vụ hơn 200,000 người dùng hàng tháng (MAU)'
      )
      .replace(
        /chuyển giao tính năng/gi,
        'tăng tốc độ chuyển giao tính năng lên 40% với độ bao phủ kiểm thử >85%'
      );
  } else if (params.action === 'more_confident') {
    updatedContent = updatedContent
      .replace(/tôi tin rằng/gi, 'tôi khẳng định rằng')
      .replace(/rất mong có cơ hội/gi, 'tôi sẵn sàng đồng hành và tạo ra bước đột phá cho');
  }

  return {
    content: updatedContent,
    subject: updatedSubject,
    scoreDelta: 2,
  };
}
