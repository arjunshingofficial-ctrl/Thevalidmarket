# TESTING.md - Testing Strategy

## Unit Tests
- Framework: Jest / Vitest
- Focus: Utility functions, payment state calculations, cart math, fulfillment logic, permission checks.

## E2E Tests
- Framework: Playwright / Cypress
- Focus:
  - **Customer:** Registration, Login, Browsing, Adding to Cart, Checkout Flow, Viewing Dashboard.
  - **Admin:** Product creation, Category management, Order status updates.

## Security Tests
- Automated checks to ensure API endpoints enforce `user_id` context.
- Verification that paid files cannot be accessed without proper session and entitlement.

## Manual QA
- Visual checks across Desktop, Tablet, and Mobile breakpoints.
- Verification of transactional emails (Welcome, Invoice, Order Confirmation).
