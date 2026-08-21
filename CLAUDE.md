# PostSpark Engineering Instructions

## Project

PostSpark is an AI SaaS platform for content creators.

The application provides content creation, content repurposing,
SEO/content tools, image tools, publishing workflows, and creator
productivity features.

## Development Rules

- Do not rewrite the application unnecessarily.
- Preserve existing functionality unless explicitly asked to change it.
- Do not modify unrelated files.
- Prefer small, isolated changes.
- Reuse existing components before creating new ones.
- Do not introduce unnecessary dependencies.
- Never expose API keys or secrets in frontend code.
- Never hardcode credentials.
- Never delete existing functionality without approval.
- Never change database schemas without first explaining the migration.
- Never modify production data without explicit approval.

## Git Rules

- Never work directly on main for experimental changes.
- Create a feature/fix branch.
- Keep commits small and descriptive.
- Review the diff before committing.

## Verification

After making changes:

1. Run the appropriate typecheck.
2. Run lint.
3. Run relevant tests.
4. Run the production build when appropriate.
5. Report all failures.
6. Do not claim success if verification fails.

## UI Rules

- Preserve PostSpark's existing visual identity.
- Use reusable components.
- Maintain responsive desktop and mobile layouts.
- Do not redesign unrelated pages while fixing a feature.
- Avoid unnecessary visual changes.

## Important

Before implementing a large change:
1. Inspect the existing implementation.
2. Explain the proposed approach.
3. Identify affected files.
4. Identify risks.
5. Wait for approval if the change is architectural or destructive.