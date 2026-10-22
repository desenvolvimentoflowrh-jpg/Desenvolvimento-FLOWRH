import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, X, ArrowRight } from "lucide-react";

import { useAuth } from "./hooks/useAuth";
import { useHRData } from "./hooks/useHRData";
import { useChat } from "./hooks/useChat";
import { UserProfile } from "./types";
import { canAccessGestao } from "./utils/rbac";

// Extracted UI Components
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { SelfProfileModal } from "./components/SelfProfileModal";
import { EditUserModal } from "./components/EditUserModal";
import { SupportModal } from "./components/SupportModal";
import { ConfirmModal } from "./components/ConfirmModal";
import { FallingSwirlSnowflakes } from "./components/FallingSwirlSnowflakes";

// Pages
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Mural } from "./pages/Mural";
import { ChatPage } from "./pages/Chat";
import { Ponto } from "./pages/Ponto";
import { Ferias } from "./pages/Ferias";
import { Funcionarios } from "./pages/Funcionarios";
import { PDI } from "./pages/PDI";
import { Onboarding } from "./pages/Onboarding";
import { FlowAI } from "./pages/FlowAI";
import { SuperAdmin } from "./pages/SuperAdmin";
import { Configuracoes } from "./pages/Configuracoes";
import { FolhaPagamento } from "./pages/FolhaPagamento";
import { LGPDPortal } from "./pages/LGPDPortal";
import { LGPDConsentModal } from "./components/LGPDConsentModal";

export function App() {
  const {
    isLoggedIn,
    currentUser,
    loginCompanyId,
    setCurrentUser,
    setLoginCompanyId,
    handleLoginSuccess,
    handleLogout
  } = useAuth();

  const {
    users,
    companies,
    posts,
    timeRecords,
    goals,
    trainings,
    invitations,
    addUser,
    updateUser,
    deleteUser,
    addCompany,
    addPost,
    updatePost,
    deletePost,
    addRecord,
    addInvitation
  } = useHRData();

  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [isOnboarding, setIsOnboarding] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [pageTheme, setPageTheme] = useState<string>(() => {
    return localStorage.getItem("flowrh_theme") || "blue";
  });

  // Global Chat & Real-Time Unread Notification Engine
  const chatState = useChat(currentUser, currentTab === "chat");

  React.useEffect(() => {
    localStorage.setItem("flowrh_theme", pageTheme);
    const root = document.documentElement;

    if (pageTheme === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", pageTheme);
    }
  }, [pageTheme]);

  const [initialPointType, setInitialPointType] = useState<
    "entrada" | "almoco_ida" | "almoco_volta" | "saida"
  >("entrada");

  // Modals state
  const [isSelfProfileOpen, setIsSelfProfileOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [onboardingTargetUser, setOnboardingTargetUser] = useState<UserProfile | null>(null);

  // Fallback active company
  const activeCompany =
    companies.find((c) => c.id === (currentUser?.company_id || loginCompanyId)) ||
    companies[0];

  if (!isLoggedIn || !currentUser) {
    return (
      <Login
        users={users}
        companies={companies}
        onLoginSuccess={(user) => {
          handleLoginSuccess(user);
          setCurrentTab("dashboard");
        }}
      />
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50 font-sans text-slate-800 antialiased selection:bg-[#0043FF] selection:text-white overflow-hidden">
      {/* Decorative background effects */}
      <FallingSwirlSnowflakes />

      {/* Header Bar */}
      <Header
        currentUser={currentUser}
        companies={companies}
        activeCompanyId={activeCompany.id}
        users={users}
        posts={posts}
        onNavigateTab={(tab) => setCurrentTab(tab)}
        onSwitchCompany={(id) => setLoginCompanyId(id)}
        onSelectCompany={(id) => setLoginCompanyId(id)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenProfileModal={() => setIsSelfProfileOpen(true)}
        onOpenSelfProfile={() => setIsSelfProfileOpen(true)}
        onOpenSupportModal={() => setIsSupportOpen(true)}
        onOpenSupport={() => setIsSupportOpen(true)}
        onLogout={handleLogout}
        pageTheme={pageTheme}
        setPageTheme={setPageTheme}
        onResetDatabase={() => {
          localStorage.clear();
          window.location.reload();
        }}
        unreadChatCount={chatState.totalUnreadCount}
        unreadChannels={chatState.unreadChannels}
        onSelectChatChannel={(channelId) => chatState.selectChannel(channelId)}
        onMarkAllChatRead={() => chatState.markAllAsRead()}
      />

      <div className="flex-1 flex h-full w-full overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={(tab) => setCurrentTab(tab)}
          onSelectTab={(tab) => setCurrentTab(tab)}
          isOnboarding={isOnboarding}
          setIsOnboarding={setIsOnboarding}
          currentUser={currentUser}
          timeRecords={timeRecords}
          unreadChatCount={chatState.totalUnreadCount}
          unreadChannels={chatState.unreadChannels}
        />

        {/* Main Content View Container */}
        <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            {currentTab === "dashboard" && (
              <Dashboard
                key="dashboard"
                currentUser={currentUser}
                companies={companies}
                activeCompanyId={activeCompany.id}
                users={users}
                invitations={invitations}
                posts={posts}
                trainings={trainings}
                onNavigateTab={(tab) => setCurrentTab(tab)}
                onSetPointType={(type) => setInitialPointType(type)}
              />
            )}

            {currentTab === "mural" && (
              <Mural
                key="mural"
                currentUser={currentUser}
                users={users}
                posts={posts}
                activeCompanyId={activeCompany.id}
                onAddPost={addPost}
                onUpdatePost={updatePost}
                onDeletePost={deletePost}
              />
            )}

            {currentTab === "chat" && (
              <ChatPage
                key="chat"
                currentUser={currentUser}
                allUsers={users}
                chatState={chatState}
              />
            )}

            {currentTab === "ponto" && (
              <Ponto
                key="ponto"
                currentUser={currentUser}
                timeRecords={timeRecords}
                activeCompanyId={activeCompany.id}
                initialPointType={initialPointType}
                onAddRecord={addRecord}
              />
            )}

            {currentTab === "ferias" && (
              <Ferias
                key="ferias"
                currentUser={currentUser}
              />
            )}

            {currentTab === "funcionarios" && canAccessGestao(currentUser) && (
              <Funcionarios
                key="funcionarios"
                currentUser={currentUser}
                users={users}
                invitations={invitations}
                posts={posts}
                activeCompanyId={activeCompany.id}
                onAddUser={addUser}
                onUpdateUser={updateUser}
                onDeleteUser={(userId) => setDeletingUserId(userId)}
                onAddInvitation={addInvitation}
                onEditUserClick={(user) => setEditingUser(user)}
                onOpenOnboardingForUser={(target) => {
                  setOnboardingTargetUser(target);
                  setCurrentTab("onboarding");
                }}
              />
            )}

            {currentTab === "folha" && canAccessGestao(currentUser) && (
              <FolhaPagamento
                key="folha"
                currentUser={currentUser}
                activeCompany={activeCompany}
                allUsers={users}
                timeRecords={timeRecords}
              />
            )}

            {currentTab === "pdi" && (
              <PDI
                key="pdi"
                currentUser={currentUser}
                goals={goals}
                trainings={trainings}
              />
            )}

            {currentTab === "onboarding" && canAccessGestao(currentUser) && (
              <Onboarding
                key="onboarding"
                currentUser={currentUser}
                users={users}
                targetUser={onboardingTargetUser}
                onUpdateUser={updateUser}
                onBackToGestao={() => setCurrentTab("funcionarios")}
              />
            )}

            {currentTab === "flowai" && (
              <FlowAI
                key="flowai"
                currentUser={currentUser}
                activeCompany={activeCompany}
              />
            )}

            {currentTab === "superadmin" && (
              <SuperAdmin
                key="superadmin"
                companies={companies}
                users={users}
                onAddCompany={addCompany}
              />
            )}

            {currentTab === "configuracoes" && (
              <Configuracoes
                key="configuracoes"
                currentUser={currentUser}
                activeCompany={activeCompany}
                companies={companies}
                activeCompanyId={activeCompany.id}
                onSwitchCompany={(id) => setLoginCompanyId(id)}
                onResetDatabase={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                users={users}
              />
            )}

            {currentTab === "lgpd" && (
              <LGPDPortal
                key="lgpd"
                currentUser={currentUser}
              />
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Consentimento & Privacidade LGPD */}
      <LGPDConsentModal
        currentUser={currentUser}
        onOpenPortal={() => setCurrentTab("lgpd")}
      />

      {/* Global Modals */}
      <SelfProfileModal
        isOpen={isSelfProfileOpen}
        onClose={() => setIsSelfProfileOpen(false)}
        currentUser={currentUser}
        users={users}
        onUpdateUser={(updated) => {
          updateUser(updated);
          setCurrentUser(updated);
        }}
      />

      <EditUserModal
        isOpen={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        onSave={(updated) => updateUser(updated)}
      />

      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />

      <ConfirmModal
        isOpen={Boolean(deletingUserId)}
        onClose={() => setDeletingUserId(null)}
        onConfirm={() => {
          if (deletingUserId) {
            deleteUser(deletingUserId);
            setDeletingUserId(null);
          }
        }}
        title="Excluir Colaborador"
        message="Tem certeza que deseja excluir este colaborador? Esta ação revogará todos os acessos do usuário nesta empresa."
        confirmText="Confirmar Exclusão"
      />

      {/* Notificação Flutuante em Tempo Real de Nova Mensagem Não Lida */}
      <AnimatePresence>
        {chatState.latestToast && (
          <motion.div
            key={chatState.latestToast.id}
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-5 right-5 z-50 w-80 sm:w-92 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700/80 p-4 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#0043FF] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 bg-rose-600 text-white text-[9px] font-black uppercase rounded-md">
                      Nova mensagem
                    </span>
                    <span className="text-xs font-extrabold text-white truncate">
                      {chatState.latestToast.senderName}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {chatState.latestToast.channelType === "group"
                      ? `Em #${chatState.latestToast.channelName}`
                      : "Mensagem Direta (DM)"}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={chatState.dismissToast}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                title="Fechar notificação"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-200 bg-slate-800/80 rounded-xl px-3 py-2 border border-slate-700/60 line-clamp-2">
              {chatState.latestToast.content}
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={chatState.dismissToast}
                className="px-3 py-1.5 text-[11px] font-bold text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
              >
                Depois
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetChanId = chatState.latestToast?.channelId;
                  if (targetChanId) {
                    chatState.selectChannel(targetChanId);
                  }
                  chatState.dismissToast();
                  setCurrentTab("chat");
                }}
                className="px-3.5 py-1.5 bg-[#0043FF] hover:bg-blue-600 text-white text-[11px] font-extrabold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Ler e Responder</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
