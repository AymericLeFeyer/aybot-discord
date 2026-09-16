import { Fragment, type ReactNode } from 'react';
import { renderMessage, type PreviewValues } from '@/domain/subscription/services/message';

/** Rendu minimal du markdown Discord : **gras**, *italique*, liens et @mentions. */
function formatDiscord(text: string): ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|https?:\/\/\S+|@everyone|@here)/g);
  return tokens.map((token, index) => {
    if (/^\*\*[^*]+\*\*$/.test(token)) return <strong key={index}>{token.slice(2, -2)}</strong>;
    if (/^\*[^*]+\*$/.test(token)) return <em key={index}>{token.slice(1, -1)}</em>;
    if (/^https?:\/\//.test(token)) {
      return (
        <span key={index} className="text-sky-600 dark:text-sky-400 break-all">
          {token}
        </span>
      );
    }
    if (token === '@everyone' || token === '@here') {
      return (
        <span
          key={index}
          className="rounded bg-indigo-500/15 px-0.5 text-indigo-600 dark:text-indigo-300"
        >
          {token}
        </span>
      );
    }
    return <Fragment key={index}>{token}</Fragment>;
  });
}

interface MessagePreviewProps {
  template: string;
  values: PreviewValues;
}

export function MessagePreview({ template, values }: MessagePreviewProps) {
  const rendered = renderMessage(template, values);
  return (
    <div className="rounded-lg border bg-muted/40 p-3">
      <div className="flex gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-sm font-semibold text-white">
          A
        </div>
        <div className="min-w-0 text-sm">
          <div className="mb-0.5 flex items-baseline gap-2">
            <span className="font-medium">AyBot</span>
            <span className="rounded bg-indigo-500 px-1 text-[0.625rem] font-semibold text-white">
              APP
            </span>
            <span className="text-xs text-muted-foreground">Aujourd’hui</span>
          </div>
          <p className="whitespace-pre-wrap break-words">
            {rendered.trim() ? (
              formatDiscord(rendered)
            ) : (
              <span className="text-muted-foreground italic">Message vide</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
