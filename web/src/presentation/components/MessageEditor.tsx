import { useRef } from 'react';
import { Button } from '@/presentation/components/ui/button';
import { Textarea } from '@/presentation/components/ui/textarea';
import { MAX_MESSAGE_LENGTH, MESSAGE_PLACEHOLDERS } from '@/domain/subscription/services/message';
import { cn } from '@/shared/lib/utils';

interface MessageEditorProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
}

export function MessageEditor({ id, value, onChange }: MessageEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /** Insère le placeholder à la position du curseur. */
  const insert = (placeholder: string) => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? value.length;
    onChange(value.slice(0, start) + placeholder + value.slice(end));
    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(start + placeholder.length, start + placeholder.length);
    });
  };

  return (
    <div className="space-y-2">
      <Textarea
        id={id}
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        maxLength={MAX_MESSAGE_LENGTH}
        className="font-mono text-xs"
      />
      <div className="flex flex-wrap items-center gap-1.5">
        {MESSAGE_PLACEHOLDERS.map((placeholder) => (
          <Button
            key={placeholder.key}
            type="button"
            variant="outline"
            size="xs"
            onClick={() => insert(placeholder.key)}
            title={`Insérer ${placeholder.key}`}
          >
            <code>{placeholder.key}</code>
          </Button>
        ))}
        <span
          className={cn(
            'ml-auto text-xs text-muted-foreground tabular-nums',
            value.length > MAX_MESSAGE_LENGTH * 0.9 && 'text-destructive',
          )}
        >
          {value.length}/{MAX_MESSAGE_LENGTH}
        </span>
      </div>
    </div>
  );
}
