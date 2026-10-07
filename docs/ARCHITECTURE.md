# ARCHITECTURE.md - Asia D Market

## System Architecture Overview
Asia D Market follows a modern, scalable Serverless/Edge monolithic architecture utilizing Next.js as the core full-stack framework. 

## Technology Stack
- **Frontend/Backend:** Next.js (App Router), React, TypeScript.
- **Styling:** Tailwind CSS + custom design system.
- **Database:** PostgreSQL (managed by Supabase or Neon).
- **ORM:** Prisma ORM for type-safe database interactions.
- **Authentication:** NextAuth.js (Auth.js) or Supabase Auth.
- **Storage:** AWS S3 compatible (e.g., Supabase Storage, Cloudflare R2).
- **Payments:** Custom abstractions for UPI, BTC, USDT.
- **Email:** Resend / SendGrid.

## High-Level Components
1. **Public Web (Frontend):** SSG/ISR for store pages, SSR for dynamic carts/checkouts.
2. **Customer Dashboard:** Client-side rendered (CSR) with server actions for high interactivity.
3. **Admin Dashboard:** Secure, RBAC-protected backend management interface.
4. **API Layer:** Next.js Route Handlers + Server Actions.
5. **Fulfillment Engine:** Background/async processing for license generation and secure URL delivery.

## Directory Structure
```
/src
  /app           # Next.js App Router (pages, layouts, api)
  /components    # Reusable UI components
  /features      # Domain-specific logic (e.g., auth, products, checkout)
  /lib           # Core libraries, database clients
  /services      # External integrations (payments, storage, email)
  /types         # TypeScript definitions
```
