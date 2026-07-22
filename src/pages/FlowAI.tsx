import React, { useState } from "react";
import { motion } from "framer-motion";
import { Bot, Send, Sparkles, User } from "lucide-react";
import { UserProfile, Company } from "../types";

interface FlowAIProps {
  currentUser: UserProfile;
  activeCompany: Company | undefined;
}

export const FlowAI: React.FC<FlowAIProps> = ({ currentUser, activeCompany }) => {
  const [messages, setMessages] = useState<
    { sender: "user" | "ai"; text: string; time: string }[]
  >([
    {
      sender: "ai",
      text: `Olá, ${currentUser.name}! Sou o Flow AI, assistente inteligente de Recursos Humanos da ${
        activeCompany?.name || "sua empresa"
      }. Como posso ajudar com dúvidas sobre férias, políticas internas ou registro de ponto hoje?`,
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    }
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendMessage = (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim()) return;

    const timeStr = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    });

    const userMsg = { sender: "user" as const, text: textToSend.trim(), time: timeStr };
    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput("");
    setLoading(true);

    setTimeout(() => {
      let aiReply = "Ainda estou aprendendo sobre esse assunto específico. Por favor, verifique o Manual do Colaborador no módulo de Onboarding.";

      const lower = textToSend.toLowerCase();
      if (lower.includes("reembolso") || lower.includes("uber") || lower.includes("despesa")) {
        aiReply = `De acordo com as diretrizes da ${activeCompany?.name}, o reembolso de refeições em viagens possui limite de R$ 80,00/dia, e corridas de aplicativo corporativo devem ser comprovadas com recibo no sistema até o dia 25 de cada mês.`;
      } else if (lower.includes("férias") || lower.includes("ferias") || lower.includes("folga")) {
        aiReply = `As solicitações de férias devem ser realizadas com pelo menos 30 dias de antecedência através do canal oficial do RH. Seu saldo atual disponível é de 15 dias.`;
      } else if (lower.includes("ponto") || lower.includes("biometria") || lower.includes("horário")) {
        aiReply = `O registro de ponto deve ser feito no botão central 'Ponto' com biometria facial e localização GPS ativa. O limite de tolerância é de 10 minutos conforme a legislação CLT.`;
      } else if (lower.includes("home office") || lower.includes("híbrido") || lower.includes("presencial")) {
        aiReply = `O modelo híbrido permite até 2 dias de trabalho remoto por semana, combinados previamente com sua liderança direta.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: aiReply,
          time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        }
      ]);
      setLoading(false);
    }, 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-8"
    >
      {/* Suggestions Sidebar */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-600" /> Consultas Rápidas de Políticas
          </h4>
          <p className="text-[11px] text-slate-500">
            Clique em um tema para tirar dúvidas usando a base corporativa.
          </p>

          <div className="space-y-2 pt-1">
            {[
              "Como funciona o reembolso de refeição e Uber?",
              "Com quanto tempo de antecedência devo pedir férias?",
              "Quais as diretrizes do trabalho híbrido?",
              "Como funciona a biometria no registro de ponto?"
            ].map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="w-full text-left bg-slate-50 hover:bg-cyan-50/50 border border-slate-100 hover:border-cyan-200 text-xs font-semibold text-slate-700 p-3 rounded-xl transition"
              >
                💬 {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Box */}
      <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[520px]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center gap-3">
          <Bot className="w-6 h-6 text-cyan-400" />
          <div>
            <h3 className="font-bold text-sm">Flow AI - Assistente de RH</h3>
            <p className="text-[10px] text-slate-400">Empresa: {activeCompany?.name}</p>
          </div>
        </div>

        {/* Message Container */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 max-w-[80%] ${
                m.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-bold text-xs ${
                  m.sender === "user"
                    ? "bg-[#0043FF] text-white"
                    : "bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                {m.sender === "user" ? "U" : <Bot className="w-4 h-4 text-cyan-600" />}
              </div>

              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  m.sender === "user"
                    ? "bg-[#0043FF] text-white rounded-tr-none"
                    : "bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none"
                }`}
              >
                <p>{m.text}</p>
                <span className="text-[9px] opacity-60 block text-right mt-1 font-mono">
                  {m.time}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 max-w-[80%] mr-auto">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <Bot className="w-4 h-4 text-cyan-600" />
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl rounded-tl-none border border-slate-100 text-xs text-slate-400 font-bold animate-pulse">
                Consultando políticas internas...
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-4 border-t border-slate-100 flex gap-2"
        >
          <input
            type="text"
            placeholder="Digite sua dúvida sobre o RH..."
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-cyan-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-200 text-white font-bold px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </motion.div>
  );
};
