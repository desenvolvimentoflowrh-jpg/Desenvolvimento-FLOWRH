import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";

import { useAuth } from "./hooks/useAuth";
import { useHRData } from "./hooks/useHRData";
import { UserProfile, UserRole } from "./types";

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
import { Funcionarios } from "./pages/Funcionarios";
import { PDI } from "./pages/PDI";
import { Onboarding } from "./pages/Onboarding";
import { FlowAI } from "./pages/FlowAI";
import { SuperAdmin } from "./pages/SuperAdmin";

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

            {currentTab === "funcionarios" && (
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

            {currentTab === "onboarding" && (
              <Onboarding
                key="onboarding"
                currentUser={currentUser}
                users={users}
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
          </AnimatePresence>
        </main>
      </div>

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
    </div>
  );
}

export default App;
