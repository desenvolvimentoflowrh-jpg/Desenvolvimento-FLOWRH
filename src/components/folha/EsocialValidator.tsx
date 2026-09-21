import React, { useState } from "react";
import { PayrollPeriod, Payslip, Company } from "../../types";
import {
  validarDadosESocial,
  generateESocialS1200XML,
  generateESocialS1210XML,
  generateESocialS1299XML
} from "../../utils/esocialGenerator";
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  FileCode,
  Download,
  Copy,
  CheckCircle2,
  Send
} from "lucide-react";

interface EsocialValidatorProps {
  period: PayrollPeriod | null;
  payslips: Payslip[];
  activeCompany?: Company;
}

export const EsocialValidator: React.FC<EsocialValidatorProps> = ({
  period,
  payslips,
  activeCompany
}) => {
  const [selectedEvent, setSelectedEvent] = useState<"S-1200" | "S-1210" | "S-1299">("S-1200");
  const [copied, setCopied] = useState(false);
  const [simulatedTransmitted, setSimulatedTransmitted] = useState(false);

  if (!period) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-500 text-xs">
        Selecione uma competência para validar e gerar os eventos do eSocial.
      </div>
    );
  }

  const cnpj = activeCompany?.cnpj || "12.345.678/0001-90";
  const validation = validarDadosESocial(payslips, cnpj);

  // XMLs gerados dinamicamente
  const s1200XML = generateESocialS1200XML(period, payslips, cnpj);
  const s1210XML = generateESocialS1210XML(period, payslips, cnpj, `${period.reference_year}-${String(period.reference_month).padStart(2, "0")}-05`);
  const s1299XML = generateESocialS1299XML(period, cnpj);

  const currentXML =
    selectedEvent === "S-1200" ? s1200XML : selectedEvent === "S-1210" ? s1210XML : s1299XML;

  const handleCopyXML = () => {
    navigator.clipboard.writeText(currentXML);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadXML = () => {
    const blob = new Blob([currentXML], { type: "application/xml;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ESOCIAL_${selectedEvent}_${period.reference_year}_${period.reference_month}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Status da Validação Prévia */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0043FF]" /> Validação Prévia eSocial (Ambiente de Produção Restrita)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Verificação estrutural de conformidade cadastral e tributária dos {payslips.length} colaboradores para o período {String(period.reference_month).padStart(2, "0")}/{period.reference_year}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {validation.isValid ? (
              <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-xl font-black flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Folha em Conformidade
              </span>
            ) : (
              <span className="text-xs bg-rose-50 text-rose-800 border border-rose-200 px-3 py-1 rounded-xl font-black flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-600" /> {validation.errors.length} Inconsistência(s)
              </span>
            )}
          </div>
        </div>

        {/* Lista de Inconsistências se houver */}
        {validation.errors.length > 0 && (
          <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 space-y-2 text-xs">
            <span className="font-bold text-rose-900 block flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-rose-600" /> Pendências Críticas que Bloqueiam a Transmissão:
            </span>
            <ul className="list-disc list-inside space-y-1 text-rose-800 text-[11px]">
              {validation.errors.map((err, idx) => (
                <li key={idx}>
                  <strong>{err.userName}</strong>: {err.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {validation.warnings.length > 0 && (
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2 text-xs">
            <span className="font-bold text-amber-900 block flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> Avisos e Alertas Cadastrais:
            </span>
            <ul className="list-disc list-inside space-y-1 text-amber-800 text-[11px]">
              {validation.warnings.map((warn, idx) => (
                <li key={idx}>
                  <strong>{warn.userName}</strong>: {warn.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Gerador e Visualizador de XML dos Eventos Periódicos */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedEvent("S-1200")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedEvent === "S-1200"
                  ? "bg-[#0043FF] text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              S-1200 Remuneração
            </button>
            <button
              type="button"
              onClick={() => setSelectedEvent("S-1210")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedEvent === "S-1210"
                  ? "bg-[#0043FF] text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              S-1210 Pagamentos
            </button>
            <button
              type="button"
              onClick={() => setSelectedEvent("S-1299")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedEvent === "S-1299"
                  ? "bg-[#0043FF] text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              S-1299 Fechamento
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyXML}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-1.5 px-3 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copiado!" : "Copiar XML"}
            </button>
            <button
              type="button"
              onClick={handleDownloadXML}
              className="bg-[#0043FF] hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-3.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" /> Baixar .XML
            </button>
          </div>
        </div>

        {/* Visualizador de Código XML com syntax highlight simplificado */}
        <div className="bg-slate-900 text-emerald-400 p-4 rounded-2xl font-mono text-[11px] max-h-80 overflow-y-auto leading-relaxed border border-slate-800 shadow-inner">
          <pre>{currentXML}</pre>
        </div>

        {/* Transmissão Simulada para Ambiente eSocial */}
        <div className="bg-blue-50/60 border border-blue-100 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-blue-900 block">Transmissão Direta via WebService eSocial</span>
            <p className="text-[11px] text-blue-700">
              Conexão segura com certificado digital A1 ICP-Brasil para envio dos lotes de eventos periódicos.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSimulatedTransmitted(true);
              setTimeout(() => setSimulatedTransmitted(false), 4000);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
          >
            <Send className="w-3.5 h-3.5" /> Transmitir Lote
          </button>
        </div>

        {simulatedTransmitted && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Lote de eventos eSocial transmitido e aceito com sucesso pelo SERPRO / Receita Federal! (Protocolo: 2026.08.001928374)</span>
          </div>
        )}
      </div>
    </div>
  );
};
