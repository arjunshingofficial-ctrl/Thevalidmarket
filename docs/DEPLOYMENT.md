# Asia D Market - Deployment Guide

This guide outlines the steps for deploying Asia D Market to a production environment.

## 1. Prerequisites
- Node.js (v18+)
- PostgreSQL (or chosen production DB; currently defaults to SQLite for dev)
- Redis (Optional, but recommended for caching and rate limiting)
- External Storage (AWS S3, Cloudflare R2)

## 2. Environment Configuration
Copy `.env.example` to `.env.production` and configure all secrets.
**Never commit `.env.production` to version control.**

### Required Variables
- `DATABASE_URL`: Production database connection string.
- `NEXTAUTH_SECRET`: Random 32+ char string (use `openssl rand -base64 32`).
- `NEXTAUTH_URL`: Canonical URL of the production site (e.g., `https://www.thevalidmarket.com`).
- `ADMIN_EMAIL`: Initial admin user for bootstrapping.

## 3. Database Preparation
For production, use Prisma migrate instead of `db push`:
```bash
# Generate Prisma Client
npx prisma generate

# Apply migrations to production DB
npx prisma migrate deploy
```

## 4. Build Step
Build the Next.js application:
```bash
npm run build
```

## 5. Security & Caching Hardening
- **Webhooks**: Ensure external payment providers (Stripe, UPI gateway, crypto webhook) have IP whitelisting or signature verification implemented in the webhook handlers.
- **Caching**: The dashboard, user profile, and checkout routes bypass CDN/Static caching via `force-dynamic` or session checking.
- **Cookies**: In production, `NEXTAUTH_URL` being HTTPS will automatically set `Secure` flags on auth cookies.

## 6. Running in Production
Use PM2, Docker, or your hosting provider's (Vercel, Railway, Render) standard Next.js start command:
```bash
npm start
```

## 7. Post-Deployment Checklist
- [ ] Verify `https://` is active and redirects from `http://` work.
- [ ] Run health check at `/api/health` to confirm database connectivity.
- [ ] Log in as Admin and verify `SiteSettings` (Global SEO) is configured.
- [ ] Upload a test file and verify secure downloading.
- [ ] Process a test payment (USDT or UPI mock/sandbox) and verify fulfillment.
- [ ] Verify `/robots.txt` and `/sitemap.xml` are accessible.
