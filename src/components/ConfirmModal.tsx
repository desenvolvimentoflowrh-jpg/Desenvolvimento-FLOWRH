import React from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Excluir"
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 p-4 rounded-2xl">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <p className="text-xs text-rose-800 dark:text-rose-300 font-medium leading-relaxed">{message}</p>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium rounded-xl px-4 py-2.5 text-xs transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl px-6 py-2.5 text-xs shadow-md shadow-rose-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
