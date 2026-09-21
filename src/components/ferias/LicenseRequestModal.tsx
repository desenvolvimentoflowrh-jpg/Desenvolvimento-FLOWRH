import React, { useState, useMemo } from "react";
import {
  X,
  Stethoscope,
  Calendar,
  AlertTriangle,
  FileText,
  Clock,
  ShieldCheck
} from "lucide-react";
import { UserProfile } from "../../types";
import { LicenseType } from "../../types/vacation";
import { LicenseTypeSelector, TIPOS_LICENCA } from "./LicenseTypeSelector";
import { DateRangePicker } from "./DateRangePicker";
import { DocumentUploader } from "./DocumentUploader";
import {
  calcularDiasCorridos,
  validarRegrasLicenca
} from "../../utils/vacationCalculations";

interface LicenseRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSubmit: (dados: {
    tipo: LicenseType;
    data_inicio: string;
    data_fim: string;
    dias_totais: number;
    cid?: string;
    documento_url?: string;
    documento_nome?: string;
    observacao?: string;
  }) => Promise<void>;
}

export const LicenseRequestModal: React.FC<LicenseRequestModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSubmit
}) => {
  const [tipo, setTipo] = useState<LicenseType>("medica");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [cid, setCid] = useState("");
  const [documentoUrl, setDocumentoUrl] = useState<string | undefined>(undefined);
  const [documentoNome, setDocumentoNome] = useState<string | undefined>(undefined);
  const [observacao, setObservacao] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const diasTotais = useMemo(() => {
    return calcularDiasCorridos(dataInicio, dataFim);
  }, [dataInicio, dataFim]);

  const currentMeta = useMemo(() => {
    return TIPOS_LICENCA.find((t) => t.type === tipo) || TIPOS_LICENCA[0];
  }, [tipo]);

  // Validação da Licença
  const validation = useMemo(() => {
    if (!dataInicio || !dataFim) {
      return { isValid: false, erros: [], avisos: [] };
    }
    return validarRegrasLicenca(tipo, dataInicio, diasTotais, Boolean(documentoUrl));
  }, [tipo, dataInicio, diasTotais, documentoUrl]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validation.isValid) {
      setSubmitError(validation.erros.join(" "));
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        tipo,
        data_inicio: dataInicio,
        data_fim: dataFim,
        dias_totais: diasTotais,
        cid: cid.trim() || undefined,
        documento_url: documentoUrl,
        documento_nome: documentoNome,
        observacao: observacao.trim() || undefined
      });
      onClose();
    } catch (err: any) {
      console.error("Erro ao solicitar licença:", err);
      setSubmitError(err?.message || "Não foi possível registrar a licença.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black">Registrar Licença / Afastamento Legal</h3>
              <p className="text-xs text-blue-100">
                Colaborador: <strong>{currentUser.name}</strong> • Conformidade com o eSocial S-2230
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Seletor do Tipo de Licença */}
          <LicenseTypeSelector selectedType={tipo} onSelectType={setTipo} />

          {/* Período */}
          <DateRangePicker
            dataInicio={dataInicio}
            dataFim={dataFim}
            onChangeInicio={setDataInicio}
            onChangeFim={setDataFim}
          />

          {/* CID para atestados médicos (opcional conforme sigilo médico) */}
          {tipo === "medica" && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Código CID-10 (Opcional - Direito de sigilo médico)</span>
                <span className="text-[11px] text-slate-400 font-normal">Ex: J06.9, M54.5</span>
              </label>
              <input
                type="text"
                value={cid}
                onChange={(e) => setCid(e.target.value.toUpperCase())}
                placeholder="Insira o código CID caso conste expressamente no atestado"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#0043FF] focus:outline-none uppercase"
              />
            </div>
          )}

          {/* Upload de Comprovante */}
          <DocumentUploader
            documentUrl={documentoUrl}
            documentName={documentoNome}
            required={currentMeta.requiresMedicalDoc}
            onDocumentUploaded={({ url, name }) => {
              setDocumentoUrl(url);
              setDocumentoNome(name);
            }}
            onRemoveDocument={() => {
              setDocumentoUrl(undefined);
              setDocumentoNome(undefined);
            }}
          />

          {/* Observação */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observações Adicionais (Opcional)
            </label>
            <textarea
              rows={2}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Informações relevantes para o Departamento Pessoal e eSocial."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-[#0043FF] focus:outline-none"
            />
          </div>

          {/* Validações e Erros */}
          {validation.erros.length > 0 && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" /> Inconsistências Detectadas:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                {validation.erros.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">
              {submitError}
            </div>
          )}

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !validation.isValid}
              className="px-5 py-2.5 bg-[#0043FF] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Registrando..." : "Registrar Afastamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
