import { useState } from 'react';
import {
  ExternalLinkIcon,
  Loader2Icon,
  PencilIcon,
  SendIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  CreateSubscriptionInput,
  Subscription,
  UpdateSubscriptionInput,
} from '@/domain/subscription/entities/Subscription';
import { maskWebhookUrl } from '@/domain/subscription/services/message';
import { SubscriptionForm } from '@/presentation/components/SubscriptionForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/presentation/components/ui/alert-dialog';
import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/presentation/components/ui/card';
import { Switch } from '@/presentation/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/presentation/components/ui/tooltip';
import { errorMessage } from '@/shared/errors';
import { formatDateTime, formatRelative } from '@/shared/utils/formatDate';

interface SubscriptionCardProps {
  subscription: Subscription;
  now: number;
  onUpdate: (id: string, input: UpdateSubscriptionInput) => Promise<unknown>;
  onRemove: (id: string) => Promise<void>;
  onSendTest: (id: string) => Promise<void>;
}

export function SubscriptionCard({
  subscription,
  now,
  onUpdate,
  onRemove,
  onSendTest,
}: SubscriptionCardProps) {
  const [editing, setEditing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const channelUrl = `https://www.youtube.com/channel/${subscription.channelId}`;

  const toggleEnabled = async (enabled: boolean) => {
    setToggling(true);
    try {
      await onUpdate(subscription.id, { enabled });
      toast.success(enabled ? 'Notifications réactivées' : 'Notifications en pause');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setToggling(false);
    }
  };

  const sendTest = async () => {
    setTesting(true);
    try {
      await onSendTest(subscription.id);
      toast.success('Message de test envoyé sur Discord');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setTesting(false);
    }
  };

  const remove = async () => {
    try {
      await onRemove(subscription.id);
      toast.success(`${subscription.channelName} n’est plus suivie`);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const saveEdit = async ({ webhookUrl, message, includeShorts }: CreateSubscriptionInput) => {
    await onUpdate(subscription.id, { webhookUrl, message, includeShorts });
    setEditing(false);
    toast.success('Abonnement mis à jour');
  };

  return (
    <Card className={subscription.enabled ? undefined : 'opacity-70'}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <a
            href={channelUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:underline"
          >
            {subscription.channelName}
            <ExternalLinkIcon className="size-3.5 text-muted-foreground" />
          </a>
          {subscription.enabled ? (
            <Badge variant="secondary">Actif</Badge>
          ) : (
            <Badge variant="outline">En pause</Badge>
          )}
          {!subscription.includeShorts && <Badge variant="outline">Sans Shorts</Badge>}
        </CardTitle>
        <CardDescription className="font-mono text-xs">
          {maskWebhookUrl(subscription.webhookUrl)}
        </CardDescription>
        <CardAction>
          <Switch
            checked={subscription.enabled}
            onCheckedChange={toggleEnabled}
            disabled={toggling}
            aria-label={subscription.enabled ? 'Mettre en pause' : 'Réactiver'}
          />
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-3">
        {editing ? (
          <SubscriptionForm
            subscription={subscription}
            submitLabel="Enregistrer"
            onSubmit={saveEdit}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <>
            <pre className="rounded-md bg-muted/60 px-3 py-2 font-mono text-xs whitespace-pre-wrap break-words">
              {subscription.message}
            </pre>

            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
              <dt className="text-muted-foreground">Dernière vidéo</dt>
              <dd className="truncate">
                {subscription.lastVideo ? (
                  <a
                    href={subscription.lastVideo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                    title={subscription.lastVideo.title}
                  >
                    {subscription.lastVideo.title}
                    <span className="text-muted-foreground">
                      {' '}
                      · {formatDateTime(subscription.lastVideo.publishedAt)}
                    </span>
                  </a>
                ) : (
                  <span className="text-muted-foreground">Aucune</span>
                )}
              </dd>
              <dt className="text-muted-foreground">Vérifiée</dt>
              <dd>{formatRelative(subscription.lastCheckedAt, now)}</dd>
              <dt className="text-muted-foreground">Dernière notif</dt>
              <dd>{formatRelative(subscription.lastNotifiedAt, now)}</dd>
            </dl>

            {subscription.lastError && (
              <p className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <TriangleAlertIcon className="mt-px size-3.5 shrink-0" />
                {subscription.lastError}
              </p>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={sendTest} disabled={testing}>
                    {testing ? <Loader2Icon className="animate-spin" /> : <SendIcon />}
                    Tester
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Envoie le message avec la dernière vidéo de la chaîne
                </TooltipContent>
              </Tooltip>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <PencilIcon />
                Modifier
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2Icon />
                    Supprimer
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Arrêter de suivre {subscription.channelName} ?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Plus aucune notification ne sera envoyée sur ce webhook pour cette chaîne.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={remove}>
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
