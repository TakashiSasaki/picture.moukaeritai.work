Summary:
- What drift was found: `locations` in docs mapped to `places`. Domain time fields `createdAt`, `updatedAt`, `lastSeenAt`, `lastReportedAt`, `firstObservedAt`, `attachedAt`, `detachedAt` are used on legacy Entities. Legacy `Identifier` and `Binding` conceptually mapped to `Marker` and `Association`. `identifierSummary` mapped to `objectSummaries`.
- What was fixed: No fixes were applied as the state of the repo reflects the transition correctly with comments properly addressing them.
- What was intentionally left unchanged as legacy/current implementation: Legacy collections and fields (`identifiers`, `objectIdentifierBindings`, `locations`, `objectEvents`, and their time fields) were intentionally left unchanged.
- Any TODOs added for future migration: None added since the codebase has all required `TODO(Migration)` and `TODO(entity-fact-projection)` for future migrations.

Validation:
- `npm run lint` - Passed without errors
- `npm run test` - Passed 519 unit tests
- `npm run build` - Passed with production build generated successfully
- `npm run ops:validate-efp-drift-audit --audit docs/migrations/entity-fact-projection-drift-audit.json` - Passed (`drift-audit-valid` Status, covered 14 required items)
- No failures or pre-existing issues were introduced.
