'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Smartphone, CheckCircle, XCircle, Loader2, ArrowLeft, Phone, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface MpesaPaymentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  planName: string;
  tier: string;
  userId?: string;
  onSuccess?: (receipt: string) => void;
}

type PaymentStep = 'form' | 'waiting' | 'success' | 'failed';

export function MpesaPayment({ open, onOpenChange, amount, planName, tier, userId, onSuccess }: MpesaPaymentProps) {
  const [step, setStep] = useState<PaymentStep>('form');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkoutID, setCheckoutID] = useState<string | null>(null);
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStep('form');
    setPhone('');
    setLoading(false);
    setCheckoutID(null);
    setReceiptNumber(null);
    setErrorMessage(null);
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  useEffect(() => {
    if (step !== 'waiting' || !checkoutID) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/mpesa/status?checkoutRequestID=${checkoutID}`);
        const data = await res.json();
        if (data.success && data.transaction) {
          if (data.transaction.status === 'success') {
            setStep('success');
            setReceiptNumber(data.transaction.receipt_number);
            clearInterval(interval);
            onSuccess?.(data.transaction.receipt_number);
          } else if (data.transaction.status === 'failed') {
            setStep('failed');
            setErrorMessage(data.transaction.result_desc || 'Payment failed');
            clearInterval(interval);
          }
        }
      } catch {
        // continue polling
      }
    }, 3000);
    setTimeout(() => {
      clearInterval(interval);
      if (step === 'waiting') {
        setStep('failed');
        setErrorMessage('Payment timed out. Please try again.');
      }
    }, 120000);
    return () => clearInterval(interval);
  }, [step, checkoutID, onSuccess]);

  const handleSubmit = async () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleaned,
          amount,
          accountReference: `AGRIPRIDE_${tier.toUpperCase()}`,
          transactionDesc: `${planName} Subscription`,
          userId,
          planId: tier,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment initiation failed');

      setCheckoutID(data.checkoutRequestID);
      setStep('waiting');
      toast.success('M-Pesa prompt sent! Check your phone.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Payment failed');
      setStep('failed');
      setErrorMessage(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.startsWith('254')) {
      if (digits.length <= 12) return digits;
      return digits.slice(0, 12);
    }
    if (digits.length <= 9) return digits;
    return digits.slice(0, 9);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <DialogHeader>
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                  <Smartphone className="h-6 w-6 text-emerald-600" />
                </div>
                <DialogTitle className="text-center">M-Pesa Payment</DialogTitle>
                <DialogDescription className="text-center">
                  Pay for <strong>{planName}</strong> — KES {amount.toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 space-y-4">
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Plan</span>
                    <span className="font-medium">{planName}</span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-gray-500">Amount</span>
                    <span className="font-semibold text-emerald-600">KES {amount.toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    M-Pesa Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      placeholder="2547XXXXXXXX"
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Enter the M-Pesa registered phone number
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
                  <Shield className="h-4 w-4 shrink-0" />
                  <span>You will receive an M-Pesa STK push prompt on your phone. Enter your PIN to complete payment.</span>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => onOpenChange(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" /> Pay KES {amount.toLocaleString()}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'waiting' && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-8 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100"
              >
                <Smartphone className="h-8 w-8 text-emerald-600" />
              </motion.div>
              <h3 className="text-lg font-semibold">Waiting for Payment</h3>
              <p className="mt-2 text-sm text-gray-500">
                Check your phone for the M-Pesa prompt and enter your PIN.
              </p>
              <p className="mt-4 text-xs text-gray-400">
                Amount: <strong>KES {amount.toLocaleString()}</strong>
              </p>
              <Loader2 className="mx-auto mt-4 h-6 w-6 animate-spin text-emerald-600" />
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100"
              >
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </motion.div>
              <h3 className="text-lg font-semibold text-emerald-700">Payment Successful!</h3>
              <p className="mt-2 text-sm text-gray-500">
                Your {planName} subscription is now active.
              </p>
              {receiptNumber && (
                <p className="mt-3 text-xs text-gray-400">
                  Receipt: <strong className="text-gray-700">{receiptNumber}</strong>
                </p>
              )}
              <Button
                className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={() => onOpenChange(false)}
              >
                Continue
              </Button>
            </motion.div>
          )}

          {step === 'failed' && (
            <motion.div
              key="failed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-8 text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-red-600">Payment Failed</h3>
              <p className="mt-2 text-sm text-gray-500">
                {errorMessage || 'Something went wrong. Please try again.'}
              </p>
              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={reset}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Try Again
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
