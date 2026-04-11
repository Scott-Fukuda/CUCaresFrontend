import React from 'react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Matches the Cancel / primary action layout used on OpportunitiesPage
 * (external signup & unsignup modals).
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
        <p className="text-gray-600 mb-6 whitespace-pre-line">{message}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 bg-cornell-red text-white font-bold py-2 px-4 rounded-lg hover:bg-red-800 transition-colors"
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
