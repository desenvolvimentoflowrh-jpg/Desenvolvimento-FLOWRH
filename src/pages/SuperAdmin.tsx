import React, { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Building, Plus, Users, CheckCircle, Lock } from "lucide-react";
import { Company, UserProfile } from "../types";

interface SuperAdminProps {
  companies: Company[];
  users: UserProfile[];
  onAddCompany: (company: Company) => void;
}

export const SuperAdmin: React.FC<SuperAdminProps> = ({
  companies,
  users,
  onAddCompany
}) => {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [segment, setSegment] = useState("Tecnologia & Inovação");
  const [logoUrl, setLogoUrl] = useState(
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120"
  );
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !domain.trim()) return;

    const newCompany: Company = {
      id: `company-${Date.now()}`,
      name: name.trim(),
      domain: domain.trim().toLowerCase(),
      segment,
      logo_url: logoUrl,
      created_at: new Date().toISOString()
    };

    onAddCompany(newCompany);
    setName("");
    setDomain("");
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      {/* Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs text-purple-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-purple-400" /> Painel de Controle Multi-Tenant Super Admin
          </span>
          <h2 className="text-2xl font-black">Gestão Global de Empresas (Tenants)</h2>
          <p className="text-xs text-slate-300">
            Isolamento de dados por RLS ativado para todas as instâncias do PostgreSQL.
          </p>
        </div>

        <div className="bg-slate-800 border border-slate-700 px-6 py-3 rounded-2xl text-center">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
            Empresas Ativas
          </span>
          <span className="text-2xl font-black text-purple-400">{companies.length} Tenants</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Tenants List Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Organizações Cadastradas</span>
              <Building className="w-4 h-4 text-slate-400" />
            </h3>

            <div className="space-y-3">
              {companies.map((comp) => {
                const compUsersCount = users.filter((u) => u.company_id === comp.id).length;

                return (
                  <div
                    key={comp.id}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={comp.logo_url}
                        alt={comp.name}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                      />
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{comp.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{comp.domain}</div>
                        <div className="text-[9px] text-slate-500 font-medium">{comp.segment}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-[#0043FF] bg-blue-50 px-2.5 py-1 rounded-full uppercase">
                        {compUsersCount} Usuários
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Create Tenant Sidebar */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
              Provisionar Novo Tenant (Empresa)
            </h3>

            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Nova empresa provisionada com isolamento de dados!</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Nome da Organização
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: TechCorp Soluções"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:border-[#0043FF] focus:outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Domínio Corporativo
                </label>
                <input
                  type="text"
                  required
                  placeholder="techcorp.com.br"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:border-[#0043FF] focus:outline-none"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Segmento de Atuação
                </label>
                <input
                  type="text"
                  required
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:border-[#0043FF] focus:outline-none"
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-xl transition shadow flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Provisionar Tenant
              </button>
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
