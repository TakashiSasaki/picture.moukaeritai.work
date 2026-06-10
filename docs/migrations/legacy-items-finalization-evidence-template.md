# Legacy Items Finalization Evidence Template

> [!WARNING]
> This evidence template is intended for private/manual sign-off and should be stored safely **outside the repository**.
> * **Do not paste raw Bluetooth tag IDs.**
> * **Do not paste raw owner IDs.**
> * **Do not paste full production exports.**

**Date:** [YYYY-MM-DD]
**Administrator:** [Name/Handle]
**Source Backup Location:** [Describe securely, e.g. "Stored in private team vault as legacy-items-export-2026.json" without embedding secrets or raw data]
**Legacy Item Count:** [Count, e.g. 2]

---

## Item-by-Item Checklist

You can generate the starting markdown for this checklist by running the audit helper:
`npm run audit:legacy-items -- --markdown <legacyItemId1> <legacyItemId2>`

[PASTE CHECKLIST HERE]

---

## Final Review

* [ ] Normalized object verification completed.
* [ ] Identifiers verification completed.
* [ ] Bindings verification completed.
* [ ] Images verification completed.
* [ ] Events verification completed.
* [ ] Location/address verification completed.
* [ ] `bluetoothTags` preservation decision made and executed if required.
* [ ] `tagType` preservation decision made and executed if required.

## Field Classification Table

| Field Name | Source | Recommended Status | Administrator Sign-off Status |
| :--- | :--- | :--- | :--- |
| `name` | legacy items | `migrated` | `migrated` |
| [Add remaining fields here] | | | |

*Allowed statuses: `migrated`, `partially-migrated`, `derived-only`, `preserved-as-legacy-reference`, `preserved-as-raw-snapshot`, `intentionally-discarded`.*

## Final Sign-Off

I confirm that the legacy items listed above have been completely verified against the normalized schema and all fields are appropriately classified. The active data required for application operation is preserved.

**Signature:** ___________________________
