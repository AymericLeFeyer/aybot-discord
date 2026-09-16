import {
  GetMonitorStatus,
  TriggerCheck,
} from '@/application/monitoring/usecases/monitoringUseCases';
import {
  CreateSubscription,
  DeleteSubscription,
  ListSubscriptions,
  SendTestNotification,
  UpdateSubscription,
} from '@/application/subscription/usecases/subscriptionUseCases';
import { HttpMonitorRepository } from './monitoring/repositories/HttpMonitorRepository';
import { HttpSubscriptionRepository } from './subscription/repositories/HttpSubscriptionRepository';

/** Racine de composition : les hooks UI consomment uniquement ces use cases. */
const subscriptionRepository = new HttpSubscriptionRepository();
const monitorRepository = new HttpMonitorRepository();

export const useCases = {
  listSubscriptions: new ListSubscriptions(subscriptionRepository),
  createSubscription: new CreateSubscription(subscriptionRepository),
  updateSubscription: new UpdateSubscription(subscriptionRepository),
  deleteSubscription: new DeleteSubscription(subscriptionRepository),
  sendTestNotification: new SendTestNotification(subscriptionRepository),
  getMonitorStatus: new GetMonitorStatus(monitorRepository),
  triggerCheck: new TriggerCheck(monitorRepository),
};
