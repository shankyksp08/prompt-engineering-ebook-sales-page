/**
 * Digital Govind — Prompt Engineering Handbook
 * Server-Side Order & Fulfillment Store
 * 
 * Capabilities:
 * - Server-authoritative record of verified customer purchases.
 * - Enforces strict idempotency: repeated verification requests for the same
 *   paymentId return the existing valid license without creating duplicate records.
 * - Prevents multiple fulfills, prevents license regeneration attacks, and tracks order status.
 */

export interface CustomerLicensePayload {
  orderId: string;
  paymentId: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  amount: string;
  currency: string;
  verifiedAt: number;
  token: string;
  status: 'active' | 'revoked';
  maxDevices: number;
  downloadUrl: string;
  readerStreamUrl: string;
}

export interface OrderRecord {
  orderId: string;
  paymentId: string;
  paymentLinkId?: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  amountPaise: number;
  amountFormatted: string;
  currency: string;
  verifiedAt: number;
  licenseToken: string;
  license: CustomerLicensePayload;
  status: 'fulfilled' | 'refunded' | 'revoked';
  createdAt: string;
  updatedAt: string;
}

class OrderFulfillmentStore {
  // Keyed by paymentId (primary unique transaction key from Razorpay)
  private ordersByPaymentId: Map<string, OrderRecord> = new Map();
  // Indexed by orderId
  private paymentIdByOrderId: Map<string, string> = new Map();

  public hasPayment(paymentId: string): boolean {
    if (!paymentId) return false;
    return this.ordersByPaymentId.has(paymentId.trim());
  }

  public hasOrder(orderId: string): boolean {
    if (!orderId) return false;
    return this.paymentIdByOrderId.has(orderId.trim());
  }

  public getByPaymentId(paymentId: string): OrderRecord | undefined {
    if (!paymentId) return undefined;
    return this.ordersByPaymentId.get(paymentId.trim());
  }

  public getByOrderId(orderId: string): OrderRecord | undefined {
    if (!orderId) return undefined;
    const paymentId = this.paymentIdByOrderId.get(orderId.trim());
    if (paymentId) {
      return this.ordersByPaymentId.get(paymentId);
    }
    // Fallback search across records
    for (const record of this.ordersByPaymentId.values()) {
      if (record.orderId === orderId.trim()) {
        return record;
      }
    }
    return undefined;
  }

  public set(order: OrderRecord): void {
    const pId = order.paymentId.trim();
    const oId = order.orderId.trim();
    this.ordersByPaymentId.set(pId, order);
    this.paymentIdByOrderId.set(oId, pId);
  }

  public updateStatus(paymentId: string, status: 'fulfilled' | 'refunded' | 'revoked'): boolean {
    const order = this.getByPaymentId(paymentId);
    if (!order) return false;
    order.status = status;
    order.updatedAt = new Date().toISOString();
    if (status === 'revoked' || status === 'refunded') {
      order.license.status = 'revoked';
    }
    return true;
  }

  public listAll(): OrderRecord[] {
    return Array.from(this.ordersByPaymentId.values()).reverse();
  }

  public clear(): void {
    this.ordersByPaymentId.clear();
    this.paymentIdByOrderId.clear();
  }
}

export const orderFulfillmentStore = new OrderFulfillmentStore();
