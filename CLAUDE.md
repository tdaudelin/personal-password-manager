# Claude Instructions

This project uses **bd** (beads) for issue tracking.

## Issue Tracking with bd

**IMPORTANT**: Use **bd** for ALL issue tracking. Do NOT use markdown TODOs, task lists, or other tracking methods.

### Key Commands

```bash
bd ready --json                         # Find available (unblocked) work
bd show <id>                            # View issue details
bd update <id> --claim --json           # Claim work atomically before starting
bd close <id> --reason "Done" --json    # Complete work
bd dolt push                            # Push beads data to remote
```

### Creating Issues

```bash
bd create "Issue title" --description="Detailed context" -t bug|feature|task|chore|epic -p 0-4 --json
bd create "Issue title" --description="..." -p 1 --deps discovered-from:<id> --json
```

### Priorities

- `0` — Critical (security, data loss, broken builds)
- `1` — High (major features, important bugs)
- `2` — Medium (default)
- `3` — Low (polish, optimization)
- `4` — Backlog (future ideas)

### Workflow

1. `bd ready --json` — find unblocked issues
2. `bd update <id> --claim --json` — claim before starting
3. Implement, test, document
4. If new work is discovered: `bd create "..." --deps discovered-from:<id>`
5. `bd close <id> --reason "..."` — complete

### Rules

- ✅ Use bd for ALL task tracking
- ✅ Always use `--json` flag for programmatic use
- ✅ Link discovered work with `discovered-from` dependencies
- ✅ Check `bd ready` before asking "what should I work on?"
- ❌ Do NOT create markdown TODO lists
- ❌ Do NOT duplicate tracking systems

---

## Shell Commands — Non-Interactive Mode

Shell commands like `cp`, `mv`, and `rm` may be aliased with `-i` (interactive) mode, causing hangs waiting for y/n input.

**Always use these forms:**

```bash
cp -f source dest       # NOT: cp source dest
mv -f source dest       # NOT: mv source dest
rm -f file              # NOT: rm file
rm -rf directory        # NOT: rm -r directory
cp -rf source dest      # NOT: cp -r source dest
```

---

## Session Completion (Landing the Plane)

**When ending a work session**, complete ALL steps. Work is NOT done until `git push` succeeds.

1. **File issues for remaining work** — create bd issues for anything needing follow-up
2. **Run quality gates** (if code changed) — tests, linters, builds
3. **Update issue status** — close finished work
4. **Push everything**:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Verify** — all changes committed AND pushed

**Critical rules:**

- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing — that leaves work stranded locally
