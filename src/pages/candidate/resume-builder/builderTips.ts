import type { Resume } from '../../../types/domain';

export type BuilderStep = 'contacts' | 'experience' | 'education' | 'skills' | 'summary' | 'finalize';
type Lang = 'vi' | 'en';

export interface StepTips {
  /** Cách ghi đúng cho bước này. */
  tips: string[];
  /** Câu mẫu để người dùng tham khảo. */
  example?: string;
}

/** Gợi ý soạn sẵn cho từng bước của trình soạn CV (không cần AI). */
export const STEP_TIPS: Record<Lang, Record<BuilderStep, StepTips>> = {
  vi: {
    contacts: {
      tips: [
        'Vị trí mong muốn nên trùng với tên vị trí trong tin tuyển dụng, ví dụ "Frontend Developer" thay vì "Lập trình viên".',
        'Dùng email nghiêm túc dạng ten.ho@…, tránh biệt danh.',
        'Địa chỉ chỉ cần thành phố, không cần số nhà.',
        'Thêm ảnh đại diện chuyên nghiệp hoặc liên kết mạng xã hội nếu có.',
      ],
    },
    experience: {
      tips: [
        'Mỗi gạch đầu dòng bắt đầu bằng động từ: Xây dựng, Triển khai, Tối ưu, Dẫn dắt…',
        'Thêm con số khi có thể: %, số người dùng, thời gian giảm, doanh thu.',
        'Ghi kết quả bạn tạo ra, không chỉ liệt kê nhiệm vụ.',
        'Ngày tháng theo dạng MM/YYYY, công việc gần nhất ghi trước.',
      ],
      example: 'Tối ưu tải trang bằng lazy-load và code splitting, giảm 35% thời gian tải lần đầu.',
    },
    education: {
      tips: [
        'Ghi tên trường đầy đủ, bằng cấp và chuyên ngành.',
        'Chỉ ghi GPA khi từ 3.0/4 (hoặc 7.0/10) trở lên.',
        'Sinh viên mới ra trường có thể đặt mục Học vấn lên trước Kinh nghiệm.',
      ],
    },
    skills: {
      tips: [
        'Ưu tiên kỹ năng xuất hiện trong tin tuyển dụng, hệ thống lọc CV (ATS) dò theo từ khoá.',
        'Ghi đúng tên chuẩn: "JavaScript" thay vì "JS", "PostgreSQL" thay vì "postgres".',
        'Ngoại ngữ nên kèm chứng chỉ hoặc mức độ, ví dụ "IELTS 6.5".',
      ],
    },
    summary: {
      tips: [
        'Viết 2–4 câu: bạn là ai, bao nhiêu năm kinh nghiệm, thế mạnh chính, mục tiêu.',
        'Nêu 2–3 kỹ năng hoặc công nghệ chính khớp với vị trí ứng tuyển.',
        'Tránh câu chung chung như "chăm chỉ, ham học hỏi" nếu không có dẫn chứng.',
      ],
      example:
        'Lập trình viên Frontend với 2 năm kinh nghiệm React và TypeScript, từng xây dựng trang quản trị cho hơn 5.000 người dùng. Mạnh về tối ưu hiệu năng và giao diện dễ dùng. Mong muốn phát triển lên vị trí Senior trong môi trường sản phẩm.',
    },
    finalize: {
      tips: [
        'Thêm các mục bổ sung để làm nổi bật hồ sơ: Ngoại ngữ, Chứng chỉ, Dự án, Giải thưởng, Mạng xã hội.',
        'Chỉ chọn những mục thực sự liên quan đến vị trí ứng tuyển.',
      ],
    },
  },
  en: {
    contacts: {
      tips: [
        'Match the target position to the job post title, e.g. "Frontend Developer".',
        'Use a professional email like first.last@…',
        'City is enough for the address.',
        'Add a professional photo or links to your LinkedIn/GitHub if available.',
      ],
    },
    experience: {
      tips: [
        'Start each bullet with an action verb: Built, Led, Improved, Shipped…',
        'Add numbers where you can: %, users, time saved, revenue.',
        'Describe results, not just duties.',
        'Use MM/YYYY and list the most recent job first.',
      ],
      example: 'Cut first-load time by 35% with lazy loading and code splitting.',
    },
    education: {
      tips: [
        'Give the full school name, degree and major.',
        'Only list GPA if it is 3.0/4 or higher.',
        'Recent graduates can put Education before Experience.',
      ],
    },
    skills: {
      tips: [
        'Prioritise skills named in the job post; ATS filters match keywords.',
        'Use standard names: "JavaScript" not "JS", "PostgreSQL" not "postgres".',
        'Add a level or certificate to languages, e.g. "IELTS 6.5".',
      ],
    },
    summary: {
      tips: [
        'Write 2–4 sentences: who you are, years of experience, key strengths, goal.',
        'Mention 2–3 core skills that match the role.',
        'Avoid generic claims like "hard-working" without evidence.',
      ],
      example:
        'Frontend developer with 2 years of React and TypeScript experience, building admin dashboards used by 5,000+ people. Strong in performance tuning and usable UI. Looking to grow into a senior role on a product team.',
    },
    finalize: {
      tips: [
        'Add extra sections to showcase your strengths: Languages, Certifications, Projects, Awards, Socials.',
        'Only include what is relevant to the target job.',
      ],
    },
  },
};

const ACTION_VERBS_VI = /^(xây|phát triển|thiết kế|triển khai|tối ưu|dẫn|quản lý|phụ trách|cải thiện|giảm|tăng|tích hợp|viết|tạo|hỗ trợ|nghiên cứu|đào tạo|vận hành|lập|chuyển|tự động|đề xuất|phối hợp|kiểm thử|bảo trì|đạt|hoàn thành)/i;
const ACTION_VERBS_EN = /^(built|developed|designed|implemented|led|managed|improved|reduced|increased|optimi[sz]ed|created|delivered|shipped|launched|integrated|automated|wrote|owned|drove|migrated|mentored|tested|maintained|achieved|cut|grew)/i;
const HAS_NUMBER = /\d/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Kiểm tra nhanh nội dung đang nhập ở một bước, trả về các nhắc nhở ngắn. */
export function stepChecks(step: BuilderStep, cv: Partial<Resume>, lang: Lang): string[] {
  const vi = lang === 'vi';
  const out: string[] = [];
  switch (step) {
    case 'contacts':
      if (!cv.fullName?.trim()) out.push(vi ? 'Chưa có họ và tên.' : 'Full name is missing.');
      if (!cv.email?.trim()) out.push(vi ? 'Chưa có email liên hệ.' : 'Contact email is missing.');
      else if (!EMAIL.test(cv.email.trim())) out.push(vi ? 'Email có vẻ chưa đúng định dạng.' : 'Email looks invalid.');
      if (!cv.phone?.trim()) out.push(vi ? 'Chưa có số điện thoại.' : 'Phone number is missing.');
      if (!cv.position?.trim()) out.push(vi ? 'Thêm vị trí mong muốn để CV có tiêu đề rõ ràng.' : 'Add a target position as your CV headline.');
      break;
    case 'experience': {
      const items = (cv.experience ?? []).filter((e) => e.role?.trim() || e.company?.trim());
      if (!items.length) out.push(vi ? 'Chưa có kinh nghiệm nào. Có thể ghi thực tập hoặc dự án làm thêm.' : 'No experience yet. Internships or freelance work count.');
      items.forEach((e, i) => {
        const label = `#${i + 1}`;
        const rawBullets = e.highlights && e.highlights.length > 0 ? e.highlights : (e.description ?? '').split('\n');
        const bullets = rawBullets.map((b) => b.replace(/^[-*•–]\s*/, '').trim()).filter(Boolean);
        const text = (e.description ?? '').trim() || bullets.join(' ');
        if (!e.startDate?.trim()) out.push(vi ? `${label}: chưa có thời gian bắt đầu.` : `${label}: start date missing.`);
        if (!bullets.length && text.length < 40)
          out.push(vi ? `${label}: thêm mô tả chi tiết hoặc các gạch đầu dòng về việc bạn đã làm.` : `${label}: add details or bullet points of what you did.`);
        if (text && !HAS_NUMBER.test(text))
          out.push(vi ? `${label}: chưa có con số nào, thử thêm %, số người dùng hoặc thời gian.` : `${label}: no numbers yet; try %, users or time saved.`);
        const verbs = vi ? ACTION_VERBS_VI : ACTION_VERBS_EN;
        const weak = bullets.filter((b) => !verbs.test(b));
        if (bullets.length > 0 && weak.length === bullets.length)
          out.push(vi ? `${label}: nên mở đầu gạch đầu dòng bằng động từ (Xây dựng, Tối ưu…).` : `${label}: start bullets with action verbs (Built, Improved…).`);
      });
      break;
    }
    case 'education':
      if (!(cv.education ?? []).some((e) => e.school?.trim())) out.push(vi ? 'Chưa có thông tin học vấn.' : 'No education added yet.');
      break;
    case 'skills': {
      const n = (cv.skills ?? []).length;
      if (n < 5) out.push(vi ? `Mới có ${n} kỹ năng, nên có ít nhất 6.` : `Only ${n} skills; aim for at least 6.`);
      else if (n > 20) out.push(vi ? 'Nhiều kỹ năng quá, chọn lọc khoảng 12 cái sát vị trí nhất.' : 'Too many skills; keep the ~12 most relevant.');
      break;
    }
    case 'summary': {
      const len = cv.summary?.trim().length ?? 0;
      if (!len) out.push(vi ? 'Phần tóm tắt đang trống.' : 'Summary is empty.');
      else if (len < 120) out.push(vi ? 'Phần tóm tắt hơi ngắn, nên khoảng 2–4 câu.' : 'Summary is short; aim for 2–4 sentences.');
      else if (len > 700) out.push(vi ? 'Phần tóm tắt khá dài, nên gọn dưới 4 câu.' : 'Summary is long; keep it under 4 sentences.');
      break;
    }
    case 'finalize':
      break;
  }
  return out;
}
