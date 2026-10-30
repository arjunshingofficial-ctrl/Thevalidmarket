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

// Strict production payment provider interface
// Simulation mocks are permanently disabled to prevent payment bypass.
export const getPaymentProvider = (providerId: string): PaymentProvider => {
  return {
    id: providerId,
    createPayment: async (orderId, amount, currency, metadata) => {
      return {
        success: false,
        status: "FAILED",
        message: "Automated simulation provider is disabled in production.",
      };
    },
    verifyPayment: async (transactionId) => {
      return {
        success: false,
        transactionId,
        status: "FAILED",
        message: "Sandbox verification is disabled in production.",
      };
    },
    getPaymentStatus: async (transactionId) => {
      return {
        success: false,
        transactionId,
        status: "FAILED",
      };
    },
    refundPayment: async (transactionId) => {
      return {
        success: false,
        transactionId,
        status: "FAILED",
      };
    }
  };
};
