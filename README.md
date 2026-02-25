# Toolich

A developer-focused toolkit built as a single-page app with a browser-tab UX. Tools are organized into categories (Developers, DevOps, Security, Networking, Managers) and accessible both inline via tabs and at standalone URLs.

**Stack:** Next.js 16 · React 19 · TypeScript 5 · Tailwind CSS 4 · lucide-react

---

## Project Goal

Toolich aims to be a fast, no-signup, no-tracking collection of utilities that developers actually reach for daily — Base64 encoding, JSON validation, hashing, URL encoding, and more. Everything runs client-side; there are no external API calls or databases.

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm (comes with Node)

### Install & run

```bash
git clone git@github.com:cratonik/toolich.git
cd toolich
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Available commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server with hot reload |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |

---

## Deployments

| Environment | URL | Branch |
|-------------|-----|--------|
| Production | [toolich.com](https://toolich.com) | `prod` |
| Development | [toolich.netlify.app](https://toolich.netlify.app) | `dev` |

---

## Branch & PR Workflow

| Branch | Purpose |
|--------|---------|
| `prod` | Production — PRs must target this |
| `dev` | Integration branch; reflects the live dev environment |
| `tool/<tool-name>` | Branch for adding a new tool (e.g. `tool/hash-generator`) |
| `feature/<name>` | Branch for features, UI changes, or non-tool work |

**Flow:** `tool/<name>` or `feature/<name>` → PR → `prod`

1. Branch off `dev` for your work.
2. Use `tool/<tool-name>` when adding a new tool, `feature/<name>` for everything else.
3. Keep branches focused — one tool or change per branch.
4. Open a PR against `prod` with a clear description of what changed and why.
5. Ensure `npm run build` and `npm run lint` pass before requesting review.

---

## Project Structure

```
src/
  app/
    layout.tsx              # Root layout: TabProvider > SearchProvider > Header
    page.tsx                # Home page: TabBar + TabContent
    tools/
      layout.tsx            # Standalone tool layout (breadcrumb back-link)
      developers/           # Next.js routes for each tool
  components/
    Header.tsx              # Fixed top bar with search trigger
    TabBar.tsx              # Browser-style tab bar (Home tab always pinned)
    TabContent.tsx          # Renders active tab: HomePanel | CategoryPanel | tool
    HomePanel.tsx           # Hero, category cards, recently used tools, footer
    CategoryPanel.tsx       # Tool grid for a category (used inside tabs)
    SpotlightSearch.tsx     # Cmd+K search modal
    ShortcutHelp.tsx        # Floating ? button + keyboard shortcut panel
  lib/
    tab-context.tsx         # Tab state management
    tool-registry.ts        # TOOLS[] metadata array
    tool-components.ts      # Dynamic imports map for tool components
    routes.ts               # Route constants and helpers
  tools/
    developers/
      base64-encode/        # Base64Encoder.tsx + index.ts
      base64-decode/        # Base64Decoder.tsx + index.ts
```

---

## Adding a New Tool

Start by creating a branch: `tool/<tool-name>` (e.g. `tool/hash-generator`). Then follow these steps — all five are required.

### 1. Create the tool component

```
src/tools/<category>/<slug>/MyTool.tsx   ← React component ("use client")
src/tools/<category>/<slug>/index.ts     ← re-exports the component
```

Tool components must be client components (`"use client"`). Use the split panel layout: input on the left, output on the right (`md:grid-cols-2`). Include Copy and Clear action buttons.

### 2. Register the tool

In `src/lib/tool-registry.ts`, add an entry to the `TOOLS` array:

```ts
{
  slug: "my-tool",
  category: "developers",
  name: "My Tool",
  description: "Short description shown in the tool grid.",
  tags: ["tag1", "tag2"],
}
```

### 3. Add the dynamic import

In `src/lib/tool-components.ts`, add to `TOOL_COMPONENTS`:

```ts
"developers/my-tool": dynamic(() => import("@/tools/developers/my-tool"), { ssr: false }),
```

### 4. Create the standalone Next.js page

```
src/app/tools/developers/my-tool/page.tsx
```

This thin page wraps the tool component for direct URL access (`/tools/developers/my-tool`).

### 5. Add to routes (optional but recommended)

In `src/lib/routes.ts`, add to `ROUTES.tools.developers`.

---

## Styling Conventions

- Dark mode via Tailwind `dark:` variants throughout
- Neutral palette: `zinc-*`
- Category accent colors: `indigo` (developers), `emerald` (devops), `rose` (security), `violet` (networking), `amber` (managers)
- Border radius: `rounded-xl` for panels, `rounded-lg` for buttons, `rounded-full` for icons/pills
- Focus ring: `focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20`

---

## Issues & Milestones

[![Open Issues](https://img.shields.io/github/issues/cratonik/toolich?style=flat-square&label=open%20issues)](https://github.com/cratonik/toolich/issues)
[![Milestone 1](https://img.shields.io/github/milestones/open-issues/cratonik/toolich/1?style=flat-square&label=milestone%201%20open)](https://github.com/cratonik/toolich/milestone/1)
[![Closed Issues](https://img.shields.io/github/issues-closed/cratonik/toolich?style=flat-square&label=closed%20issues)](https://github.com/cratonik/toolich/issues?q=is%3Aissue+is%3Aclosed)

The badges above update automatically from GitHub — no manual maintenance needed.

- Browse all open issues: [github.com/cratonik/toolich/issues](https://github.com/cratonik/toolich/issues)
- Current milestone: [Milestone 1 — Developers v1.0](https://github.com/cratonik/toolich/milestone/1)

---

## For Testers

### Getting assigned

Testing is community-driven. To get assigned to a testing task:

1. Open the [Discussions panel](https://github.com/cratonik/toolich/discussions) on GitHub.
2. Find the discussion thread for the feature or issue you want to test, or start a new one.
3. Express your interest in testing it — a maintainer will assign you to the relevant issue.
4. Once assigned, you own the testing for that issue and are expected to report findings as comments on the issue.

### Where to test

You don't need to set up anything locally. Both deployed environments are always available:

| Environment | URL | What's on it |
|-------------|-----|--------------|
| Production | [toolich.com](https://toolich.com) | Stable, merged work |
| Development | [toolich.netlify.app](https://toolich.netlify.app) | Latest from `dev` — may include in-progress changes |

Open either URL in your browser and test directly there.

### Testing workflow

1. **Pick an issue** — look for issues labelled `needs-testing` or `ready-for-review` in the [issues list](https://github.com/cratonik/toolich/issues).
2. **Test on the deployed URL** — use [toolich.netlify.app](https://toolich.netlify.app) for dev work or [toolich.com](https://toolich.com) for production issues. No local setup needed.
3. **Run through the acceptance criteria** listed on the issue. Each issue describes the expected behaviour; test against that.
4. **Report results**:
   - If you have access to create issues: open a new issue with your findings — steps to reproduce, expected vs actual behaviour, and a screenshot or recording if relevant.
   - If you don't have issue creation access: post your findings in the [Discussions panel](https://github.com/cratonik/toolich/discussions) and a maintainer will create the issue on your behalf.
5. **Label the issue** — apply `tested-pass` or `tested-fail` if you have permission, or ask a maintainer to do so.

### Environment info to include in reports

Always include the following so findings are actionable:

- OS and version (e.g. macOS 15.3, Windows 11)
- Browser and version (e.g. Chrome 132, Firefox 134)
- Which URL you tested on (prod or dev)

---

## Contributing

We welcome contributions! To ensure a smooth and effective process, please follow these guidelines:

1.  **Find or Create an Issue:**
    *   Browse [open issues](https://github.com/cratonik/toolich/issues) for tasks you'd like to work on.
    *   If you find an issue, ask to be assigned in the comments.
    *   If you have a new idea, bug report, or feature request, please open a new issue to discuss it before starting any work.
2.  **Assignment Required:** Contributions (Pull Requests) will only be considered if they are linked to an existing issue that you have been assigned to. Unassigned contributions will not be reviewed.
3.  **Follow Workflow:** Adhere to the [Branch & PR Workflow](#branch--pr-workflow) outlined above.
4.  **Keep it Focused:** Keep Pull Requests small and focused — one tool or fix per PR is ideal.
5.  **Code Quality:**
    *   Ensure `npm run lint` passes with no errors.
    *   Match existing code style and naming conventions.

---

## License

MIT
