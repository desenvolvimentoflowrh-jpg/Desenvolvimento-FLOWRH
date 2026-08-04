import React, { useState, useEffect } from "react";
import { Clock, Calendar, AlertCircle, CheckCircle2, User, FileText, Plus, Edit2 } from "lucide-react";
import { Modal } from "./Modal";
import { UserProfile, TimeRecord, UserRole, PontoAuditLog } from "../types";
import { dataService } from "../services/dataService";

interface ManualPontoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  activeCompanyId: string;
  editingRecord?: TimeRecord | null;
  onAddOrUpdateRecord: (record: TimeRecord, auditLog: PontoAuditLog) => void;
}

export const ManualPontoModal: React.FC<ManualPontoModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  activeCompanyId,
  editingRecord = null,
  onAddOrUpdateRecord
}) => {
  const allUsers = dataService.getUsers().filter((u) => u.company_id === activeCompanyId);

  const getTodayDate = () => new Date().toISOString().split("T")[0];
  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  };

  const [targetUserId, setTargetUserId] = useState(currentUser.id);
  const [recordType, setRecordType] = useState<"entrada" | "almoco_ida" | "almoco_volta" | "saida">("entrada");
  const [dateStr, setDateStr] = useState(getTodayDate());
  const [timeStr, setTimeStr] = useState(getCurrentTime());
  const [justification, setJustification] = useState("");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);

      if (editingRecord) {
        setTargetUserId(editingRecord.user_id);
        setRecordType(editingRecord.type);
        const d = new Date(editingRecord.timestamp);
        setDateStr(d.toISOString().split("T")[0]);
        setTimeStr(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
        setJustification("");
      } else {
        setTargetUserId(currentUser.id);
        setRecordType("entrada");
        setDateStr(getTodayDate());
        setTimeStr(getCurrentTime());
        setJustification("");
      }
    }
  }, [isOpen, editingRecord, currentUser.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!justification.trim()) {
      setErrorMessage("A justificativa é obrigatória.");
      return;
    }

    if (justification.trim().length < 10) {
      setErrorMessage("A justificativa deve ter no mínimo 10 caracteres explicativos.");
      return;
    }

    const targetUser = allUsers.find((u) => u.id === targetUserId) || currentUser;
    const isoTimestamp = new Date(`${dateStr}T${timeStr}:00`).toISOString();

    const isEdit = !!editingRecord;
    const recordId = editingRecord ? editingRecord.id : `rec-man-${Date.now()}`;

    const originalTime = editingRecord
      ? new Date(editingRecord.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      : "--";
    const newTimeDisplay = `${timeStr} (${recordType.toUpperCase()})`;

    const updatedRecord: TimeRecord = {
      id: recordId,
      user_id: targetUser.id,
      user_name: targetUser.name,
      company_id: activeCompanyId,
      timestamp: isoTimestamp,
      type: recordType,
      location: "Alteração Manual via Painel Administrativo",
      status: "approved"
    };

    const auditLog: PontoAuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      modified_by_id: currentUser.id,
      modified_by_name: currentUser.name,
      modified_by_avatar: currentUser.avatar,
      modified_by_role: currentUser.role,
      record_id: recordId,
      target_user_id: targetUser.id,
      target_user_name: targetUser.name,
      action_type: isEdit ? "manual_edit" : "manual_creation",
      record_type: recordType,
      original_value: originalTime,
      new_value: newTimeDisplay,
      justification: justification.trim(),
      timestamp: new Date().toISOString()
    };

    onAddOrUpdateRecord(updatedRecord, auditLog);
    setSuccessMessage(isEdit ? "Registro editado e log registrado com sucesso!" : "Inclusão manual registrada e auditada com sucesso!");

    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const isManagementRole =
    currentUser.role === UserRole.SUPER_ADMIN ||
    currentUser.role === UserRole.HR_MANAGER ||
    currentUser.role === UserRole.SUPERVISOR;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingRecord ? "Editar Registro de Ponto Manualmente" : "Inclusão Manual de Registro de Ponto"}
    >
      {successMessage ? (
        <div className="py-8 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">{successMessage}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            A alteração foi devidamente registrada e armazenada na tabela de auditoria da empresa.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Seleção do Colaborador (se for Gestor/Admin/Supervisor) */}
          {isManagementRole ? (
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-purple-500" /> Colaborador Afetado *
              </label>
              <select
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                disabled={!!editingRecord}
                className="w-full text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-xl px-3.5 py-2.5 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 outline-none transition-all cursor-pointer"
              >
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.department})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-bold">Colaborador:</span> {currentUser.name}
            </div>
          )}

          {/* Tipo de Ponto */}
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
              Tipo de Marcação *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "entrada", label: "🟢 Entrada" },
                { id: "almoco_ida", label: "🍔 Ida Almoço" },
                { id: "almoco_volta", label: "☕ Volta Almoço" },
                { id: "saida", label: "🔴 Saída" }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRecordType(item.id as any)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                    recordType === item.id
                      ? "border-[#8B5CF6] bg-purple-50 dark:bg-purple-950/60 text-[#8B5CF6] dark:text-purple-300 ring-2 ring-purple-500/20"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-purple-500" /> Data do Ponto *
              </label>
              <input
                type="date"
                required
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl px-3.5 py-2.5 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-purple-500" /> Horário *
              </label>
              <input
                type="time"
                required
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                className="w-full text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl px-3.5 py-2.5 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Justificativa da Alteração */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Justificativa da Alteração (Obrigatória para Auditoria) *
              </label>
              <span
                className={`text-[10px] font-bold ${
                  justification.trim().length >= 10
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {justification.trim().length}/10 mín.
              </span>
            </div>
            <textarea
              required
              rows={3}
              placeholder="Descreva o motivo legal/operacional da inclusão ou alteração manual de ponto (mínimo 10 caracteres)..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="w-full text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl p-3.5 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 outline-none transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#8B5CF6] hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              {editingRecord ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{editingRecord ? "Salvar Alteração" : "Confirmar Inclusão Manual"}</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
