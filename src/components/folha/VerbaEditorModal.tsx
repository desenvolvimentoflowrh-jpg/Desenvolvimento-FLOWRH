import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit3, Save, AlertCircle, DollarSign, Info } from "lucide-react";
import { Payslip, PayrollVerbaItem } from "../../types/payroll";
import { formatCurrencyBRL } from "../../utils/payrollCalculations";

interface VerbaEditorModalProps {
  payslip: Payslip | null;
  onClose: () => void;
  onSave: (
    payslipId: string,
    verbaCode: string,
    newVal: number,
    newRef: string,
    reason: string
  ) => Promise<void>;
}

export const VerbaEditorModal: React.FC<VerbaEditorModalProps> = ({
  payslip,
  onClose,
  onSave
}) => {
  const [selectedCode, setSelectedCode] = useState<string>("");
  const [newVal, setNewVal] = useState<number>(0);
  const [newRef, setNewRef] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!payslip) return null;

  const allVerbas: PayrollVerbaItem[] = [...payslip.earnings, ...payslip.deductions];

  const handleSelectVerba = (code: string) => {
    setSelectedCode(code);
    const item = allVerbas.find((v) => v.code === code);
    if (item) {
      setNewVal(item.val);
      setNewRef(typeof item.ref === "number" ? String(item.ref) : item.ref);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCode) {
      setError("Selecione uma verba para editar.");
      return;
    }
    if (!reason.trim()) {
      setError("O motivo do ajuste é obrigatório para fins de auditoria.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(payslip.id, selectedCode, newVal, newRef, reason.trim());
      onClose();
    } catch (err: any) {
      setError(err?.message || "Erro ao salvar alteração.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden"
        >
          {/* Header */}
          <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black">Ajuste Manual de Verba</h3>
                <p className="text-xs text-slate-400">{payslip.employee_snapshot.name}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs text-slate-800">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="font-bold text-slate-700 block mb-1">Selecione a Rubrica / Verba</label>
              <select
                required
                value={selectedCode}
                onChange={(e) => handleSelectVerba(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-[#0043FF] cursor-pointer"
              >
                <option value="">Selecione uma verba...</option>
                <optgroup label="Proventos (Vencimentos)">
                  {payslip.earnings.map((e) => (
                    <option key={e.code} value={e.code}>
                      [+] {e.code} - {e.desc} ({formatCurrencyBRL(e.val)})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Descontos">
                  {payslip.deductions.map((d) => (
                    <option key={d.code} value={d.code}>
                      [-] {d.code} - {d.desc} ({formatCurrencyBRL(d.val)})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Novo Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={newVal}
                  onChange={(e) => setNewVal(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-black focus:outline-none focus:border-[#0043FF]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Referência (Ex: 10h, 20%, 3d)</label>
                <input
                  type="text"
                  value={newRef}
                  onChange={(e) => setNewRef(e.target.value)}
                  placeholder="Ex: 15h"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0043FF]"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                <span>Motivo / Justificativa do Ajuste</span>
                <span className="text-[10px] text-amber-600 font-bold">* Obrigatório para Auditoria</span>
              </label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Ajuste solicitado pela diretoria referente a 4 horas extras aprovadas em regime de plantão..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#0043FF]"
              />
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2 text-[11px] text-blue-800">
              <Info className="w-4 h-4 text-[#0043FF] shrink-0 mt-0.5" />
              <span>
                Esta alteração recalculará automaticamente o total bruto, líquido e registrará o evento no log de auditoria da folha com seu usuário responsável.
              </span>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="text-slate-600 hover:text-slate-800 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || !selectedCode || !reason.trim()}
                className="bg-[#0043FF] hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> Salvar Ajuste
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
