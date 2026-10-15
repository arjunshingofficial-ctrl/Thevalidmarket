# API.md - The Valid Market API Architecture

We will primarily use **Next.js Server Actions** for form submissions and internal data mutations, and **Next.js Route Handlers (/api/*)** for webhooks, external integrations, and specific RESTful needs.

## REST Endpoints (Route Handlers)

### Webhooks
- `POST /api/webhooks/upi` - Handle UPI payment updates
- `POST /api/webhooks/btc` - Handle BTC payment confirmations
- `POST /api/webhooks/usdt` - Handle USDT payment confirmations

### Public API (Read-only)
- `GET /api/products` - Fetch products (filters, pagination)
- `GET /api/products/[slug]` - Fetch single product
- `GET /api/categories` - Fetch categories hierarchy

### Secure Downloads
- `GET /api/downloads/generate-link` - Validates user entitlement and generates a signed AWS S3/Supabase Storage URL.

## Server Actions (Internal RPC)

### Auth
- `loginUser(data)`
- `registerUser(data)`
- `resetPassword(data)`

### Commerce
- `addToCart(productId, quantity)`
- `applyCoupon(code)`
- `createCheckoutSession(cart, paymentMethod)`

### Admin
- `createProduct(data)`
- `updateProductStatus(id, status)`
- `processRefund(orderId)`
