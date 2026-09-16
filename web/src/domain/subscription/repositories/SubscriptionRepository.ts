import type {
  CreateSubscriptionInput,
  Subscription,
  UpdateSubscriptionInput,
} from '../entities/Subscription';

export interface SubscriptionRepository {
  list(): Promise<Subscription[]>;
  create(input: CreateSubscriptionInput): Promise<Subscription>;
  update(id: string, input: UpdateSubscriptionInput): Promise<Subscription>;
  remove(id: string): Promise<void>;
  /** Envoie le message avec la dernière vidéo de la chaîne sur le webhook. */
  sendTest(id: string): Promise<void>;
}
