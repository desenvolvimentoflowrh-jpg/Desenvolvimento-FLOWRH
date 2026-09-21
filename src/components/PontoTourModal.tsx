import React, { useState } from "react";
import {
  Clock,
  Camera,
  MapPin,
  ShieldCheck,
  FileText,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  LogIn,
  Coffee,
  RotateCcw,
  LogOut,
  Sparkles,
  Award,
  X
} from "lucide-react";
import { Modal } from "./Modal";

interface PontoTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

interface TourStep {
  title: string;
  badge: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  content: React.ReactNode;
}

export const PontoTourModal: React.FC<PontoTourModalProps> = ({
  isOpen,
  onClose,
  userName
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: TourStep[] = [
    {
      title: "Sequência Inteligente de Marcações",
      badge: "Passo 1 de 4 • Jornada Diária",
      description:
        "O sistema organiza e sugere automaticamente a próxima batida de ponto com base na sua rotina de trabalho.",
      icon: Clock,
      iconColor: "text-purple-600 dark:text-purple-400",
      iconBg: "bg-purple-500/10 dark:bg-purple-500/20 border-purple-500/20",
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <LogIn className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">1. Entrada</div>
                <div className="text-[10px] text-slate-400 font-mono">08:00 (Início)</div>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Coffee className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">2. Início Intervalo</div>
                <div className="text-[10px] text-slate-400 font-mono">12:00 (Refeição)</div>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">3. Retorno</div>
                <div className="text-[10px] text-slate-400 font-mono">13:00 (Turno 2)</div>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
                <LogOut className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">4. Saída</div>
                <div className="text-[10px] text-slate-400 font-mono">17:00 (Fim)</div>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-purple-50/60 dark:bg-purple-950/30 p-2.5 rounded-xl border border-purple-100 dark:border-purple-900/40">
            💡 <strong>Dica:</strong> O botão com brilho roxo indicará sempre qual é a sua próxima marcação sugerida do dia.
          </p>
        </div>
      )
    },
    {
      title: "Foto Facial & Geolocalização",
      badge: "Passo 2 de 4 • Segurança e Validação",
      description:
        "Em total conformidade com a Portaria 671 do MTE, o registro valida sua presença física e foto para auditoria antifraude.",
      icon: Camera,
      iconColor: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/20",
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Camera className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Reconhecimento Facial</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Ligue a câmera e posicione seu rosto na moldura oval centralizada antes de capturar a foto.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>GPS de Alta Precisão</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                O navegador detecta seu endereço e coordenadas geográficas instantaneamente ao carregar a página.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800/50">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Seus dados biométricos e de geolocalização são encriptados de ponta a ponta.</span>
          </div>
        </div>
      )
    },
    {
      title: "Comprovante Digital & Banco de Horas",
      badge: "Passo 3 de 4 • Transparência em Tempo Real",
      description:
        "Ao confirmar sua batida, você recebe o comprovante legal e suas horas trabalhadas são recalculadas instantaneamente.",
      icon: ShieldCheck,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20",
      content: (
        <div className="space-y-3">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-600" />
                Comprovante Assinado (PDF/SHA-256)
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Válido MTE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Clique em qualquer registro na lista de marcações para visualizar, imprimir ou baixar o comprovante oficial com assinatura digital.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 text-[11px] text-purple-900 dark:text-purple-200 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Cálculo Automático de Saldo:</strong>
              Veja suas horas normais, horas extras, adicional noturno e saldo do banco de horas no painel superior.
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Solicitação de Ajustes & Suporte",
      badge: "Passo 4 de 4 • Esquecimentos e Atestados",
      description:
        "Esqueceu de bater o ponto ou precisa anexar um atestado médico? O processo é simples e 100% digital.",
      icon: FileText,
      iconColor: "text-purple-600 dark:text-purple-400",
      iconBg: "bg-purple-500/10 dark:bg-purple-500/20 border-purple-500/20",
      content: (
        <div className="space-y-3">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-500" />
              Botão &quot;Solicitar Ajuste de Ponto&quot;
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Disponível no topo da página. Permite selecionar a data, o tipo de ocorrência, informar a justificativa e anexar comprovantes médicos para avaliação do RH.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50 text-[11px] text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Você está pronto para utilizar o Flow RH com total facilidade e segurança!</span>
          </div>
        </div>
      )
    }
  ];

  const step = steps[currentStep];
  const StepIcon = step.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      hideHeader
      maxWidth="max-w-xl"
      contentPadding="p-0"
    >
      <div className="relative overflow-hidden bg-white dark:bg-slate-900 flex flex-col">
        {/* Top Header with Gradient Accent */}
        <div className="bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            aria-label="Fechar guia"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
              {step.badge}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
              <StepIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">{step.title}</h2>
              <p className="text-xs text-purple-100/90 leading-snug">
                {userName ? `Olá, ${userName.split(" ")[0]}! ` : ""}
                {step.description}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {step.content}

          {/* Progress Dots & Nav Controls */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
            {/* Step Indicators */}
            <div className="flex items-center gap-1.5">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentStep
                      ? "w-6 bg-purple-600 dark:bg-purple-500"
                      : "w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300"
                  }`}
                  aria-label={`Ir para passo ${idx + 1}`}
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {currentStep > 0 ? (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all cursor-pointer"
                >
                  Pular tour
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>{currentStep === steps.length - 1 ? "Entendi, vamos começar!" : "Próximo"}</span>
                {currentStep === steps.length - 1 ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
