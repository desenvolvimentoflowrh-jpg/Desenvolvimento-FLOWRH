import React, { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, X, Loader2 } from "lucide-react";
import { vacationService } from "../../services/vacationService";

interface DocumentUploaderProps {
  documentUrl?: string;
  documentName?: string;
  onDocumentUploaded: (result: { url: string; name: string }) => void;
  onRemoveDocument: () => void;
  disabled?: boolean;
  required?: boolean;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  documentUrl,
  documentName,
  onDocumentUploaded,
  onRemoveDocument,
  disabled = false,
  required = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setErrorMessage(null);

    // Validação de formato
    const allowedExtensions = ["pdf", "jpg", "jpeg", "png"];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(ext)) {
      setErrorMessage("Formato inválido. Por favor, anexe arquivos PDF, JPG ou PNG.");
      return;
    }

    // Validação de tamanho (máximo 10MB)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setErrorMessage("Arquivo muito grande. O tamanho máximo permitido é de 10MB.");
      return;
    }

    try {
      setIsUploading(true);
      const res = await vacationService.uploadLicenseDocument(file);
      onDocumentUploaded(res);
    } catch (err: any) {
      console.error("Falha no upload do documento:", err);
      setErrorMessage(err?.message || "Não foi possível carregar o arquivo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700">
          Comprovante / Atestado Digital {required && <span className="text-red-500">*</span>}
        </label>
        <span className="text-[11px] text-slate-400">PDF, JPG ou PNG (Máx 10MB)</span>
      </div>

      {documentUrl ? (
        <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-emerald-950 truncate">
                {documentName || "Documento anexado"}
              </div>
              <div className="text-[11px] text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Arquivo validado e pronto para envio
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-emerald-800 hover:underline px-2 py-1 bg-white rounded-lg border border-emerald-200"
            >
              Visualizar
            </a>
            {!disabled && (
              <button
                type="button"
                onClick={onRemoveDocument}
                className="p-1 text-slate-400 hover:text-red-600 rounded-md transition cursor-pointer"
                title="Remover arquivo"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => {
            if (!disabled && !isUploading && fileInputRef.current) {
              fileInputRef.current.click();
            }
          }}
          className={`p-6 border-2 border-dashed rounded-2xl text-center flex flex-col items-center justify-center gap-2 transition cursor-pointer ${
            isDragging
              ? "border-[#0043FF] bg-blue-50/50"
              : "border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            disabled={disabled || isUploading}
            className="hidden"
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-xs text-slate-600">
              <Loader2 className="w-6 h-6 text-[#0043FF] animate-spin" />
              <span className="font-semibold">Fazendo upload seguro do documento...</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-[#0043FF]">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">
                  Clique para selecionar ou arraste o arquivo aqui
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Atestados médicos devem conter identificação do CRM e assinatura legível
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
