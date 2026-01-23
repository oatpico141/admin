import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // DEV MODE: Auto-login route for testing
  if (process.env.NODE_ENV === "development") {
    app.get("/dev/login/:role", async (req, res) => {
      const role = req.params.role;
      const userMap: Record<string, string> = {
        admin: "admin-001",
        manager: "manager-001",
        staff: "staff-001"
      };
      const openId = userMap[role];
      if (!openId) {
        return res.status(400).json({ error: "Invalid role. Use: admin, manager, staff" });
      }
      // Set cookie to simulate login (for frontend)
      res.cookie("dev_user", openId, { httpOnly: false, maxAge: 24 * 60 * 60 * 1000 });
      res.json({
        success: true,
        message: `Logged in as ${role}`,
        openId,
        instructions: "Add header 'x-dev-user: " + openId + "' to API requests, or use the cookie"
      });
    });

    app.get("/dev/users", async (req, res) => {
      const { drizzle } = await import("drizzle-orm/mysql2");
      const { users } = await import("../../drizzle/schema");
      const db = drizzle(process.env.DATABASE_URL!);
      const allUsers = await db.select().from(users);
      res.json(allUsers);
    });

    console.log("[DEV] Dev routes enabled: /dev/login/:role, /dev/users");
  }

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
