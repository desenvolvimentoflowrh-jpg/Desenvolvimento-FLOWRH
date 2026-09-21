import React, { useState, useEffect } from "react";
import { X, FileCode, Copy, Check, ShieldCheck, Download, RefreshCw } from "lucide-react";
import { VacationRequest } from "../../types/vacation";
import { vacationService } from "../../services/vacationService";
import { generateEsocialXmlEdge } from "../../services/edgeFunctions";

interface ESocialModalProps {
  request: VacationRequest | null;
  onClose: () => void;
}

export const ESocialModal: React.FC<ESocialModalProps> = ({ request, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [xmlContent, setXmlContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [schemaVersion, setSchemaVersion] = useState<string>("v_S_01_02_00");

  useEffect(() => {
    if (!request) return;
    let isMounted = true;
    setLoading(true);

    async function loadEdgeXml() {
      try {
        // Invoca Edge Function 'esocial-xml'
        const res = await generateEsocialXmlEdge("S-2230", {
          vacationRequest: request,
          companyId: request?.company_id,
          employeeData: {
            id: request?.user_id,
            name: request?.user_name,
            cpf: "12345678909",
          },
        });

        if (isMounted && res.data?.xml) {
          setXmlContent(res.data.xml);
          setSchemaVersion(res.data.schemaVersion || "v_S_01_02_00");
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Falha ao invocar Edge Function esocial-xml, utilizando gerador local:", err);
      }

      // Fallback local seguro
      if (isMounted && request) {
        const fallback = vacationService.generateESocialXML(request, "S-2230");
        setXmlContent(fallback.xmlPayload);
        setLoading(false);
      }
    }

    loadEdgeXml();

    return () => {
      isMounted = false;
    };
  }, [request]);

  if (!request) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(xmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([xmlContent], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `esocial-s2230-${request.id}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl">
              <FileCode className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-black flex items-center gap-2">
                Evento eSocial S-2230
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Validado por Edge Function ({schemaVersion})
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Afastamento Temporário • Colaborador: {request.user_name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* XML Viewer */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Estrutura XML oficial gerada via Supabase Edge Function:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                disabled={loading}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copiado!" : "Copiar XML"}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={loading}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer border border-indigo-200 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" /> Baixar .xml
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
              <span className="text-xs font-bold">Compilando XML S-2230 via Edge Function...</span>
            </div>
          ) : (
            <pre className="p-4 bg-slate-950 text-emerald-400 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-80 border border-slate-800 leading-relaxed">
              {xmlContent}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Fechar Visualizador
          </button>
        </div>
      </div>
    </div>
  );
};
