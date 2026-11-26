import { DashboardLayout } from './DashboardLayout';
import { candidateNav } from '../constants/navigation';
import { AssistantChatWidget } from '../pages/candidate/assistant/AssistantChatWidget';
import { CandidateAiTasks } from './CandidateAiTasks';

export default function CandidateLayout() {
  return (
    <CandidateAiTasks>
      <DashboardLayout area="Candidate" nav={candidateNav} />
      <AssistantChatWidget />
    </CandidateAiTasks>
  );
}
