# TerraPOS Dashboard

Admin Dashboard UI crafted with Shadcn and Vite. Built with responsiveness and accessibility in mind.

![alt text](public/images/shadcn-admin.png)

[![Sponsored by Clerk](https://img.shields.io/badge/Sponsored%20by-Clerk-5b6ee1?logo=clerk)](https://go.clerk.com/GttUAaK)

I've been creating dashboard UIs at work and for my personal projects. I always wanted to make a reusable collection of dashboard UI for future projects; and here it is now. While I've created a few custom components, some of the code is directly adapted from ShadcnUI examples.

> This is not a starter project (template) though. I'll probably make one in the future.

## Features

- Light/dark mode
- Responsive
- Accessible
- With built-in Sidebar component
- Global search command
- 10+ pages
- Extra custom components
- RTL support

<details>
<summary>Customized Components (click to expand)</summary>

This project uses Shadcn UI components, but some have been slightly modified for better RTL (Right-to-Left) support and other improvements. These customized components differ from the original Shadcn UI versions.

If you want to update components using the Shadcn CLI (e.g., `npx shadcn@latest add <component>`), it's generally safe for non-customized components. For the listed customized ones, you may need to manually merge changes to preserve the project's modifications and avoid overwriting RTL support or other updates.

> If you don't require RTL support, you can safely update the 'RTL Updated Components' via the Shadcn CLI, as these changes are primarily for RTL compatibility. The 'Modified Components' may have other customizations to consider.

### Modified Components

- scroll-area
- sonner
- separator

### RTL Updated Components

- alert-dialog
- calendar
- command
- dialog
- dropdown-menu
- select
- table
- sheet
- sidebar
- switch

**Notes:**

- **Modified Components**: These have general updates, potentially including RTL adjustments.
- **RTL Updated Components**: These have specific changes for RTL language support (e.g., layout, positioning).
- For implementation details, check the source files in `src/components/ui/`.
- All other Shadcn UI components in the project are standard and can be safely updated via the CLI.

</details>

## Tech Stack

**UI:** [ShadcnUI](https://ui.shadcn.com) (TailwindCSS + RadixUI)

**Build Tool:** [Vite](https://vitejs.dev/)

**Routing:** [TanStack Router](https://tanstack.com/router/latest)

**Type Checking:** [TypeScript](https://www.typescriptlang.org/)

**Linting/Formatting:** [ESLint](https://eslint.org/) & [Prettier](https://prettier.io/)

**Icons:** [Lucide Icons](https://lucide.dev/icons/), [Tabler Icons](https://tabler.io/icons) (Brand icons only)

**Auth (partial):** [Clerk](https://go.clerk.com/GttUAaK)

## Run Locally

Clone the project

```bash
  git clone https://github.com/satnaing/shadcn-admin.git
```

Go to the project directory

```bash
  cd shadcn-admin
```

Install dependencies

```bash
  pnpm install
```

Start the server

```bash
  pnpm run dev
```

## Environments

The URLs below are backend API targets. Browser requests use `/api`; Vite
proxies them to the selected target to support same-origin cookie authentication.

| Environment | Config file        | Backend API target                            |
| ----------- | ------------------ | --------------------------------------------- |
| Development | `.env.development` | `https://dev-terrapos.calterras.com/app/terrapos` |
| Staging     | `.env.staging`     | `https://staging-terrapos.calterras.com/app/terrapos` |
| Production  | `.env.production`  | `https://terrapos.calterras.com/app/terrapos` |

| Environment | Run locally           | Build                   | Preview the build locally |
| ----------- | --------------------- | ----------------------- | ------------------------- |
| Development | `pnpm dev`            | `pnpm build:dev`        | `pnpm preview:dev`        |
| Staging     | `pnpm dev:staging`    | `pnpm build:staging`    | `pnpm preview:staging`    |
| Production  | `pnpm dev:production` | `pnpm build:production` | `pnpm preview:production` |

`pnpm build` and `pnpm preview` default to production. All builds write to `dist/`;
build the matching environment before previewing it. To use a local backend on
port `18068`, set `VITE_API_URL=http://localhost:18068/app/terrapos` in
`.env.development.local`.

The mode files are committed and work without copying `.env.example`. For optional
shared settings such as the Clerk publishable key, copy `.env.example` to
`.env.local`. To override an API target locally, create `.env.development.local`,
`.env.staging.local`, or `.env.production.local` and set `VITE_API_URL`. Local
files are ignored by Git. Mode settings override values in the shared `.env`;
shell environment variables take precedence over all files. Restart Vite after
changing environment files. See [Vite's environment documentation](https://vite.dev/guide/env-and-mode).

### Local login through a Cloudflare tunnel

With `VITE_API_URL=https://dev-terrapos.calterras.com/app/terrapos`, the browser
still calls `/api` on localhost. Vite forwards requests to the tunnel and changes
the upstream `Host`, while preserving the browser's `Origin` (for example,
`http://localhost:5173`). The backend must trust that exact frontend origin,
including its port. In `kartika-be`, `FRONTEND_URL` and `CORS_ORIGINS` configure
Better Auth's trusted origins. Add the actual local origin there if you use a
different hostname or port, then restart the backend.

Do not replace the proxy's `Origin` with the tunnel URL: the development backend
may only trust its local API and frontend origins. This causes `Invalid origin`
when cookies are present. See [Better Auth's trusted origins documentation](https://better-auth.com/docs/reference/options#trustedorigins).

### Deployment routing

For deployment, use `pnpm build:staging` for staging and `pnpm build:production`
for production, with `dist/` as the output directory. Both environments currently
share the same backend. The checked-in `vercel.json` and `netlify.toml` route
`/api/*` to that backend before the SPA fallback. These hosting rewrites are
separate from Vite's local proxy: changing `VITE_API_URL` does not change the
deployed rewrite. Update the hosting rewrite too if a hosted backend changes.
Other hosts need an equivalent `/api/*` reverse proxy to the backend.

## Sponsoring this project ❤️

If you find this project helpful or use this in your own work, consider [sponsoring me](https://github.com/sponsors/satnaing) to support development and maintenance. You can [buy me a coffee](https://buymeacoffee.com/satnaing) as well. Don’t worry, every penny helps. Thank you! 🙏

For questions or sponsorship inquiries, feel free to reach out at [satnaingdev@gmail.com](mailto:satnaingdev@gmail.com).

### Current Sponsor

- [Clerk](https://go.clerk.com/GttUAaK) - authentication and user management for the modern web

## Author

Crafted with 🤍 by [@satnaing](https://github.com/satnaing)

## License

Licensed under the [MIT License](https://choosealicense.com/licenses/mit/)

### Email verification

See [email verification setup and testing](docs/email-verification.md) for the required `VITE_TURNSTILE_SITE_KEY`, backend callback configuration, public verification routes, and the manual end-to-end checklist.
