# .claude/commands/self-review.md

Review this repository's agent setup and code. Don't change anything.

1. Read CLAUDE.md and .specify/memory/constitution.md.
2. Check src/ and tests/ against them: list every violation with the file and line.
3. For every acceptance criterion in specs/\*/spec.md, name the test that checks it,
   and list the criteria that have no test.
4. List what a colleague gets from .claude/ after cloning, and what they must set up
   themselves.
5. Finish with one line: "ready" or a list of what is wrong.
