import React from 'react';

export const Toast = ({ toast, onClose }) => {
  if (!toast) return null;

  const typeStyles = {
    success: 'bg-emerald-900 text-emerald-100 border-emerald-700',
    error: 'bg-red-900 text-red-100 border-red-700',
    info: 'bg-blue-900 text-blue-100 border-blue-700'
  };

  const icons = {
    success: 'check_circle',
    error: 'error',
    info: 'info'
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4">
      <div
        className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-xs font-semibold max-w-md ${
          typeStyles[toast.type] || typeStyles.info
        }`}
      >
        <span className="material-symbols-outlined text-lg">
          {icons[toast.type] || 'info'}
        </span>
        <span className="flex-1">{toast.message}</span>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>
    </div>
  );
};
