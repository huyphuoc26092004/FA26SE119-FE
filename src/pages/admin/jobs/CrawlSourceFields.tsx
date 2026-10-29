import { fieldLabel, underlineInput, underlineSelect } from '../../../components/admin/AdminKit';
import type { CrawlSource, CrawlSourceSite } from '../../../types/jobCrawl';
import { ROLE_SUGGESTIONS, clamp } from './crawlFormat';

/** Site / keyword / role / location / limits inputs shared by the manual run and the schedule. */
export function CrawlSourceFields({
  value,
  onChange,
  idPrefix,
  disabled,
}: {
  value: CrawlSource;
  onChange: (next: CrawlSource) => void;
  idPrefix: string;
  disabled?: boolean;
}) {
  const set = <K extends keyof CrawlSource>(key: K, v: CrawlSource[K]) => onChange({ ...value, [key]: v });
  const listId = `${idPrefix}-roles`;

  return (
    <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 xl:grid-cols-6">
      <label className="block xl:col-span-1">
        <span className={fieldLabel}>Trang nguồn</span>
        <select
          className={underlineSelect}
          value={value.sourceSite}
          disabled={disabled}
          onChange={(e) => set('sourceSite', e.target.value as CrawlSourceSite)}
        >
          <option value="ITVIEC">ITviec</option>
          <option value="TOPCV">TopCV</option>
        </select>
      </label>
      <label className="block xl:col-span-2">
        <span className={fieldLabel}>Từ khoá tìm kiếm</span>
        <input
          className={underlineInput}
          value={value.keyword}
          maxLength={255}
          disabled={disabled}
          placeholder="Java, React, Data Engineer…"
          onChange={(e) => set('keyword', e.target.value)}
        />
      </label>
      <label className="block xl:col-span-1">
        <span className={fieldLabel}>Nhóm vai trò</span>
        <input
          className={underlineInput}
          value={value.roleCategory}
          maxLength={100}
          list={listId}
          disabled={disabled}
          placeholder="Backend"
          onChange={(e) => set('roleCategory', e.target.value)}
        />
        <datalist id={listId}>
          {ROLE_SUGGESTIONS.map((r) => (
            <option key={r} value={r} />
          ))}
        </datalist>
      </label>
      <label className="block xl:col-span-2">
        <span className={fieldLabel}>Địa điểm</span>
        <input
          className={underlineInput}
          value={value.location}
          maxLength={120}
          disabled={disabled}
          placeholder="Để trống để tìm toàn quốc"
          onChange={(e) => set('location', e.target.value)}
        />
      </label>
      <label className="block xl:col-span-1">
        <span className={fieldLabel}>Số tin tối đa (1–20)</span>
        <input
          type="number"
          min={1}
          max={20}
          className={underlineInput}
          value={value.limit}
          disabled={disabled}
          onChange={(e) => set('limit', clamp(Number(e.target.value), 1, 20))}
        />
      </label>
      <label className="block xl:col-span-1">
        <span className={fieldLabel}>Số trang tìm (1–5)</span>
        <input
          type="number"
          min={1}
          max={5}
          className={underlineInput}
          value={value.maxPages}
          disabled={disabled}
          onChange={(e) => set('maxPages', clamp(Number(e.target.value), 1, 5))}
        />
      </label>
    </div>
  );
}

export const isSourceComplete = (s: CrawlSource) => s.keyword.trim() !== '' && s.roleCategory.trim() !== '';
