import React, { useState } from "react";
import { PayrollEarningRule, VerbaType, PayrollCalculationType } from "../../types/payroll";
import { Plus, Edit2, CheckCircle2, XCircle, Sliders, Save, X } from "lucide-react";

interface PayrollVerbaConfigTableProps {
  rules: PayrollEarningRule[];
  onSaveRule: (rule: Partial<PayrollEarningRule>) => void;
  canManage: boolean;
}

export const PayrollVerbaConfigTable: React.FC<PayrollVerbaConfigTableProps> = ({
  rules,
  onSaveRule,
  canManage
}) => {
  const [editingRule, setEditingRule] = useState<Partial<PayrollEarningRule> | null>(null);

  const handleOpenNew = () => {
    setEditingRule({
      code: "",
      description: "",
      type: "provento",
      calculation_type: "fixo",
      is_active: true,
      display_order: rules.length + 1
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule || !editingRule.code || !editingRule.description) return;
    onSaveRule(editingRule);
    setEditingRule(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#0043FF]" /> Catálogo de Verbas e Regras de Cálculo
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Configure as rubricas de proventos, adicionais e descontos aplicados nos cálculos da folha da empresa.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={handleOpenNew}
            className="bg-[#0043FF] hover:bg-blue-700 text-white text-xs font-bold py-2 px-3.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" /> Nova Verba
          </button>
        )}
      </div>

      {/* Modal / Form de Edição */}
      {editingRule && (
        <form onSubmit={handleSave} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs text-slate-900">
              {editingRule.id ? "Editar Verba / Rubrica" : "Cadastrar Nova Verba"}
            </h4>
            <button
              type="button"
              onClick={() => setEditingRule(null)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Código</label>
              <input
                type="text"
                required
                placeholder="Ex: 102, 501"
                value={editingRule.code || ""}
                onChange={(e) => setEditingRule({ ...editingRule, code: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl p-2 font-mono text-xs focus:outline-none focus:border-[#0043FF]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Descrição</label>
              <input
                type="text"
                required
                placeholder="Ex: Adicional de Periculosidade 30%"
                value={editingRule.description || ""}
                onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:border-[#0043FF]"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Tipo</label>
              <select
                value={editingRule.type || "provento"}
                onChange={(e) => setEditingRule({ ...editingRule, type: e.target.value as VerbaType })}
                className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:border-[#0043FF] cursor-pointer"
              >
                <option value="provento">Provento (+)</option>
                <option value="desconto">Desconto (-)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Método de Cálculo</label>
              <select
                value={editingRule.calculation_type || "fixo"}
                onChange={(e) =>
                  setEditingRule({ ...editingRule, calculation_type: e.target.value as PayrollCalculationType })
                }
                className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:border-[#0043FF] cursor-pointer"
              >
                <option value="fixo">Valor Fixo / Manual</option>
                <option value="horas_extras_50">Horas Extras 50% (Integração Ponto)</option>
                <option value="horas_extras_100">Horas Extras 100% (Domingos/Feriados)</option>
                <option value="noturno">Adicional Noturno 20%</option>
                <option value="dsr">DSR sobre Variáveis</option>
                <option value="periculosidade">Periculosidade (30% Salário Base)</option>
                <option value="insalubridade">Insalubridade (Grau Mínimo/Médio/Máximo)</option>
                <option value="ferias_gozo">Férias Gozadas + 1/3 Constitucional</option>
                <option value="decimo_terceiro">13º Salário</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="rule_active"
                checked={editingRule.is_active ?? true}
                onChange={(e) => setEditingRule({ ...editingRule, is_active: e.target.checked })}
                className="w-4 h-4 text-[#0043FF] rounded border-slate-300 focus:ring-[#0043FF] cursor-pointer"
              />
              <label htmlFor="rule_active" className="text-xs font-bold text-slate-800 cursor-pointer">
                Regra Ativa na Folha
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-5">
              <button
                type="submit"
                className="bg-[#0043FF] hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Save className="w-3.5 h-3.5" /> Salvar Regra
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tabela de Verbas */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
            <tr>
              <th className="py-3 px-4">Cód.</th>
              <th className="py-3 px-4">Descrição da Rubrica</th>
              <th className="py-3 px-4">Tipo</th>
              <th className="py-3 px-4">Método de Cálculo</th>
              <th className="py-3 px-4 text-center">Status</th>
              {canManage && <th className="py-3 px-4 text-right">Ação</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rules.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/60 transition">
                <td className="py-3 px-4 font-mono font-bold text-slate-800">{r.code}</td>
                <td className="py-3 px-4 font-bold text-slate-900">{r.description}</td>
                <td className="py-3 px-4">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      r.type === "provento"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {r.type === "provento" ? "Provento (+)" : "Desconto (-)"}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-600 capitalize">
                  {r.calculation_type.replace(/_/g, " ")}
                </td>
                <td className="py-3 px-4 text-center">
                  {r.is_active ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 text-[11px] font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ativa
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-400 text-[11px] font-bold">
                      <XCircle className="w-3.5 h-3.5" /> Inativa
                    </span>
                  )}
                </td>
                {canManage && (
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setEditingRule(r)}
                      className="text-[#0043FF] hover:text-blue-800 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Editar
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
