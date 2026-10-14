import { useState } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';
import { Button, Card, Input, PageTitle } from '../../components/ui';
import { useTranslation } from '../../i18n';

type Message = { role: 'USER' | 'ASSISTANT'; text: string };

export default function AssistantPage() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ASSISTANT',
      text: t('assistant.initialMessage'),
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);

  const suggestedPrompts = [
    t('assistant.prompt1'),
    t('assistant.prompt2'),
    t('assistant.prompt3'),
  ];

  const send = async (text = input) => {
    if (!text.trim() || typing) return;
    setMessages((old) => [...old, { role: 'USER', text }]);
    setInput('');
    setTyping(true);
    await new Promise((r) => setTimeout(r, 650));
    setMessages((old) => [
      ...old,
      {
        role: 'ASSISTANT',
        text: t('assistant.mockReply'),
      },
    ]);
    setTyping(false);
  };

  return (
    <>
      <PageTitle title={t('assistant.title')} subtitle={t('assistant.subtitle')} />
      <Card className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-4 text-sm font-semibold text-slate-800">
          <Bot size={20} className="text-blue-600" /> {t('assistant.headerTitle')}{' '}
          <span className="ml-auto rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700">
            {t('assistant.mockMode')}
          </span>
        </div>

        <div className="flex h-[380px] flex-col gap-4 overflow-y-auto py-3" aria-live="polite">
          {messages.map((message, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                message.role === 'USER'
                  ? 'ml-auto bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {message.text}
            </div>
          ))}
          {typing && <p className="text-sm text-slate-400">{t('assistant.typing')}</p>}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => void send(prompt)}
              className="rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer transition"
            >
              <Sparkles size={12} className="mr-1 inline text-blue-600" />
              {prompt}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
          className="flex gap-2"
        >
          <label className="flex-1">
            <span className="sr-only">Your message</span>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('assistant.inputPlaceholder')}
            />
          </label>
          <Button disabled={typing || !input.trim()} aria-label={t('assistant.send')}>
            <Send size={18} />
          </Button>
        </form>
      </Card>
    </>
  );
}
