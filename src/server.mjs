import express from "express";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PUBLIC_DIR = join(ROOT, "public");
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "127.0.0.1";
const APP_ORIGIN = process.env.APP_ORIGIN || `http://${HOST}:${PORT}`;
const WIDGET_URI = "ui://widget/legacy-in-ink-booklet.html";
const WIDGET_PATH = join(PUBLIC_DIR, "widget.html");

const pageTitles = [
  "Cover",
  "Opening Statement",
  "Table of Contents",
  "Verse 001 Title",
  "Verse 001: Know Your Value As An Individual",
  "Verse 001 Reader Notes",
  "Verse 002 Title",
  "Verse 002: The Book Of Risk",
  "Verse 002 Reader Notes",
  "Verse 003 Title",
  "Verse 003: The Book Of The Table",
  "Verse 003 Reader Notes",
  "Verse 004 Title",
  "Verse 004: Take Care Of Your Business",
  "Verse 004 Reader Notes",
  "Verse 005 Title",
  "Verse 005: Feelings Heal, Principles Stand",
  "Verse 005 Reader Notes",
  "Verse 006 Title",
  "Verse 006: Redeem Your Time",
  "Verse 006 Reader Notes",
  "Verse 007 Title",
  "Verse 007: Let Money Become Shelter",
  "Verse 007 Reader Notes",
  "Verse 008 Title",
  "Verse 008: Speak Life Into The Gate",
  "Verse 008 Reader Notes",
  "Verse 009 Title",
  "Verse 009: Old Lies From New Mouths I",
  "Verse 009: Old Lies From New Mouths II",
  "Verse 009 Reader Notes",
  "Verse 010 Title",
  "Verse 010: The Measure In The Challenge",
  "Verse 010 Reader Notes",
  "Verse 011 Title",
  "Verse 011: Stop Borrowing Love",
  "Verse 011 Reader Notes"
];

function pageManifest() {
  return pageTitles.map((title, index) => {
    const pageNumber = String(index + 1).padStart(2, "0");
    return {
      page: index + 1,
      title,
      imageUrl: `${APP_ORIGIN}/assets/pages/page-${pageNumber}.jpg`
    };
  });
}

function bookletPayload() {
  return {
    title: "Legacy In Ink: The Final Frequency",
    subtitle: "A spoken-word digital booklet preserved as an interactive reader.",
    pdfUrl: `${APP_ORIGIN}/assets/legacy-in-ink-the-final-frequency-booklet.pdf`,
    pages: pageManifest()
  };
}

async function buildServer() {
  const server = new McpServer({
    name: "legacy-in-ink-final-frequency",
    version: "0.1.0"
  });

  server.registerResource(
    "legacy-in-ink-booklet-widget",
    WIDGET_URI,
    {
      title: "Legacy In Ink Digital Booklet",
      description: "Interactive booklet reader for Legacy In Ink: The Final Frequency.",
      mimeType: "text/html;profile=mcp-app",
      _meta: {
        "openai/widgetDescription": "An interactive digital booklet reader with page turns, thumbnails, and a PDF link.",
        "openai/widgetPrefersBorder": true,
        "openai/widgetCSP": {
          connect_domains: [APP_ORIGIN],
          resource_domains: [APP_ORIGIN]
        }
      }
    },
    async () => {
      const html = await readFile(WIDGET_PATH, "utf8");
      return {
        contents: [
          {
            uri: WIDGET_URI,
            mimeType: "text/html;profile=mcp-app",
            text: html.replaceAll("__ASSET_BASE_URL__", APP_ORIGIN)
          }
        ]
      };
    }
  );

  server.registerTool(
    "get_booklet_manifest",
    {
      title: "Get Booklet Manifest",
      description: "Use this when you need the Legacy In Ink booklet title, PDF URL, and page list.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false
      }
    },
    async () => ({
      structuredContent: bookletPayload(),
      content: [
        {
          type: "text",
          text: "Loaded the Legacy In Ink digital booklet manifest."
        }
      ]
    })
  );

  server.registerTool(
    "open_booklet",
    {
      title: "Open Digital Booklet",
      description: "Use this when the user wants to read the Legacy In Ink digital booklet in an interactive app view.",
      inputSchema: {
        startPage: z.number().int().min(1).max(pageTitles.length).optional().describe("Optional page number to open first.")
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false
      },
      _meta: {
        "openai/outputTemplate": WIDGET_URI,
        "openai/toolInvocation/invoking": "Opening booklet...",
        "openai/toolInvocation/invoked": "Booklet opened"
      }
    },
    async ({ startPage = 1 } = {}) => ({
      structuredContent: {
        ...bookletPayload(),
        startPage
      },
      content: [
        {
          type: "text",
          text: `Opened Legacy In Ink: The Final Frequency at page ${startPage}.`
        }
      ],
      _meta: {
        pages: pageManifest(),
        startPage,
        pdfUrl: `${APP_ORIGIN}/assets/legacy-in-ink-the-final-frequency-booklet.pdf`
      }
    })
  );

  return server;
}

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(PUBLIC_DIR, { fallthrough: true }));

app.get("/", (_req, res) => {
  res.sendFile(join(PUBLIC_DIR, "standalone.html"));
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, name: "legacy-in-ink-final-frequency", pages: pageTitles.length });
});

app.post("/mcp", async (req, res) => {
  const server = await buildServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined
  });

  res.on("close", () => {
    transport.close();
    server.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

const httpServer = app.listen(PORT, HOST, () => {
  console.log(`Legacy In Ink app running at ${APP_ORIGIN}`);
  console.log(`MCP endpoint: ${APP_ORIGIN}/mcp`);
});

httpServer.on("error", (error) => {
  console.error("Server failed to start:", error);
  process.exitCode = 1;
});

// Keep the standalone server process alive in runtimes that aggressively
// release unreferenced handles after startup output.
setInterval(() => {}, 1 << 30);
