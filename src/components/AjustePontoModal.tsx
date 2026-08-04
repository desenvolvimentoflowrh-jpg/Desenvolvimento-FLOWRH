import React, { useState, useEffect } from "react";
import { Upload, AlertCircle, CheckCircle2, RefreshCw, FileText, Image as ImageIcon, Calendar, Clock } from "lucide-react";
import { Modal } from "./Modal";
import { UserProfile } from "../types";
import { supabase, isSupabaseConfigured } from "../services/supabase";

interface AjustePontoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
}

export const AjustePontoModal: React.FC<AjustePontoModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  // Helper to format today YYYY-MM-DD
  const getTodayDate = () => new Date().toISOString().split("T")[0];

  // Helper to format current time HH:mm
  const getCurrentTime = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const [motivo, setMotivo] = useState("");
  const [data, setData] = useState(getTodayDate());
  const [hora, setHora] = useState(getCurrentTime());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setMotivo("");
      setData(getTodayDate());
      setHora(getCurrentTime());
      setSelectedFile(null);
      setFilePreview(null);
      setErrorMessage(null);
      setSuccessMessage(null);
      setLoading(false);
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    // Client-side image validation
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Formato inválido. Por favor, selecione apenas arquivos de imagem (JPEG, PNG, WEBP, etc).");
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    // Client-side size validation (5 MB max)
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE) {
      setErrorMessage(`O arquivo selecionado (${(file.size / (1024 * 1024)).toFixed(2)} MB) excede o limite máximo permitido de 5 MB.`);
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setFilePreview(objectUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validações client-side
    if (!motivo.trim()) {
      setErrorMessage("O campo 'Motivo' é obrigatório.");
      return;
    }

    if (motivo.trim().length < 10) {
      setErrorMessage("O motivo deve ter no mínimo 10 caracteres explicativos.");
      return;
    }

    if (!data) {
      setErrorMessage("A data do ponto é obrigatória.");
      return;
    }

    if (!hora) {
      setErrorMessage("O horário do ponto é obrigatório.");
      return;
    }

    if (!selectedFile) {
      setErrorMessage("A inclusão da foto/comprovante é obrigatória.");
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      setErrorMessage("O comprovante deve ser uma imagem válida.");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setErrorMessage("O tamanho da foto/comprovante deve ser no máximo 5 MB.");
      return;
    }

    if (!supabase) {
      setErrorMessage("O serviço do Supabase não está configurado. Configure SUPABASE_URL e SUPABASE_ANON_KEY no ambiente.");
      return;
    }

    setLoading(true);

    try {
      // 1. Reference única para o arquivo no Storage
      const randomStr = Math.random().toString(36).substring(2, 9);
      const fileExt = selectedFile.name.split(".").pop() || "png";
      const fileName = `ajuste_${Date.now()}_${randomStr}.${fileExt}`;

      // 2. Upload para o bucket ponto-ajustes no Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("ponto-ajustes")
        .upload(fileName, selectedFile, {
          cacheControl: "3600",
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Falha no upload para o Supabase Storage: ${uploadError.message}`);
      }

      const fullFilePath = `ponto-ajustes/${uploadData?.path || fileName}`;

      // 3. Registro no banco Supabase na tabela ponto_ajustes
      const uuid = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `ajuste-${Date.now()}`;

      const { error: insertError } = await supabase.from("ponto_ajustes").insert([
        {
          id: uuid,
          user_id: currentUser.id,
          motivo: motivo.trim(),
          data: data,
          hora: hora,
          file_path: fullFilePath,
          status: "pendente",
          created_at: new Date().toISOString()
        }
      ]);

      if (insertError) {
        // Tentar desfazer o upload se o insert falhar
        await supabase.storage.from("ponto-ajustes").remove([fileName]).catch(() => {});
        throw new Error(`Falha ao registrar solicitação no banco de dados: ${insertError.message}`);
      }

      // Sucesso
      setSuccessMessage("Solicitação de ajuste de ponto enviada com sucesso!");
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error("Erro no ajuste de ponto:", err);
      setErrorMessage(err.message || "Ocorreu um erro ao processar a solicitação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Solicitar Ajuste de Ponto">
      {successMessage ? (
        <div className="py-8 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">
            {successMessage}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sua solicitação foi enviada para análise do RH/Gestor e está registrada como pendente.
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

          {/* Motivo */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Motivo do Ajuste *
              </label>
              <span className={`text-[10px] font-bold ${motivo.trim().length >= 10 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                {motivo.trim().length}/10 mín.
              </span>
            </div>
            <textarea
              required
              rows={3}
              placeholder="Descreva detalhadamente o motivo da solicitação de ajuste de ponto (mínimo 10 caracteres)..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-xl p-3.5 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 outline-none transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Data e Horário em Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-purple-500" /> Data *
              </label>
              <input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-xl px-3.5 py-2.5 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-purple-500" /> Horário *
              </label>
              <input
                type="time"
                required
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="w-full text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-xl px-3.5 py-2.5 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Foto/Comprovante Upload */}
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-purple-500" /> Foto / Comprovante *
              </span>
              <span className="text-[10px] text-slate-400">Máx. 5 MB (image/*)</span>
            </label>

            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 text-center hover:border-purple-400 dark:hover:border-purple-500 transition-all bg-slate-50/50 dark:bg-slate-800/40">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="comprovante-file-input"
              />

              {filePreview ? (
                <div className="space-y-3">
                  <div className="relative inline-block max-h-36 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <img
                      src={filePreview}
                      alt="Pré-visualização"
                      className="max-h-36 object-contain mx-auto"
                    />
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold flex items-center justify-center gap-2">
                    <span className="truncate max-w-[200px]">{selectedFile?.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({selectedFile ? (selectedFile.size / (1024 * 1024)).toFixed(2) : 0} MB)
                    </span>
                  </div>
                  <label
                    htmlFor="comprovante-file-input"
                    className="inline-flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline cursor-pointer"
                  >
                    Trocar Imagem
                  </label>
                </div>
              ) : (
                <label
                  htmlFor="comprovante-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2 py-2"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Clique para selecionar a foto ou comprovante
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Formatos aceitos: JPG, PNG, WEBP (Até 5 MB)
                    </p>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium rounded-xl px-4 py-2.5 text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="bg-[#8B5CF6] hover:bg-purple-700 text-white font-bold rounded-xl px-6 py-2.5 text-xs shadow-md shadow-purple-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Enviando Solicitação...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" /> Enviar Ajuste de Ponto
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
