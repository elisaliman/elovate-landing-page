---
name: git-workflow
description: Follow the repository's preferred git workflow when inspecting changes, staging files, creating logical commits, and preparing branch history. Use when asked to commit, split commits, review diffs, clean up changes, or otherwise perform git work.
---

# Git Workflow

Use this skill for git-related work in this repository.

## When to Use

Use this skill when the user asks you to:

- make commits
- split work into logical commits
- inspect diffs or explain what changed
- clean up a branch before handoff
- stage only part of a file
- amend or reorganize local commit history
- prepare changes for review or PR submission

## Goals

- Keep history readable and intentional.
- Prefer small, logical commits over large mixed commits.
- Preserve user work and avoid destructive commands.
- Make it easy for a human reviewer to understand what changed and why.

## Default Workflow

1. Inspect the current state before changing git history.
2. Review diffs before staging.
3. Group changes by concern.
4. Stage selectively.
5. Commit with clear messages.
6. Report what was committed and what remains uncommitted.

## Inspect Before Acting

Before making commits or altering history:

- Check branch status.
- Review tracked and untracked files.
- Review the diff.
- If multiple concerns are mixed together, identify sensible commit boundaries first.

Prefer commands like:

- `git status`
- `git diff`
- `git diff --staged`
- `git log --oneline --decorate -n 10`

## Logical Commit Rules

A logical commit should usually contain one of these:

- one feature
- one bug fix
- one refactor
- one docs update
- one formatting-only or mechanical change
- one test update tied to one code change

Do not mix unrelated concerns in one commit when they can be separated.

Examples of changes that should usually be separate commits:

- feature work and formatting cleanup
- refactor and behavior change
- code changes and unrelated documentation edits
- dependency updates and app logic changes

If a single file contains multiple concerns, use selective staging so each commit stays coherent.

## Staging Guidance

Prefer selective staging over broad staging.

Preferred approaches:

- `git add <specific-file>`
- `git add -p`
- `git restore --staged <file>` to unstage when needed

Avoid `git add .` unless the entire working tree is intentionally part of one coherent change.

Before every commit, review the staged diff with:

- `git diff --staged`

## Commit Message Convention

Use Conventional Commits unless the user asks for a different style.

Format:

`type(scope): summary`

Common types:

- `feat`
- `fix`
- `refactor`
- `docs`
- `test`
- `chore`
- `style`

Guidelines:

- Keep the summary short and specific.
- Use imperative mood.
- Describe the actual change, not vague intent.
- Omit scope if it adds no value.

Examples:

- `feat(outfits): add fourth outfit to rotation`
- `fix(normalize): resolve paths from project root`
- `refactor(shoes): spin each shoe independently`
- `docs(skills): add git workflow skill`

## Safety Rules

Do not use destructive git commands unless the user explicitly asks for them or they are clearly required and safe.

Treat these as destructive or high-risk:

- `git reset --hard`
- `git clean -fd`
- `git checkout -- <file>`
- rebasing published history
- force-pushing

Do not rewrite commits that may already be shared unless the user explicitly requests it.

If history editing is needed, prefer the least destructive option that solves the problem.

## Amending and Rewriting History

You may amend or reorganize **local, unshared** commits when it clearly improves commit quality.

Safe defaults:

- amend the most recent local commit if only the latest commit needs correction
- use interactive rebase only for local cleanup when the branch is clearly not yet published
- preserve commit meaning when rewording or squashing

Do not rebase or force-push without a clear reason.

If uncertain whether commits are shared, avoid history rewriting.

## Mixed Changes in One Working Tree

When the user asks for logical commits and the working tree contains mixed concerns:

1. Identify the commit groups.
2. Stage only the first group.
3. Commit it.
4. Repeat for the remaining groups.
5. Confirm any leftover unstaged or untracked files.

If separating cleanly is not possible, explain the tradeoff and choose the most reviewable split.

## Validation Before Commit

Before committing, run the smallest relevant validation that matches the change, when available.

Examples:

- targeted tests for affected code
- lint for touched files or project
- build or typecheck if relevant
- quick smoke test for UI or workflow changes

If validation cannot be run, say so plainly in the handoff.

Do not claim tests passed unless you actually ran them.

## Final Handoff Format

After git work, report:

- current branch
- commits created, in order
- short explanation of what each commit contains
- whether anything remains unstaged or uncommitted
- any validation run
- any risks, assumptions, or follow-up items

Example structure:

- Branch: `feature/outfit-rotation`
- Created commits:
  - `fix(normalize): resolve outfit paths from project root`
  - `feat(outfits): add fourth outfit to rotation`
- Remaining changes: none
- Validation: ran targeted script successfully
- Notes: browser hard refresh may be needed after asset path changes

## Decision Heuristics

Prefer:

- readable history over clever history
- selective staging over broad staging
- small coherent commits over giant commits
- explicit summaries over vague messages
- safety over aggressive cleanup

When in doubt, make the history easier for a future reviewer to understand