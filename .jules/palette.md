## 2024-05-22 - Mobile Action Buttons Accessibility

**Learning:** Mobile list action buttons (dropdown triggers) were missing accessibility labels, unlike their desktop counterparts. This created an inconsistency and an accessibility gap for screen reader users on mobile views.
**Action:** Always check mobile-specific components (like `TransactionsMobileList`) for accessibility parity with desktop views, especially for icon-only buttons.
