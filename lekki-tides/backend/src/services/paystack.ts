import crypto from "crypto";

const PAYSTACK_BASE = "https://api.paystack.co";

export class PaystackError extends Error {}

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new PaystackError("PAYSTACK_SECRET_KEY is not set.");
  return key;
}

interface InitializeParams {
  email: string;
  amountNaira: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}

interface InitializeResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

// Paystack expects the amount in kobo (smallest unit), so amountNaira * 100.
export async function initializeTransaction(params: InitializeParams): Promise<InitializeResult> {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: Math.round(params.amountNaira * 100),
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
  });

  const data = (await res.json()) as {
    status: boolean;
    message?: string;
    data?: { authorization_url: string; access_code: string; reference: string };
  };
  if (!res.ok || !data.status || !data.data) {
    throw new PaystackError(data.message ?? "Paystack could not initialize this transaction.");
  }

  return {
    authorizationUrl: data.data.authorization_url,
    accessCode: data.data.access_code,
    reference: data.data.reference,
  };
}

interface VerifyResult {
  status: "success" | "failed" | "abandoned" | string;
  reference: string;
  amountNaira: number;
  metadata: Record<string, unknown>;
}

// Always re-verify server-to-server before trusting a payment, even if the
// webhook already told you — belt and braces against spoofed callbacks.
export async function verifyTransaction(reference: string): Promise<VerifyResult> {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey()}` },
  });
  const data = (await res.json()) as {
    status: boolean;
    message?: string;
    data?: { status: string; reference: string; amount: number; metadata?: Record<string, unknown> };
  };
  if (!res.ok || !data.status || !data.data) {
    throw new PaystackError(data.message ?? "Could not verify this transaction with Paystack.");
  }
  return {
    status: data.data.status,
    reference: data.data.reference,
    amountNaira: data.data.amount / 100,
    metadata: data.data.metadata ?? {},
  };
}

// Paystack signs webhook bodies with HMAC-SHA512 of the *raw* request body,
// using your secret key. This must run against the raw bytes, before any
// JSON.parse — see routes/paymentRoutes.ts for how the raw body is captured.
export function verifyWebhookSignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
  if (!signatureHeader) return false;
  const expected = crypto.createHmac("sha512", secretKey()).update(rawBody).digest("hex");
  // timingSafeEqual requires equal-length buffers, so guard first
  if (expected.length !== signatureHeader.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
}
