import React from 'react';

interface MarkdownMessageProps {
  content: string;
}

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  const lines = content.split('\n');

  const renderFormattedText = (text: string): React.ReactNode => {
    // Split by bold (**text**)
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={index} className="italic text-slate-700">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={index}
            className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono font-medium text-brand-700 border border-slate-200/60"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const renderedElements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let isNumberedList = false;

  const flushList = () => {
    if (currentList.length > 0) {
      if (isNumberedList) {
        renderedElements.push(
          <ol
            key={`list-${renderedElements.length}`}
            className="my-2.5 space-y-1.5 pl-5 list-decimal text-slate-700 text-sm leading-relaxed"
          >
            {currentList}
          </ol>
        );
      } else {
        renderedElements.push(
          <ul
            key={`list-${renderedElements.length}`}
            className="my-2.5 space-y-1.5 pl-2 list-none text-slate-700 text-sm leading-relaxed"
          >
            {currentList}
          </ul>
        );
      }
      currentList = [];
    }
  };

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      flushList();
      return;
    }

    // Horizontal Rule
    if (trimmed === '---' || trimmed === '***') {
      flushList();
      renderedElements.push(
        <hr key={lineIndex} className="my-3.5 border-t border-slate-200/80" />
      );
      return;
    }

    // Heading 3
    if (trimmed.startsWith('### ')) {
      flushList();
      renderedElements.push(
        <h3
          key={lineIndex}
          className="mt-3.5 mb-1.5 text-base font-medium text-slate-900 flex items-center gap-1.5"
        >
          {renderFormattedText(trimmed.replace('### ', ''))}
        </h3>
      );
      return;
    }

    // Heading 4
    if (trimmed.startsWith('#### ')) {
      flushList();
      renderedElements.push(
        <h4
          key={lineIndex}
          className="mt-2.5 mb-1 text-sm font-medium text-slate-800"
        >
          {renderFormattedText(trimmed.replace('#### ', ''))}
        </h4>
      );
      return;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      flushList();
      renderedElements.push(
        <blockquote
          key={lineIndex}
          className="my-2 rounded-r-xl border-l-3 border-brand-500 bg-brand-50/50 py-2 px-3 text-xs sm:text-sm italic text-slate-700 leading-relaxed"
        >
          {renderFormattedText(trimmed.replace('> ', ''))}
        </blockquote>
      );
      return;
    }

    // Numbered list item
    const numberMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numberMatch) {
      if (currentList.length > 0 && !isNumberedList) {
        flushList();
      }
      isNumberedList = true;
      currentList.push(
        <li key={lineIndex} className="text-sm">
          {renderFormattedText(numberMatch[2])}
        </li>
      );
      return;
    }

    // Bullet list item
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (currentList.length > 0 && isNumberedList) {
        flushList();
      }
      isNumberedList = false;
      const text = trimmed.slice(2);
      currentList.push(
        <li key={lineIndex} className="flex items-start gap-2 text-sm">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-600 shrink-0" />
          <span>{renderFormattedText(text)}</span>
        </li>
      );
      return;
    }

    // Normal paragraph
    flushList();
    renderedElements.push(
      <p key={lineIndex} className="my-1.5 text-sm leading-relaxed text-slate-700">
        {renderFormattedText(line)}
      </p>
    );
  });

  flushList();

  return <div className="space-y-1">{renderedElements}</div>;
}
