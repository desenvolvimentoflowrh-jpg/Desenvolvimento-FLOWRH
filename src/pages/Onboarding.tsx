import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Upload,
  UserCheck,
  BookOpen,
  Send
} from "lucide-react";
import { UserProfile } from "../types";

interface OnboardingProps {
  currentUser: UserProfile;
  users: UserProfile[];
}

export const Onboarding: React.FC<OnboardingProps> = ({ currentUser, users }) => {
  const [tasks, setTasks] = useState([
    { id: "1", title: "Envio de Documentos Pessoais (RG / CNH / CPF)", status: "completed" },
    { id: "2", title: "Assinatura Digital do Contrato de Trabalho", status: "completed" },
    { id: "3", title: "Configuração do E-mail e Acessos Corporativos", status: "completed" },
    { id: "4", title: "Leitura do Manual de Conduta & Cultura", status: "in_progress" },
    { id: "5", title: "Reunião de Alinhamento com o Padrinho (Buddy)", status: "pending" },
    { id: "6", title: "Treinamento Inicial de Segurança da Informação", status: "pending" }
  ]);

  const [uploadedDocs, setUploadedDocs] = useState<
    { name: string; type: string; status: "analyzed" | "pending" }[]
  >([
    { name: "RG_Frente_Verso.pdf", type: "Documento de Identidade", status: "analyzed" },
    { name: "Comprovante_Residencia.pdf", type: "Comprovante de Endereço", status: "analyzed" }
  ]);

  const [ocrStatus, setOcrStatus] = useState("");

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  const buddyUser = users.find((u) => u.id !== currentUser.id) || users[0];

  const handleToggleTask = (taskId: string) => {
    setTasks(
      tasks.map((t) => {
        if (t.id === taskId) {
          const nextStatus =
            t.status === "completed"
              ? "in_progress"
              : t.status === "in_progress"
              ? "pending"
              : "completed";
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  const handleSimulateDocUpload = (file: File) => {
    setOcrStatus("Processando OCR e Leitura Automática de Dados...");
    setTimeout(() => {
      setUploadedDocs([
        ...uploadedDocs,
        { name: file.name, type: "Documento Civil", status: "analyzed" }
      ]);
      setOcrStatus("✅ Documento validado via OCR com sucesso!");
      setTimeout(() => setOcrStatus(""), 3500);
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      {/* Header Banner */}
      <div className="bg-[#0043FF] text-white p-6 rounded-3xl shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left z-10">
          <span className="text-xs text-blue-200 font-bold uppercase tracking-wider flex items-center justify-center md:justify-start gap-1.5">
            <UserCheck className="w-4 h-4" /> Admissão Digital Corporativa
          </span>
          <h2 className="text-2xl font-black">Portal de Onboarding</h2>
          <p className="text-xs text-blue-100">
            Acompanhe sua integração, envio de documentos e etapas de boas-vindas.
          </p>
        </div>

        {/* Overall Progress Gauge */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl text-center min-w-[200px] z-10">
          <div className="text-[10px] uppercase font-bold text-blue-200 tracking-wider mb-1">
            Progresso Geral
          </div>
          <div className="text-3xl font-black text-white">{progressPercent}%</div>
          <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden mt-2">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Task List Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Lista de Tarefas de Integração</h3>
              <span className="text-[10px] text-slate-400 font-bold uppercase">
                {completedCount} de {tasks.length} concluídas
              </span>
            </div>

            <div className="space-y-2.5">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task.id)}
                  className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                    task.status === "completed"
                      ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                      : task.status === "in_progress"
                      ? "bg-amber-50/60 border-amber-200 text-amber-900"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {task.status === "completed" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : task.status === "in_progress" ? (
                      <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
                    )}
                    <span>{task.title}</span>
                  </div>

                  <span
                    className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      task.status === "completed"
                        ? "bg-emerald-100 text-emerald-700"
                        : task.status === "in_progress"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {task.status === "completed"
                      ? "Concluído"
                      : task.status === "in_progress"
                      ? "Em Andamento"
                      : "Pendente"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Document Upload Zone for OCR */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3">
              Upload de Documentos Civis (Com Leitor OCR)
            </h3>

            {ocrStatus && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-xl text-xs font-bold">
                {ocrStatus}
              </div>
            )}

            <div className="border-2 border-dashed border-slate-200 hover:border-[#0043FF] rounded-2xl p-6 text-center transition bg-slate-50/50">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                id="doc-upload"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleSimulateDocUpload(e.target.files[0]);
                  }
                }}
              />
              <label htmlFor="doc-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-[#0043FF]" />
                <span className="text-xs font-bold text-slate-700">
                  Arraste arquivos ou clique para selecionar
                </span>
                <span className="text-[10px] text-slate-400">PDF, PNG ou JPG (até 10MB)</span>
              </label>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Documentos Enviados:
              </span>
              {uploadedDocs.map((doc, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs flex justify-between items-center"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#0043FF]" />
                    <div>
                      <div className="font-bold text-slate-800">{doc.name}</div>
                      <div className="text-[10px] text-slate-400">{doc.type}</div>
                    </div>
                  </div>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">
                    OCR Validado
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Column (Buddy & Links) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Buddy Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3">
              Seu Padrinho de Integração (Buddy)
            </h3>

            {buddyUser && (
              <div className="flex items-center gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <img
                  src={buddyUser.avatar}
                  alt={buddyUser.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">{buddyUser.name}</h4>
                  <p className="text-[10px] text-slate-500">{buddyUser.department}</p>
                  <span className="text-[9px] bg-blue-100 text-[#0043FF] font-bold px-2 py-0.5 rounded-full mt-1 inline-block uppercase">
                    Padrinho Oficial
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() => alert(`Iniciando chat com ${buddyUser?.name}...`)}
              className="w-full bg-[#0043FF] hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Falar com o Padrinho
            </button>
          </div>

          {/* Useful Links */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-3">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3">
              Links & Documentos Úteis
            </h3>

            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert("Abrindo Manual do Colaborador 2026...");
              }}
              className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 text-xs flex items-center gap-3 text-slate-700 font-bold transition"
            >
              <BookOpen className="w-4 h-4 text-[#0043FF]" />
              <span>Manual do Colaborador (PDF)</span>
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
