import React, { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { Modal } from "./Modal";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    setSubject("");
    setMessage("");
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 2500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Suporte Técnico Flow RH">
      {success ? (
        <div className="py-8 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
          <h4 className="font-bold text-slate-800 text-sm">Mensagem enviada com sucesso!</h4>
          <p className="text-xs text-slate-500">Nossa equipe de TI responderá em breve via e-mail.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
              Assunto / Categoria
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Dúvida sobre registro de ponto"
              className="w-full text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-xl px-3.5 py-2.5 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
              Descrição do Problema ou Dúvida
            </label>
            <textarea
              required
              rows={4}
              placeholder="Descreva com detalhes o que está acontecendo..."
              className="w-full text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-xl p-3.5 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium rounded-xl px-4 py-2.5 text-xs transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl px-6 py-2.5 text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" /> Enviar Chamado
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
