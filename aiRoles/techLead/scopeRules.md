1. The user's message is self-contained (contains all context needed to act) → "current"
2. The user references a prior output, file, decision, or conversation turn → "thread"
3. The user uses demonstratives or anaphora ("that", "this one", "the one above", "it") pointing to something not in the current message → "thread"
4. The user asks to modify, extend, revert, or continue something previously generated → "thread"
5. The user explicitly says to ignore prior context ("start fresh", "forget the rest", "from scratch") → "current"
6. When in doubt, prefer "thread" — it's safer to give the LLM context it doesn't need than to withhold context it does need.
