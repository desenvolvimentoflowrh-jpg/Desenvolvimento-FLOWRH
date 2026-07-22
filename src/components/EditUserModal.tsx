import React, { useState, useEffect } from "react";
import { UserProfile, UserRole } from "../types";
import { Modal } from "./Modal";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onSave: (updatedUser: UserProfile) => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.COLLABORATOR);
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setDepartment(user.department);
      setHireDate(user.hire_date);
      setRole(user.role);
      setActive(user.active !== false);
    }
  }, [user]);

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...user,
      name,
      email,
      department,
      hire_date: hireDate,
      role,
      active
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Editar Funcionário: ${user.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
            Nome Completo
          </label>
          <input
            type="text"
            required
            className="w-full text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-xl px-3.5 py-2.5 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
            E-mail Corporativo
          </label>
          <input
            type="email"
            required
            className="w-full text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-xl px-3.5 py-2.5 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
              Departamento
            </label>
            <input
              type="text"
              required
              className="w-full text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-xl px-3.5 py-2.5 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
              Data de Admissão
            </label>
            <input
              type="date"
              required
              className="w-full text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-xl px-3.5 py-2.5 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all"
              value={hireDate}
              onChange={(e) => setHireDate(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
              Função (Role RBAC)
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-xl px-3.5 py-2.5 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all"
            >
              <option value={UserRole.COLLABORATOR}>Colaborador</option>
              <option value={UserRole.SUPERVISOR}>Líder / Supervisor</option>
              <option value={UserRole.HR_MANAGER}>Gestor de RH</option>
              <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
              Status da Conta
            </label>
            <button
              type="button"
              onClick={() => setActive(!active)}
              className={`w-full px-3.5 py-2.5 rounded-xl font-medium transition-all flex items-center justify-between border cursor-pointer text-xs ${
                active
                  ? "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300"
                  : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${active ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                <span className="font-semibold text-xs">{active ? "Conta Ativa" : "Conta Inativa"}</span>
              </div>
              
              <div
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  active ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-600"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                    active ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium rounded-xl px-4 py-2.5 text-xs transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl px-6 py-2.5 text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            Salvar Alterações
          </button>
        </div>
      </form>
    </Modal>
  );
};
