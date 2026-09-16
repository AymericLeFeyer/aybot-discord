import { CheckSubscriptions } from './application/subscription/usecases/CheckSubscriptions.js';
import { CreateSubscription } from './application/subscription/usecases/CreateSubscription.js';
import { DeleteSubscription } from './application/subscription/usecases/DeleteSubscription.js';
import { ListSubscriptions } from './application/subscription/usecases/ListSubscriptions.js';
import { SendTestNotification } from './application/subscription/usecases/SendTestNotification.js';
import { UpdateSubscription } from './application/subscription/usecases/UpdateSubscription.js';
import { DiscordWebhookClient } from './infrastructure/notification/api/DiscordWebhookClient.js';
import { Poller } from './infrastructure/scheduler/Poller.js';
import { JsonFileSubscriptionRepository } from './infrastructure/subscription/repositories/JsonFileSubscriptionRepository.js';
import { YoutubeRssClient } from './infrastructure/youtube/api/YoutubeRssClient.js';
import { createApp } from './presentation/http/createApp.js';
import { config } from './shared/config.js';
import { logger } from './shared/logger.js';

const subscriptions = new JsonFileSubscriptionRepository(config.dataFile);
const youtube = new YoutubeRssClient();
const discord = new DiscordWebhookClient();

const poller = new Poller(
  new CheckSubscriptions(subscriptions, youtube, discord),
  config.pollIntervalMinutes,
);

const app = createApp({
  listSubscriptions: new ListSubscriptions(subscriptions),
  createSubscription: new CreateSubscription(subscriptions, youtube),
  updateSubscription: new UpdateSubscription(subscriptions),
  deleteSubscription: new DeleteSubscription(subscriptions),
  sendTestNotification: new SendTestNotification(subscriptions, youtube, discord),
  poller,
  adminPassword: config.adminPassword,
  webDistDir: config.webDistDir,
});

const server = app.listen(config.port, () => {
  logger.info(`aybot écoute sur http://localhost:${config.port} (données : ${config.dataFile})`);
  poller.start();
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    poller.stop();
    server.close(() => process.exit(0));
  });
}
