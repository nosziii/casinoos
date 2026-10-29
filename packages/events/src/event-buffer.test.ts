import type { CasinoEvent } from "@casino-ops/shared";
import { describe, expect, it, vi } from "vitest";
import { EventBuffer } from "./event-buffer.js";

describe("EventBuffer", () => {
  it("discards queued events when a scenario reset clears the buffer", async () => {
    const onFlush = vi.fn();
    const buffer = new EventBuffer({ maxSize: 20, flushIntervalMs: 60_000, onFlush });

    await buffer.push(event());
    expect(buffer.size).toBe(1);

    buffer.clear();
    await buffer.flush();

    expect(buffer.size).toBe(0);
    expect(onFlush).not.toHaveBeenCalled();
  });
});

function event(): CasinoEvent {
  return {
    id: "evt-reset",
    timestamp: "2026-10-29T09:00:00.000Z",
    domain: "kyc",
    source: "kyc-service",
    type: "KYC_QUEUE_GROWING",
    severity: "warning",
    data: { queueDepth: 34 },
  };
}
