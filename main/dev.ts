import { spawn } from "child_process";

console.log("=================================================================");
console.log("  STARTING MONOLITHIC CIVIC AIR QUALITY STUDIO (DEV MODE)        ");
console.log("  Express API Server -> http://localhost:3001                    ");
console.log("  Vite UI Dev Server -> http://localhost:5173                    ");
console.log("=================================================================\n");

// 1. Launch Backend API Server on 3001
const server = spawn("npx", ["tsx", "server/index.ts"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, PORT: "3001" }
});

// 2. Launch Vite UI Server on 5173
const client = spawn("npx", ["vite", "--port", "5173"], {
  stdio: "inherit",
  shell: true
});

const cleanup = (code: number = 0) => {
  console.log("\n[Monolith] Gracefully shutting down development servers...");
  try {
    server.kill("SIGTERM");
    client.kill("SIGTERM");
  } catch {
    // Ignore error on exit
  }
  process.exit(code);
};

process.on("SIGINT", () => cleanup(0));
process.on("SIGTERM", () => cleanup(0));

server.on("exit", (code) => {
  if (code !== 0 && code !== null) {
    console.error(`Backend server exited with code ${code}`);
    cleanup(code);
  }
});

client.on("exit", (code) => {
  if (code !== 0 && code !== null) {
    console.error(`Frontend client exited with code ${code}`);
    cleanup(code);
  }
});
