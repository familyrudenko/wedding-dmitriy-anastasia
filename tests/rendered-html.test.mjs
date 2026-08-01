import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the current wedding invitation", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Приглашение на свадьбу — Дмитрий и Анастасия<\/title>/i);
  assert.match(html, /ДМИТРИЙ/);
  assert.match(html, /АНАСТАСИЯ/);
  assert.match(html, /26 \| 09 \| 2026/);
  assert.match(html, /og-dmitriy-anastasia\.webp/);
  assert.doesNotMatch(html, /Сергей|Наталия|14 сентября 2025/i);
});

test("uses an optimized and current social preview", async () => {
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const previewUrl = new URL("../public/og-dmitriy-anastasia.webp", import.meta.url);
  const preview = await stat(previewUrl);

  assert.match(layout, /Дмитрий и Анастасия — 26 сентября 2026/);
  assert.match(layout, /og-dmitriy-anastasia\.webp/);
  assert.doesNotMatch(layout, /Сергей|Наталия|14 сентября 2025/i);
  assert.ok(preview.size < 100_000, `social preview is ${preview.size} bytes`);
  await assert.rejects(access(new URL("../public/og.png", import.meta.url)));
});
