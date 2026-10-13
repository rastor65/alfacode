import { ApiError } from "./api-error";

/**
 * Limita cuantas tareas costosas se ejecutan a la vez y cuantas pueden esperar.
 * Si la cola esta llena se responde 503 en lugar de acumular memoria sin limite.
 */
export class ConcurrencyLimiter {
  private active = 0;
  private readonly queue: (() => void)[] = [];

  constructor(
    private readonly maxConcurrent: number,
    private readonly maxQueued: number,
  ) {}

  async run<T>(task: () => Promise<T>): Promise<T> {
    if (this.active < this.maxConcurrent) {
      this.active += 1;
    } else {
      if (this.queue.length >= this.maxQueued) {
        throw new ApiError(503, "SERVICE_BUSY", "El servicio esta ocupado; intenta de nuevo en unos segundos");
      }

      // El cupo se transfiere directamente desde la tarea que termina.
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }

    try {
      return await task();
    } finally {
      const next = this.queue.shift();

      if (next) {
        next();
      } else {
        this.active -= 1;
      }
    }
  }
}
