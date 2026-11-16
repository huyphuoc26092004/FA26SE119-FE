import { useEffect } from 'react';
import { GuestTrialSection } from '../../components/guest-trial/GuestTrialSection';

export default function GuestTrialPage() {
  // Scroll to top when opening the trial page
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="min-h-[var(--vh100)] bg-canvas text-ink">
      <GuestTrialSection isStandalone={true} />
    </div>
  );
}
