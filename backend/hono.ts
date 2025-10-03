import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

app.use("*", cors());

app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  })
);

app.get("/api", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

app.post("/api/openai/chat", async (c) => {
  try {
    const apiKey = (process.env as Record<string, string | undefined>)["OPENAI_API_KEY"];
    if (!apiKey) {
      return c.json({ error: "Missing OPENAI_API_KEY on server" }, 500);
    }

    const body = (await c.req.json()) as {
      messages: { role: "system" | "user" | "assistant"; content: string }[];
      response_format?: "json_object" | "text";
      temperature?: number;
      model?: string;
    };

    const model = body.model ?? "gpt-4o-mini";
    const temperature = typeof body.temperature === "number" ? body.temperature : 0.7;

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: body.messages,
        temperature,
        response_format: body.response_format === "json_object" ? { type: "json_object" } : undefined,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return c.json({ error: "Upstream OpenAI error", detail: text });
    }

    const data = await resp.json();
    return c.json(data);
  } catch {
    return c.json({ error: "OpenAI proxy error" });
  }
});

export default app;