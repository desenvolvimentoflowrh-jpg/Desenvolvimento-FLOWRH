import React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Target,
  Award,
  CheckCircle,
  BookOpen,
  MessageSquareQuote
} from "lucide-react";
import { UserProfile, Goal, Training } from "../types";

interface PDIProps {
  currentUser: UserProfile;
  goals: Goal[];
  trainings: Training[];
}

export const PDI: React.FC<PDIProps> = ({ currentUser, goals, trainings }) => {
  const userGoals = goals.filter((g) => g.user_id === currentUser.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      {/* Banner */}
      <div className="bg-[#0043FF] text-white p-6 rounded-3xl shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs text-blue-200 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Target className="w-4 h-4" /> Plano de Desenvolvimento Individual
          </span>
          <h2 className="text-2xl font-black">Meu PDI & Carreira</h2>
          <p className="text-xs text-blue-100">
            Acompanhe suas metas de evolução técnica, liderança e habilidades contínuas.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-center">
          <span className="text-[10px] text-blue-200 uppercase font-bold tracking-wider block">
            Nível de Desempenho
          </span>
          <span className="text-xl font-black text-amber-300">⭐ Excede Expectativas</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Goals Progress Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <TrendingUp className="w-5 h-5 text-[#0043FF]" /> Minhas Metas Principais
            </h3>

            <div className="space-y-5">
              {userGoals.map((goal) => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-bold text-slate-800">{goal.title}</span>
                    <span className="font-mono font-bold text-[#0043FF]">{goal.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#0043FF] h-full rounded-full transition-all duration-500"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">{goal.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Trainings Panel */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <BookOpen className="w-5 h-5 text-indigo-600" /> Trilhas de Treinamento
            </h3>

            <div className="space-y-3">
              {trainings.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">{t.title}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">Prazo: {t.due_date}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all"
                      style={{ width: `${t.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                    <span>{t.progress}% concluído</span>
                    <span className="text-indigo-600 font-bold">Continuar Aula →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Skills & Feedbacks Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Skills Competencies */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <Award className="w-5 h-5 text-amber-500" /> Painel de Competências
            </h3>

            <div className="space-y-3">
              {[
                { name: "TypeScript & React Architecture", type: "Hard Skill", level: "Avançado (90%)" },
                { name: "Comunicação Não-Violenta (CNV)", type: "Soft Skill", level: "Intermediário (75%)" },
                { name: "Segurança de Dados & RLS Multi-Tenant", type: "Hard Skill", level: "Avançado (95%)" },
                { name: "Liderança de Squads Ágeis", type: "Soft Skill", level: "Em Desenvolvimento (60%)" }
              ].map((skill) => (
                <div
                  key={skill.name}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs flex justify-between items-center"
                >
                  <div>
                    <div className="font-bold text-slate-800">{skill.name}</div>
                    <div className="text-[10px] text-slate-400">{skill.type}</div>
                  </div>
                  <span className="text-[10px] font-bold bg-blue-50 text-[#0043FF] px-2 py-0.5 rounded-full">
                    {skill.level}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback History */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <MessageSquareQuote className="w-5 h-5 text-emerald-600" /> Feedbacks Recentes da Liderança
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-1">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Excelente autonomia no refactor SaaS</span>
                  <span className="text-[10px] text-slate-400">10 de Julho</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  "Demonstrou grande conhecimento de arquitetura limpa e isolamento de dados no projeto de migração."
                </p>
                <div className="text-[10px] text-emerald-700 font-bold mt-1">
                  — Gestão de Engenharia
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
