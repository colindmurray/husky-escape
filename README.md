# Husky Escape

A React/Vite platformer where you help Onyx the Husky escape the pound and find her way home. The game includes short, optional AI reactions after important gameplay events.

## Local development

```bash
npm install
npm run dev
```

## Visual testing with DeepSeek Harness

This repository includes a project-scoped Playwright MCP configuration for
DeepSeek Harness. It runs an isolated, headless Chrome session at 1440×900 and
keeps generated screenshots and traces under the ignored `.playwright-mcp/`
directory.

Start the app in one terminal:

```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

Then start the Harness browser UI in another terminal:

```bash
npm run dsh:web
```

For a one-shot visual check:

```bash
npm run dsh:headless -- "Use Playwright MCP to open http://127.0.0.1:5173, take a screenshot, and visually inspect the game."
```

The `dsh-ox` launcher reads the existing local OpenRouter key at runtime. No
credential is stored in this repository.

The browser game works without the AI endpoint; it displays a local fallback quote if the endpoint is unavailable. To exercise the server-side AI locally, build the app and run the Pages Functions emulator with an untracked `.dev.vars` file:

```text
OPENROUTER_API_KEY=your-openrouter-key
```

```bash
npm run build
npx wrangler pages dev dist
```

## OpenRouter integration

The browser calls `POST /api/husky-wisdom`. The API key is used only by the server-side function in `functions/api/husky-wisdom.js`; it is never included in the Vite bundle. The endpoint sends requests to OpenRouter using `nvidia/nemotron-3.5-lightning:free` and returns only the generated reaction text.

## Cloudflare Pages deployment

Create or select a Pages project, then store the key as an encrypted Pages secret:

```bash
npx wrangler pages secret put OPENROUTER_API_KEY --project-name husky-escape
npm run build
npx wrangler pages deploy dist --project-name husky-escape
```

Keep `.dev.vars` and all `.env` files local. Do not put an OpenRouter key in source code, `vite.config.ts`, or a public environment variable.

The production site is available at `https://huskyescape.com` and `https://www.huskyescape.com`. The domain remains registered at Namecheap, while its authoritative nameservers and DNS records are managed on Cloudflare's free plan.

## Optional Node server

The included Dockerfile can run the same built app behind the small Express server. Provide the secret at runtime rather than during the image build:

```bash
docker build -t husky-escape .
docker run --rm -p 3000:3000 -e OPENROUTER_API_KEY="$OPENROUTER_API_KEY" husky-escape
```
