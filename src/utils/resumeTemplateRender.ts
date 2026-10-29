import type { Resume } from '../types/domain';

/** Kích thước trang A4 ở 96dpi, dùng để thu nhỏ bản xem trước cho vừa khung. */
export const A4_WIDTH_PX = 794;
export const A4_HEIGHT_PX = 1123;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Giữ xuống dòng người dùng gõ trong ô mô tả. */
const multiline = (value: string) => escapeHtml(value.trim()).replace(/\n/g, '<br>');

const period = (start?: string, end?: string, isCurrent?: boolean, presentLabel = 'Hiện tại') => {
  const to = isCurrent ? presentLabel : end?.trim();
  return [start?.trim(), to].filter(Boolean).join(' – ');
};

interface Entry {
  title: string;
  subtitle?: string;
  period?: string;
  text?: string;
  bullets?: string[];
}

const entryHtml = (item: Entry) => {
  const bullets = (item.bullets ?? []).map((b) => b.trim()).filter(Boolean);
  return `
    <div class="cv-entry" style="margin-bottom: 12px; break-inside: avoid;">
      <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 8px;">
        <span class="cv-entry-title" style="font-size: 13.5px; font-weight: 700; color: inherit;">${escapeHtml(item.title)}</span>
        ${item.period ? `<span class="cv-entry-period" style="font-size: 11.5px; font-weight: 600; opacity: 0.8; white-space: nowrap; font-variant-numeric: tabular-nums;">${escapeHtml(item.period)}</span>` : ''}
      </div>
      ${item.subtitle ? `<div class="cv-entry-subtitle" style="font-size: 12.5px; font-weight: 600; opacity: 0.85; margin: 1px 0 3px 0;">${escapeHtml(item.subtitle)}</div>` : ''}
      ${item.text?.trim() ? `<p class="cv-entry-text" style="margin: 0 0 4px 0; font-size: 12.5px; line-height: 1.55; opacity: 0.9;">${multiline(item.text)}</p>` : ''}
      ${
        bullets.length
          ? `<ul class="cv-entry-items" style="margin: 0; padding-left: 18px; font-size: 12.5px; line-height: 1.5; opacity: 0.9;">${bullets
              .map((b) => `<li style="margin-bottom: 2.5px;">${escapeHtml(b)}</li>`)
              .join('')}</ul>`
          : ''
      }
    </div>`;
};

const pillsHtml = (items: string[]) => `
  <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 4px;">
    ${items
      .map(
        (s) =>
          `<span class="cv-skill-pill" style="display: inline-flex; align-items: center; padding: 2.5px 8px; font-size: 11px; font-weight: 500; border-radius: 4px; border: 1px solid currentColor; opacity: 0.9;">${escapeHtml(s)}</span>`,
      )
      .join('')}
  </div>`;

const hasText = (value?: string) => Boolean(value && value.trim());

/**
 * Bỏ một mục trống khỏi mẫu: cả khối `section` chứa nó, hoặc (với cột bên kiểu
 * sidebar) chính ô đó cùng tiêu đề đứng ngay trước.
 */
function removeSlot(el: Element) {
  const section = el.parentElement?.closest('section, .cv-section');
  if (el.matches('section, .cv-section')) {
    el.remove();
    return;
  }
  if (section && section.querySelectorAll('[data-cv-section]').length === 1) {
    section.remove();
    return;
  }
  const prev = el.previousElementSibling;
  if (prev && /^H[1-4]$/.test(prev.tagName)) prev.remove();
  el.remove();
}

export interface RenderOptions {
  /** Ngôn ngữ của nhãn phụ (Hiện tại / Present, Ngoại ngữ / Languages...). */
  lang?: 'vi' | 'en';
  /** Chữ mờ hiện ở ô họ tên khi người dùng chưa nhập. */
  namePlaceholder?: string;
}

/**
 * Điền dữ liệu CV người dùng đang nhập vào HTML của mẫu (các ô `data-cv-field` /
 * `data-cv-section` giống trang quản trị mẫu). Mục nào trống thì ẩn khỏi bản xem trước.
 */
export function renderTemplateWithResume(html: string, cv: Partial<Resume>, options: RenderOptions = {}): string {
  if (!html) return '';
  const lang = options.lang ?? 'vi';
  const labels =
    lang === 'en'
      ? { present: 'Present', languages: 'Languages', gpa: 'GPA', awards: 'Awards' }
      : { present: 'Hiện tại', languages: 'Ngoại ngữ', gpa: 'GPA', awards: 'Giải thưởng' };

  const doc = new DOMParser().parseFromString(html, 'text/html');

  const setField = (key: string, value: string | undefined, placeholder?: string) => {
    doc.querySelectorAll(`[data-cv-field="${key}"]`).forEach((el) => {
      if (hasText(value)) {
        el.textContent = value!.trim();
      } else if (placeholder) {
        el.textContent = placeholder;
        (el as HTMLElement).style.opacity = '0.25';
      } else {
        el.remove();
      }
    });
  };

  const fillSection = (key: string, content: string) => {
    doc.querySelectorAll(`[data-cv-section="${key}"]`).forEach((el) => {
      if (!content.trim()) {
        removeSlot(el);
        return;
      }
      // Mẫu do backend sinh có <h2> nằm ngay trong ô; giữ lại tiêu đề đó.
      const heading = el.querySelector(':scope > h1, :scope > h2, :scope > h3, :scope > h4');
      el.innerHTML = (heading ? heading.outerHTML : '') + content;
    });
  };

  setField('fullName', cv.fullName, options.namePlaceholder);
  setField('headline', cv.position);
  const contact = [cv.email, cv.phone, cv.location, cv.website, cv.linkedin, cv.github]
    .map((v) => v?.trim())
    .filter(Boolean)
    .join(' • ');
  setField('contact', contact);

  // Ô ảnh đại diện chữ "CV" ở mẫu hai cột: thay bằng chữ cái đầu của tên.
  const initials = (cv.fullName ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  doc.querySelectorAll('.cv-avatar').forEach((el) => {
    el.textContent = initials || 'CV';
  });

  fillSection(
    'summary',
    hasText(cv.summary)
      ? `<p class="cv-entry-text" style="margin: 0; line-height: 1.6; font-size: 13px;">${multiline(cv.summary!)}</p>`
      : '',
  );

  fillSection(
    'experience',
    (cv.experience ?? [])
      .filter((e) => hasText(e.role) || hasText(e.company) || hasText(e.description))
      .map((e) =>
        entryHtml({
          title: e.role || e.company,
          subtitle: [e.role ? e.company : '', e.location].filter(hasText).join(' • '),
          period: period(e.startDate, e.endDate, e.isCurrent, labels.present),
          text: e.description,
          bullets: e.highlights,
        }),
      )
      .join(''),
  );

  fillSection(
    'education',
    (cv.education ?? [])
      .filter((e) => hasText(e.school) || hasText(e.degree) || hasText(e.field))
      .map((e) =>
        entryHtml({
          title: [e.degree, e.field].filter(hasText).join(' – ') || e.school,
          subtitle: e.degree || e.field ? e.school : '',
          period: period(e.startDate, e.endDate),
          text: hasText(e.gpa) ? `${labels.gpa}: ${e.gpa}` : '',
          bullets: e.highlights,
        }),
      )
      .join(''),
  );

  const skills = [...(cv.skills ?? []), ...(cv.softSkills ?? [])].map((s) => s.trim()).filter(Boolean);
  const languages = (cv.languages ?? []).filter((l) => hasText(l.name));
  fillSection(
    'skills',
    (skills.length ? pillsHtml(skills) : '') +
      (languages.length
        ? `<p class="cv-entry-text" style="margin: 8px 0 0 0; font-size: 12.5px;"><strong>${labels.languages}:</strong> ${languages
            .map((l) => escapeHtml(l.level ? `${l.name} (${l.level})` : l.name))
            .join(', ')}</p>`
        : ''),
  );

  fillSection(
    'projects',
    (cv.projects ?? [])
      .filter((p) => hasText(p.name) || hasText(p.description))
      .map((p) =>
        entryHtml({
          title: p.name,
          subtitle: [p.role, p.techStack?.filter(hasText).join(', '), p.link].filter(hasText).join(' • '),
          text: p.description,
        }),
      )
      .join(''),
  );

  fillSection(
    'certifications',
    [
      ...(cv.certifications ?? [])
        .filter((c) => hasText(c.name))
        .map((c) => entryHtml({ title: c.name, subtitle: c.issuer, period: c.date })),
      ...(cv.awards ?? [])
        .filter((a) => hasText(a.title))
        .map((a) => entryHtml({ title: a.title, subtitle: a.issuer, period: a.year, text: a.description })),
    ].join(''),
  );

  // Trang trắng cỡ A4; CSS của mẫu vẫn được ưu tiên vì nằm sau.
  const style = doc.createElement('style');
  style.textContent = `
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    html { background: #ffffff; }
    body { min-height: ${A4_HEIGHT_PX}px; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
  `;
  doc.head.insertBefore(style, doc.head.firstChild);

  return '<!DOCTYPE html>' + doc.documentElement.outerHTML;
}
