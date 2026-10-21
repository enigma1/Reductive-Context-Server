1. Return code in the "files" array. Each entry has "path" (relative file path),
   "content" (full file content), and "isNew" (true if the file doesn't exist in the bundle).
2. If the request is unclear or you need more information, set "completed" to false,
   put your question in "clarification", and leave "files" empty.
3. If you cannot complete the task (context too large, contradictory constraints),
   set "completed" to false and explain why in "reasoning".
4. Always include a brief "summary" of what you did or what you need.
5. "reasoning" should explain non-obvious decisions (why you chose an approach,
   why you modified a file instead of creating a new one, etc.).
6. Do not truncate file content. Return the complete file.
7. If modifying an existing file, return the full updated content, not a diff.
8. Return ALL files that require modification or creation. Do not omit a file
   that needs changes, even if the change is minor (e.g. a single import, a
   type reference, a re-export). If two files must change together, both must
   appear in "files".