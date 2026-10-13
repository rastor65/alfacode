import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ApiError } from "./api-error";
import { ConcurrencyLimiter } from "./concurrency-limiter";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("ConcurrencyLimiter", () => {
  it("no supera el maximo de tareas simultaneas y procesa la cola", async () => {
    const limiter = new ConcurrencyLimiter(2, 10);
    const gates = Array.from({ length: 5 }, deferred);
    let running = 0;
    let peak = 0;

    const tasks = gates.map((gate, index) =>
      limiter.run(async () => {
        running += 1;
        peak = Math.max(peak, running);
        await gate.promise;
        running -= 1;
        return index;
      }),
    );

    for (const gate of gates) {
      await new Promise((resolve) => setImmediate(resolve));
      gate.resolve();
    }

    assert.deepEqual(await Promise.all(tasks), [0, 1, 2, 3, 4]);
    assert.equal(peak, 2);
  });

  it("responde 503 cuando la cola esta llena", async () => {
    const limiter = new ConcurrencyLimiter(1, 1);
    const gate = deferred();
    const first = limiter.run(() => gate.promise);
    const second = limiter.run(async () => "ok");

    await assert.rejects(limiter.run(async () => "rechazada"), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.getStatus(), 503);
      return true;
    });

    gate.resolve();
    await first;
    assert.equal(await second, "ok");
  });

  it("libera el cupo aunque la tarea falle", async () => {
    const limiter = new ConcurrencyLimiter(1, 0);

    await assert.rejects(limiter.run(async () => Promise.reject(new Error("fallo"))));
    assert.equal(await limiter.run(async () => "libre"), "libre");
  });
});
