---
applyTo: '**'
---

# Stellmare Project Memory

The Stellmare SaaS platform lives at `C:\Users\nickc\Desktop\Dev\Stellmare\`.

Before doing ANY Stellmare work, read these files at the Stellmare repo root:

1. **`README.md`** — Architecture, project structure, build/deploy, roadmap status.
2. **`SCHEMA.md`** — Database schema reference. Every table, column, type, and constraint. **Always consult before writing any database queries or inserts.**
3. **`API.md`** — Full API reference. Every endpoint's request body, response JSON shape, query params, auth requirements, and error format. **Always consult before writing any frontend fetch() calls or handler changes.**

These three files are the sources of truth. Use the exact field names documented there — never guess.

After completing work on Stellmare, UPDATE the relevant docs:
- `README.md` — roadmap checkboxes, infrastructure status, key decisions, known issues
- `SCHEMA.md` — if you added/changed any database tables or columns
- `API.md` — if you added/changed any API endpoints, request bodies, or response shapes

`STATUS.md` exists only as an AI instruction pointer — do NOT duplicate information there.
