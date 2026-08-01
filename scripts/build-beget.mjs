import { spawn } from "node:child_process";
import {
  cp,
  mkdir,
  readdir,
  readFile,
  rm,
  rmdir,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const vinextCli = join(projectRoot, "node_modules", "vinext", "dist", "cli.js");
const outputDirectory = join(projectRoot, "dist", "beget");
const clientDirectory = join(projectRoot, "dist", "client");
const serverEntry = join(projectRoot, "dist", "server", "index.js");
const defaultSiteUrl = "https://rudenko-family.ru";
const defaultRsvpEndpoint = "https://92.118.170.205:8443/api/rsvp";
const siteUrl = (process.env.BEGET_SITE_URL || defaultSiteUrl).replace(/\/$/, "");
const rsvpEndpoint =
  process.env.BEGET_RSVP_ENDPOINT || defaultRsvpEndpoint;

function run(command, args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      env: {
        ...process.env,
        NEXT_PUBLIC_RSVP_ENDPOINT: rsvpEndpoint,
        WRANGLER_LOG_PATH: join(projectRoot, ".wrangler", "wrangler.log"),
      },
      stdio: "inherit",
    });

    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`vinext build exited with code ${code}`));
    });
  });
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(path)));
    else files.push(path);
  }

  return files;
}

async function pruneUnusedPublicFiles() {
  const files = await listFiles(outputDirectory);
  const searchable = files.filter((path) => /\.(?:html|css|js)$/i.test(path));
  const referenced = new Set();

  for (const path of searchable) {
    const content = await readFile(path, "utf8");
    for (const match of content.matchAll(/\/assets\/[A-Za-z0-9._/-]+/g)) {
      referenced.add(match[0].slice(1));
    }
    for (const match of content.matchAll(/\/(?:favicon\.svg|og-dmitriy-anastasia\.webp)/g)) {
      referenced.add(match[0].slice(1));
    }
  }

  let removedFiles = 0;
  let removedBytes = 0;
  for (const path of files) {
    const relative = path.slice(outputDirectory.length + 1).replaceAll("\\", "/");
    const isRuntimeFile =
      relative === "index.html" ||
      relative.startsWith("assets/") && /\.(?:css|js)$/i.test(relative);

    if (!isRuntimeFile && !referenced.has(relative)) {
      removedBytes += (await stat(path)).size;
      await unlink(path);
      removedFiles += 1;
    }
  }

  async function removeEmptyDirectories(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        await removeEmptyDirectories(join(directory, entry.name));
      }
    }
    if (directory !== outputDirectory && (await readdir(directory)).length === 0) {
      await rmdir(directory);
    }
  }

  await removeEmptyDirectories(outputDirectory);

  console.log(
    `Removed ${removedFiles} unused public files (${(removedBytes / 1024 / 1024).toFixed(1)} MB).`,
  );
}

await run(process.execPath, [vinextCli, "build"]);

const workerUrl = pathToFileURL(serverEntry);
workerUrl.searchParams.set("static-build", `${process.pid}-${Date.now()}`);
const { default: worker } = await import(workerUrl.href);
const response = await worker.fetch(
  new Request(`${siteUrl}/`, { headers: { accept: "text/html" } }),
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

if (!response.ok) {
  throw new Error(`Unable to render static HTML: ${response.status}`);
}

const html = (await response.text()).replaceAll(
  "http://localhost:3000",
  siteUrl,
);
await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
await cp(clientDirectory, outputDirectory, { recursive: true });
await writeFile(join(outputDirectory, "index.html"), html, "utf8");
await pruneUnusedPublicFiles();

console.log(`Beget upload directory prepared in ${outputDirectory}`);
