import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Subscription } from '../../../domain/subscription/entities/Subscription.js';
import type { SubscriptionRepository } from '../../../domain/subscription/repositories/SubscriptionRepository.js';

/**
 * Stockage dans un fichier JSON. Toutes les opérations passent par une file
 * séquentielle pour éviter les écritures concurrentes (poller + API).
 */
export class JsonFileSubscriptionRepository implements SubscriptionRepository {
  private cache: Map<string, Subscription> | null = null;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  findAll(): Promise<Subscription[]> {
    return this.exclusive(async (items) => structuredClone([...items.values()]));
  }

  findById(id: string): Promise<Subscription | null> {
    return this.exclusive(async (items) => structuredClone(items.get(id) ?? null));
  }

  create(subscription: Subscription): Promise<void> {
    return this.exclusive(async (items) => {
      items.set(subscription.id, structuredClone(subscription));
      await this.persist(items);
    });
  }

  update(
    id: string,
    updater: (current: Subscription) => Subscription,
  ): Promise<Subscription | null> {
    return this.exclusive(async (items) => {
      const current = items.get(id);
      if (!current) return null;
      const next = updater(structuredClone(current));
      items.set(id, next);
      await this.persist(items);
      return structuredClone(next);
    });
  }

  delete(id: string): Promise<boolean> {
    return this.exclusive(async (items) => {
      const deleted = items.delete(id);
      if (deleted) await this.persist(items);
      return deleted;
    });
  }

  private exclusive<T>(task: (items: Map<string, Subscription>) => Promise<T>): Promise<T> {
    const run = this.queue.then(async () => task(await this.load()));
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async load(): Promise<Map<string, Subscription>> {
    if (this.cache) return this.cache;
    try {
      const raw = JSON.parse(await readFile(this.filePath, 'utf8')) as Subscription[];
      this.cache = new Map(raw.map((subscription) => [subscription.id, subscription]));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      this.cache = new Map();
    }
    return this.cache;
  }

  /** Écriture atomique : fichier temporaire puis renommage. */
  private async persist(items: Map<string, Subscription>): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const tmpPath = `${this.filePath}.tmp`;
    await writeFile(tmpPath, JSON.stringify([...items.values()], null, 2), 'utf8');
    await rename(tmpPath, this.filePath);
  }
}
