## 2024-07-03 - [Missing aria-label on dialog close button]
**Learning:** Icon-only close buttons (like the `X` icon in `ImageMetadataDialog`) often miss `aria-label`s, making them unreadable to screen readers.
**Action:** When inspecting dialog or modal components, specifically verify that any icon-only action buttons (especially those dismissing the dialog) include a descriptive `aria-label` (e.g. `aria-label="Close dialog"`).
