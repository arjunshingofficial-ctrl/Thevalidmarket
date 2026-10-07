# PAYMENTS.md - Payment Architecture

## Abstraction Layer
A generic Payment Provider interface ensures the core logic is not coupled to one specific gateway.

```typescript
interface PaymentProvider {
  createPaymentRequest(order: Order): Promise<PaymentSession>;
  verifyWebhook(req: Request): Promise<PaymentVerification>;
  getPaymentStatus(transactionId: string): Promise<PaymentStatus>;
  refundPayment?(transactionId: string): Promise<boolean>;
}
```

## Supported Methods

### 1. UPI (India)
- Configurable Gateway (e.g., PhonePe, Razorpay, Custom UPI gateway).
- Flow: Order -> Generate intent/QR -> User pays -> Webhook triggers backend -> Order Fulfilled.

### 2. BTC
- Integration via BTCPay Server or similar provider.
- Requires configurable number of confirmations before marking as PAID.

### 3. USDT
- TRC20 / ERC20 support.
- Requires network selection, address generation, and transaction hash monitoring/verification.

## Payment State Engine
Transitions must be strictly enforced:
`PENDING` -> `PROCESSING` -> `PAID` | `FAILED` | `EXPIRED` -> `REFUNDED`
