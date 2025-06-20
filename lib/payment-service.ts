// Razorpay integration for payment links and status tracking
export interface PaymentLinkData {
  amount: number;
  currency: string;
  description: string;
  customer: {
    name: string;
    email: string;
  };
  notify: {
    sms: boolean;
    email: boolean;
  };
  reminder_enable: boolean;
  callback_url?: string;
  callback_method?: string;
}

export interface PaymentStatus {
  id: string;
  status: 'created' | 'partially_paid' | 'paid' | 'cancelled';
  amount: number;
  amount_paid: number;
  created_at: number;
  paid_at?: number;
}

export class PaymentService {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl = 'https://api.razorpay.com/v1';
  }

  async createPaymentLink(data: PaymentLinkData): Promise<string | null> {
    try {
      // In a real implementation, you would make an API call to Razorpay
      // For demo purposes, we'll return a mock payment link
      const mockPaymentLink = `https://rzp.io/l/${Math.random().toString(36).substr(2, 9)}`;
      return mockPaymentLink;
    } catch (error) {
      console.error('Failed to create payment link:', error);
      return null;
    }
  }

  async getPaymentStatus(paymentLinkId: string): Promise<PaymentStatus | null> {
    try {
      // In a real implementation, you would make an API call to Razorpay
      // For demo purposes, we'll return mock status
      return {
        id: paymentLinkId,
        status: 'created',
        amount: 50000, // Amount in paise
        amount_paid: 0,
        created_at: Date.now(),
      };
    } catch (error) {
      console.error('Failed to get payment status:', error);
      return null;
    }
  }

  async handleWebhook(payload: any, signature: string): Promise<boolean> {
    try {
      // In a real implementation, you would verify the webhook signature
      // and process the payment status update
      console.log('Webhook received:', payload);
      return true;
    } catch (error) {
      console.error('Webhook processing failed:', error);
      return false;
    }
  }

  static generatePaymentLink(invoiceData: any): PaymentLinkData {
    return {
      amount: Math.round(invoiceData.amount * 100), // Convert to paise
      currency: 'INR',
      description: `Payment for Invoice ${invoiceData.invoiceNumber}`,
      customer: {
        name: invoiceData.clientName,
        email: invoiceData.clientEmail,
      },
      notify: {
        sms: true,
        email: true,
      },
      reminder_enable: true,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/callback`,
      callback_method: 'get',
    };
  }
}