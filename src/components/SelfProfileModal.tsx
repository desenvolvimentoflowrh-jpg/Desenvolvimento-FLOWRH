import React, { useState } from "react";
import {
  Mail,
  Calendar,
  Lock,
  Upload,
  X,
  Pencil,
  Briefcase,
  UserCheck,
  CheckCircle,
  ArrowLeft
} from "lucide-react";
import { UserProfile } from "../types";
import { Modal } from "./Modal";
import { useUserPresence } from "../hooks/useUserPresence";
import { AvatarWithStatus } from "./AvatarWithStatus";
import { UserStatusSelector } from "./UserStatusSelector";

interface SelfProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  users: UserProfile[];
  onUpdateUser: (updated: UserProfile) => void;
}

export const SelfProfileModal: React.FC<SelfProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  onUpdateUser
}) => {
  const { currentStatus, updateStatus } = useUserPresence(currentUser);
  const [isEditing, setIsEditing] = useState(false);
  const [selfName, setSelfName] = useState(currentUser.name);
  const [selfEmail, setSelfEmail] = useState(currentUser.email);
  const [selfBirthDate, setSelfBirthDate] = useState(currentUser.birth_date || "");
  const [selfAvatar, setSelfAvatar] = useState(currentUser.avatar || "");
  const [selfAvatarError, setSelfAvatarError] = useState("");
  const [selfPassword, setSelfPassword] = useState(currentUser.password || "123456");
  const [showSelfPassword, setShowSelfPassword] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setSelfAvatarError("O arquivo enviado não é uma imagem válida.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSelfAvatarError("A imagem deve ter no máximo 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setSelfAvatar(e.target.result as string);
        setSelfAvatarError("");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selfName.trim() || !selfEmail.trim()) {
      alert("Por favor, preencha os campos obrigatórios (Nome e E-mail).");
      return;
    }
    if (selfPassword && selfPassword.length < 6) {
      alert("A senha deve conter no mínimo 6 caracteres.");
      return;
    }

    const emailLower = selfEmail.trim().toLowerCase();
    const exists = users.some(
      (u) => u.id !== currentUser.id && u.email.toLowerCase() === emailLower
    );
    if (exists) {
      alert("Este e-mail já está sendo utilizado por outro usuário.");
      return;
    }

    const updatedUser: UserProfile = {
      ...currentUser,
      name: selfName.trim(),
      email: emailLower,
      birth_date: selfBirthDate,
      avatar: selfAvatar || currentUser.avatar,
      password: selfPassword || currentUser.password || "123456"
    };

    onUpdateUser(updatedUser);
    setIsEditing(false);
    setSuccessMsg("Perfil atualizado com sucesso!");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const formattedBirthDate = currentUser.birth_date
    ? new Date(currentUser.birth_date + "T00:00:00").toLocaleDateString("pt-BR")
    : "Não informada";

  const formattedHireDate = currentUser.hire_date
    ? new Date(currentUser.hire_date + "T00:00:00").toLocaleDateString("pt-BR")
    : "Não informada";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      hideHeader={true}
      containerClassName="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
      contentPadding="p-0 overflow-y-auto"
    >
      {/* Decorative Gradient Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 h-28 rounded-t-3xl relative p-4 flex items-start justify-between">
        <div className="text-white/90 text-xs font-semibold flex items-center gap-1.5 pt-1 px-1">
          {isEditing && (
            <button
              onClick={() => setIsEditing(false)}
              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar</span>
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-full bg-slate-900/20 hover:bg-slate-900/40 text-white backdrop-blur-md transition cursor-pointer"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Header Profile Section with Overlapping Avatar */}
      <div className="px-6 pb-2 pt-0 flex flex-col items-center text-center -mt-12 mb-4">
        <div className="relative group">
          <AvatarWithStatus
            src={isEditing ? selfAvatar || currentUser.avatar : currentUser.avatar}
            alt={currentUser.name}
            status={currentStatus}
            size="xl"
            imgClassName="border-4 border-white shadow-md bg-white"
          />
        </div>

        <h3 className="text-lg font-bold text-slate-800 mt-2">{currentUser.name}</h3>
        <p className="text-sm text-slate-500 font-medium">{currentUser.email}</p>

        {/* Presence Selector in Profile Modal */}
        <div className="mt-3 w-full max-w-xs bg-slate-50 p-2 rounded-2xl border border-slate-100">
          <UserStatusSelector
            currentStatus={currentStatus}
            onStatusChange={(status) => updateStatus(status)}
            variant="compact"
          />
        </div>

        <div className="mt-2.5 flex items-center gap-2 flex-wrap justify-center">
          <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider border border-blue-100">
            {currentUser.department}
          </span>
          <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full capitalize">
            {currentUser.role === "hr_manager"
              ? "Gestor de RH"
              : currentUser.role === "team_leader"
              ? "Líder de Equipe"
              : "Colaborador"}
          </span>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="mx-6 mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* VIEW MODE */}
      {!isEditing ? (
        <div className="px-6 pb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* E-mail Corporativo */}
            <div className="bg-slate-50/80 border border-slate-100 p-3.5 rounded-2xl flex items-start gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-0.5">
                  E-mail Corporativo
                </span>
                <span className="text-sm font-semibold text-slate-700 truncate block">
                  {currentUser.email}
                </span>
              </div>
            </div>

            {/* Cargo / Função */}
            <div className="bg-slate-50/80 border border-slate-100 p-3.5 rounded-2xl flex items-start gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-0.5">
                  Cargo / Função
                </span>
                <span className="text-sm font-semibold text-slate-700 truncate block">
                  {currentUser.role === "hr_manager"
                    ? "Gestor de RH"
                    : currentUser.role === "team_leader"
                    ? "Líder de Equipe"
                    : "Colaborador"}
                </span>
              </div>
            </div>

            {/* Data de Nascimento */}
            <div className="bg-slate-50/80 border border-slate-100 p-3.5 rounded-2xl flex items-start gap-3">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-0.5">
                  Data de Nascimento
                </span>
                <span className="text-sm font-semibold text-slate-700 block">
                  {formattedBirthDate}
                </span>
              </div>
            </div>

            {/* Data de Contratação */}
            <div className="bg-slate-50/80 border border-slate-100 p-3.5 rounded-2xl flex items-start gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-0.5">
                  Data de Contratação
                </span>
                <span className="text-sm font-semibold text-slate-700 block">
                  {formattedHireDate}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-slate-100 pt-4 mt-6 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="text-slate-600 hover:bg-slate-100 rounded-xl px-4 py-2.5 text-xs font-semibold transition cursor-pointer"
            >
              Fechar
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl px-5 py-2.5 text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Editar Dados</span>
            </button>
          </div>
        </div>
      ) : (
        /* EDIT MODE FORM */
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-3">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Foto de Perfil
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition ${
                isDragging
                  ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/40"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800"
              }`}
            >
              <input
                type="file"
                accept="image/*"
                id="avatar-upload"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <label htmlFor="avatar-upload" className="cursor-pointer flex flex-col items-center">
                <Upload className="w-5 h-5 text-blue-600 mb-1" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Arraste uma foto ou clique para selecionar
                </span>
                <span className="text-[10px] text-slate-400">PNG, JPG até 5MB</span>
              </label>
            </div>
            {selfAvatarError && (
              <p className="text-rose-500 text-[10px] font-bold mt-1">⚠️ {selfAvatarError}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
              Nome Completo
            </label>
            <input
              type="text"
              required
              className="w-full text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-xl px-3.5 py-2.5 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all"
              value={selfName}
              onChange={(e) => setSelfName(e.target.value)}
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
              value={selfEmail}
              onChange={(e) => setSelfEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
              Data de Nascimento
            </label>
            <input
              type="date"
              className="w-full text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-xl px-3.5 py-2.5 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all"
              value={selfBirthDate}
              onChange={(e) => setSelfBirthDate(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
              Senha de Acesso
            </label>
            <div className="relative">
              <input
                type={showSelfPassword ? "text" : "password"}
                required
                className="w-full text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-xl pl-3.5 pr-10 py-2.5 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all"
                value={selfPassword}
                onChange={(e) => setSelfPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowSelfPassword(!showSelfPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <Lock className={`w-4 h-4 ${showSelfPassword ? "text-blue-600" : ""}`} />
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium rounded-xl px-4 py-2.5 text-xs transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl px-6 py-2.5 text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

