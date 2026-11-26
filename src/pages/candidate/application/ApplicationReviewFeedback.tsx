import { MarkdownMessage } from '../assistant/MarkdownMessage';

type ReviewRow = Record<string, unknown>;

function isRow(value: unknown): value is ReviewRow {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseReview(feedback: string): ReviewRow | undefined {
  const json = feedback.trim().replace(/^```(?:json)?\s*\n|\n\s*```$/gi, '');
  if (!json.startsWith('{')) return;

  try {
    // Some responses include literal line breaks inside quoted JSON values.
    const escaped = json.replace(/"(?:[^"\\]|\\[\s\S])*"/g, (value) =>
      value.replace(/\r\n|[\r\n]/g, '\\n').replace(/\t/g, '\\t'),
    );
    const value: unknown = JSON.parse(escaped);
    if (isRow(value) && ('overall_assessment' in value || 'evaluations' in value || 'improvements' in value)) {
      return value;
    }
  } catch {
    return;
  }
}

function Text({ value, label, quote = false }: { value: unknown; label?: string; quote?: boolean }) {
  const text = Array.isArray(value) ? value.filter((item) => typeof item === 'string').join('\n') : value;
  if (typeof text !== 'string' || !text.trim()) return null;
  const [primary, ...translation] = quote ? [text] : text.replace(/\\n/g, '\n').trim().split(/\r?\n/);

  return (
    <div className="text-sm leading-relaxed text-slate-700">
      <p className="whitespace-pre-wrap">{label && <strong>{label} </strong>}{primary}</p>
      {translation.length > 0 && (
        <p className="whitespace-pre-wrap italic text-slate-600">
          {translation.join('\n').trim()}
        </p>
      )}
    </div>
  );
}

const criterionLabels: Record<string, [string, string]> = {
  WORDING: ['Cách diễn đạt và tính chuyên nghiệp', 'Wording and professionalism'],
  SPELLING_GRAMMAR: ['Chính tả và ngữ pháp', 'Spelling and grammar'],
  APPLICATION_REASON: ['Lý do ứng tuyển', 'Application reason'],
  PERSONAL_SKILLS: ['Kỹ năng và mức độ phù hợp', 'Skills and job relevance'],
  THANK_YOU: ['Lời cảm ơn', 'Thank-you expression'],
  CONTACT_INFORMATION: ['Thông tin liên hệ', 'Contact information'],
};

const statusLabels: Record<string, [string, string]> = {
  PASS: ['Đạt', 'Pass'],
  PARTIAL: ['Đạt một phần', 'Partial'],
  FAIL: ['Chưa đạt', 'Fail'],
  NOT_APPLICABLE: ['Không áp dụng', 'Not applicable'],
};

export function ApplicationReviewFeedback({ feedback, vi }: { feedback: string; vi: boolean }) {
  const review = parseReview(feedback);
  if (!review) return <MarkdownMessage content={feedback} bilingual />;

  const evaluations = Array.isArray(review.evaluations) ? review.evaluations.filter(isRow) : [];
  const improvements = Array.isArray(review.improvements) ? review.improvements.filter(isRow) : [];
  const heading = (vn: string, en: string) => (
    <h4 className="mb-2 font-medium text-ink">
      {vi ? vn : en}
      <span className="block text-sm italic font-normal text-slate-600">{vi ? en : vn}</span>
    </h4>
  );
  const localized = (labels: Record<string, [string, string]>, value: unknown) =>
    typeof value === 'string' ? labels[value]?.[vi ? 0 : 1] ?? value : '';

  return (
    <div className="space-y-5">
      {typeof review.overall_assessment === 'string' && (
        <section>
          {heading('Đánh giá chung', 'Overall assessment')}
          <Text value={review.overall_assessment} />
        </section>
      )}
      {evaluations.length > 0 && (
        <section>
          {heading('Tiêu chí đánh giá', 'Evaluation criteria')}
          <ul className="space-y-3">
            {evaluations.map((item, index) => (
              <li key={index} className="space-y-1">
                <p className="text-sm font-medium text-ink">
                  {[localized(criterionLabels, item.criterion), localized(statusLabels, item.status)]
                    .filter(Boolean).join(' · ')}
                </p>
                <Text value={item.reason} />
                <Text value={item.evidence} label={vi ? 'Trích dẫn' : 'Evidence'} quote />
                <Text value={item.suggestion} label={vi ? 'Đề xuất' : 'Suggestion'} />
              </li>
            ))}
          </ul>
        </section>
      )}
      {improvements.length > 0 && (
        <section>
          {heading('Các điểm cần cải thiện', 'Areas for improvement')}
          <ol className="ml-5 list-decimal space-y-3">
            {improvements.map((item, index) => (
              <li key={index} className="space-y-1">
                <div className="font-medium"><Text value={item.title} /></div>
                <Text value={item.original_text} label={vi ? 'Đoạn liên quan' : 'Relevant text'} quote />
                <Text value={item.problem} label={vi ? 'Vấn đề' : 'Issue'} />
                <Text value={item.suggestion} label={vi ? 'Đề xuất' : 'Suggestion'} />
                <Text value={item.replacement} label={vi ? 'Đổi thành' : 'Suggested replacement'} />
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
