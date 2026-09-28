// @vitest-environment node
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

describe("service worker de notificações", () => {
  it("mostra a marca e mantém o clique dentro do site", async () => {
    const handlers: Record<string, (event: unknown) => void> = {};
    const showNotification = vi.fn(async () => undefined);
    const openWindow = vi.fn(async () => undefined);
    const worker = { addEventListener: (type: string, handler: (event: unknown) => void) => { handlers[type] = handler; }, registration: { showNotification }, location: { origin: "https://worshipflow.test" }, clients: { matchAll: vi.fn(async () => []), openWindow } };
    runInNewContext(readFileSync("public/sw.js", "utf8"), { self: worker, URL });
    let work: Promise<void> = Promise.resolve();
    handlers.push({ data: { json: () => ({ id: "event-1", title: "WorshipFlow · Nova escala", body: "04/10 · Guitarra", url: "https://evil.test" }) }, waitUntil: (promise: Promise<void>) => { work = promise; } });
    await work;
    expect(showNotification).toHaveBeenCalledWith("WorshipFlow · Nova escala", expect.objectContaining({ icon: "/icon-512.webp", tag: "worshipflow-event-1", renotify: false }));
    handlers.notificationclick({ notification: { close: vi.fn() }, waitUntil: (promise: Promise<void>) => { work = promise; } });
    await work;
    expect(openWindow).toHaveBeenCalledWith("https://worshipflow.test/dashboard/escalas");
  });
});
