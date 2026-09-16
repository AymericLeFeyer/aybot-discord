import { useState, type FormEvent } from 'react';
import { Loader2Icon } from 'lucide-react';
import type {
  CreateSubscriptionInput,
  Subscription,
} from '@/domain/subscription/entities/Subscription';
import { DEFAULT_MESSAGE, isDiscordWebhookUrl } from '@/domain/subscription/services/message';
import { MessageEditor } from '@/presentation/components/MessageEditor';
import { MessagePreview } from '@/presentation/components/MessagePreview';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Switch } from '@/presentation/components/ui/switch';
import { errorMessage } from '@/shared/errors';

interface SubscriptionFormProps {
  /** Abonnement existant : mode édition (la chaîne n'est plus modifiable). */
  subscription?: Subscription;
  submitLabel: string;
  onSubmit: (input: CreateSubscriptionInput) => Promise<void>;
  onCancel?: () => void;
}

export function SubscriptionForm({
  subscription,
  submitLabel,
  onSubmit,
  onCancel,
}: SubscriptionFormProps) {
  const [channel, setChannel] = useState('');
  const [webhookUrl, setWebhookUrl] = useState(subscription?.webhookUrl ?? '');
  const [message, setMessage] = useState(subscription?.message ?? DEFAULT_MESSAGE);
  const [includeShorts, setIncludeShorts] = useState(subscription?.includeShorts ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openedAt] = useState(() => new Date().toISOString());

  const idPrefix = subscription ? `edit-${subscription.id}` : 'create';
  const webhookInvalid = webhookUrl.trim() !== '' && !isDiscordWebhookUrl(webhookUrl);
  const lastVideo = subscription?.lastVideo;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ channel, webhookUrl: webhookUrl.trim(), message, includeShorts });
      if (!subscription) {
        setChannel('');
        setWebhookUrl('');
        setMessage(DEFAULT_MESSAGE);
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!subscription && (
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-channel`}>Chaîne YouTube</Label>
          <Input
            id={`${idPrefix}-channel`}
            value={channel}
            onChange={(event) => setChannel(event.target.value)}
            placeholder="https://www.youtube.com/@MaChaine"
            required
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">URL de la chaîne, @handle ou ID UC…</p>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-webhook`}>Webhook Discord</Label>
        <Input
          id={`${idPrefix}-webhook`}
          type="url"
          value={webhookUrl}
          onChange={(event) => setWebhookUrl(event.target.value)}
          placeholder="https://discord.com/api/webhooks/…"
          aria-invalid={webhookInvalid}
          required
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">
          {webhookInvalid
            ? 'Cette URL ne ressemble pas à un webhook Discord.'
            : 'Salon Discord → Paramètres → Intégrations → Webhooks → Copier l’URL.'}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-message`}>Message</Label>
        <MessageEditor id={`${idPrefix}-message`} value={message} onChange={setMessage} />
      </div>

      <div className="space-y-1.5">
        <span className="text-sm font-medium">Aperçu</span>
        <MessagePreview
          template={message}
          values={{
            title: lastVideo?.title ?? 'Ma nouvelle vidéo',
            url: lastVideo?.url ?? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            channel: subscription?.channelName ?? (channel.trim() || 'Ma chaîne'),
            date: new Date(lastVideo?.publishedAt ?? openedAt).toLocaleString('fr-FR'),
          }}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <Label htmlFor={`${idPrefix}-shorts`} className="flex-col items-start gap-0.5">
          <span>Inclure les Shorts</span>
          <span className="text-xs font-normal text-muted-foreground">
            Notifier aussi les vidéos courtes
          </span>
        </Label>
        <Switch
          id={`${idPrefix}-shorts`}
          checked={includeShorts}
          onCheckedChange={setIncludeShorts}
        />
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={submitting || webhookInvalid}>
          {submitting && <Loader2Icon className="animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
