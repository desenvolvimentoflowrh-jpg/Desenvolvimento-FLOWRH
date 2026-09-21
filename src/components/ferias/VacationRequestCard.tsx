import React, { useState } from "react";
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  User,
  DollarSign,
  FileText,
  FileCode,
  Check,
  X
} from "lucide-react";
import { VacationRequest, UserProfile } from "../../types";
import { formatarDataBR } from "../../utils/vacationCalculations";
import { canAccessGestao } from "../../utils/rbac";

interface VacationRequestCardProps {
  request: VacationRequest;
  currentUser: UserProfile;
  onApprove?: (id: string) => void;
  onReject?: (id: string, motivo: string) => void;
  onCancel?: (id: string) => void;
  onViewESocial?: (request: VacationRequest) => void;
}

export const VacationRequestCard: React.FC<VacationRequestCardProps> = ({
  request,
  currentUser,
  onApprove,
  onReject,
  onCancel,
  onViewESocial
}) => {
  const [isRejecting, setIsRejecting] = useState(false);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const isManager = canAccessGestao(currentUser);
  const isOwner = currentUser.id === request.user_id;

  const statusConfig = {
    pendente: {
      label: "Pendente de Aprovação",
      badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
      icon: Clock
    },
    aprovada: {
      label: "Aprovada",
      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
      icon: CheckCircle
    },
    rejeitada: {
      label: "Recusada",
      badgeClass: "bg-red-50 text-red-800 border-red-200",
      icon: XCircle
    },
    cancelada: {
      label: "Cancelada",
      badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
      icon: Ban
    },
    gozada: {
      label: "Concluída / Gozada",
      badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
      icon: CheckCircle
    }
  };

  const currentStatus = statusConfig[request.status] || statusConfig.pendente;
  const StatusIcon = currentStatus.icon;

  const handleConfirmReject = () => {
    if (!motivoRejeicao || motivoRejeicao.trim().length < 5) return;
    if (onReject) {
      onReject(request.id, motivoRejeicao.trim());
      setIsRejecting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 transition p-5 space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          {request.user_avatar ? (
            <img
              src={request.user_avatar}
              alt={request.user_name || "Colaborador"}
              className="w-9 h-9 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
          )}
          <div>
            <div className="font-bold text-slate-900 text-sm">{request.user_name || "Colaborador"}</div>
            <div className="text-[11px] text-slate-500">
              {request.user_department} • Solicitado em {formatarDataBR(request.created_at)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${currentStatus.badgeClass}`}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            {currentStatus.label}
          </span>
        </div>
      </div>

      {/* Período & Detalhes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <div className="text-slate-500 text-[11px] font-semibold flex items-center gap-1 mb-1">
            <Calendar className="w-3.5 h-3.5 text-[#0043FF]" /> Período Solicitado
          </div>
          <div className="font-bold text-slate-900">
            {formatarDataBR(request.data_inicio)} até {formatarDataBR(request.data_fim)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            {request.dias_solicitados} dias corridos
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <div className="text-slate-500 text-[11px] font-semibold flex items-center gap-1 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Abono Pecuniário (1/3)
          </div>
          <div className="font-bold text-slate-900">
            {request.abono_pecuniario ? `Sim (${request.dias_abono} dias)` : "Não"}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            {request.abono_pecuniario ? "Venda de dias solicitada" : "Gozará período integral"}
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <div className="text-slate-500 text-[11px] font-semibold flex items-center gap-1 mb-1">
            <FileText className="w-3.5 h-3.5 text-indigo-600" /> Adiantamento 13º
          </div>
          <div className="font-bold text-slate-900">
            {request.adiantamento_decimo_terceiro ? "Sim (1ª Parcela)" : "Não"}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            {request.adiantamento_decimo_terceiro ? "Pago nas férias" : "Pago no calendário normal"}
          </div>
        </div>
      </div>

      {/* Observação / Justificativa */}
      {request.observacao && (
        <div className="text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-slate-700">
          <span className="font-bold text-slate-800">Observação:</span> {request.observacao}
        </div>
      )}

      {/* Motivo da Rejeição se houver */}
      {request.motivo_rejeicao && (
        <div className="text-xs bg-red-50 p-3 rounded-xl border border-red-100 text-red-900">
          <span className="font-bold">Motivo da Recusa:</span> {request.motivo_rejeicao}
        </div>
      )}

      {/* Formulário Inline de Rejeição */}
      {isRejecting && (
        <div className="p-3 bg-red-50/60 border border-red-200 rounded-xl space-y-2 text-xs">
          <label className="font-bold text-red-900 block">
            Informe a justificativa da recusa (obrigatório):
          </label>
          <textarea
            rows={2}
            value={motivoRejeicao}
            onChange={(e) => setMotivoRejeicao(e.target.value)}
            placeholder="Ex: Conflito de escala no período com outro analista sênior."
            className="w-full p-2 bg-white border border-red-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsRejecting(false)}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={motivoRejeicao.trim().length < 5}
              onClick={handleConfirmReject}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition disabled:opacity-50 cursor-pointer"
            >
              Confirmar Recusa
            </button>
          </div>
        </div>
      )}

      {/* Actions Bottom Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        {/* eSocial Event Badge */}
        <div>
          {request.esocial_evento_id ? (
            <button
              type="button"
              onClick={() => onViewESocial && onViewESocial(request)}
              className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5" /> eSocial S-2230 ({request.esocial_evento_id})
            </button>
          ) : (
            <span className="text-[11px] text-slate-400 font-medium">
              ID: {request.id}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Owner can cancel if still pending */}
          {isOwner && request.status === "pendente" && onCancel && (
            <button
              type="button"
              onClick={() => onCancel(request.id)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Cancelar Solicitação
            </button>
          )}

          {/* Manager Actions */}
          {isManager && request.status === "pendente" && !isRejecting && (
            <>
              {onReject && (
                <button
                  type="button"
                  onClick={() => setIsRejecting(true)}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs rounded-xl flex items-center gap-1 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Recusar
                </button>
              )}
              {onApprove && (
                <button
                  type="button"
                  onClick={() => onApprove(request.id)}
                  className="px-3 py-1.5 bg-[#0043FF] hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm transition cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Aprovar Férias
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
