# THE VALID MARKET — LOCAL TESTING GUIDE

This document provides instructions for setting up a disposable Windows-based environment to run database integration tests on the The Valid Market WordPress Plugin.

Because real financial transactions, row locking (`FOR UPDATE`), and unique database constraints are used in this application, **a live MySQL or MariaDB instance is strictly required to prove concurrency safety.** Mock unit tests cannot validate transaction atomicity or deadlock prevention.

---

## 1. Prepare the Test Environment (Windows)

We recommend using **Local by Flywheel** as it automatically provisions a localized, disposable WordPress stack with PHP and MySQL on Windows without requiring manual IIS/Apache configuration.

1. Download and install **Local** from [localwp.com](https://localwp.com/).
2. Open Local and click **Add Local Site**.
3. Create a new site named `The Valid Market Staging`.
4. Choose **Custom Environment**:
   - **PHP Version:** 7.4.x or 8.1.x
   - **Database:** MySQL 8.0.x (Important: We need `InnoDB` for transactions).
   - **Web Server:** Nginx or Apache.
5. Create a test WordPress admin account (e.g., `admin` / `password`).
6. Start the site and open the **Site Shell** (to verify PHP is available via CLI if you intend to run headless scripts).

---

## 2. Install the Plugin and Theme

1. Navigate to the `wp-content/plugins/` directory of your Local site.
2. Extract the contents of `wordpress-export/asia-d-market-core.zip` into a new folder named `asia-d-market-core`.
3. Navigate to the `wp-content/themes/` directory.
4. Extract the contents of `wordpress-export/asia-d-market-theme.zip` into a new folder named `asia-d-market-theme`.
5. Log in to your test WordPress Admin Dashboard (`http://asia-d-market-staging.local/wp-admin`).
6. Go to **Plugins** and activate the `The Valid Market Core` plugin. 
7. Go to **Appearance > Themes** and activate the `The Valid Market Theme`.

---

## 3. Database Integration Test Checklist

This checklist must be executed against the live test database to verify concurrency and schema integrity.

### Schema & Installation
- [ ] Verify `wp_adm_wallets`, `wp_adm_wallet_transactions`, `wp_adm_orders`, `wp_adm_licenses`, `wp_adm_commissions`, and `wp_adm_webhook_events` were successfully created.
- [ ] Deactivate and reactivate the plugin. Verify existing test rows are not dropped.

### Wallet Concurrency (Critical)
- [ ] Create a wallet with exactly `$100.00` in Cash.
- [ ] Simultaneously dispatch two `POST /wp-json/adm/v1/wallet/transfer` requests for `$100.00` to a recipient.
- [ ] *Expected Result:* Only one transfer succeeds. The second must fail with `Insufficient cash balance` due to the `FOR UPDATE` lock.

### Orders & Idempotency
- [ ] Submit `POST /wp-json/adm/v1/checkout/process` with a valid `Idempotency-Key` header.
- [ ] Resubmit the exact same request with the exact same `Idempotency-Key`.
- [ ] *Expected Result:* The second request returns the original order ID and status, without inserting duplicate items or double-deducting balances.

### Payment Webhooks & Double-Crediting
- [ ] Submit a simulated deposit webhook to `POST /wp-json/adm/v1/webhooks/crypto` with a valid test signature.
- [ ] Resubmit the exact same event.
- [ ] *Expected Result:* The unique constraint on `wp_adm_webhook_events(provider, event_id)` triggers a silent abort to prevent replay attacks.
- [ ] *Expected Result:* The `wp_adm_wallet_transactions` ledger reflects exactly one deposit credit.

---

## 4. Unfinished Features & Mocked Integrations

The following features were intentionally scaffolded as mocks because production credentials, external keys, or specific provider logic is outside the scope of the export phase:

1. **Storage Signed-URL Adapter:**
   - **Location:** `class-adm-storage.php -> generate_signed_url()`
   - **Current State:** Returns a hardcoded `https://mock-storage.local` URL.
   - **Missing:** Implementation of the AWS SDK for PHP `S3Client->createPresignedRequest()`.

2. **Crypto Signature Verification:**
   - **Location:** `class-adm-payments.php -> verify_signature()`
   - **Current State:** Reads `adm_crypto_webhook_secret` and uses standard `hash_hmac()`.
   - **Missing:** The actual live payload schema mapping for the specific crypto provider (e.g., NowPayments, Coinbase Commerce).

3. **Production Webhook Secrets:**
   - No `.env` secrets from Next.js were copied into this export. You must manually define your webhook secrets in the WordPress options table.

4. **Frontend Parity:**
   - The React/Next.js dashboard components and shopping cart UIs have not been fully ported into the WordPress PHP templates yet.

---

## 5. Running the Unit Tests

We have included a mock testing harness that runs without a database. To execute it:

1. Open your terminal in the Local Site Shell (which provides PHP access).
2. Run: `php wp-content/plugins/asia-d-market-core/tests/test-runner.php`
3. Verify that the logical boundaries (e.g., negative amounts, invalid products, missing idempotency keys) pass.
