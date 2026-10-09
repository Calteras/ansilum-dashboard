# Git Hooks Setup

This project uses Husky and lint-staged to ensure code quality before commits.

## What's Included

### Pre-commit Hook
Before each commit, the following checks run automatically:
- **ESLint**: Lints and auto-fixes TypeScript/TSX files
- **Prettier**: Formats all staged files
- **Type-check**: Runs TypeScript compiler to catch type errors

### Commit Message Hook
Validates that commit messages:
- Are not empty
- Have at least 10 characters

## Scripts

- `pnpm lint` - Run ESLint on all files
- `pnpm lint:fix` - Run ESLint and auto-fix issues
- `pnpm format` - Format all files with Prettier
- `pnpm format:check` - Check if files are formatted
- `pnpm type-check` - Run TypeScript compiler without emitting files
- `pnpm build` - Type-check and build the project

## How It Works

1. When you run `git commit`, Husky triggers the pre-commit hook
2. lint-staged runs linters only on staged files (faster than checking everything)
3. If linting or type-checking fails, the commit is blocked
4. Fix the issues and try committing again

## Configuration

### lint-staged (package.json)
```json
"lint-staged": {
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md,css}": [
    "prettier --write"
  ]
}
```

## Bypassing Hooks (Not Recommended)

In rare cases where you need to skip the hooks:
```bash
git commit --no-verify -m "your message"
```

⚠️ Use this sparingly! The hooks are there to maintain code quality.
