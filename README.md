This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Video editing via Claude Code (Palmier Pro)

This repo ships a project-scoped MCP config (`.mcp.json`) that connects Claude Code
to [Palmier Pro](https://www.palmier.io/) — a macOS video editor with a built-in
MCP server. With Palmier Pro open, Claude Code can read your timeline, add/trim/
reorder clips, and generate footage by prompt.

1. Install and open **Palmier Pro** (macOS 26 / Apple Silicon). It exposes an MCP
   server at `http://127.0.0.1:19789/mcp`.
2. Run Claude Code from this repo on your Mac. It auto-detects `.mcp.json`; approve
   the `palmier-pro` server when prompted (use `/mcp` to check status).
3. Ask Claude Code to edit your video — e.g. "trim the first clip to 3s and add a title."

The MCP server only responds while the Palmier Pro app is running on the same machine
as Claude Code, so this works in a local Claude Code session (not a remote/web one).

To register the server manually instead of using `.mcp.json`:

```bash
claude mcp add --transport http palmier-pro http://127.0.0.1:19789/mcp
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
