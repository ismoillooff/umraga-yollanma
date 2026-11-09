import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const children = [
  spawn(process.execPath, ["--watch", "server/index.mjs"], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
    windowsHide: true,
  }),
  spawn(
    process.execPath,
    [
      "node_modules/vite/bin/vite.js",
      "--host",
      "127.0.0.1",
      ...process.argv.slice(2),
    ],
    { cwd: root, stdio: "inherit", env: process.env, windowsHide: true },
  ),
];
let stopping = false;
const stop = () => {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
for (const child of children)
  child.on("exit", (code) => {
    if (!stopping) {
      stop();
      process.exitCode = code || 0;
    }
  });
