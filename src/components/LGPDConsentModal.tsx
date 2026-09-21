import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  BarChart2,
  Bell,
  Users,
  Check,
  X,
  Sliders,
  ChevronRight,
  Info
} from "lucide-react";
import { useLGPD, UserConsents } from "../hooks/useLGPD";
import { UserProfile } from "../types";

interface LGPDConsentModalProps {
  currentUser?: UserProfile | null;
  onOpenPortal?: () => void;
}

export const LGPDConsentModal: React.FC<LGPDConsentModalProps> = ({
  currentUser,
  onOpenPortal,
}) => {
  const { consents, hasPrompted, saveConsents, acceptAll, acceptOnlyNecessary } =
    useLGPD(currentUser);

  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [localPreferences, setLocalPreferences] = useState<UserConsents>(consents);

  if (hasPrompted && !isCustomizeOpen) {
    return null;
  }

  const handleSaveCustom = () => {
    saveConsents(localPreferences);
    setIsCustomizeOpen(false);
  };

  return (
    <>
      {/* Banner inferior flutuante */}
      {!hasPrompted && !isCustomizeOpen && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 md:left-8 md:right-8 z-50 max-w-4xl mx-auto"
        >
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-5 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 max-w-2xl">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 rounded-2xl text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  Privacidade e Proteção de Dados (LGPD)
                </p>
                <p className="mt-1">
                  O <strong>Flow RH</strong> valoriza sua privacidade e processa dados em estrita
                  conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018). Utilizamos cookies
                  e registros estritamente necessários para a execução contratual e cumprimento de obrigações legais (CLT/eSocial).
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={() => {
                  setLocalPreferences(consents);
                  setIsCustomizeOpen(true);
                }}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                Preferências
              </button>

              <button
                type="button"
                onClick={acceptOnlyNecessary}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
              >
                Apenas Obrigatórios
              </button>

              <button
                type="button"
                onClick={acceptAll}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition cursor-pointer"
              >
                Aceitar Todos
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Modal detalhado de preferências granulares */}
      <AnimatePresence>
        {isCustomizeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-xl">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Preferências Granulares de Consentimento
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Gerencie como tratamos seus dados pessoais (Art. 8º da LGPD)
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCustomizeOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Categorias granulares */}
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* 1. Necessários */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Estritamente Necessários & Obrigação Legal (CLT / eSocial)
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Essenciais para o funcionamento da plataforma, registro de ponto com Portaria 671 MTE,
                      cálculo de holerites e segurança de sessão autenticada. Não podem ser desativados.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full shrink-0">
                    Obrigatório
                  </span>
                </div>

                {/* 2. Analytics */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Métricas de Desempenho & Melhoria Contínua
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Permite coletar estatísticas anônimas sobre velocidade de carregamento e usabilidade dos módulos de RH.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={localPreferences.analytics}
                      onChange={(e) =>
                        setLocalPreferences({ ...localPreferences, analytics: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* 3. Comunicações & Mural Interno */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Integração Social & Cultura (Mural & Aniversários)
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Exibição do seu nome e foto no feed de aniversariantes e reconhecimentos da sua organização.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={localPreferences.hrSharing}
                      onChange={(e) =>
                        setLocalPreferences({ ...localPreferences, hrSharing: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* 4. Notificações informativas */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Notificações de Bem-Estar e Dicas Corporativas
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Recebimento de comunicados gerais sobre benefícios e eventos via WhatsApp ou e-mail.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={localPreferences.marketing}
                      onChange={(e) =>
                        setLocalPreferences({ ...localPreferences, marketing: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {onOpenPortal && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomizeOpen(false);
                        onOpenPortal();
                      }}
                      className="w-full p-3 rounded-2xl border border-dashed border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-50/50 dark:hover:bg-blue-950/30 flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Info className="w-4 h-4" /> Acessar Portal do Titular LGPD Completo
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Versão das Políticas: v1.0 (Set/2025)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCustomizeOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCustom}
                    className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Salvar Preferências
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
