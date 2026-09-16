import type { Subscription } from '../entities/Subscription.js';

export interface SubscriptionRepository {
  findAll(): Promise<Subscription[]>;
  findById(id: string): Promise<Subscription | null>;
  create(subscription: Subscription): Promise<void>;
  /**
   * Lecture-modification-écriture atomique : `updater` reçoit l'état le plus récent.
   * Retourne null si l'abonnement n'existe pas (ou a été supprimé entre-temps).
   */
  update(
    id: string,
    updater: (current: Subscription) => Subscription,
  ): Promise<Subscription | null>;
  delete(id: string): Promise<boolean>;
}
