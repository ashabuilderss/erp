import { spawn } from "node:child_process";
import net from "node:net";
import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(appDir, "../..");
const baseURL = process.env.WEB_E2E_BASE_URL ?? "http://localhost:3000";
const base = new URL(baseURL);
const port = base.port || (base.protocol === "https:" ? "443" : "80");
const shouldStartServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER !== "1";
const serverMode = process.env.WEB_E2E_SERVER_MODE ?? "dev";
const isProductionServer = serverMode === "production" || serverMode === "start";
const nextCli = path.join(repoRoot, "node_modules", "next", "dist", "bin", "next");
const playwrightCli = path.join(
  repoRoot,
  "node_modules",
  "@playwright",
  "test",
  "cli.js"
);

function readEnvFile(filePath) {
  if (!existsSync(filePath)) return {};

  return Object.fromEntries(
    readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        const key = line.slice(0, index).trim();
        const value = line.slice(index + 1).trim().replace(/^["']|["']$/g, "");
        return [key, value];
      })
  );
}

function stopServer(server) {
  if (!server || server.exitCode !== null || !server.pid) return;

  server.kill("SIGTERM");
}

function cleanNextCache() {
  if (process.env.WEB_E2E_CLEAN_NEXT_CACHE === "0") return;

  const target = path.resolve(appDir, ".next");
  if (!target.startsWith(`${appDir}${path.sep}`)) {
    throw new Error(`Refusing to remove outside app directory: ${target}`);
  }

  rmSync(target, { recursive: true, force: true });
}

async function waitForServer(url, server) {
  const deadline = Date.now() + 120_000;
  const probeURL = new URL("/sign-in", url);

  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Web server exited before it was ready with code ${server.exitCode}`);
    }

    try {
      const response = await fetch(probeURL, { redirect: "manual" });
      if (response.status < 500) return;
    } catch {
      // Server is still starting.
    }

    await delay(500);
  }

  throw new Error(`Timed out waiting for ${probeURL}`);
}

async function isServerReady(url) {
  const probeURL = new URL("/sign-in", url);

  try {
    const response = await fetch(probeURL, { redirect: "manual" });
    if (response.status >= 500) return false;

    const body = await response.text();
    return body.includes("RealEstate CRM");
  } catch {
    return false;
  }
}

async function isPortOpen(host, targetPort) {
  return new Promise((resolve) => {
    const socket = net.createConnection(
      { host, port: Number(targetPort), timeout: 1000 },
      () => {
        socket.destroy();
        resolve(true);
      }
    );

    socket.on("error", () => resolve(false));
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function runPlaywright(args, env) {
  const test = spawn(process.execPath, [playwrightCli, "test", ...args], {
    cwd: appDir,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  let output = "";
  let settled = false;

  return new Promise((resolve) => {
    const finish = (code, kill = false) => {
      if (settled) return;
      settled = true;
      if (kill && test.exitCode === null) test.kill("SIGTERM");
      resolve(code);
    };

    const handleOutput = (chunk, target) => {
      const text = chunk.toString();
      target.write(chunk);
      output += text;
      const normalizedOutput = output.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "");
      const lowerOutput = normalizedOutput.toLowerCase();

      if (lowerOutput.includes(" failed")) {
        setTimeout(() => finish(1, true), 250);
        return;
      }

      if (lowerOutput.includes(" passed")) {
        setTimeout(() => finish(0, true), 250);
      }
    };

    test.stdout.on("data", (chunk) => handleOutput(chunk, process.stdout));
    test.stderr.on("data", (chunk) => handleOutput(chunk, process.stderr));
    test.on("close", (code) => finish(code ?? 1));
    test.on("error", () => finish(1));
  });
}

const apiEnv = readEnvFile(path.join(repoRoot, "apps", "api", ".env"));
const env = {
  ...process.env,
  API_URL: process.env.API_URL ?? "http://127.0.0.1:4000",
  AUTH_SECRET:
    process.env.AUTH_SECRET ??
    process.env.WEB_E2E_AUTH_SECRET ??
    apiEnv.AUTH_SECRET ??
    "local-playwright-auth-secret-change-me",
  NEXTAUTH_URL: baseURL,
  AUTH_URL: process.env.AUTH_URL ?? baseURL,
  PLAYWRIGHT_SKIP_WEBSERVER: "1",
  WEB_E2E_BASE_URL: baseURL,
};

let server;

try {
  if (shouldStartServer) {
    const existingServerReady = await isServerReady(baseURL);

    if (!existingServerReady) {
      const portOccupied = await isPortOpen(base.hostname, port);

      if (portOccupied) {
        throw new Error(
          `Port ${port} is already in use, but ${new URL("/sign-in", baseURL)} is not healthy. Stop the existing process, set WEB_E2E_BASE_URL to a free port, or set PLAYWRIGHT_SKIP_WEBSERVER=1 for a known-good running server.`
        );
      }

      if (!isProductionServer) {
        cleanNextCache();
      }

      const nextCommand = isProductionServer ? "start" : "dev";
      server = spawn(process.execPath, [nextCli, nextCommand, "--port", port], {
        cwd: appDir,
        env,
        stdio: ["ignore", "inherit", "inherit"],
      });
      await waitForServer(baseURL, server);
    }
  }

  process.exitCode = await runPlaywright(process.argv.slice(2), env);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  stopServer(server);
  process.exit(process.exitCode ?? 0);
}
