/**
 * JD → Kỹ năng → Mức Bloom (Revised Bloom, 6 bậc).
 *
 * - Job có sẵn: đọc `requirement_extraction` do BE bóc tách (JobRequirementExtractor + BloomRuleEngine).
 * - JD tự dán: BE chỉ bóc tách khi tạo bài đánh giá, nên FE ước lượng bằng cùng bộ quy tắc động từ + đối tượng
 *   của BloomRuleEngine và nhận diện kỹ năng theo danh mục GET /skills.
 *
 * Bloom mô tả mức tư duy câu JD yêu cầu, không phải số năm kinh nghiệm hay độ thành thạo.
 */

export const BLOOM_LEVELS = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'] as const;
export type BloomLevel = (typeof BLOOM_LEVELS)[number];
export type BloomOrUnknown = BloomLevel | 'UNDETERMINED';

export type Importance = 'MANDATORY' | 'PREFERRED' | 'FLEXIBLE' | 'RESPONSIBILITY' | 'CONDITIONAL' | 'UNSPECIFIED';
const IMPORTANCE_ORDER: Importance[] = ['MANDATORY', 'CONDITIONAL', 'PREFERRED', 'FLEXIBLE', 'RESPONSIBILITY', 'UNSPECIFIED'];

export interface BloomEvidence {
  text: string;
  level: BloomOrUnknown;
  importance: Importance;
  justification?: string;
}

export interface SkillBloom {
  skill: string;
  category?: string;
  /** Mức Bloom cao nhất mà các câu JD nhắc kỹ năng này yêu cầu. */
  level: BloomOrUnknown;
  /** Mọi mức xuất hiện (để vẽ dải 6 bậc). */
  levels: BloomLevel[];
  importance: Importance;
  evidence: BloomEvidence[];
}

export interface JdBloomMapping {
  source: 'JOB' | 'PASTED';
  skills: SkillBloom[];
  /** Câu yêu cầu không gắn được kỹ năng nào trong danh mục. */
  unmapped: BloomEvidence[];
  distribution: Record<BloomOrUnknown, number>;
}

export const BLOOM_COPY: Record<BloomOrUnknown, { vi: string; en: string; hintVi: string; hintEn: string }> = {
  Remember: { vi: 'Ghi nhớ', en: 'Remember', hintVi: 'Nhớ, liệt kê khái niệm, cú pháp', hintEn: 'Recall facts, terms, syntax' },
  Understand: { vi: 'Hiểu', en: 'Understand', hintVi: 'Giải thích, mô tả cơ chế', hintEn: 'Explain concepts and mechanisms' },
  Apply: { vi: 'Vận dụng', en: 'Apply', hintVi: 'Dùng công cụ cho tác vụ cụ thể', hintEn: 'Use a tool on a concrete task' },
  Analyze: { vi: 'Phân tích', en: 'Analyze', hintVi: 'Tìm nguyên nhân, phân rã vấn đề', hintEn: 'Find causes, break problems down' },
  Evaluate: { vi: 'Đánh giá', en: 'Evaluate', hintVi: 'So sánh phương án theo tiêu chí', hintEn: 'Judge options against criteria' },
  Create: { vi: 'Sáng tạo', en: 'Create', hintVi: 'Thiết kế giải pháp, kiến trúc mới', hintEn: 'Design new solutions or systems' },
  UNDETERMINED: { vi: 'Chưa xác định', en: 'Undetermined', hintVi: 'Câu JD chưa đủ động từ + đối tượng', hintEn: 'Not enough action + object evidence' },
};

export const IMPORTANCE_COPY: Record<Importance, { vi: string; en: string }> = {
  MANDATORY: { vi: 'Bắt buộc', en: 'Required' },
  CONDITIONAL: { vi: 'Có điều kiện', en: 'Conditional' },
  PREFERRED: { vi: 'Ưu tiên', en: 'Preferred' },
  FLEXIBLE: { vi: 'Linh hoạt', en: 'Flexible' },
  RESPONSIBILITY: { vi: 'Trách nhiệm', en: 'Responsibility' },
  UNSPECIFIED: { vi: 'Chưa rõ', en: 'Unspecified' },
};

export const bloomRank = (level: string) => BLOOM_LEVELS.indexOf(level as BloomLevel);
const asLevel = (value: unknown): BloomOrUnknown =>
  bloomRank(String(value)) >= 0 ? (String(value) as BloomLevel) : 'UNDETERMINED';
const asImportance = (value: unknown): Importance =>
  IMPORTANCE_ORDER.includes(value as Importance) ? (value as Importance) : 'UNSPECIFIED';

type Row = Record<string, unknown>;
const rowsOf = (value: unknown): Row[] => (Array.isArray(value) ? value.filter((v): v is Row => !!v && typeof v === 'object') : []);

interface RequirementInput {
  text: string;
  importance: Importance;
  skills: { name: string; category?: string }[];
  bloom: { level: BloomOrUnknown; evidence?: string; justification?: string }[];
}

function aggregate(source: JdBloomMapping['source'], requirements: RequirementInput[]): JdBloomMapping {
  const bySkill = new Map<string, SkillBloom>();
  const unmapped: BloomEvidence[] = [];
  for (const req of requirements) {
    const best = req.bloom.reduce<BloomOrUnknown>((top, b) => (bloomRank(b.level) > bloomRank(top) ? b.level : top), 'UNDETERMINED');
    const justification = req.bloom.find((b) => b.level === best)?.justification;
    const evidence: BloomEvidence = { text: req.text, level: best, importance: req.importance, justification };
    if (!req.skills.length) {
      if (req.text.trim()) unmapped.push(evidence);
      continue;
    }
    for (const skill of req.skills) {
      const key = skill.name.toLowerCase();
      const entry = bySkill.get(key) ?? {
        skill: skill.name,
        category: skill.category,
        level: 'UNDETERMINED' as BloomOrUnknown,
        levels: [],
        importance: req.importance,
        evidence: [],
      };
      if (IMPORTANCE_ORDER.indexOf(req.importance) < IMPORTANCE_ORDER.indexOf(entry.importance)) entry.importance = req.importance;
      for (const b of req.bloom) {
        if (bloomRank(b.level) >= 0 && !entry.levels.includes(b.level as BloomLevel)) entry.levels.push(b.level as BloomLevel);
      }
      if (bloomRank(best) > bloomRank(entry.level)) entry.level = best;
      if (entry.evidence.length < 5 && !entry.evidence.some((e) => e.text === req.text)) entry.evidence.push(evidence);
      bySkill.set(key, entry);
    }
  }
  const skills = [...bySkill.values()]
    .map((s) => ({ ...s, levels: [...s.levels].sort((a, b) => bloomRank(a) - bloomRank(b)) }))
    .sort(
      (a, b) =>
        IMPORTANCE_ORDER.indexOf(a.importance) - IMPORTANCE_ORDER.indexOf(b.importance) ||
        bloomRank(b.level) - bloomRank(a.level) ||
        a.skill.localeCompare(b.skill),
    );
  const distribution = Object.fromEntries([...BLOOM_LEVELS, 'UNDETERMINED'].map((l) => [l, 0])) as Record<BloomOrUnknown, number>;
  skills.forEach((s) => {
    distribution[s.level] += 1;
  });
  return { source, skills, unmapped: unmapped.slice(0, 30), distribution };
}

/** Từ snapshot `requirement_extraction` của BE (job có sẵn). */
export function mappingFromExtraction(extraction: unknown): JdBloomMapping | null {
  if (!extraction || typeof extraction !== 'object') return null;
  const requirements = rowsOf((extraction as Row).requirements).map<RequirementInput>((r) => ({
    text: String(r.text ?? ''),
    importance: asImportance(r.importance),
    skills: rowsOf(r.skills)
      .map((s) => ({ name: String(s.name ?? ''), category: s.category ? String(s.category) : undefined }))
      .filter((s) => s.name),
    bloom: rowsOf(r.bloom).map((b) => ({
      level: asLevel(b.level),
      evidence: b.evidence ? String(b.evidence) : undefined,
      justification: b.justification ? String(b.justification) : undefined,
    })),
  }));
  if (!requirements.length) return null;
  return aggregate('JOB', requirements);
}

// ─── Ước lượng cho JD tự dán: cùng quy tắc với BloomRuleEngine (BE) ────────────

export function fold(input: string): string {
  return input
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const words = (alternatives: string) => new RegExp(`(?<![\\p{L}\\p{N}_])(?:${alternatives})(?![\\p{L}\\p{N}_])`, 'gu');

const OBJECT_TECH =
  'api|apis|endpoint|service|microservice|application|app|web|mobile|website|software|system|code|feature|function|interface|component|database|sql|' +
  'pipeline|workflow|test|testing|test case|automation|postman|java|python|spring boot|git|jenkins|ci/cd|deployment|production|' +
  'he thong|ung dung|phan mem|ma nguon|giao dien|chuc nang|dich vu|quy trinh|kiem thu|kiem tra|truong hop kiem thu|' +
  'co so du lieu|du lieu|truy van|kiem thu api|bao cao';

interface Rule {
  level: BloomLevel;
  action: RegExp;
  object: RegExp;
  reason: string;
  priority: number;
}

const RULES: Rule[] = [
  {
    level: 'Create',
    action: words('design|architect|devise|invent|formulate|thiet ke|sang tao|phat minh|xay dung kien truc|de xuat kien truc'),
    object: words(
      'architecture|architectures|algorithm|solution|model|framework|strategy|system|platform|workflow|test strategy|test plan|' +
        'kien truc|thuat toan|giai phap|mo hinh|chien luoc|ke hoach kiem thu|he thong|nen tang|quy trinh|giao dien',
    ),
    reason: 'Thiết kế hoặc xây dựng một giải pháp/sản phẩm',
    priority: 60,
  },
  {
    level: 'Create',
    action: words('create|develop|build|xay dung|phat trien|tao ra'),
    object: words('new|novel|original|from scratch|moi|tu dau|sang tao'),
    reason: 'Tạo ra sản phẩm mới một cách rõ ràng',
    priority: 58,
  },
  {
    level: 'Evaluate',
    action: words('evaluate|assess|compare|justify|prioritize|danh gia|so sanh|tham dinh|lua chon|uu tien|de xuat'),
    object: words(
      'criteria|standard|alternative|option|quality|security|performance|cost|risk|evidence|trade off|tieu chi|tieu chuan|phuong an|' +
        'chat luong|bao mat|hieu nang|chi phi|rui ro|bang chung|muc do|giai phap|ket qua',
    ),
    reason: 'Đánh giá phương án hoặc kết quả theo tiêu chí',
    priority: 50,
  },
  {
    level: 'Analyze',
    action: words(
      'analyze|analyse|diagnose|debug|investigate|troubleshoot|phan tich|chan doan|dieu tra|tim nguyen nhan|xac dinh nguyen nhan|phan ra|boc tach',
    ),
    object: words(
      'data|issue|error|problem|failure|causes?|bottleneck|dependency|relationship|log|performance|requirement|risk|root causes?|' +
        'du lieu|loi|su co|van de|nguyen nhan|nut that|phu thuoc|moi quan he|nhat ky|hieu nang|yeu cau|rui ro|he thong|quy trinh',
    ),
    reason: 'Phân tích thành phần, nguyên nhân hoặc mối quan hệ',
    priority: 40,
  },
  {
    level: 'Understand',
    action: words('explain|describe|interpret|summarize|paraphrase|giai thich|mo ta|dien giai|tom tat|trinh bay|lam ro'),
    object: words(
      'concepts?|principles?|mechanisms?|lifecycle|architecture|behavior|meaning|result|process|how|why|' +
        'khai niem|nguyen ly|co che|vong doi|kien truc|hanh vi|y nghia|ket qua|quy trinh|cach hoat dong|su khac biet',
    ),
    reason: 'Giải thích hoặc diễn giải khái niệm/quy trình',
    priority: 20,
  },
  {
    level: 'Remember',
    action: words('recall|list|name|define|enumerate|liet ke|ghi nho|dinh nghia|ke ten|nhac lai'),
    object: words(
      'syntax|terms?|definitions?|keyword|fact|command|type|concept|cu phap|thuat ngu|dinh nghia|tu khoa|lenh|kieu du lieu|khai niem|buoc|quy tac|thanh phan',
    ),
    reason: 'Ghi nhớ hoặc liệt kê kiến thức',
    priority: 10,
  },
  {
    level: 'Apply',
    action: words(
      'use|utilize|apply|implement|configure|deploy|integrate|execute|perform|test|verify|fix|code|run|operate|' +
        'su dung|ap dung|trien khai|cau hinh|tich hop|thuc hien|kiem thu|kiem tra|xac minh|sua loi|khac phuc|lap trinh|van hanh|' +
        'xay dung|phat trien|bao tri|tu dong hoa',
    ),
    object: words(OBJECT_TECH),
    reason: 'Vận dụng công cụ/quy trình vào tác vụ kỹ thuật cụ thể',
    priority: 30,
  },
];

const NOMINAL_ONLY = words(
  'experience|experienced|familiar|knowledge|proficient|expertise|years|year|senior|middle|junior|bachelor|degree|' +
    'kinh nghiem|co kinh nghiem|thanh thao|hieu biet|quen thuoc|nam|cu nhan|bang cap|tot nghiep',
);
const META = words('working hours|location|direct supervisor|salary|benefits|gio lam viec|dia diem|nguoi quan ly|muc luong|phuc loi');

function classifyClause(clause: string): { level: BloomOrUnknown; reason: string } {
  const normalized = fold(clause);
  if (new RegExp(META.source, 'u').test(normalized)) return { level: 'UNDETERMINED', reason: 'Thông tin chung, không phải yêu cầu năng lực' };
  let best: { rule: Rule; start: number } | null = null;
  for (const rule of RULES) {
    const action = new RegExp(rule.action.source, 'gu');
    let m: RegExpExecArray | null;
    while ((m = action.exec(normalized))) {
      const end = m.index + m[0].length;
      const window = normalized.slice(end, end + 95);
      if (!new RegExp(rule.object.source, 'u').test(window)) continue;
      const before = normalized.slice(Math.max(0, m.index - 32), m.index);
      if (new RegExp(NOMINAL_ONLY.source, 'u').test(before) && !/(?:can|able to|co the|kha nang)\s*$/.test(before)) continue;
      if (!best || rule.priority > best.rule.priority || (rule.priority === best.rule.priority && m.index < best.start)) best = { rule, start: m.index };
    }
  }
  return best ? { level: best.rule.level, reason: best.rule.reason } : { level: 'UNDETERMINED', reason: 'Câu chưa có động từ hành động kèm đối tượng rõ ràng' };
}

/** Tách câu, nhận diện kỹ năng theo danh mục và ước lượng Bloom cho JD tự dán. */
export function mappingFromPastedJd(text: string, catalog: { name: string; category?: string }[]): JdBloomMapping {
  const names = catalog
    .filter((s) => s.name.trim().length > 0)
    .map((s) => ({ ...s, folded: fold(s.name) }))
    .sort((a, b) => b.folded.length - a.folded.length);
  const clauses = text
    .split(/[\r\n;]+|(?<=[.!?])\s+(?=\p{Lu})/u)
    .map((c) => c.replace(/^[\s\-*•·+–—\d.)]+/u, '').trim())
    .filter((c) => c.length >= 3)
    .slice(0, 300);
  const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  const requirements = clauses.map<RequirementInput>((clause) => {
    const folded = fold(clause);
    const found: { name: string; category?: string }[] = [];
    let rest = folded;
    for (const skill of names) {
      const pattern = new RegExp(`(?<![\\p{L}\\p{N}_])${escape(skill.folded)}(?![\\p{L}\\p{N}_])`, 'u');
      if (pattern.test(rest)) {
        found.push({ name: skill.name, category: skill.category });
        rest = rest.replace(pattern, ' ');
      }
    }
    const f = fold(clause);
    const importance: Importance = /nice to have|preferred|plus|uu tien|la loi the|diem cong/.test(f)
      ? 'PREFERRED'
      : /willing to learn|san sang hoc|khong bat buoc/.test(f)
        ? 'FLEXIBLE'
        : /must|required|bat buoc|yeu cau|requirement/.test(f)
          ? 'MANDATORY'
          : 'UNSPECIFIED';
    const { level, reason } = classifyClause(clause);
    return { text: clause, importance, skills: found, bloom: [{ level, justification: reason }] };
  });
  return aggregate('PASTED', requirements);
}
