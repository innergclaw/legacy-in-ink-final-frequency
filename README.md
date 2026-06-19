# Legacy In Ink: The Final Frequency App

OpenAI Apps SDK style digital booklet for **Legacy In Ink: The Final Frequency**.

This project serves:

- A direct browser version at `/`
- Static booklet assets under `/assets`
- An MCP endpoint at `/mcp`
- A ChatGPT widget resource at `ui://widget/legacy-in-ink-booklet.html`

## App Shape

Primary archetype: `vanilla-widget`

The app has one interactive widget and two read-only tools:

- `get_booklet_manifest` - returns booklet metadata, PDF URL, and page image list
- `open_booklet` - opens the interactive booklet widget inside ChatGPT

## Local Run

```bash
npm install
npm run dev
```

Default local URLs:

- Browser app: `http://localhost:8787`
- Health check: `http://localhost:8787/health`
- MCP endpoint: `http://localhost:8787/mcp`

## ChatGPT Developer Mode Setup

1. Start the app locally.
2. Expose it with an HTTPS tunnel, for example:

```bash
ngrok http 8787
```

3. Set `APP_ORIGIN` to the public HTTPS tunnel URL before starting the server:

```bash
APP_ORIGIN=https://your-tunnel-url.ngrok-free.app npm run dev
```

4. In ChatGPT, open **Settings -> Apps & Connectors -> Advanced settings**.
5. Enable Developer Mode.
6. Create a new app / connector using:

```text
https://your-tunnel-url.ngrok-free.app/mcp
```

7. Ask ChatGPT to open the Legacy In Ink digital booklet.

## Production Notes

For a stable public app, host this server behind HTTPS and set:

```bash
APP_ORIGIN=https://your-production-domain.com
PORT=8787
```

Keep the `/mcp` endpoint public and preserve the static `/assets` URLs.

## Files

- `src/server.mjs` - MCP server, tools, widget resource, static hosting
- `public/widget.html` - ChatGPT widget UI
- `public/standalone.html` - direct browser UI
- `public/assets/pages` - booklet page images
- `public/assets/legacy-in-ink-the-final-frequency-booklet.pdf` - downloadable PDF
