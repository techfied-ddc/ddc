import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GlassCard, Reveal } from '@ddc/ui';
import { useOrderDetail, useOrderInvoice, useInitiatePayment, useVerifyPayment } from '../../lib/api.hooks.js';
import { formatRupees } from '../../lib/format.js';
import { api } from '../../lib/api.js';

// Razorpay Checkout JS loaded on demand
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open(): void; on(event: string, cb: () => void): void };
  }
}

interface RazorpayOptions {
  key:         string;
  amount:      number;
  currency:    string;
  order_id:    string;
  name:        string;
  description: string;
  prefill?:    { name?: string; contact?: string };
  theme?:      { color?: string };
  handler:     (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) { resolve(); return; }
    const script    = document.createElement('script');
    script.src      = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload   = () => resolve();
    script.onerror  = () => reject(new Error('Failed to load Razorpay script.'));
    document.head.appendChild(script);
  });
}

export default function InvoicePayPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: orderData }   = useOrderDetail(id!);
  const { data: invoiceData } = useOrderInvoice(id!);
  const initiatePayment = useInitiatePayment();
  const verifyPayment   = useVerifyPayment();

  const [loading,       setLoading]       = useState(false);
  const [success,       setSuccess]       = useState(false);
  const [error,         setError]         = useState('');
  const [pdfLoading,    setPdfLoading]    = useState(false);
  // UPI link flow — set to 'awaiting_confirmation' after redirecting to the UPI app
  const [paymentState,  setPaymentState]  = useState<'idle' | 'awaiting_confirmation'>('idle');
  const [paidMsg,       setPaidMsg]       = useState('');

  const order   = orderData;
  const invoice = invoiceData;

  async function handlePay() {
    if (!invoice || !order) return;
    setLoading(true);
    setError('');

    try {
      const payData = await initiatePayment.mutateAsync({ orderId: id! });
      const { gatewayOrderId, amountPaise, keyId, invoiceRef, orderRef } = payData as {
        gatewayOrderId: string;
        amountPaise: number;
        currency: string;
        keyId: string;
        invoiceRef: string;
        orderRef: string;
      };

      if (keyId.startsWith('upi://')) {
        // UPI deep-link flow — open GPay / PhonePe / Paytm on the device
        setPaymentState('awaiting_confirmation');
        window.location.href = keyId;
        // Note: execution continues here on desktop / browsers that ignore the deep link
        return;
      }

      if (keyId.startsWith('rzp_')) {
        // Razorpay Checkout flow
        await loadRazorpayScript();

        const rzp = new window.Razorpay({
          key:         keyId,
          amount:      amountPaise,
          currency:    'INR',
          order_id:    gatewayOrderId,
          name:        'Desire Premium Dry Cleaning',
          description: `Invoice ${invoiceRef} · Order ${orderRef}`,
          theme:       { color: '#D4AF37' },
          prefill:     { name: '', contact: '' },
          handler: async (response) => {
            try {
              await verifyPayment.mutateAsync(response);
              setSuccess(true);
            } catch (e) {
              setError((e as Error).message ?? 'Payment verification failed. Please contact support.');
            }
          },
        });

        rzp.on('payment.failed', () => {
          setError('Payment failed. Please try again.');
          setLoading(false);
        });

        rzp.open();
        return;
      }

      // Unknown gateway key — surface an error rather than silently failing
      setError('Payment gateway is not configured correctly. Please contact support.');
    } catch (e) {
      setError((e as Error).message ?? 'Could not initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!order || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-void)]">
        {!invoice && orderData ? (
          <div className="text-center px-6">
            <p className="text-[var(--text-muted)] text-sm">
              No invoice issued yet. The store will send you an invoice after inspecting your garments.
            </p>
            <button onClick={() => navigate(`/orders/${id}`)} className="mt-4 text-[var(--gold)] text-sm">
              ← Back to Order
            </button>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full border-2 border-[var(--gold)] border-t-transparent animate-spin" />
        )}
      </div>
    );
  }

  if (success || invoice.status === 'PAID') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-void)] px-4">
        <Reveal>
          <GlassCard className="p-8 text-center space-y-4 max-w-sm w-full">
            <p className="text-5xl">✅</p>
            <h1 className="font-display text-2xl text-[var(--text-primary)]">Payment Complete</h1>
            <p className="text-sm text-[var(--text-muted)]">
              {invoice.invoiceRef} · {formatRupees(invoice.totalPaise)}
            </p>
            <button
              onClick={() => navigate(`/orders/${id}`)}
              className="w-full py-3 rounded-xl bg-[var(--gold)] text-[#0B0B0C] font-semibold"
            >
              Back to Order
            </button>
          </GlassCard>
        </Reveal>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-void)] px-4 py-6 max-w-sm mx-auto space-y-5">
      <Reveal>
        <button onClick={() => navigate(`/orders/${id}`)} className="text-sm text-[var(--gold)]">
          ← Back to Order
        </button>
      </Reveal>

      <Reveal delay={0.05}>
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-xl text-[var(--text-primary)]">Invoice</h1>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-[var(--gold)]">{invoice.invoiceRef}</span>
              <button
                onClick={async () => {
                  setPdfLoading(true);
                  try {
                    const url  = await api.blobUrl(`/api/v1/invoices/${invoice._id}/pdf`);
                    const link = document.createElement('a');
                    link.href     = url;
                    link.download = `${invoice.invoiceRef}.pdf`;
                    link.click();
                    setTimeout(() => URL.revokeObjectURL(url), 10_000);
                  } catch { /* silent */ } finally {
                    setPdfLoading(false);
                  }
                }}
                disabled={pdfLoading}
                className="text-xs text-[var(--text-muted)] border border-[var(--glass-border)] px-2 py-1 rounded-lg hover:border-[var(--gold)]/50 disabled:opacity-50"
              >
                {pdfLoading ? '…' : '⬇ PDF'}
              </button>
            </div>
          </div>

          <ul className="space-y-2">
            {invoice.lines.map((line, i) => (
              <li key={i} className="flex justify-between text-sm">
                <span className="text-[var(--text-primary)]">{line.serviceName} × {line.quantity}</span>
                <span className="text-[var(--text-muted)]">{formatRupees(line.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <div className="border-t border-[var(--border)] pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-[var(--text-muted)]">
              <span>Subtotal</span><span>{formatRupees(invoice.subtotalPaise)}</span>
            </div>
            {invoice.discountPaise > 0 && (
              <div className="flex justify-between text-[var(--success)]">
                <span>Discount</span><span>−{formatRupees(invoice.discountPaise)}</span>
              </div>
            )}
            <div className="flex justify-between text-[var(--text-muted)]">
              <span>GST ({invoice.taxPercent}%)</span><span>+{formatRupees(invoice.taxPaise)}</span>
            </div>
            <div className="flex justify-between font-semibold text-[var(--text-primary)] border-t border-[var(--border)] pt-2 mt-2">
              <span>Total Due</span>
              <span className="text-[var(--gold)] text-lg">{formatRupees(invoice.totalPaise)}</span>
            </div>
          </div>

          {invoice.notes && (
            <p className="text-xs text-[var(--text-muted)] bg-[var(--bg-raised)] rounded-xl p-3">
              {invoice.notes}
            </p>
          )}
        </GlassCard>
      </Reveal>

      {order.paymentMode === 'ONLINE' && invoice.status === 'ISSUED' && (
        <Reveal delay={0.1}>
          {paymentState === 'awaiting_confirmation' ? (
            /* UPI awaiting-confirmation state */
            <GlassCard className="p-5 space-y-4 border border-[var(--gold)]/30">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">💳</span>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    Payment initiated
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Please complete the payment in your UPI app.
                  </p>
                </div>
              </div>

              <p className="text-xs text-[var(--text-subtle)] bg-[var(--bg-raised)] rounded-xl p-3">
                Your order will be confirmed once our store verifies your payment.
              </p>

              {paidMsg ? (
                <p className="text-sm text-[var(--text-muted)] text-center">{paidMsg}</p>
              ) : (
                <button
                  onClick={() => setPaidMsg("Please wait — the store will confirm your payment shortly.")}
                  className="w-full py-3 rounded-xl border border-[var(--gold)] text-[var(--gold)] font-semibold text-sm"
                >
                  I&apos;ve paid
                </button>
              )}
            </GlassCard>
          ) : (
            /* Normal pay button */
            <GlassCard className="p-5 space-y-4">
              <p className="text-sm text-[var(--text-muted)]">
                Pay securely online. Your payment is protected.
              </p>

              {error && (
                <p className="text-sm text-[var(--danger)] text-center">{error}</p>
              )}

              <button
                onClick={handlePay}
                disabled={loading || initiatePayment.isPending}
                className="w-full py-3 rounded-xl bg-[var(--gold)] text-[#0B0B0C] font-semibold text-base disabled:opacity-50"
              >
                {loading ? 'Opening payment…' : `Pay ${formatRupees(invoice.totalPaise)}`}
              </button>

              <p className="text-xs text-[var(--text-subtle)] text-center">
                256-bit SSL encrypted
              </p>
            </GlassCard>
          )}
        </Reveal>
      )}

      {order.paymentMode === 'COD' && (
        <Reveal delay={0.1}>
          <GlassCard className="p-5">
            <p className="text-sm text-[var(--text-muted)] text-center">
              Cash on Delivery. Pay {formatRupees(invoice.totalPaise)} when your order is delivered.
            </p>
          </GlassCard>
        </Reveal>
      )}
    </div>
  );
}
