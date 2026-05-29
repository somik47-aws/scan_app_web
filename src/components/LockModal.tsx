'use client';

import { useState } from 'react';

import { isValidPinFormat } from '@/lib/pinSecurity';

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (pin: string) => Promise<boolean>;
};

export function LockModal({ open, title, onClose, onSubmit }: Props) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!isValidPinFormat(pin)) {
      setError('Enter a 4–6 digit PIN');
      return;
    }
    setLoading(true);
    setError(null);
    const ok = await onSubmit(pin);
    setLoading(false);
    if (ok) {
      setPin('');
      onClose();
    } else {
      setError('Incorrect PIN');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm animate-fade-up rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl">
        <p className="section-label mb-1">Security</p>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          className="input-field mt-5 text-center text-2xl tracking-[0.4em]"
          placeholder="••••"
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={loading}
            className="btn-primary flex-1"
          >
            {loading ? '…' : 'Confirm'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
