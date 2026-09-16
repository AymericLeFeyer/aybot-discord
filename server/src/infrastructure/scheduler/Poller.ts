import type { CheckSubscriptions } from '../../application/subscription/usecases/CheckSubscriptions.js';
import { errorMessage } from '../../shared/errors.js';
import { logger } from '../../shared/logger.js';

export interface PollerStatus {
  intervalMinutes: number;
  running: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
}

/** Lance CheckSubscriptions au démarrage puis à intervalle régulier, sans chevauchement. */
export class Poller {
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private lastRunAt: Date | null = null;
  private nextRunAt: Date | null = null;

  constructor(
    private readonly checkSubscriptions: CheckSubscriptions,
    private readonly intervalMinutes: number,
  ) {}

  start(): void {
    const intervalMs = this.intervalMinutes * 60_000;
    this.nextRunAt = new Date(Date.now() + intervalMs);
    this.timer = setInterval(() => {
      this.nextRunAt = new Date(Date.now() + intervalMs);
      void this.runNow();
    }, intervalMs);
    void this.runNow();
    logger.info(`Vérification YouTube toutes les ${this.intervalMinutes} min.`);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.nextRunAt = null;
  }

  /** Retourne false si une vérification est déjà en cours. */
  async runNow(): Promise<boolean> {
    if (this.running) return false;
    this.running = true;
    try {
      const report = await this.checkSubscriptions.execute();
      if (report.checked > 0 || report.errors > 0) {
        logger.info(
          `Vérification terminée : ${report.checked} abonnement(s), ${report.notified} notification(s), ${report.errors} erreur(s).`,
        );
      }
    } catch (error) {
      logger.error('Vérification échouée :', errorMessage(error));
    } finally {
      this.running = false;
      this.lastRunAt = new Date();
    }
    return true;
  }

  status(): PollerStatus {
    return {
      intervalMinutes: this.intervalMinutes,
      running: this.running,
      lastRunAt: this.lastRunAt?.toISOString() ?? null,
      nextRunAt: this.nextRunAt?.toISOString() ?? null,
    };
  }
}
