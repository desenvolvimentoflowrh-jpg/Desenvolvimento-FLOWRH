export enum UserRole {
  COLLABORATOR = "collaborator",
  SUPERVISOR = "supervisor",
  HR_MANAGER = "hr_manager",
  SUPER_ADMIN = "super_admin",
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  company_id: string;
  name: string;
  department: string;
  hire_date: string;
  avatar: string;
  points_balance: number; // hours balance (positive or negative)
  active_streak: number; // consecutive onboarding or point record days
  birth_date?: string; // YYYY-MM-DD
  active?: boolean; // toggle to active or inactive user
  password?: string; // password for login authentication
}

// Alias requested in domain requirements
export type Funcionario = UserProfile;

export interface Company {
  id: string;
  name: string;
  segment: string;
  logo_url: string;
  domain?: string;
  created_at?: string;
}

export interface Invitation {
  id: string;
  email: string;
  company_id: string;
  role?: UserRole;
  status: "pending" | "accepted" | "cancelled";
  invited_by: string; // user name who invited
  sent_at: string;
}

export interface TimeRecord {
  id: string;
  user_id: string;
  user_name: string;
  company_id: string;
  timestamp: string;
  photo_url?: string;
  face_photo?: string;
  location: string | {
    lat: number;
    lng: number;
    address?: string;
  };
  type: "entrada" | "almoco_ida" | "almoco_volta" | "saida";
  status?: "approved" | "pending";
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  progress: number;
}

export interface Comment {
  id: string;
  user_name: string;
  user_avatar: string;
  text: string;
  created_at: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // List of user_ids who voted for this option
}

export interface Poll {
  question: string;
  options: PollOption[];
}

export interface BadgeAward {
  badge_name: string;
  icon: string;
  description: string;
  recipient_name: string;
  recipient_id: string;
}

export interface Post {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  user_role: string;
  user_department?: string;
  company_id: string;
  content: string;
  category: "aviso" | "operacao" | "comemoracao" | "treinamento" | "destaque";
  media_url?: string;
  media_type?: "image" | "pdf" | "video" | "none";
  likes: string[]; // List of user_ids who liked this post
  comments: Comment[];
  poll?: Poll;
  badge_award?: BadgeAward;
  created_at: string;
}

export interface Training {
  id: string;
  title: string;
  category: "seguranca" | "compliance" | "tecnico" | "soft_skills";
  status: "not_started" | "in_progress" | "completed";
  due_date: string;
  progress: number; // 0 to 100
}

export interface Holerite {
  id: string;
  user_id: string;
  month: string;
  year: number;
  gross_salary: number;
  net_salary: number;
  pdf_url?: string;
  status: "disponivel" | "pendente";
}
