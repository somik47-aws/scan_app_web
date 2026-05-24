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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold">{title}</h2>
        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          className="mt-4 w-full rounded-lg border border-slate-200 px-4 py-3 text-center text-2xl tracking-widest"
          placeholder="••••"
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={loading}
            className="flex-1 rounded-lg bg-teal-600 py-2 text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? '…' : 'Confirm'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-slate-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
