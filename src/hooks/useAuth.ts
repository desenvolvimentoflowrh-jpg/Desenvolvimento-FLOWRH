import { useState, useEffect } from "react";
import { UserProfile, Company } from "../types";
import { dataService } from "../services/dataService";

export function useAuth(initialUsers?: UserProfile[], initialCompanies?: Company[]) {
  const users = initialUsers || dataService.getUsers();
  const companies = initialCompanies || dataService.getCompanies();

  // Always demand authentication on initial load - initial screen is strictly Login
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const savedUser = localStorage.getItem("flow_current_user");
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        // Fallback
      }
    }
    return users[0];
  });

  const [activeCompanyId, setActiveCompanyId] = useState<string>(() => {
    return currentUser?.company_id || "company-1";
  });

  useEffect(() => {
    if (currentUser) {
      setActiveCompanyId(currentUser.company_id);
      localStorage.setItem("flow_current_user", JSON.stringify(currentUser));
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem("flow_is_logged_in", isLoggedIn ? "true" : "false");
  }, [isLoggedIn]);

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("flow_is_logged_in");
    localStorage.removeItem("flow_current_user");
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    setActiveCompanyId(user.company_id);
    localStorage.setItem("flow_is_logged_in", "true");
    localStorage.setItem("flow_current_user", JSON.stringify(user));
  };

  const switchCompany = (companyId: string) => {
    setActiveCompanyId(companyId);
    const tenantUser = users.find((u) => u.company_id === companyId);
    if (tenantUser) {
      setCurrentUser(tenantUser);
    } else if (currentUser) {
      setCurrentUser({ ...currentUser, company_id: companyId });
    }
  };

  return {
    isLoggedIn,
    setIsLoggedIn,
    currentUser,
    setCurrentUser,
    activeCompanyId,
    setActiveCompanyId,
    loginCompanyId: activeCompanyId,
    setLoginCompanyId: setActiveCompanyId,
    logout: handleLogout,
    handleLogout,
    handleLoginSuccess,
    switchCompany
  };
}
