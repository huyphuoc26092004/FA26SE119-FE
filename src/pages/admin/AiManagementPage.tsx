import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Cpu,
  ScrollText,
  Database,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Sliders,
  Play,
  Layers,
  Zap,
} from 'lucide-react';
import type {
  AdminAiModel,
  SystemPromptItem,
  EmbeddingModelConfig,
  VectorCollectionItem,
  VectorChunkingConfig,
  VectorQueueMetric,
  AiManagementSummaryMetrics,
} from '../../types/aiManagement';
import {
  getAiManagementOverview,
  getAdminAiModels,
  saveAdminAiModel,
  toggleModelPrimaryStatus,
  testModelPing,
  getSystemPrompts,
  saveSystemPrompt,
  publishNewPromptVersion,
  rollbackPromptVersion,
  getEmbeddingModels,
  getVectorCollections,
  getChunkingConfig,
  saveChunkingConfig,
  getVectorQueueMetrics,
  reindexVectorCollection,
} from '../../services/aiManagementService';

import { AiModelsTab } from './ai/AiModelsTab';
import { SystemPromptsTab } from './ai/SystemPromptsTab';
import { EmbeddingServiceTab } from './ai/EmbeddingServiceTab';
import { ModelConfigModal } from './ai/ModelConfigModal';
import { PromptEditorModal } from './ai/PromptEditorModal';
import { PromptPlaygroundModal } from './ai/PromptPlaygroundModal';
import { SemanticTesterModal } from './ai/SemanticTesterModal';

export type AiManagementTabKey = 'models' | 'prompts' | 'embeddings';

interface AiManagementPageProps {
  defaultTab?: AiManagementTabKey;
}

export const AiManagementPage: React.FC<AiManagementPageProps> = ({
  defaultTab = 'models',
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as AiManagementTabKey | null;
  const [activeTab, setActiveTab] = useState<AiManagementTabKey>(tabParam || defaultTab);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Core Data States
  const [overview, setOverview] = useState<AiManagementSummaryMetrics | null>(null);
  const [models, setModels] = useState<AdminAiModel[]>([]);
  const [prompts, setPrompts] = useState<SystemPromptItem[]>([]);
  const [embeddings, setEmbeddings] = useState<EmbeddingModelConfig[]>([]);
  const [collections, setCollections] = useState<VectorCollectionItem[]>([]);
  const [chunking, setChunking] = useState<VectorChunkingConfig | null>(null);
  const [queues, setQueues] = useState<VectorQueueMetric[]>([]);

  // Modals
  const [selectedModelForModal, setSelectedModelForModal] = useState<AdminAiModel | null>(null);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);

  const [selectedPromptForEditor, setSelectedPromptForEditor] = useState<SystemPromptItem | null>(null);
  const [isPromptEditorOpen, setIsPromptEditorOpen] = useState(false);

  const [selectedPromptForPlayground, setSelectedPromptForPlayground] = useState<SystemPromptItem | null>(null);
  const [isPlaygroundOpen, setIsPlaygroundOpen] = useState(false);

  const [isSemanticTesterOpen, setIsSemanticTesterOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3800);
  };

  const loadData = useCallback(async () => {
    try {
      const [ov, mod, prm, emb, col, chk, qu] = await Promise.all([
        getAiManagementOverview(),
        getAdminAiModels(),
        getSystemPrompts(),
        getEmbeddingModels(),
        getVectorCollections(),
        getChunkingConfig(),
        getVectorQueueMetrics(),
      ]);
      setOverview(ov);
      setModels(mod);
      setPrompts(prm);
      setEmbeddings(emb);
      setCollections(col);
      setChunking(chk);
      setQueues(qu);
    } catch (err) {
      console.error('Error loading AI Management data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Tab change handler
  const handleTabChange = (tab: AiManagementTabKey) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    showToast('Đã làm mới dữ liệu cấu hình AI & đồng bộ trạng thái Gateway thành công!');
  };

  // Model actions
  const handleSaveModel = async (model: AdminAiModel) => {
    await saveAdminAiModel(model);
    await loadData();
    showToast(`Đã lưu cấu hình mô hình ${model.displayName} thành công!`);
  };

  const handleTogglePrimary = async (modelId: string) => {
    await toggleModelPrimaryStatus(modelId);
    await loadData();
    showToast(`Đã thiết lập mô hình #${modelId} làm Mô hình Mặc định Chính (Primary)!`);
  };

  const handleTestPing = async (modelId: string) => {
    const res = await testModelPing(modelId);
    await loadData();
    return res;
  };

  // Prompt actions
  const handleSavePrompt = async (prompt: SystemPromptItem) => {
    await saveSystemPrompt(prompt);
    await loadData();
    showToast(`Đã lưu câu lệnh hệ thống "${prompt.name}" thành công!`);
  };

  const handlePublishPromptVersion = async (
    promptId: string,
    version: string,
    content: string,
    changelog: string
  ) => {
    await publishNewPromptVersion(promptId, version, content, changelog);
    await loadData();
    showToast(`Đã xuất bản thành công phiên bản ${version} ra môi trường hoạt động!`);
  };

  const handleRollbackVersion = async (promptId: string, version: string) => {
    await rollbackPromptVersion(promptId, version);
    await loadData();
    showToast(`Đã khôi phục thành công câu lệnh về phiên bản ${version}!`);
  };

  const handleCreatePrompt = () => {
    const newPromptTemplate: SystemPromptItem = {
      id: `prompt-${Date.now().toString().slice(-4)}`,
      featureKey: 'assistant_chat',
      featureName: 'Tùy chỉnh Nghiệp vụ',
      name: 'Custom Career Prompt',
      description: 'Chỉ thị hệ thống tùy chỉnh mới cho trợ lý thông minh',
      targetRole: 'All Candidates',
      assignedModelId: models[0]?.modelId || 'gemini-1.5-flash',
      status: 'DRAFT',
      currentVersion: 'v1.0',
      variables: [
        {
          name: 'candidate_name',
          label: 'Tên ứng viên',
          description: 'Họ tên ứng viên',
          sampleValue: 'Alex Morgan',
          required: true,
        },
      ],
      systemInstructions:
        'Bạn là Cố vấn Nghề nghiệp Tinh hoa. Nhiệm vụ của bạn là giải đáp thắc mắc cho ứng viên {{candidate_name}}...',
      versions: [
        {
          version: 'v1.0',
          content:
            'Bạn là Cố vấn Nghề nghiệp Tinh hoa. Nhiệm vụ của bạn là giải đáp thắc mắc cho ứng viên {{candidate_name}}...',
          changelog: 'Phiên bản khởi tạo ban đầu',
          author: 'Admin',
          createdAt: new Date().toLocaleDateString('vi-VN'),
          isActive: true,
        },
      ],
      updatedAt: new Date().toLocaleString('vi-VN'),
      updatedBy: 'Admin',
    };
    setSelectedPromptForEditor(newPromptTemplate);
    setIsPromptEditorOpen(true);
  };

  // Embedding actions
  const handleSaveChunking = async (cfg: VectorChunkingConfig) => {
    await saveChunkingConfig(cfg);
    await loadData();
    showToast('Đã lưu cấu hình phân đoạn văn bản (Text Chunking) thành công!');
  };

  const handleReindex = async (collectionId: string) => {
    const res = await reindexVectorCollection(collectionId);
    await loadData();
    showToast(`Đã hoàn thành Re-index ${res.reindexedVectors.toLocaleString()} vectors (${res.durationMs}ms)!`);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16 font-sans">
      {/* Toast notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-2xl animate-slide-left border border-slate-800">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Sticky Bar */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-20 backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                <span>Quản trị hệ thống</span>
                <span>/</span>
                <span className="text-blue-600 font-bold">Cấu hình AI & Prompt Studio</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <Cpu className="text-blue-600" size={26} />
                <span>Quản lý Hạ tầng AI & Câu lệnh Hệ thống</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Quản trị mô hình ngôn ngữ lớn (LLMs), tinh chỉnh tham số suy luận, câu lệnh hệ thống (Prompts) và dịch vụ Embedding
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-3.5 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
              >
                <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />
                <span>{isRefreshing ? 'Đang đồng bộ...' : 'Đồng bộ dữ liệu'}</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto border-b border-slate-200 -mb-px">
            <button
              onClick={() => handleTabChange('models')}
              className={`px-4 py-3 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
                activeTab === 'models'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/40'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Cpu size={15} />
              <span>Cấu hình Mô hình AI (Inference Gateway)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                {models.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('prompts')}
              className={`px-4 py-3 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
                activeTab === 'prompts'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/40'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <ScrollText size={15} />
              <span>Câu lệnh Hệ thống (System Prompts Studio)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700">
                {prompts.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('embeddings')}
              className={`px-4 py-3 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
                activeTab === 'embeddings'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/40'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Database size={15} />
              <span>Dịch vụ Embedding & Vector Search</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                {collections.length} Collections
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {isLoading ? (
          <div className="p-16 text-center rounded-3xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-sm font-bold text-slate-800">Đang tải dữ liệu cấu hình AI...</h3>
            <p className="text-xs text-slate-400 mt-1">Đang kết nối tới Gateway và đồng bộ Vector Index</p>
          </div>
        ) : (
          <>
            {activeTab === 'models' && (
              <AiModelsTab
                models={models}
                onOpenModelModal={(m) => {
                  setSelectedModelForModal(m);
                  setIsModelModalOpen(true);
                }}
                onTogglePrimary={handleTogglePrimary}
                onTestPing={handleTestPing}
              />
            )}

            {activeTab === 'prompts' && (
              <SystemPromptsTab
                prompts={prompts}
                models={models}
                onOpenEditor={(p) => {
                  setSelectedPromptForEditor(p);
                  setIsPromptEditorOpen(true);
                }}
                onOpenPlayground={(p) => {
                  setSelectedPromptForPlayground(p);
                  setIsPlaygroundOpen(true);
                }}
                onRollbackVersion={handleRollbackVersion}
                onCreatePrompt={handleCreatePrompt}
              />
            )}

            {activeTab === 'embeddings' && chunking && (
              <EmbeddingServiceTab
                models={embeddings}
                collections={collections}
                chunkingConfig={chunking}
                queues={queues}
                onSaveChunking={handleSaveChunking}
                onReindex={handleReindex}
                onOpenSemanticTester={() => setIsSemanticTesterOpen(true)}
              />
            )}
          </>
        )}
      </div>

      {/* Modals Container */}
      <ModelConfigModal
        isOpen={isModelModalOpen}
        model={selectedModelForModal}
        allModels={models}
        onClose={() => setIsModelModalOpen(false)}
        onSave={handleSaveModel}
      />

      <PromptEditorModal
        isOpen={isPromptEditorOpen}
        prompt={selectedPromptForEditor}
        models={models}
        onClose={() => setIsPromptEditorOpen(false)}
        onSavePrompt={handleSavePrompt}
        onPublishVersion={handlePublishPromptVersion}
        onOpenPlayground={(p) => {
          setSelectedPromptForPlayground(p);
          setIsPlaygroundOpen(true);
        }}
      />

      <PromptPlaygroundModal
        isOpen={isPlaygroundOpen}
        prompt={selectedPromptForPlayground}
        models={models}
        onClose={() => setIsPlaygroundOpen(false)}
      />

      <SemanticTesterModal
        isOpen={isSemanticTesterOpen}
        models={embeddings}
        onClose={() => setIsSemanticTesterOpen(false)}
      />
    </div>
  );
};

export default AiManagementPage;
