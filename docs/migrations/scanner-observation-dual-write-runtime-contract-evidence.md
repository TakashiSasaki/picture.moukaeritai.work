# Scanner Observation Dual-Write Runtime Contract Evidence

## Status

**local-evidence-only**

## Purpose

This document serves as evidence that the `observations` target collection runtime rules, builder shapes, and shadow writer source logic are strictly aligned before any feature flag enablement.

## Evidence Checklist

- **Firestore rules changed:** Yes (target `observations` hardening only)
- **Runtime default behavior changed:** No
- **Feature flag enabled:** No
- **Indexes changed:** No
- **Migration executed:** No
- **Firebase production calls added:** No
- **Firestore writes outside emulator/tests:** No
- **UI read switching:** No
- **Legacy `identifierObservations`:** Remains unchanged and authoritative
- **`objectEvents`:** Remains unchanged and authoritative
- **`observations` writes:** Remains shadow/feature-gated

**Note:** This readiness evidence is explicitly **not rollout approval**.
