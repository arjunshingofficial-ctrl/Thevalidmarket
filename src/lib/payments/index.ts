export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  status: "PENDING" | "PAID" | "FAILED";
  amount?: number;
  currency?: string;
  message?: string;
  metadata?: any;
}

export interface PaymentProvider {
  id: string;
  createPayment: (orderId: string, amount: number, currency: string, metadata?: any) => Promise<PaymentResult>;
  verifyPayment: (transactionId: string) => Promise<PaymentResult>;
  getPaymentStatus: (transactionId: string) => Promise<PaymentResult>;
  refundPayment: (transactionId: string) => Promise<PaymentResult>;
  verifyWebhook?: (req: Request) => Promise<boolean>;
}

// Development / Sandbox Environment Implementation
// In a true production rollout, these are replaced by the respective provider SDKs (Stripe, NowPayments, etc.)
// Currently, this simulates the Sandbox API responses for testing fulfillment flows.
export const getPaymentProvider = (providerId: string): PaymentProvider => {
  return {
    id: providerId,
    createPayment: async (orderId, amount, currency, metadata) => {
      // Sandbox creation simulation
      return {
        success: true,
        transactionId: `sandbox_tx_${Date.now()}`,
        status: "PENDING",
        amount,
        currency
      };
    },
    verifyPayment: async (transactionId) => {
      // Sandbox verification simulation
      return {
        success: true,
        transactionId,
        status: "PAID"
      };
    },
    getPaymentStatus: async (transactionId) => {
      return {
        success: true,
        transactionId,
        status: "PAID" // Default to paid in sandbox
      };
    },
    refundPayment: async (transactionId) => {
      return {
        success: true,
        transactionId,
        status: "FAILED"
      };
    }
  };
};
