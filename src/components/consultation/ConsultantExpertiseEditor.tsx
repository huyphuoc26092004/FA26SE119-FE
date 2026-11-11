import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CONSULTATION_TARGET_ROLES } from '../../constants/consultationRoles';
import { useTranslation } from '../../i18n';
import {
  getMyConsultantProfile,
  saveMyConsultantProfile,
  type ConsultantProfile,
} from '../../services/bookingService';
import { fieldLabel, primaryButton, underlineInput } from '../admin/AdminKit';

export function ConsultantExpertiseForm({ profile, onSave, isSaving, onEdit }: {
  profile: ConsultantProfile;
  onSave: (targetRoles: string[], bio: string) => void;
  isSaving: boolean;
  onEdit: () => void;
}) {
  const { isVietnamese: vi } = useTranslation();
  const [roles, setRoles] = useState(() => [...new Set(profile.target_roles)]);
  const [bio, setBio] = useState(profile.bio);
  // Keep saved specialties that predate the shared list when updating a profile.
  const options = [...new Set<string>([...CONSULTATION_TARGET_ROLES, ...profile.target_roles])];
  const valid = roles.length >= 1 && roles.length <= 20;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (valid && !isSaving) onSave(roles, bio.trim());
  };

  return (
    <form className="space-y-6" onSubmit={submit}>
      <p className="max-w-3xl text-sm leading-6 text-slate-600">
        {vi
          ? 'Chọn lĩnh vực bạn có thể tư vấn. Ứng viên sẽ thấy chuyên môn và phần giới thiệu này khi chọn người tư vấn phù hợp.'
          : 'Choose the areas you can advise on. Candidates see these specialties and your introduction when choosing an advisor.'}
      </p>
      {profile.target_roles.length === 0 && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {vi
            ? 'Bạn chưa có chuyên môn tư vấn. Chọn ít nhất một lĩnh vực và lưu để ứng viên có thể tìm thấy bạn.'
            : 'Your expertise is not set up yet. Select at least one area and save so candidates can find you.'}
        </p>
      )}
      <fieldset disabled={isSaving} aria-describedby="expertise-role-help">
        <legend className="text-sm font-medium text-ink">{vi ? 'Lĩnh vực tư vấn' : 'Consulting areas'}</legend>
        <p id="expertise-role-help" className="mt-1 text-xs text-slate-500">
          {vi ? 'Chọn từ 1 đến 20 lĩnh vực.' : 'Select 1 to 20 areas.'}
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {options.map((role) => (
            <label key={role} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
              roles.includes(role) ? 'border-brand bg-brand/5 text-ink' : 'border-border text-slate-600'
            }`}>
              <input
                type="checkbox"
                name="targetRoles"
                value={role}
                checked={roles.includes(role)}
                disabled={!roles.includes(role) && roles.length >= 20}
                onChange={(event) => {
                  setRoles(event.target.checked ? [...roles, role] : roles.filter((value) => value !== role));
                  onEdit();
                }}
                className="size-4 shrink-0 accent-brand"
              />
              <span className="break-words">{role}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block">
        <span className={fieldLabel}>{vi ? 'Giới thiệu với ứng viên' : 'Introduction for candidates'}</span>
        <textarea
          name="bio"
          value={bio}
          disabled={isSaving}
          onChange={(event) => { setBio(event.target.value); onEdit(); }}
          maxLength={3000}
          rows={4}
          className={underlineInput}
          placeholder={vi
            ? 'Kinh nghiệm làm việc, thế mạnh và những nội dung bạn có thể hỗ trợ ứng viên…'
            : 'Share your experience, strengths and how you can help candidates…'}
        />
      </label>
      <button type="submit" className={primaryButton} disabled={isSaving || !valid}>
        {isSaving ? (vi ? 'Đang lưu…' : 'Saving…') : (vi ? 'Lưu chuyên môn' : 'Save expertise')}
      </button>
    </form>
  );
}

export default function ConsultantExpertiseEditor() {
  const { isVietnamese: vi } = useTranslation();
  const client = useQueryClient();
  const profile = useQuery({ queryKey: ['consultant-profile'], queryFn: getMyConsultantProfile });
  const save = useMutation({
    mutationFn: ({ roles, bio }: { roles: string[]; bio: string }) => saveMyConsultantProfile(roles, bio),
    onSuccess: (saved) => {
      client.setQueryData(['consultant-profile'], saved);
      void client.invalidateQueries({ queryKey: ['matching-consultants'] });
      void client.invalidateQueries({ queryKey: ['manager-consultants'] });
    },
  });

  if (profile.isPending) return <p className="text-sm text-slate-500">{vi ? 'Đang tải chuyên môn…' : 'Loading expertise…'}</p>;
  if (profile.isError) return (
    <div className="space-y-3">
      <p role="alert" className="text-sm text-danger">{profile.error.message}</p>
      <button type="button" className="text-sm text-brand underline" onClick={() => void profile.refetch()}>
        {vi ? 'Thử lại' : 'Try again'}
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <ConsultantExpertiseForm
        key={JSON.stringify(profile.data)}
        profile={profile.data}
        onSave={(roles, bio) => save.mutate({ roles, bio })}
        onEdit={() => save.reset()}
        isSaving={save.isPending}
      />
      {save.isError && <p role="alert" className="text-sm text-danger">{save.error.message}</p>}
      {save.isSuccess && <p role="status" className="text-sm text-brand">
        {vi ? 'Đã lưu chuyên môn và giới thiệu cho ứng viên.' : 'Your expertise and introduction have been saved.'}
      </p>}
    </div>
  );
}
