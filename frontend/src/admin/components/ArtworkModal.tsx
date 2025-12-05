import React, { useEffect } from 'react';
import type { Design } from '../../types';

interface ArtworkModalProps {
  isOpen: boolean;
  design: Design | null;
  onClose: () => void;
}

const ArtworkModal: React.FC<ArtworkModalProps> = ({
  isOpen,
  design,
  onClose,
}) => {
  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen || !design) return null;

  const { artworkUrl, productId, variantId, color, size, quantity, createdAt } =
    design;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 w-full h-full cursor-default"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Artwork preview
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 break-all">
              {productId}
            </p>
            <p className="text-[11px] text-slate-500">
              {color || '—'} · {size || '—'} · Qty: {quantity}
            </p>
            {createdAt && (
              <p className="text-[11px] text-slate-400 mt-1">
                Created:{' '}
                {new Date(createdAt).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none px-2"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Image */}
        <div className="flex-1 overflow-auto bg-slate-50 flex items-center justify-center p-4">
          {artworkUrl ? (
            <img
              src={artworkUrl}
              alt="Artwork preview"
              className="max-h-[70vh] max-w-full object-contain rounded-md border border-slate-200 bg-white"
            />
          ) : (
            <p className="text-sm text-slate-500">No artwork file available.</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-white">
          <div className="text-[11px] text-slate-500 truncate">
            Artwork file:{' '}
            <span className="font-mono">
              {design.artworkFile || '—'}
            </span>
          </div>
          <div className="flex gap-2">
            {artworkUrl && (
              <a
                href={artworkUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="px-3 py-1.5 text-[11px] border border-slate-200 rounded-md hover:bg-slate-50"
              >
                Download
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-[11px] border border-slate-200 rounded-md hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtworkModal;
