import { DashboardLayout } from './DashboardLayout';
import { candidateNav } from '../constants/navigation';
import { AssistantChatWidget } from '../pages/candidate/assistant/AssistantChatWidget';
export default function CandidateLayout(){return <><DashboardLayout area="Candidate" nav={candidateNav}/><AssistantChatWidget/></>;}
