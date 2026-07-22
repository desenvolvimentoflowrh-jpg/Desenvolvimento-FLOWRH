import React from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  hideHeader?: boolean;
  containerClassName?: string;
  contentPadding?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
  hideHeader = false,
  containerClassName,
  contentPadding
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className={
          containerClassName ||
          `bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full ${maxWidth} overflow-hidden flex flex-col max-h-[90vh]`
        }
      >
        {!hideHeader && title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{title}</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className={contentPadding !== undefined ? contentPadding : "p-6 overflow-y-auto bg-white dark:bg-slate-900"}>
          {children}
        </div>
      </div>
    </div>
  );
};
