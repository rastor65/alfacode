import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { acceptsTasks, canCancel, canComplete, canStart } from "./sprint-policy";
import type { SprintStatus } from "./sprint.entity";

describe("politica de sprints", () => {
  it("transiciones: planned -> active -> completed; cancelar desde planned o active", () => {
    const table: [SprintStatus, boolean, boolean, boolean, boolean][] = [
      // estado, iniciar, cerrar, cancelar, acepta tareas
      ["planned", true, false, true, true],
      ["active", false, true, true, true],
      ["completed", false, false, false, false],
      ["cancelled", false, false, false, false],
    ];

    for (const [status, start, complete, cancel, tasks] of table) {
      assert.equal(canStart(status), start, `iniciar ${status}`);
      assert.equal(canComplete(status), complete, `cerrar ${status}`);
      assert.equal(canCancel(status), cancel, `cancelar ${status}`);
      assert.equal(acceptsTasks(status), tasks, `tareas ${status}`);
    }
  });
});
