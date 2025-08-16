#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");

console.log("🚀 Starting SmartTodos Full-Stack Development Server...\n");

// Start Django backend
console.log("📊 Starting Django backend on port 8000...");
const djangoProcess = spawn(
  "python",
  ["manage.py", "runserver", "0.0.0.0:8000"],
  {
    cwd: path.join(__dirname, "backend"),
    stdio: "pipe",
    env: {
      ...process.env,
      PYTHONUNBUFFERED: "1",
    },
  },
);

// Start Next.js frontend
console.log("⚛️  Starting Next.js frontend on port 3000...");
const nextProcess = spawn("npm", ["run", "dev"], {
  stdio: "pipe",
  env: {
    ...process.env,
    PORT: "3000",
  },
});

// Handle Django output
djangoProcess.stdout.on("data", (data) => {
  console.log(`[Django] ${data.toString().trim()}`);
});

djangoProcess.stderr.on("data", (data) => {
  console.log(`[Django Error] ${data.toString().trim()}`);
});

// Handle Next.js output
nextProcess.stdout.on("data", (data) => {
  console.log(`[Next.js] ${data.toString().trim()}`);
});

nextProcess.stderr.on("data", (data) => {
  console.log(`[Next.js Error] ${data.toString().trim()}`);
});

// Handle process exits
djangoProcess.on("exit", (code) => {
  console.log(`\n❌ Django backend exited with code ${code}`);
  process.exit(code);
});

nextProcess.on("exit", (code) => {
  console.log(`\n❌ Next.js frontend exited with code ${code}`);
  process.exit(code);
});

// Handle cleanup on exit
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down development servers...");
  djangoProcess.kill();
  nextProcess.kill();
  process.exit();
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down development servers...");
  djangoProcess.kill();
  nextProcess.kill();
  process.exit();
});

console.log("\n✅ Development servers started!");
console.log("📱 Frontend: http://localhost:3000");
console.log("🔧 Backend API: http://localhost:8000/api");
console.log("\n💡 Press Ctrl+C to stop both servers\n");
