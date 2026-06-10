/** Tipos do contrato com a API do Asaas (v3). Spec: docs/integrations/asaas.md */

export type AsaasBillingType = "PIX" | "BOLETO" | "CREDIT_CARD";

export interface AsaasCustomerInput {
  name: string;
  email: string;
  cpfCnpj: string;
  mobilePhone?: string;
}

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
}

export interface AsaasCreditCard {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export interface AsaasCreditCardHolderInfo {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  addressComplement?: string;
  phone: string;
}

export interface AsaasCreatePaymentInput {
  customer: string;
  billingType: AsaasBillingType;
  /** valor em reais (Asaas usa decimal, não centavos) */
  value: number;
  dueDate: string; // YYYY-MM-DD
  description?: string;
  externalReference?: string;
  creditCard?: AsaasCreditCard;
  creditCardHolderInfo?: AsaasCreditCardHolderInfo;
  /** IP do comprador — exigido pelo Asaas para transações de cartão */
  remoteIp?: string;
}

export interface AsaasPayment {
  id: string;
  status: string;
  billingType: AsaasBillingType;
  value: number;
  dueDate: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  externalReference?: string;
}

export interface AsaasPixQrCode {
  encodedImage: string; // base64
  payload: string; // copia-e-cola
  expirationDate: string;
}

/** Eventos de webhook que a plataforma processa. */
export type AsaasWebhookEventType =
  | "PAYMENT_CREATED"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_RECEIVED"
  | "PAYMENT_OVERDUE"
  | "PAYMENT_REFUNDED"
  | "PAYMENT_DELETED";

export interface AsaasWebhookEvent {
  id: string;
  event: AsaasWebhookEventType | (string & {});
  payment?: AsaasPayment;
}
