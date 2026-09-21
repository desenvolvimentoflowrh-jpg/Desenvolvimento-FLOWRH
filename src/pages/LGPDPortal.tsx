import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  Download,
  Trash2,
  Edit3,
  Eye,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
  Info,
  Building2,
  Key
} from "lucide-react";
import { UserProfile } from "../types";
import { useLGPD } from "../hooks/useLGPD";
import { exportLgpdDataEdge, anonymizeLgpdUserEdge } from "../services/edgeFunctions";

interface LGPDPortalProps {
  currentUser: UserProfile;
}

export const LGPDPortal: React.FC<LGPDPortalProps> = ({ currentUser }) => {
  const { consents, saveConsents } = useLGPD(currentUser);

  const [activeSubTab, setActiveSubTab] = useState<
    "direitos" | "portabilidade" | "anonimizacao" | "retencao"
  >("direitos");

  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<{
    protocol: string;
    filename: string;
    data: any;
  } | null>(null);

  const [isAnonymizing, setIsAnonymizing] = useState(false);
  const [anonymizeSuccess, setAnonymizeSuccess] = useState<{
    protocol: string;
    anonymizedFields: string[];
  } | null>(null);
  const [confirmDeleteText, setConfirmDeleteText] = useState("");
  const [deleteReason, setDeleteReason] = useState("");

  // Ação de Portabilidade (Exportar todos os dados em JSON / ZIP)
  const handleExportData = async () => {
    setIsExporting(true);
    setExportSuccess(null);
    try {
      const res = await exportLgpdDataEdge(currentUser.id);
      if (res.data?.success) {
        setExportSuccess({
          protocol: res.data.protocol,
          filename: res.data.filename,
          data: res.data.data,
        });

        // Trigger download do arquivo
        const blob = new Blob([JSON.stringify(res.data.data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = res.data.filename || `dados_titular_${currentUser.id}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error("Erro ao exportar dados:", e);
    } finally {
      setIsExporting(false);
    }
  };

  // Ação de Anonimização (Direito de Eliminação sob Art. 18, VI)
  const handleAnonymize = async () => {
    if (confirmDeleteText !== "CONFIRMAR ANONIMIZACAO") return;
    setIsAnonymizing(true);
    try {
      const res = await anonymizeLgpdUserEdge(
        currentUser.id,
        deleteReason || "Solicitação direta no Portal do Titular",
        true
      );
      if (res.data?.success) {
        setAnonymizeSuccess({
          protocol: res.data.protocol,
          anonymizedFields: res.data.anonymizedFields,
        });
      }
    } catch (e) {
      console.error("Erro na anonimização:", e);
    } finally {
      setIsAnonymizing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-blue-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
            <ShieldCheck className="w-4 h-4" />
            Portal do Titular de Dados Pessoais • Lei 13.709/2018
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Transparência & Direitos LGPD
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Tenha total controle sobre os dados tratados pelo Flow RH. Acesse suas informações,
            solicite a portabilidade ou exerça seus direitos garantidos pela legislação brasileira.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-xs space-y-1 shrink-0 w-full md:w-auto">
          <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">
            Titular Autenticado
          </span>
          <p className="font-bold text-white text-sm">{currentUser.name}</p>
          <p className="text-slate-300">{currentUser.email}</p>
          <span className="inline-block mt-1 text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
            CPF: {currentUser.cpf || "000.***.***-00"}
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto pb-1">
        {[
          { id: "direitos", label: "Seus Direitos (Art. 18)", icon: Eye },
          { id: "portabilidade", label: "Portabilidade de Dados (Download)", icon: Download },
          { id: "anonimizacao", label: "Eliminação & Anonimização", icon: Trash2 },
          { id: "retencao", label: "Política de Retenção Legal", icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Visão Geral dos Direitos */}
      {activeSubTab === "direitos" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: "1. Confirmação & Acesso",
                art: "Art. 18, I e II",
                desc: "Direito de confirmar a existência de tratamento e acessar a relação completa de registros cadastrais, ponto e holerites.",
                status: "Disponível em tempo real",
                statusColor: "text-emerald-600 dark:text-emerald-400",
              },
              {
                title: "2. Correção de Dados Incompletos",
                art: "Art. 18, III",
                desc: "Direito de solicitar retificação de dados cadastrais, cargo, endereço ou divergências de apontamento de jornada.",
                status: "Via RH ou Perfil",
                statusColor: "text-blue-600 dark:text-blue-400",
              },
              {
                title: "3. Anonimização / Bloqueio",
                art: "Art. 18, IV e VI",
                desc: "Direito de solicitar descarte ou anonimização de dados desnecessários ou tratados em desconformidade.",
                status: "Conforme prazos CLT",
                statusColor: "text-amber-600 dark:text-amber-400",
              },
              {
                title: "4. Portabilidade de Dados",
                art: "Art. 18, V",
                desc: "Exportação dos dados pessoais em formato aberto e interoperável (JSON padronizado).",
                status: "Download Imediato",
                statusColor: "text-purple-600 dark:text-purple-400",
              },
              {
                title: "5. Revogação do Consentimento",
                art: "Art. 18, IX",
                desc: "Direito de revogar autorizações para tratamentos facultativos (análise de métricas e feed social interno).",
                status: "Granular e instantâneo",
                statusColor: "text-emerald-600 dark:text-emerald-400",
              },
              {
                title: "6. Segurança & Criptografia",
                art: "Art. 46",
                desc: "Proteção contra acessos não autorizados com Row Level Security (RLS) e Edge Functions segregadas.",
                status: "Auditoria Ativa",
                statusColor: "text-indigo-600 dark:text-indigo-400",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                      {item.art}
                    </span>
                    <span className={`text-[10px] font-bold ${item.statusColor}`}>
                      {item.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">{item.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* DPO / Contato do Encarregado */}
          <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-950/80 rounded-2xl text-blue-600 dark:text-blue-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Encarregado de Proteção de Dados (DPO)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Canal de comunicação oficial para dúvidas e solicitações:{" "}
                  <strong className="text-blue-600 dark:text-blue-400">dpo@flowrh.com.br</strong>
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              Prazo legal de resposta: até 15 dias úteis
            </span>
          </div>
        </motion.div>
      )}

      {/* Tab 2: Portabilidade de Dados */}
      {activeSubTab === "portabilidade" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-2xl shrink-0">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Gerar Pacote de Portabilidade de Dados Pessoais
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Em conformidade com o <strong>Art. 18, inciso V da LGPD</strong>, você pode solicitar a
                  extração completa de todos os registros armazenados no sistema em formato JSON legível
                  por máquina e interoperável.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-500" /> O pacote de dados exportado inclui:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1 text-[11px]">
                <li>Perfil Cadastral, identificadores e contato profissional</li>
                <li>Histórico completo de registros de ponto com carimbo de tempo</li>
                <li>Recibos de remuneração e holerites emitidos</li>
                <li>Solicitações e períodos aquisitivos de férias e licenças</li>
                <li>Histórico de consentimentos LGPD e logs de auditoria vinculados</li>
              </ul>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleExportData}
                disabled={isExporting}
                className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Compilando dados via Edge Function...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" /> Baixar Meus Dados (JSON Interoperável)
                  </>
                )}
              </button>

              {exportSuccess && (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-4 h-4" />
                  Arquivo gerado com sucesso! Protocolo: {exportSuccess.protocol}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab 3: Eliminação & Anonimização */}
      {activeSubTab === "anonimizacao" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-rose-200 dark:border-rose-900/50 shadow-xs space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Direito de Eliminação & Anonimização (Art. 18, VI)
                  <span className="text-[10px] bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-full font-bold">
                    Ação Irreversível
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Solicitação de anonimização dos dados pessoais identificáveis cadastrados no Flow RH.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-200 space-y-2">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Guarda Legal Obrigatória Trabalhista (Art. 16, I da LGPD e Art. 11 da CLT):
              </p>
              <p className="text-[11px] leading-relaxed">
                Em respeito à legislação trabalhista brasileira, holerites, recolhimentos e registros de ponto
                <strong> não podem sofrer exclusão física imediata (hard delete)</strong> durante o prazo prescricional
                de 5 (cinco) anos. Ao executar este procedimento, seus dados cadastrais diretos serão
                <strong> completamente anonimizados e descaracterizados</strong> na base de dados, mantendo apenas
                identificadores opacos para auditoria fiscal e previdenciária.
              </p>
            </div>

            {anonymizeSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 space-y-2">
                <p className="font-bold text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Anonimização Executada com Sucesso!
                </p>
                <p className="text-[11px]">
                  Protocolo de Auditoria LGPD: <strong>{anonymizeSuccess.protocol}</strong>
                </p>
                <p className="text-[11px]">
                  Campos anonimizados: {anonymizeSuccess.anonymizedFields.join(", ")}.
                </p>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Motivo da solicitação (opcional)
                  </label>
                  <input
                    type="text"
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="Ex: Encerramento de vínculo / Revogação geral de dados"
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Digite exatamente <span className="text-rose-600">CONFIRMAR ANONIMIZACAO</span> para prosseguir:
                  </label>
                  <input
                    type="text"
                    value={confirmDeleteText}
                    onChange={(e) => setConfirmDeleteText(e.target.value)}
                    placeholder="CONFIRMAR ANONIMIZACAO"
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAnonymize}
                  disabled={confirmDeleteText !== "CONFIRMAR ANONIMIZACAO" || isAnonymizing}
                  className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  {isAnonymizing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Processando Anonimização...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" /> Anonimizar Meus Dados Pessoais
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Tab 4: Política de Retenção Legal */}
      {activeSubTab === "retencao" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Tabela de Temporalidade & Prazos Legais de Retenção
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Embasamento jurídico para a guarda legal e fiscal de dados na plataforma Flow RH
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[10px] uppercase font-black">
                    <th className="py-3 px-4">Categoria de Dados</th>
                    <th className="py-3 px-4">Finalidade do Tratamento</th>
                    <th className="py-3 px-4">Prazo de Retenção</th>
                    <th className="py-3 px-4">Base Legal (LGPD & Legislação)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      Holerites & Folha de Pagamento
                    </td>
                    <td className="py-3 px-4">Comprovação de pagamento salarial e quitação trabalhista</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">5 anos</td>
                    <td className="py-3 px-4 text-slate-500">CLT art. 11 / CF art. 7º, XXIX / LGPD art. 16, I</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      Marcações de Ponto Eletrônico
                    </td>
                    <td className="py-3 px-4">Fiscalização do trabalho e controle de jornada</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">5 anos</td>
                    <td className="py-3 px-4 text-slate-500">Portaria MTE 671/2021 / LGPD art. 7º, II</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      Contribuições Previdenciárias (INSS/FGTS)
                    </td>
                    <td className="py-3 px-4">Aposentadoria e benefícios previdenciários do trabalhador</td>
                    <td className="py-3 px-4 font-mono font-bold text-purple-600">10 a 30 anos</td>
                    <td className="py-3 px-4 text-slate-500">Lei 8.213/91 / Súmula 362 do TST</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      Logs Imutáveis de Auditoria
                    </td>
                    <td className="py-3 px-4">Rastreabilidade contra fraudes e segurança da informação</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">10 anos</td>
                    <td className="py-3 px-4 text-slate-500">Marco Civil da Internet (Lei 12.965/14) / LGPD art. 46</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      Currículos e Processos Seletivos
                    </td>
                    <td className="py-3 px-4">Recrutamento e seleção de novos colaboradores</td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-600">6 meses a 2 anos</td>
                    <td className="py-3 px-4 text-slate-500">Consentimento do candidato / LGPD art. 7º, I</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
