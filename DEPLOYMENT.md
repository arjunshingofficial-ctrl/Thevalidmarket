# The Valid Market - Deployment Guide

## 1. Requirements
- Node.js 18+
- PostgreSQL or equivalent SQL database supported by Prisma
- A persistent file system or configured S3/Blob storage (currently defaults to local filesystem).

## 2. Environment Variables
Copy the `.env.example` file to `.env` and fill out the required variables:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

For the complete list of optional integrations (UPI, S3, SMTP), see `.env.example`.

## 3. Database Setup
Ensure your database is running and accessible via the `DATABASE_URL`.

## 4. Prisma Migration
For production, **do not** use `prisma db push`. Instead, run:
```bash
npx prisma migrate deploy
```
This safely applies pending migrations without dropping data.

## 5. Storage Setup
**CRITICAL NOTE FOR SERVERLESS HOSTING (e.g. Vercel, Netlify):**
The current architecture defaults to local filesystem storage (`/public/uploads` and `/private/uploads`). Serverless functions operate on a read-only filesystem. 
**PRODUCTION BLOCKER:** You MUST implement an S3StorageProvider or equivalent object storage adapter in `src/lib/storage/index.ts` before deploying to a serverless provider, otherwise image uploads and secure digital downloads will fail silently or lose data on restart.

## 6. Build Command
```bash
npm install
npx prisma generate
npm run build
```

## 7. Start Command
```bash
npm run start
```
(If deploying to a PaaS like Vercel, this is handled automatically).

## 8. Domain Configuration
- Ensure `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` match your production domain.
- Set up DNS records (A/CNAME) pointing to your host.

## 9. Payment Configuration
- Set `UPI_API_KEY`, `USDT_WALLET_ADDRESS`, and `BTC_PROVIDER_URL` as needed.
- If webhooks are used in the future, configure the Webhook Secrets.

## 10. Email Configuration
- Set `EMAIL_SMTP_HOST`, `PORT`, `USER`, and `PASS` to enable transactional emails.
- If left blank, the application gracefully skips email delivery.

## 11. Backup Procedure
- **Database:** Configure automated daily pg_dump backups (or use managed database automated backups).
- **Files:** Backup the local `/public/uploads` and `/private/uploads` directories if not using object storage.

## 12. Rollback Procedure
- If a deployment fails, revert to the previous Git commit.
- If a database migration causes issues, restore from the last daily backup (Prisma `migrate down` is not natively supported out of the box in the same way; restoring the DB state is the safest fallback).
