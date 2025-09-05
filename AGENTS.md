# Repository Guidelines

## Project Structure & Module Organization
- Root: primary working doc `the_zhunk_box_diy_case_lab_prd.md`.
- Proposed additions as the project grows:
  - `docs/` for supplementary specs and notes
  - `assets/images/` for screenshots and diagrams
  - `assets/files/` for downloadable artifacts
- File naming: use `snake_case.md` (matches the current file).

## Build, Test, and Development Commands
- No build system is required; this is a Markdown-first repo.
- Preview: use your editor’s Markdown preview (e.g., VS Code).
- Lint (optional):
  - `npx markdownlint "**/*.md"` — style and common Markdown issues
  - `npx prettier --check "**/*.md"` — formatting check
- Format (optional): `npx prettier --write "**/*.md"`.

## Coding Style & Naming Conventions
- Headings: sentence case; one `#`-level per section; avoid jumps.
- Lists: `-` for bullets; keep items concise; wrap at ~100 chars.
- Code fences: specify language hint (e.g., bash).
- Links: prefer relative paths; add descriptive link text.
- Images: place in `assets/images/`; use alt text; keep files under 1MB.

## Architecture & Modularity
- Keep components small: no single file/module should exceed 250 LOC.
- Split large sections into focused modules under `docs/`.
- Compose the main entry (index README) from module links.

## Testing Guidelines
- Validate links before submitting (editor extension or CLI):
  - Example: `npx markdown-link-check -q the_zhunk_box_diy_case_lab_prd.md`
- Run `markdownlint` and `prettier` locally if available.
- Keep PRs green by fixing all reported issues before review.

## Commit & Pull Request Guidelines
- Commits: follow Conventional Commits
  - Examples: `docs: clarify enclosure tolerances`, `chore: reformat markdown`.
- PRs must include:
  - Clear summary of changes and motivation
  - Scope of affected sections/files
  - Screenshots or embedded images for visual changes
  - Linked issue (if applicable) and a short testing note
- Prefer small, focused PRs over large, mixed changes.

## Security & Configuration Tips
- Do not commit secrets, personal data, or license-restricted assets.
- Strip metadata from images; use lossless compression when possible.
- For large binaries, consider Git LFS and include `.gitattributes` rules.
