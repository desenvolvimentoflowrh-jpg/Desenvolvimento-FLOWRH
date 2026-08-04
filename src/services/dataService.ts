import {
  Company,
  UserProfile,
  Invitation,
  Training,
  TimeRecord,
  Post,
  PontoAuditLog
} from "../types";
import {
  INITIAL_COMPANIES,
  INITIAL_USERS,
  INITIAL_INVITATIONS,
  INITIAL_TRAININGS,
  INITIAL_TIME_RECORDS,
  INITIAL_POSTS,
  INITIAL_AUDIT_LOGS
} from "../utils/mockData";

export const dataService = {
  getCompanies(): Company[] {
    try {
      const saved = localStorage.getItem("flow_companies");
      return saved ? JSON.parse(saved) : INITIAL_COMPANIES;
    } catch {
      return INITIAL_COMPANIES;
    }
  },
  saveCompanies(companies: Company[]): void {
    localStorage.setItem("flow_companies", JSON.stringify(companies));
  },

  getUsers(): UserProfile[] {
    try {
      const saved = localStorage.getItem("flow_users");
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  },
  saveUsers(users: UserProfile[]): void {
    localStorage.setItem("flow_users", JSON.stringify(users));
  },

  getInvitations(): Invitation[] {
    try {
      const saved = localStorage.getItem("flow_invitations");
      return saved ? JSON.parse(saved) : INITIAL_INVITATIONS;
    } catch {
      return INITIAL_INVITATIONS;
    }
  },
  saveInvitations(invitations: Invitation[]): void {
    localStorage.setItem("flow_invitations", JSON.stringify(invitations));
  },

  getTrainings(): Training[] {
    try {
      const saved = localStorage.getItem("flow_trainings");
      return saved ? JSON.parse(saved) : INITIAL_TRAININGS;
    } catch {
      return INITIAL_TRAININGS;
    }
  },
  saveTrainings(trainings: Training[]): void {
    localStorage.setItem("flow_trainings", JSON.stringify(trainings));
  },

  getTimeRecords(): TimeRecord[] {
    try {
      const saved = localStorage.getItem("flow_time_records");
      return saved ? JSON.parse(saved) : INITIAL_TIME_RECORDS;
    } catch {
      return INITIAL_TIME_RECORDS;
    }
  },
  saveTimeRecords(records: TimeRecord[]): void {
    localStorage.setItem("flow_time_records", JSON.stringify(records));
  },

  getPosts(): Post[] {
    try {
      const saved = localStorage.getItem("flow_posts");
      return saved ? JSON.parse(saved) : INITIAL_POSTS;
    } catch {
      return INITIAL_POSTS;
    }
  },
  savePosts(posts: Post[]): void {
    localStorage.setItem("flow_posts", JSON.stringify(posts));
  },

  getAuditLogs(): PontoAuditLog[] {
    try {
      const saved = localStorage.getItem("flow_ponto_audit_logs");
      return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  },
  saveAuditLogs(logs: PontoAuditLog[]): void {
    localStorage.setItem("flow_ponto_audit_logs", JSON.stringify(logs));
  },
  addAuditLog(log: PontoAuditLog): void {
    const logs = this.getAuditLogs();
    const updated = [log, ...logs];
    this.saveAuditLogs(updated);
  }
};
