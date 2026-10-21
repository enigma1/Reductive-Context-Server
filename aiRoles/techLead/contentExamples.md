# Examples

## Example 1: New API

### Input

Build a task management API. Users can create, list, complete, and delete tasks. Users can only see their own tasks.

### Expected Output

#### Requirements Summary

CRUD API for tasks, scoped to authenticated users.

#### Assumptions & Open Questions

- Auth mechanism unspecified → propose JWT or session-based, flag for confirmation.
- No stack specified → propose one, note it's a proposal.
- Pagination not mentioned → defer unless requested.

#### Implementation Tasks

##### TASK-001: Project scaffolding & auth

**Objective:** Set up the project, configure auth so endpoints can identify the caller.

**Acceptance criteria:**

- App starts with a documented command.
- Unauthenticated requests are rejected.

**Dependencies:** None.

##### TASK-002: Task model & endpoints

**Objective:** Persist tasks with ownership; implement create, list, complete, delete.

**Acceptance criteria:**

- Users can only access their own tasks.
- Invalid input returns appropriate errors.

**Dependencies:** TASK-001.

##### TASK-003: Tests & docs

**Objective:** Verify behaviour and document the API.

**Acceptance criteria:**

- Tests cover normal flow, validation, and cross-user access.
- Endpoints and auth requirements are documented.

**Dependencies:** TASK-002.

#### Definition of Done

- All tasks complete, tests pass, docs exist.

---

## Example 2: New CLI Tool

### Input

Write a CLI tool that watches a directory and copies new files to a backup location on a schedule.

### Expected Output

#### Requirements Summary

File-watching CLI with scheduled backup to a destination path.

#### Assumptions & Open Questions

- "On a schedule" — interval unspecified → propose configurable interval with a default, flag for confirmation.
- No language specified → propose one.
- Conflict handling (file already exists at destination) not specified → propose overwrite or skip, flag.

#### Implementation Tasks

##### TASK-001: Project setup & config

**Objective:** Scaffold the CLI, accept source/destination paths and interval as arguments or config.

**Acceptance criteria:**

- Tool runs with documented arguments.
- Invalid paths produce a clear error.

**Dependencies:** None.

##### TASK-002: Watch & copy logic

**Objective:** Detect new files in the source directory and copy them to the destination on the configured schedule.

**Acceptance criteria:**

- New files are copied within one scheduling interval.
- Existing files at destination are handled per the chosen conflict policy.

**Dependencies:** TASK-001.

##### TASK-003: Tests

**Objective:** Verify watch, copy, and error behaviour.

**Acceptance criteria:**

- Tests cover new-file detection, conflict handling, and invalid input.

**Dependencies:** TASK-002.

#### Definition of Done

- All tasks complete, tests pass, usage documented.
