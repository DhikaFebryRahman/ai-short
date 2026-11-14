import { spawn } from "node:child_process";

const children = [];

const startProcess = (name, cmd, args) => {
  const child = spawn(cmd, args, {
    stdio: "inherit",
    env: process.env,
  });
  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
    }
  });
  children.push(child);
};

startProcess("server", "npx", ["tsx", "watch", "server/index.ts"]);
startProcess("client", "npx", ["vite"]);

const shutdown = () => {
  for (const child of children) {
    child.kill("SIGTERM");
  }
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

