const DISCORD_WEBHOOK =
  /^https:\/\/(?:(?:canary|ptb)\.)?discord(?:app)?\.com\/api(?:\/v\d+)?\/webhooks\/\d+\/[\w-]+\/?$/;

export function isDiscordWebhookUrl(url: string): boolean {
  return DISCORD_WEBHOOK.test(url.trim());
}
