import React, { useState } from 'react';
import { Check, Loader2, Trash2, X } from 'lucide-react';

export default function SlideDeleteConfirm({ onConfirm, label = 'Kaydı sil' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onConfirm();
      setIsOpen(false);
    } catch {
      // The parent shows the API error; keep this open so the user can retry.
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={`relative h-9 shrink-0 overflow-hidden rounded-xl border transition-[width,background-color,border-color,box-shadow] duration-300 ease-out ${
        isOpen
          ? 'w-[190px] border-danger-200 bg-danger-50 shadow-sm'
          : 'w-9 border-transparent bg-transparent hover:border-danger-100 hover:bg-danger-50'
      }`}
    >
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`absolute inset-y-0 left-0 flex w-9 items-center justify-center text-danger-400 transition-all duration-200 hover:text-danger-600 ${isOpen ? 'pointer-events-none -translate-x-2 opacity-0' : 'translate-x-0 opacity-100'}`}
        aria-label={label}
        aria-expanded={isOpen}
        title={label}
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <div
        className={`absolute inset-0 flex items-center gap-1.5 pl-3 pr-1.5 transition-all duration-300 ease-out ${
          isOpen ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-5 opacity-0'
        }`}
        aria-hidden={!isOpen}
      >
        <span className="min-w-0 flex-1 whitespace-nowrap text-xs font-semibold text-danger-700">
          Emin misin?
        </span>
        <button
          type="button"
          onClick={confirmDelete}
          disabled={isDeleting}
          className="flex h-7 items-center gap-1 rounded-lg bg-danger-500 px-2 text-[11px] font-semibold text-white transition-colors hover:bg-danger-600 disabled:cursor-wait disabled:opacity-70"
          aria-label="Silmeyi onayla"
        >
          {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Onayla
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          disabled={isDeleting}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-danger-400 transition-colors hover:bg-white hover:text-danger-600 disabled:opacity-50"
          aria-label="Silmeyi iptal et"
          title="İptal"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
