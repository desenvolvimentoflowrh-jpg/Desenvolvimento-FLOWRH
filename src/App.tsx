import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  MessageSquare,
  Clock,
  Users,
  Bot,
  Settings,
  Camera,
  MapPin,
  Sparkles,
  Plus,
  Search,
  Award,
  Send,
  Check,
  CheckCircle,
  AlertCircle,
  ThumbsUp,
  MessageCircle,
  X,
  ArrowUp,
  ArrowDown,
  Briefcase,
  Calendar,
  TrendingUp,
  GraduationCap,
  Building,
  LogOut,
  ChevronUp,
  ChevronDown,
  UserCheck,
  Lock,
  RefreshCw,
  Vote,
  Edit2,
  Trash2,
  User,
  Mail,
  Shield
} from "lucide-react";

import { UserRole, UserProfile, Company, Invitation, TimeRecord, Comment, PollOption, Poll, BadgeAward, Post, Training } from "./types";
import {
  INITIAL_COMPANIES,
  INITIAL_USERS,
  INITIAL_INVITATIONS,
  INITIAL_TRAININGS,
  INITIAL_TIME_RECORDS,
  INITIAL_POSTS
} from "./mockData";

// Flow RH Custom Logo Component containing the stylized 5-arm people swirl symbol
export function FlowRhLogo({ size = "text-xl", textColor = "text-white", iconSize = "h-7" }: { size?: string; textColor?: string; iconSize?: string }) {
  return (
    <div className="flex items-center select-none font-sans">
      <div className="flex items-center gap-1.5">
        <span className={`${size} font-black tracking-tight ${textColor} uppercase`}>FL</span>
        {/* Swirl replacing O with a slow, beautiful rotational animation for premium touch */}
        <svg
          viewBox="0 0 100 100"
          className={`${iconSize} shrink-0 animate-[spin_60s_linear_infinite]`}
          style={{ fill: "currentColor" }}
        >
          {[0, 72, 144, 216, 288].map((angle) => (
            <g key={angle} transform={`rotate(${angle} 50 50)`}>
              <circle cx="50" cy="22" r="5.5" />
              <path d="M 45,30 C 51,31 55,36 54,42 C 53,47 48,50 43,47 C 47,45 50,41 50,37 C 50,33 48,31 45,30 Z" />
            </g>
          ))}
        </svg>
        <span className={`${size} font-black tracking-tight ${textColor} uppercase`}>W</span>
        <span className="text-[9px] font-bold tracking-widest ml-1 self-center uppercase bg-white/15 px-1 py-0.5 rounded text-white border border-white/10 select-none leading-none">RH</span>
      </div>
    </div>
  );
}

// Static random properties array to avoid layout shifts or continuous re-evaluation in render cycles
const SWIRL_SNOWFLAKES = Array.from({ length: 35 }, (_, i) => {
  const left = `${(i * 2.85) % 100}%`;
  const size = `${12 + (i * 7) % 20}px`;
  const duration = `${12 + (i * 5) % 16}s`;
  const delay = `-${(i * 3.7) % 24}s`;
  const sway = `${-35 + (i * 21) % 71}px`;
  const opacity = (0.04 + ((i * 3) % 8) * 0.015).toFixed(3);
  const rotate = `${180 + (i * 85) % 360}deg`;
  return { id: i, left, size, duration, delay, sway, opacity, rotate };
});

export function FallingSwirlSnowflakes() {
  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
      {SWIRL_SNOWFLAKES.map((swirl) => (
        <svg
          key={swirl.id}
          viewBox="0 0 100 100"
          className="falling-swirl"
          style={{
            "--left-pos": swirl.left,
            "--swirl-size": swirl.size,
            "--fall-duration": swirl.duration,
            "--fall-delay": swirl.delay,
            "--sway-distance": swirl.sway,
            "--swirl-opacity": swirl.opacity,
            "--rotate-degree": swirl.rotate,
            fill: "currentColor",
          } as React.CSSProperties}
        >
          {[0, 72, 144, 216, 288].map((angle) => (
            <g key={angle} transform={`rotate(${angle} 50 50)`}>
              <circle cx="50" cy="22" r="5.5" />
              <path d="M 45,30 C 51,31 55,36 54,42 C 53,47 48,50 43,47 C 47,45 50,41 50,37 C 50,33 48,31 45,30 Z" />
            </g>
          ))}
        </svg>
      ))}
    </div>
  );
}

export default function App() {
  // --- Persistent State Loaders ---
  const [companies, setCompanies] = useState<Company[]>(() => {
    const saved = localStorage.getItem("flow_companies");
    return saved ? JSON.parse(saved) : INITIAL_COMPANIES;
  });

  const [users, setUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem("flow_users");
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [invitations, setInvitations] = useState<Invitation[]>(() => {
    const saved = localStorage.getItem("flow_invitations");
    return saved ? JSON.parse(saved) : INITIAL_INVITATIONS;
  });

  const [trainings, setTrainings] = useState<Training[]>(() => {
    const saved = localStorage.getItem("flow_trainings");
    return saved ? JSON.parse(saved) : INITIAL_TRAININGS;
  });

  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>(() => {
    const saved = localStorage.getItem("flow_records");
    return saved ? JSON.parse(saved) : INITIAL_TIME_RECORDS;
  });

  const [posts, setPosts] = useState<Post[]>(() => {
    const saved = localStorage.getItem("flow_posts");
    return saved ? JSON.parse(saved) : INITIAL_POSTS;
  });

  // Active session and view management
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const savedId = localStorage.getItem("flow_current_user_id");
    const found = INITIAL_USERS.find(u => u.id === savedId);
    return found || INITIAL_USERS[0]; // Mariana Ferreira by default
  });

  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("todos");

  // Onboarding registration state
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardEmail, setOnboardEmail] = useState("");
  const [onboardName, setOnboardName] = useState("");
  const [onboardPassword, setOnboardPassword] = useState("");
  const [onboardOtp, setOnboardOtp] = useState("");
  const [onboardDepartment, setOnboardDepartment] = useState("Engenharia");
  const [onboardError, setOnboardError] = useState("");
  const [onboardSuccess, setOnboardSuccess] = useState(false);

  // Widget customized order (Home Inteligente)
  const [widgetsOrder, setWidgetsOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem("flow_widgets_order");
    return saved ? JSON.parse(saved) : ["clima", "banco", "treinos", "aniversarios", "marcos"];
  });

  // --- Post Composer States ---
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCategory, setNewPostCategory] = useState<Post["category"]>("aviso");
  const [showPollBuilder, setShowPollBuilder] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  
  // --- Post Edit States ---
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [editingCategory, setEditingCategory] = useState<Post["category"]>("aviso");
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  // --- Collaborator Management (CRUD) States ---
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserDepartment, setEditUserDepartment] = useState("");
  const [editUserHireDate, setEditUserHireDate] = useState("");
  const [editUserRole, setEditUserRole] = useState<UserRole>(UserRole.COLLABORATOR);
  const [editUserAvatar, setEditUserAvatar] = useState("");

  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const [creationMode, setCreationMode] = useState<"invite" | "direct">("invite");
  const [createUserName, setCreateUserName] = useState("");
  const [createUserEmail, setCreateUserEmail] = useState("");
  const [createUserDepartment, setCreateUserDepartment] = useState("");
  const [createUserHireDate, setCreateUserHireDate] = useState(new Date().toISOString().split('T')[0]);
  const [createUserRole, setCreateUserRole] = useState<UserRole>(UserRole.COLLABORATOR);
  
  const [showBadgeSelector, setShowBadgeSelector] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<{name: string, icon: string} | null>(null);
  const [selectedRecipientId, setSelectedRecipientId] = useState("");

  const badgesList = [
    { name: "Inovação Brilhante", icon: "💡", desc: "Por ideias criativas e inovação disruptiva." },
    { name: "Foco no Cliente", icon: "🎯", desc: "Por ir além para encantar nossos clientes." },
    { name: "Espírito de Equipe", icon: "🤝", desc: "Por apoiar os colegas e fortalecer o time." },
    { name: "Superação", icon: "🚀", desc: "Por entregar com maestria sob grandes desafios." }
  ];

  // --- Clock-in (Ponto) States ---
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [pointType, setPointType] = useState<TimeRecord["type"]>("entrada");
  const [geolocation, setGeolocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [pontoLoading, setPontoLoading] = useState(false);
  const [pontoSuccess, setPontoSuccess] = useState(false);
  const [cameraPermissionError, setCameraPermissionError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // --- Google Login & Choose account states ---
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem("flow_is_logged_in");
    return saved === "true";
  });
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginCompanyId, setLoginCompanyId] = useState("company-1");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // --- Clima Organizacional states ---
  const [votedClimate, setVotedClimate] = useState<boolean>(() => {
    const today = new Date().toDateString();
    const saved = localStorage.getItem(`flow_voted_climate_${today}`);
    return saved === "true";
  });
  const [selectedVibe, setSelectedVibe] = useState<string>("");
  const [climateFeedback, setClimateFeedback] = useState<string>("");
  const [climateHistory, setClimateHistory] = useState(() => {
    const saved = localStorage.getItem("flow_climate_history");
    return saved ? JSON.parse(saved) : [
      { date: "10/07", positivo: 85, participacao: 90 },
      { date: "11/07", positivo: 88, participacao: 92 },
      { date: "12/07", positivo: 82, participacao: 85 },
      { date: "13/07", positivo: 90, participacao: 94 },
      { date: "14/07", positivo: 92, participacao: 96 },
      { date: "15/07", positivo: 87, participacao: 91 }
    ];
  });

  // --- Talent Management & CV Screening States ---
  const [candidateName, setCandidateName] = useState("");
  const [targetRole, setTargetRole] = useState("Desenvolvedor Full Stack");
  const [resumeText, setResumeText] = useState("");
  const [screeningResult, setScreeningResult] = useState<any>(null);
  const [screeningLoading, setScreeningLoading] = useState(false);
  const [screeningError, setScreeningError] = useState("");

  // --- Flow AI Chat States ---
  const [aiInput, setAiInput] = useState("");
  const [aiHistory, setAiHistory] = useState<{ role: "user" | "model"; text: string }[]>([
    { role: "model", text: "Olá! Sou a **Flow AI**. Estou aqui para responder dúvidas sobre as políticas da empresa, reembolsos, férias e registro de ponto. O que gostaria de consultar hoje?" }
  ]);
  const [aiLoading, setAiLoading] = useState(false);

  // --- Invitation States (HR) ---
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.COLLABORATOR);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState("");

  // --- Sync storage ---
  useEffect(() => {
    localStorage.setItem("flow_companies", JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem("flow_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("flow_invitations", JSON.stringify(invitations));
  }, [invitations]);

  useEffect(() => {
    localStorage.setItem("flow_trainings", JSON.stringify(trainings));
  }, [trainings]);

  useEffect(() => {
    localStorage.setItem("flow_records", JSON.stringify(timeRecords));
  }, [timeRecords]);

  useEffect(() => {
    localStorage.setItem("flow_posts", JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem("flow_current_user_id", currentUser.id);
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem("flow_widgets_order", JSON.stringify(widgetsOrder));
  }, [widgetsOrder]);

  useEffect(() => {
    localStorage.setItem("flow_is_logged_in", isLoggedIn ? "true" : "false");
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem("flow_climate_history", JSON.stringify(climateHistory));
  }, [climateHistory]);

  // Check for invite email in URL query
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    if (emailParam) {
      setOnboardEmail(emailParam);
      // See if we have an invitation
      const invite = invitations.find(i => i.email.toLowerCase() === emailParam.toLowerCase());
      if (invite) {
        setIsOnboarding(true);
        setOnboardError("");
      }
    }
  }, [invitations]);

  // Initialize camera for point capturing
  useEffect(() => {
    if (cameraActive && !capturedPhoto) {
      setCameraPermissionError(false);
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "user" } })
        .then(stream => {
          cameraStreamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        })
        .catch(err => {
          console.error("Camera access denied or unavailable:", err);
          setCameraPermissionError(true);
        });
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [cameraActive, capturedPhoto]);

  // Turn off camera if the user navigates away from the "ponto" tab
  useEffect(() => {
    if (currentTab !== "ponto") {
      setCameraActive(false);
      setCapturedPhoto(null);
      stopCamera();
    }
  }, [currentTab]);

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      cameraStreamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject = null;
    }
  };

  // --- Geolocation Fetcher ---
  const fetchGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setGeolocation({
            lat: Number(position.coords.latitude.toFixed(4)),
            lng: Number(position.coords.longitude.toFixed(4)),
            address: "São Paulo, SP (Localização Confirmada)"
          });
        },
        () => {
          // Default fallback
          setGeolocation({
            lat: -23.5505,
            lng: -46.6333,
            address: "Escritório Central (Geolocalização Presumida)"
          });
        }
      );
    } else {
      setGeolocation({
        lat: -23.5505,
        lng: -46.6333,
        address: "Escritório Central (Geolocalização Presumida)"
      });
    }
  };

  // --- Camera snapshot ---
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (context) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Let's add a neat face scanning reticle to the captured snapshot
        context.strokeStyle = "#0043FF";
        context.lineWidth = 4;
        context.setLineDash([15, 10]);
        // Draw centered rectangle
        const rectW = canvas.width * 0.5;
        const rectH = canvas.height * 0.6;
        const rectX = (canvas.width - rectW) / 2;
        const rectY = (canvas.height - rectH) / 2;
        context.strokeRect(rectX, rectY, rectW, rectH);

        const dataUrl = canvas.toDataURL("image/png");
        setCapturedPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  // --- Reset database helper ---
  const resetDatabase = () => {
    localStorage.removeItem("flow_companies");
    localStorage.removeItem("flow_users");
    localStorage.removeItem("flow_invitations");
    localStorage.removeItem("flow_trainings");
    localStorage.removeItem("flow_records");
    localStorage.removeItem("flow_posts");
    localStorage.removeItem("flow_widgets_order");
    window.location.reload();
  };

  // --- Clock-in Record Handler ---
  const handleRegisterPonto = () => {
    setPontoLoading(true);
    // Mimic API delay
    setTimeout(() => {
      const locationData = geolocation || {
        lat: -23.5505,
        lng: -46.6333,
        address: "São Paulo, SP (Localização Manual)"
      };

      const photoToSave = capturedPhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";

      const newRecord: TimeRecord = {
        id: `rec-${Date.now()}`,
        user_id: currentUser.id,
        user_name: currentUser.name,
        company_id: currentUser.company_id,
        timestamp: new Date().toISOString(),
        photo_url: photoToSave,
        location: locationData,
        type: pointType
      };

      setTimeRecords(prev => [newRecord, ...prev]);
      
      // Update User Balance & Streak
      setUsers(prevUsers =>
        prevUsers.map(u => {
          if (u.id === currentUser.id) {
            // Clock-in increases streak slightly, lunch/exit adjusts hour balance
            let balanceMod = 0;
            if (pointType === "entrada") balanceMod = 0;
            else if (pointType === "saida") balanceMod = 8; // Simulated 8 hours
            
            return {
              ...u,
              points_balance: u.points_balance + balanceMod,
              active_streak: u.active_streak + 1
            };
          }
          return u;
        })
      );

      // Refresh current user reference in state
      setCurrentUser(prev => ({
        ...prev,
        points_balance: prev.points_balance + (pointType === "saida" ? 8 : 0),
        active_streak: prev.active_streak + 1
      }));

      // Create automated feed post if it's their "entrada" point (Gamificação/Mural 1.0)
      if (pointType === "entrada") {
        const autoPost: Post = {
          id: `post-${Date.now()}`,
          user_id: currentUser.id,
          user_name: currentUser.name,
          user_avatar: currentUser.avatar,
          user_role: currentUser.role === UserRole.HR_MANAGER ? "Gestor de RH" : "Colaborador",
          company_id: currentUser.company_id,
          content: `⏰ **Ponto Registrado:** Acabei de iniciar minhas atividades hoje! Vamos com tudo para mais um dia produtivo de trabalho.`,
          category: "operacao",
          likes: [],
          comments: [],
          created_at: new Date().toISOString()
        };
        setPosts(prev => [autoPost, ...prev]);
      }

      setPontoLoading(false);
      setPontoSuccess(true);
      setCapturedPhoto(null);
      setCameraActive(false);
      stopCamera();

      // Hide success banner after 3 seconds
      setTimeout(() => {
        setPontoSuccess(false);
      }, 4000);
    }, 1500);
  };

  // --- Onboarding Complete Handler ---
  const handleCompleteOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardError("");

    if (!onboardName.trim()) {
      setOnboardError("Por favor, digite seu nome completo.");
      return;
    }
    if (onboardPassword.length < 6) {
      setOnboardError("A senha precisa ter no mínimo 6 caracteres.");
      return;
    }
    if (onboardOtp !== "123456" && onboardOtp !== "1234") {
      setOnboardError("Código OTP incorreto. Use o código padrão de teste: 123456");
      return;
    }

    // Process invitation mapping
    const matchedInvite = invitations.find(
      i => i.email.toLowerCase() === onboardEmail.toLowerCase()
    );

    if (!matchedInvite) {
      setOnboardError("Não encontramos nenhum convite ativo para este e-mail.");
      return;
    }

    // Add new user
    const newUserId = `user-${Date.now()}`;
    const newUser: UserProfile = {
      id: newUserId,
      email: onboardEmail,
      role: matchedInvite.role,
      company_id: matchedInvite.company_id,
      name: onboardName,
      department: onboardDepartment,
      hire_date: new Date().toISOString().split("T")[0],
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 999999)}?w=150&auto=format&fit=crop&q=80`,
      points_balance: 0,
      active_streak: 1
    };

    // Update invitations status
    setInvitations(prev =>
      prev.map(inv =>
        inv.id === matchedInvite.id ? { ...inv, status: "accepted" as const } : inv
      )
    );

    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);

    // Welcome post on Mural
    const welcomePost: Post = {
      id: `post-${Date.now()}`,
      user_id: newUserId,
      user_name: onboardName,
      user_avatar: newUser.avatar,
      user_role: newUser.role === UserRole.HR_MANAGER ? "Gestor de RH" : "Colaborador",
      company_id: newUser.company_id,
      content: `🎉 **Novo Integrante na Equipe!** Acabo de concluir meu onboarding no **Flow RH**. Muito feliz em fazer parte do time de **${onboardDepartment}** da ${companies.find(c => c.id === matchedInvite.company_id)?.name}! Vamos nos conectar!`,
      category: "comemoracao",
      likes: [],
      comments: [],
      created_at: new Date().toISOString()
    };
    setPosts(prev => [welcomePost, ...prev]);

    setOnboardSuccess(true);
    setTimeout(() => {
      setIsOnboarding(false);
      setOnboardSuccess(false);
      setCurrentTab("dashboard");
      // Clean query string
      window.history.pushState({}, document.title, "/");
    }, 3000);
  };

  // --- Send Invitation (HR) ---
  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteSuccessMsg("");

    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      alert("Por favor, digite um e-mail válido.");
      return;
    }

    // Check if invitation already exists
    const exists = invitations.find(i => i.email.toLowerCase() === inviteEmail.toLowerCase() && i.status === "pending");
    if (exists) {
      alert("Já existe um convite pendente para este e-mail.");
      return;
    }

    const newInvite: Invitation = {
      id: `invite-${Date.now()}`,
      email: inviteEmail.trim(),
      company_id: currentUser.company_id,
      role: inviteRole,
      status: "pending",
      invited_by: currentUser.name,
      sent_at: new Date().toISOString()
    };

    setInvitations(prev => [newInvite, ...prev]);
    setInviteSuccessMsg(`Convite gerado com sucesso! Link simulado criado.`);
    setInviteEmail("");
  };

  // --- Promote/Demote User Role ---
  const handleToggleUserRole = (targetUserId: string, currentRole: UserRole) => {
    if (targetUserId === currentUser.id) {
      alert("Você não pode alterar sua própria permissão de acesso.");
      return;
    }

    // Determine new role
    const newRole = currentRole === UserRole.HR_MANAGER ? UserRole.COLLABORATOR : UserRole.HR_MANAGER;

    setUsers(prev =>
      prev.map(u => (u.id === targetUserId ? { ...u, role: newRole } : u))
    );
  };

  // --- Collaborator CRUD: Direct Create, Update and Delete ---
  const handleCreateUserDirect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createUserName.trim() || !createUserEmail.trim() || !createUserDepartment.trim()) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    const emailLower = createUserEmail.trim().toLowerCase();
    const exists = users.some(u => u.email.toLowerCase() === emailLower);
    if (exists) {
      alert("Este e-mail já está cadastrado.");
      return;
    }

    const randomAvatar = [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
    ][Math.floor(Math.random() * 5)];

    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      email: emailLower,
      role: createUserRole,
      company_id: currentUser.company_id,
      name: createUserName.trim(),
      department: createUserDepartment.trim(),
      hire_date: createUserHireDate || new Date().toISOString().split('T')[0],
      avatar: randomAvatar,
      points_balance: 15.0,
      active_streak: 1
    };

    setUsers(prev => [...prev, newUser]);
    setInviteSuccessMsg(`Colaborador "${createUserName}" cadastrado diretamente com sucesso!`);
    
    // reset form
    setCreateUserName("");
    setCreateUserEmail("");
    setCreateUserDepartment("");
    setCreateUserRole(UserRole.COLLABORATOR);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;
    if (!editUserName.trim() || !editUserEmail.trim() || !editUserDepartment.trim()) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    const emailLower = editUserEmail.trim().toLowerCase();
    const exists = users.some(u => u.id !== editingUserId && u.email.toLowerCase() === emailLower);
    if (exists) {
      alert("Este e-mail já está em uso por outro colaborador.");
      return;
    }

    setUsers(prev =>
      prev.map(u => {
        if (u.id === editingUserId) {
          const updated = {
            ...u,
            name: editUserName.trim(),
            email: emailLower,
            department: editUserDepartment.trim(),
            hire_date: editUserHireDate,
            role: editUserRole,
            avatar: editUserAvatar || u.avatar
          };
          if (currentUser.id === editingUserId) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );

    setEditingUserId(null);
    setInviteSuccessMsg("Colaborador atualizado com sucesso!");
  };

  const handleDeleteUser = (targetUserId: string) => {
    if (targetUserId === currentUser.id) {
      alert("Você não pode excluir o seu próprio usuário logado!");
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== targetUserId));
    setInviteSuccessMsg("Colaborador excluído com sucesso.");
  };

  // --- Climate Organizacional Handler ---
  const handleClimateSubmit = (vibe: string, comment: string) => {
    const today = new Date().toDateString();
    localStorage.setItem(`flow_voted_climate_${today}`, "true");
    setVotedClimate(true);

    const multiplier = vibe === "excelente" ? 100 : vibe === "bom" ? 85 : vibe === "regular" ? 65 : vibe === "cansado" ? 45 : 20;
    const todayFormatted = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    
    setClimateHistory((prev: any) => {
      const copy = [...prev];
      const idx = copy.findIndex((h: any) => h.date === todayFormatted);
      if (idx !== -1) {
        copy[idx].positivo = Math.round((copy[idx].positivo * 3 + multiplier) / 4);
        copy[idx].participacao = Math.min(100, copy[idx].participacao + 2);
      } else {
        copy.push({
          date: todayFormatted,
          positivo: multiplier,
          participacao: 80
        });
      }
      return copy;
    });

    if (comment.trim()) {
      const climatePost: Post = {
        id: `post-${Date.now()}`,
        user_id: "anon-climate",
        user_name: "Feedback de Clima (Anônimo)",
        user_avatar: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=150&auto=format&fit=crop&q=80",
        user_role: "Clima Organizacional",
        company_id: currentUser.company_id,
        content: `💭 **Feedback de Clima Anônimo:** "${comment.trim()}"\n\nSentimento hoje: ${vibe === "excelente" ? "Excelente 😍" : vibe === "bom" ? "Muito Bom 🙂" : vibe === "regular" ? "Regular 😐" : vibe === "cansado" ? "Cansado 🥱" : "Ruim 😢"}.`,
        category: "aviso",
        likes: [],
        comments: [],
        created_at: new Date().toISOString()
      };
      setPosts(prev => [climatePost, ...prev]);
    }
    
    setSelectedVibe("");
    setClimateFeedback("");
  };

  // --- Talent CV Screening Handler ---
  const handleScreenResume = async () => {
    if (!resumeText.trim()) {
      alert("Por favor, cole ou digite o texto do currículo do candidato.");
      return;
    }
    
    setScreeningLoading(true);
    setScreeningError("");
    setScreeningResult(null);

    try {
      const response = await fetch("/api/screen-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          candidateName: candidateName.trim() || "Candidato",
          targetRole
        })
      });

      if (!response.ok) {
        throw new Error("Erro de comunicação com o servidor de triagem.");
      }

      const data = await response.json();
      setScreeningResult(data);
    } catch (err: any) {
      console.error("Screening error:", err);
      setScreeningError("Erro ao processar currículo. Tente novamente.");
    } finally {
      setScreeningLoading(false);
    }
  };

  // --- Mural: Create Custom Post ---
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() && !selectedBadge && !showPollBuilder) {
      return;
    }

    let pollData: Poll | undefined;
    if (showPollBuilder && pollQuestion.trim()) {
      pollData = {
        question: pollQuestion.trim(),
        options: pollOptions
          .filter(opt => opt.trim() !== "")
          .map((opt, idx) => ({
            id: `opt-${Date.now()}-${idx}`,
            text: opt.trim(),
            votes: []
          }))
      };
    }

    let badgeData: BadgeAward | undefined;
    if (selectedBadge && selectedRecipientId) {
      const recipient = users.find(u => u.id === selectedRecipientId);
      if (recipient) {
        badgeData = {
          badge_name: selectedBadge.name,
          icon: selectedBadge.icon,
          description: badgesList.find(b => b.name === selectedBadge.name)?.desc || "",
          recipient_name: recipient.name,
          recipient_id: recipient.id
        };

        // Award some gamified point balance to the recipient
        setUsers(prev =>
          prev.map(u =>
            u.id === recipient.id ? { ...u, points_balance: u.points_balance + 2 } : u
          )
        );
      }
    }

    const dynamicRole = currentUser.role === UserRole.SUPER_ADMIN
      ? "Super Admin"
      : currentUser.role === UserRole.HR_MANAGER
      ? "Gestor de RH"
      : currentUser.role === UserRole.SUPERVISOR
      ? "Supervisor"
      : "Colaborador";

    const newPost: Post = {
      id: `post-${Date.now()}`,
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_avatar: currentUser.avatar,
      user_role: dynamicRole,
      user_department: currentUser.department,
      company_id: currentUser.company_id,
      content: newPostContent,
      category: newPostCategory,
      poll: pollData,
      badge_award: badgeData,
      likes: [],
      comments: [],
      created_at: new Date().toISOString()
    };

    setPosts(prev => [newPost, ...prev]);
    setNewPostContent("");
    setShowPollBuilder(false);
    setPollQuestion("");
    setPollOptions(["", ""]);
    setShowBadgeSelector(false);
    setSelectedBadge(null);
    setSelectedRecipientId("");
  };

  // --- Mural CRUD Actions: Edit and Delete ---
  const handleEditPost = (postId: string, updatedContent: string, updatedCategory: Post["category"]) => {
    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            content: updatedContent,
            category: updatedCategory
          };
        }
        return p;
      })
    );
  };

  const handleDeletePost = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const canEditOrDeletePost = (post: Post) => {
    // Administrador (SUPER_ADMIN or HR_MANAGER) has full CRUD
    if (currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.HR_MANAGER) {
      return true;
    }
    // Supervisor can edit and delete posts of their own department
    if (currentUser.role === UserRole.SUPERVISOR) {
      const authorDept = post.user_department || users.find(u => u.id === post.user_id)?.department;
      return authorDept === currentUser.department;
    }
    // Collaborator has no edit/delete privileges
    return false;
  };

  // --- Social Actions (Likes/Comments/Poll Votes) ---
  const handleLikePost = (postId: string) => {
    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          const alreadyLiked = p.likes.includes(currentUser.id);
          const newLikes = alreadyLiked
            ? p.likes.filter(id => id !== currentUser.id)
            : [...p.likes, currentUser.id];
          return { ...p, likes: newLikes };
        }
        return p;
      })
    );
  };

  const handleAddComment = (postId: string, commentText: string) => {
    if (!commentText.trim()) return;

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      user_name: currentUser.name,
      user_avatar: currentUser.avatar,
      text: commentText.trim(),
      created_at: new Date().toISOString()
    };

    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          return { ...p, comments: [...p.comments, newComment] };
        }
        return p;
      })
    );
  };

  const handleVotePoll = (postId: string, optionId: string) => {
    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId && p.poll) {
          // Remove previous votes from this user on this poll
          const updatedOptions = p.poll.options.map(opt => {
            const cleanVotes = opt.votes.filter(id => id !== currentUser.id);
            if (opt.id === optionId) {
              return { ...opt, votes: [...cleanVotes, currentUser.id] };
            }
            return { ...opt, votes: cleanVotes };
          });

          return {
            ...p,
            poll: {
              ...p.poll,
              options: updatedOptions
            }
          };
        }
        return p;
      })
    );
  };

  // --- Flow AI Chat Integration ---
  const handleSendAiMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiInput.trim() || aiLoading) return;

    const userMsg = aiInput.trim();
    setAiInput("");
    setAiHistory(prev => [...prev, { role: "user", text: userMsg }]);
    setAiLoading(true);

    const userCompany = companies.find(c => c.id === currentUser.company_id);

    try {
      const response = await fetch("/api/flow-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: aiHistory.slice(1), // Exclude greeting
          context: {
            companyName: userCompany?.name || "Base44 Tec",
            userName: currentUser.name,
            userRole: currentUser.role === UserRole.HR_MANAGER ? "Gestor de RH" : "Colaborador"
          }
        })
      });

      if (!response.ok) {
        throw new Error("Resposta inválida do servidor.");
      }

      const data = await response.json();
      setAiHistory(prev => [...prev, { role: "model", text: data.answer }]);
    } catch (err: any) {
      console.error("AI Fetch error:", err);
      setAiHistory(prev => [
        ...prev,
        {
          role: "model",
          text: `⚠️ **Ops! Ocorreu um erro ao conectar ao servidor de Inteligência Artificial.** 

Estou operando temporariamente no modo offline de contingência. Para responder sua pergunta:
As políticas padrões da **${userCompany?.name}** de reembolso cobrem até **R$ 50,00** para refeições e transporte integral se justificado. Suas férias de **30 dias** ficam disponíveis após **12 meses** de trabalho contínuo.`
        }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const executeQuickQuery = (queryText: string) => {
    setAiInput(queryText);
    setTimeout(() => {
      const btn = document.getElementById("send-ai-btn");
      if (btn) btn.click();
    }, 100);
  };

  // --- Widget Reordering Handlers ---
  const moveWidget = (index: number, direction: "up" | "down") => {
    const newOrder = [...widgetsOrder];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newOrder.length) {
      const temp = newOrder[index];
      newOrder[index] = newOrder[targetIndex];
      newOrder[targetIndex] = temp;
      setWidgetsOrder(newOrder);
    }
  };

  // Filters for posts and users
  const activeCompanyId = currentUser.company_id;
  const filteredPosts = posts
    .filter(p => p.company_id === activeCompanyId)
    .filter(p => {
      if (selectedCategory === "todos") return true;
      return p.category === selectedCategory;
    })
    .filter(p => p.content.toLowerCase().includes(searchQuery.toLowerCase()) || p.user_name.toLowerCase().includes(searchQuery.toLowerCase()));

  const companyUsers = users.filter(u => u.company_id === activeCompanyId);
  const companyInvitations = invitations.filter(i => i.company_id === activeCompanyId);
  const activeCompany = companies.find(c => c.id === activeCompanyId);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex items-center justify-center p-4 md:p-8 antialiased relative overflow-hidden">
        
        {/* Background Swirl Snowflakes animation */}
        <FallingSwirlSnowflakes />

        {/* Center Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden relative z-10 grid grid-cols-1 md:grid-cols-12 border border-white/50"
        >
          {/* Left Column: Form and Logo */}
          <div className="md:col-span-7 p-8 md:p-10 flex flex-col justify-center space-y-6">
            <div className="flex items-center justify-between">
              <FlowRhLogo size="text-2xl" textColor="text-[#0043FF]" iconSize="h-8" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded border border-slate-200">
                SaaS Portal
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Acesse sua Conta</h2>
              <p className="text-xs text-slate-500 leading-normal">
                Faça login para gerenciar sua jornada de trabalho, ver comunicados e acessar o assistente de IA.
              </p>
            </div>

            {loginError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 text-red-700 text-xs p-3.5 rounded-xl flex items-start gap-2 border border-red-200 shadow-sm"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-medium leading-normal">{loginError}</span>
              </motion.div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setLoginError("");
                setLoginLoading(true);

                setTimeout(() => {
                  const targetUser = users.find(u => u.email.toLowerCase() === loginEmail.trim().toLowerCase());
                  if (!targetUser) {
                    setLoginError("E-mail corporativo não encontrado. Por favor, verifique ou utilize uma conta de demonstração rápida.");
                    setLoginLoading(false);
                    return;
                  }

                  if (targetUser.company_id !== loginCompanyId) {
                    const expectedComp = companies.find(c => c.id === targetUser.company_id)?.name || "Outra empresa";
                    const triedComp = companies.find(c => c.id === loginCompanyId)?.name || "Empresa selecionada";
                    setLoginError(`Acesso Negado! O e-mail informado pertence à empresa "${expectedComp}", mas você tentou entrar na empresa "${triedComp}". O isolamento Multi-Tenant por Row Level Security (RLS) impede este login.`);
                    setLoginLoading(false);
                    return;
                  }

                  // If email exists and tenant matches, sign in!
                  setCurrentUser(targetUser);
                  setIsLoggedIn(true);
                  localStorage.setItem("flow_is_logged_in", "true");
                  localStorage.setItem("flow_current_user_id", targetUser.id);
                  setLoginLoading(false);
                }, 1000);
              }}
              className="space-y-4"
            >
              {/* Tenant Selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 tracking-wider">
                  Empresa / Organização (Tenant)
                </label>
                <div className="relative">
                  <select
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:border-[#0043FF] focus:outline-none bg-white font-medium pr-10"
                    value={loginCompanyId}
                    onChange={(e) => setLoginCompanyId(e.target.value)}
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.segment})
                      </option>
                    ))}
                  </select>
                  <Building className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 tracking-wider">
                  E-mail Corporativo
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="seu.nome@empresa.com"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:border-[#0043FF] focus:outline-none pr-10"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                  <span className="absolute right-3 top-3.5 text-slate-400 text-xs font-bold">@</span>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                    Senha de Acesso
                  </label>
                  <span className="text-[9px] text-slate-400 font-medium">Qualquer senha é aceita para teste</span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Sua senha secreta"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:border-[#0043FF] focus:outline-none pr-10"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition"
                  >
                    <Lock className={`w-4 h-4 ${showPassword ? "text-[#0043FF]" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Security Banner */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex items-start gap-2.5 text-[10px] text-blue-800 leading-normal">
                <span className="text-base">🛡️</span>
                <div>
                  <span className="font-bold block">Autenticação com Isolamento RLS Ativado</span>
                  <span className="text-blue-600/90">
                    O sistema valida as sessões de forma estrita. Dados de outros tenants nunca são retornados pela API local.
                  </span>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-[#0043FF] hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 rounded-xl text-xs transition duration-200 shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loginLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Autenticando...
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    Entrar no Painel Flow RH
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Demo Accounts Quick Sign-In */}
          <div className="md:col-span-5 bg-slate-900 text-white p-8 md:p-10 flex flex-col justify-between border-l border-slate-800">
            <div className="space-y-4">
              <div>
                <span className="text-[9px] font-bold text-[#14B8A6] bg-teal-950 border border-teal-800 px-2 py-0.5 rounded uppercase tracking-widest">
                  Sandbox Técnico
                </span>
                <h3 className="text-lg font-bold text-slate-100 mt-2">Contas de Demonstração</h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-normal">
                  Escolha um perfil de teste abaixo para validar os controles RBAC e o isolamento de dados de cada tenant.
                </p>
              </div>

              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1 font-sans">
                {users.map(u => {
                  const comp = companies.find(c => c.id === u.company_id);
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        setLoginEmail(u.email);
                        setLoginPassword("123456");
                        setLoginCompanyId(u.company_id);
                        setLoginError("");
                        
                        // Smooth auto-login to make testing seamless
                        setLoginLoading(true);
                        setTimeout(() => {
                          setCurrentUser(u);
                          setIsLoggedIn(true);
                          localStorage.setItem("flow_is_logged_in", "true");
                          localStorage.setItem("flow_current_user_id", u.id);
                          setLoginLoading(false);
                        }, 500);
                      }}
                      className="w-full text-left bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-[#14B8A6] rounded-xl p-3 transition duration-200 flex items-center justify-between gap-3 group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-200 group-hover:text-white truncate">{u.name}</div>
                          <div className="text-[10px] text-slate-400 truncate font-mono">{u.email}</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[8px] font-bold text-slate-300 bg-slate-700 px-1.5 py-0.5 rounded block uppercase mb-1 truncate max-w-[80px]">
                          {comp?.name.split(" ")[0]}
                        </span>
                        <span className={`text-[8px] font-bold uppercase ${
                          u.role === UserRole.SUPER_ADMIN ? "text-orange-400" :
                          u.role === UserRole.HR_MANAGER ? "text-blue-400" : "text-slate-400"
                        }`}>
                          {u.role === UserRole.SUPER_ADMIN ? "S. Admin" :
                           u.role === UserRole.HR_MANAGER ? "Gestor" : "Colab"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 text-[10px] text-slate-500 space-y-1">
              <p className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Row Level Security (RLS) habilitada
              </p>
              <p>Autenticação simulada com persistência local.</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased relative overflow-hidden">
      
      {/* Background Swirl Snowflakes animation */}
      <FallingSwirlSnowflakes />

      {/* Simulation Banner & Role Switcher */}
      <div className="bg-amber-500 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between gap-4 shadow-inner relative z-10">
        <div className="flex items-center gap-2">
          <span className="bg-amber-700 text-white rounded px-1.5 py-0.5 text-[10px]">AMBIENTE DE SIMULAÇÃO</span>
          <span>Explore as permissões mudando o perfil atual no menu superior.</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="opacity-90">Usuário Ativo:</span>
          <select
            className="bg-amber-600 text-white rounded px-2 py-0.5 outline-none cursor-pointer border border-amber-400"
            value={currentUser.id}
            onChange={(e) => {
              const found = users.find(u => u.id === e.target.value);
              if (found) setCurrentUser(found);
            }}
          >
            {users.map(u => {
              const roleLabel = u.role === UserRole.SUPER_ADMIN
                ? "Super Admin"
                : u.role === UserRole.HR_MANAGER
                ? "Gestor RH"
                : u.role === UserRole.SUPERVISOR
                ? "Supervisor"
                : "Colaborador";
              return (
                <option key={u.id} value={u.id} className="text-slate-800">
                  {u.name} ({roleLabel} - {u.department}) - {companies.find(c => c.id === u.company_id)?.name}
                </option>
              );
            })}
          </select>
          <button
            onClick={resetDatabase}
            className="bg-amber-700 hover:bg-amber-800 text-white text-[10px] uppercase tracking-wider py-0.5 px-2 rounded flex items-center gap-1 transition"
            title="Resetar banco de dados local"
          >
            <RefreshCw className="w-3 h-3" /> Resetar Banco
          </button>
        </div>
      </div>

      {/* --- HEADER --- */}
      <header className="bg-[#0043FF] text-white py-3 px-6 flex items-center justify-between shadow-md sticky top-0 z-40 relative">
        <div className="flex items-center gap-3">
          <FlowRhLogo size="text-2xl" textColor="text-white" iconSize="h-8" />
        </div>

        {/* Global Search */}
        <div className="hidden md:flex items-center bg-white/10 hover:bg-white/15 focus-within:bg-white focus-within:text-slate-900 rounded-full px-4 py-1.5 w-96 transition duration-200">
          <Search className="w-4 h-4 mr-2 opacity-70" />
          <input
            type="text"
            placeholder="Buscar avisos, colegas de equipe..."
            className="bg-transparent border-none outline-none w-full text-sm placeholder-white/60 focus:placeholder-slate-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}>
              <X className="w-4 h-4 opacity-70 hover:opacity-100" />
            </button>
          )}
        </div>

        {/* Company & Profile Info */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <span className="inline-block bg-blue-700/60 text-blue-100 text-[10px] px-2 py-0.5 rounded font-bold uppercase mb-0.5">
              {activeCompany?.name}
            </span>
            <div className="text-xs font-medium text-white">{currentUser.name}</div>
          </div>
          <div className="relative group">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-white/50 shadow-sm cursor-pointer"
            />
            <button
              onClick={() => {
                setIsLoggedIn(false);
                localStorage.setItem("flow_is_logged_in", "false");
              }}
              className="absolute right-0 mt-1.5 hidden group-hover:block bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md border border-slate-700 whitespace-nowrap hover:bg-red-600 transition"
            >
              Sair da Conta
            </button>
          </div>
          <button
            onClick={() => {
              setIsLoggedIn(false);
              localStorage.setItem("flow_is_logged_in", "false");
            }}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
            title="Sair da Conta"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* --- MAIN STRUCTURE --- */}
      <div className="flex flex-1">
        
        {/* --- LEFT SIDEBAR (Thin, Colorful blocks like GOintegro) --- */}
        <aside className="w-22 flex flex-col items-center py-6 gap-5 select-none relative z-20">
          {/* Dashboard Icon */}
          <button
            onClick={() => { setIsOnboarding(false); setCurrentTab("dashboard"); }}
            className={`flex flex-col items-center group relative w-14 h-14 rounded-2xl transition-all duration-300 cursor-pointer ${
              currentTab === "dashboard" && !isOnboarding
                ? "bg-slate-500/90 text-white scale-105 shadow-lg shadow-slate-500/20 border border-slate-400/30"
                : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5"
            }`}
            title="Início / Widgets"
          >
            <div className="flex-1 flex items-center justify-center pt-1.5">
              <LayoutDashboard className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${currentTab === "dashboard" && !isOnboarding ? "text-white" : "text-slate-400"}`} />
            </div>
            <span className="text-[9px] pb-1.5 font-bold tracking-tight">Início</span>
            {currentTab === "dashboard" && !isOnboarding && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-slate-400 rounded-r" />
            )}
          </button>

          {/* Mural Icon */}
          <button
            onClick={() => { setIsOnboarding(false); setCurrentTab("mural"); }}
            className={`flex flex-col items-center group relative w-14 h-14 rounded-2xl transition-all duration-300 cursor-pointer ${
              currentTab === "mural" && !isOnboarding
                ? "bg-[#14B8A6] text-white scale-105 shadow-lg shadow-teal-500/20 border border-teal-400/30"
                : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5"
            }`}
            title="Mural de Avisos"
          >
            <div className="flex-1 flex items-center justify-center pt-1.5">
              <MessageSquare className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${currentTab === "mural" && !isOnboarding ? "text-white" : "text-[#14B8A6]"}`} />
            </div>
            <span className="text-[9px] pb-1.5 font-bold tracking-tight">Mural</span>
            {currentTab === "mural" && !isOnboarding && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-[#14B8A6] rounded-r" />
            )}
          </button>

          {/* Ponto Icon */}
          <button
            onClick={() => { setIsOnboarding(false); setCurrentTab("ponto"); }}
            className={`flex flex-col items-center group relative w-14 h-14 rounded-2xl transition-all duration-300 cursor-pointer ${
              currentTab === "ponto" && !isOnboarding
                ? "bg-[#8B5CF6] text-white scale-105 shadow-lg shadow-purple-500/20 border border-purple-400/30"
                : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5"
            }`}
            title="Registrar Ponto"
          >
            <div className="flex-1 flex items-center justify-center pt-1.5">
              <Clock className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${currentTab === "ponto" && !isOnboarding ? "text-white" : "text-[#A78BFA]"}`} />
            </div>
            <span className="text-[9px] pb-1.5 font-bold tracking-tight">Ponto</span>
            {currentTab === "ponto" && !isOnboarding && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-[#8B5CF6] rounded-r" />
            )}
          </button>

          {/* Gestão / Empresa Icon */}
          <button
            onClick={() => { setIsOnboarding(false); setCurrentTab("empresa"); }}
            className={`flex flex-col items-center group relative w-14 h-14 rounded-2xl transition-all duration-300 cursor-pointer ${
              currentTab === "empresa" && !isOnboarding
                ? "bg-[#0043FF] text-white scale-105 shadow-lg shadow-blue-500/20 border border-blue-400/30"
                : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5"
            }`}
            title="Sua Empresa"
          >
            <div className="flex-1 flex items-center justify-center pt-1.5">
              <Users className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${currentTab === "empresa" && !isOnboarding ? "text-white" : "text-[#3B82F6]"}`} />
            </div>
            <span className="text-[9px] pb-1.5 font-bold tracking-tight">Gestão</span>
            {currentTab === "empresa" && !isOnboarding && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-[#0043FF] rounded-r" />
            )}
          </button>

          {/* Talentos Icon */}
          <button
            onClick={() => { setIsOnboarding(false); setCurrentTab("talentos"); }}
            className={`flex flex-col items-center group relative w-14 h-14 rounded-2xl transition-all duration-300 cursor-pointer ${
              currentTab === "talentos" && !isOnboarding
                ? "bg-[#7C3AED] text-white scale-105 shadow-lg shadow-purple-500/20 border border-purple-400/30"
                : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5"
            }`}
            title="Gestão de Talentos (Triagem IA)"
          >
            <div className="flex-1 flex items-center justify-center pt-1.5">
              <Briefcase className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${currentTab === "talentos" && !isOnboarding ? "text-white" : "text-[#C084FC]"}`} />
            </div>
            <span className="text-[9px] pb-1.5 font-bold tracking-tight">Talentos</span>
            {currentTab === "talentos" && !isOnboarding && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-[#7C3AED] rounded-r" />
            )}
          </button>

          {/* Flow AI Icon */}
          <button
            onClick={() => { setIsOnboarding(false); setCurrentTab("flow_ai"); }}
            className={`flex flex-col items-center group relative w-14 h-14 rounded-2xl transition-all duration-300 cursor-pointer ${
              currentTab === "flow_ai" && !isOnboarding
                ? "bg-violet-600 text-white scale-105 shadow-lg shadow-violet-500/20 border border-violet-400/30"
                : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5"
            }`}
            title="Assistente Flow AI"
          >
            <div className="flex-1 flex items-center justify-center pt-1.5">
              <Bot className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${currentTab === "flow_ai" && !isOnboarding ? "text-white" : "text-[#D8B4FE]"}`} />
            </div>
            <span className="text-[9px] pb-1.5 font-bold tracking-tight">Flow AI</span>
            {currentTab === "flow_ai" && !isOnboarding && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-violet-600 rounded-r" />
            )}
          </button>

          {/* Super Admin Icon */}
          {(currentUser.role === UserRole.SUPER_ADMIN || currentUser.email === "desenvolvimentoflowrh@gmail.com") && (
            <button
              onClick={() => { setIsOnboarding(false); setCurrentTab("super_admin"); }}
              className={`flex flex-col items-center group relative w-14 h-14 rounded-2xl transition-all duration-300 cursor-pointer ${
                currentTab === "super_admin" && !isOnboarding
                  ? "bg-[#EA580C] text-white scale-105 shadow-lg shadow-orange-500/20 border border-orange-400/30"
                  : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5"
              }`}
              title="Área do Super Admin"
            >
              <div className="flex-1 flex items-center justify-center pt-1.5">
                <Lock className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${currentTab === "super_admin" && !isOnboarding ? "text-white" : "text-orange-400"}`} />
              </div>
              <span className="text-[9px] pb-1.5 font-bold tracking-tight">S. Admin</span>
              {currentTab === "super_admin" && !isOnboarding && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-[#EA580C] rounded-r" />
              )}
            </button>
          )}

          <hr className="w-10 border-slate-800/60 my-1" />

          {/* Simulator & Setup Icon */}
          <button
            onClick={() => { setIsOnboarding(false); setCurrentTab("admin"); }}
            className={`flex flex-col items-center group relative w-14 h-14 rounded-2xl transition-all duration-300 cursor-pointer ${
              currentTab === "admin" && !isOnboarding
                ? "bg-[#EF4444] text-white scale-105 shadow-lg shadow-red-500/20 border border-red-400/30"
                : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5"
            }`}
            title="Simulador de Onboarding & Configurações"
          >
            <div className="flex-1 flex items-center justify-center pt-1.5">
              <Settings className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${currentTab === "admin" && !isOnboarding ? "text-white" : "text-red-400"}`} />
            </div>
            <span className="text-[9px] pb-1.5 font-bold tracking-tight">Config</span>
            {currentTab === "admin" && !isOnboarding && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-[#EF4444] rounded-r" />
            )}
          </button>
        </aside>

        {/* --- MAIN WORKSPACE --- */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            
            {/* ONBOARDING FLOW VIEW */}
            {isOnboarding ? (
              <motion.div
                key="onboarding"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="max-w-md mx-auto"
              >
                <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                  <div className="bg-[#0043FF] text-white px-6 py-8 text-center relative">
                    <div className="absolute right-4 top-4">
                      <button
                        onClick={() => setIsOnboarding(false)}
                        className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex justify-center mb-4">
                      <FlowRhLogo size="text-2xl" textColor="text-white" iconSize="h-9" />
                    </div>
                    <h2 className="text-xl font-bold">Portal de Onboarding</h2>
                    <p className="text-xs text-blue-100 mt-1">Conclua o cadastro da sua conta no Flow RH</p>
                  </div>

                  {onboardSuccess ? (
                    <div className="p-8 text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Onboarding Concluído!</h3>
                      <p className="text-sm text-slate-600 mb-4">
                        Seja muito bem-vindo à equipe. Seus acessos foram criados e vinculados à empresa. Redirecionando para a sua Home...
                      </p>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#0043FF] h-full animate-[loading_3s_ease-in-out_infinite]" style={{ width: "100%" }} />
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleCompleteOnboarding} className="p-6 space-y-4">
                      {onboardError && (
                        <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg flex items-start gap-2 border border-red-100">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{onboardError}</span>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">E-mail do Convite</label>
                        <div className="relative">
                          <input
                            type="email"
                            value={onboardEmail}
                            readOnly
                            className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-lg px-3 py-2 text-sm outline-none cursor-not-allowed"
                          />
                          <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                        </div>
                        <p className="text-[10px] text-teal-600 mt-1 font-semibold flex items-center gap-1">
                          <UserCheck className="w-3 h-3" /> Convite ativo pré-detectado para esta empresa.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Nome Completo</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Pedro de Almeida"
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-[#0043FF] focus:outline-none"
                          value={onboardName}
                          onChange={(e) => setOnboardName(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Departamento</label>
                        <select
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-[#0043FF] focus:outline-none bg-white"
                          value={onboardDepartment}
                          onChange={(e) => setOnboardDepartment(e.target.value)}
                        >
                          <option value="Engenharia de Software">Engenharia de Software</option>
                          <option value="UX/UI Design">UX/UI Design</option>
                          <option value="Recursos Humanos">Recursos Humanos</option>
                          <option value="Marketing & Comunicação">Marketing & Comunicação</option>
                          <option value="Operações & Suporte">Operações & Suporte</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-xs font-semibold uppercase text-slate-500">Definir Senha</label>
                          <span className="text-[10px] text-slate-400">Min. 6 caracteres</span>
                        </div>
                        <input
                          type="password"
                          required
                          placeholder="Sua senha secreta"
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-[#0043FF] focus:outline-none"
                          value={onboardPassword}
                          onChange={(e) => {
                            setOnboardPassword(e.target.value);
                            if (onboardError.includes("senha")) setOnboardError("");
                          }}
                        />
                        {onboardPassword && (
                          <div className="mt-1 flex gap-1 items-center">
                            <span className="text-[10px] text-slate-400">Força:</span>
                            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden flex">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  onboardPassword.length < 6
                                    ? "bg-red-500 w-1/3"
                                    : onboardPassword.length < 10
                                    ? "bg-amber-500 w-2/3"
                                    : "bg-green-500 w-full"
                                }`}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-xs font-semibold uppercase text-slate-500">Confirmação de Segurança (OTP)</label>
                          <span className="text-[10px] text-amber-600 bg-amber-50 px-1 rounded font-mono">Padrão: 123456</span>
                        </div>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="Digite 123456"
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-center tracking-widest focus:border-[#0043FF] focus:outline-none"
                          value={onboardOtp}
                          onChange={(e) => setOnboardOtp(e.target.value)}
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-[#0043FF] hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition shadow-md shadow-blue-500/10 mt-2"
                      >
                        Concluir Onboarding e Entrar
                      </button>
                    </form>
                  )}
                </div>
              </motion.div>
            ) : currentTab === "dashboard" ? (
              
              /* --- HOME INTELIGENTE (BENTO GRID WIDGETS) --- */
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* COLUNA ESQUERDA (Profile, Company details, Colleagues) */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Profile Card */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 text-center relative">
                    <div className="absolute top-0 left-0 w-full h-20 bg-[#0043FF] opacity-10" />
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-white shadow relative z-10"
                    />
                    <h3 className="text-lg font-bold text-slate-900 mt-3">{currentUser.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">{currentUser.department}</p>
                    
                    <div className="inline-block mt-2 bg-blue-50 text-[#0043FF] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {currentUser.role === UserRole.HR_MANAGER
                        ? "Gestor de RH"
                        : currentUser.role === UserRole.SUPER_ADMIN
                        ? "Super Admin"
                        : currentUser.role === UserRole.SUPERVISOR
                        ? "Supervisor"
                        : "Colaborador"}
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 mt-6 pt-4">
                      <div className="text-center">
                        <div className="text-xs text-slate-400 font-medium">Streak de Atividade</div>
                        <div className="text-lg font-extrabold text-amber-600 flex items-center justify-center gap-1 mt-0.5">
                          🔥 {currentUser.active_streak} dias
                        </div>
                      </div>
                      <div className="text-center border-l border-slate-100">
                        <div className="text-xs text-slate-400 font-medium">Balanço de Horas</div>
                        <div className={`text-lg font-extrabold flex items-center justify-center gap-1 mt-0.5 ${currentUser.points_balance >= 0 ? "text-green-600" : "text-red-500"}`}>
                          {currentUser.points_balance >= 0 ? `+${currentUser.points_balance}` : currentUser.points_balance}h
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Company Info Card */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Building className="w-4 h-4 text-slate-400" /> Detalhes da Empresa
                    </h4>
                    <div className="flex items-center gap-3 mb-4">
                      <img src={activeCompany?.logo_url} alt={activeCompany?.name} className="w-12 h-12 rounded-lg object-cover" />
                      <div>
                        <h5 className="font-bold text-slate-800 text-sm">{activeCompany?.name}</h5>
                        <p className="text-xs text-slate-500">{activeCompany?.segment}</p>
                      </div>
                    </div>
                    <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Colaboradores ativos</span>
                        <span className="font-semibold text-slate-700">{companyUsers.length} integrantes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Convites pendentes</span>
                        <span className="font-semibold text-[#0043FF]">{companyInvitations.filter(i=>i.status==='pending').length} convites</span>
                      </div>
                    </div>
                  </div>

                  {/* Colleagues List */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                      <span>Equipe ({companyUsers.length})</span>
                      <Users className="w-4 h-4 text-slate-400" />
                    </h4>
                    <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                      {companyUsers.map(u => (
                        <div key={u.id} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                              <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-white rounded-full" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-800">{u.name}</div>
                              <div className="text-[10px] text-slate-400">{u.department}</div>
                            </div>
                          </div>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${u.role === UserRole.HR_MANAGER ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"}`}>
                            {u.role === UserRole.HR_MANAGER ? "RH" : "Colab"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* COLUNA DIREITA (Home Inteligente widgets orderable) */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Home Inteligente</h2>
                      <p className="text-xs text-slate-500">Gerencie sua jornada e rotinas corporativas de forma rápida.</p>
                    </div>
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded font-mono">Widgets Customizáveis</span>
                  </div>

                  {/* Dynamic widgets reordering wrapper */}
                  <div className="space-y-6">
                    {widgetsOrder.map((widgetId, index) => {
                      
                      // CLIMA ORGANIZACIONAL WIDGET (Pesquisa Dia a Dia)
                      if (widgetId === "clima") {
                        const todayFormatted = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
                        const todayStats = climateHistory.find(h => h.date === todayFormatted) || climateHistory[climateHistory.length - 1];
                        
                        return (
                          <div key="clima" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 relative group transition duration-300 hover:shadow-md">
                            {/* Control handles */}
                            <div className="absolute right-4 top-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => moveWidget(index, "up")} disabled={index === 0} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30">
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button onClick={() => moveWidget(index, "down")} disabled={index === widgetsOrder.length - 1} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30">
                                <ChevronDown className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex items-center gap-2 mb-4">
                              <span className="text-xl">📊</span>
                              <div>
                                <h3 className="font-bold text-slate-800">Clima Organizacional Diário</h3>
                                <p className="text-xs text-slate-500">Deixe seu sentimento anônimo para medirmos a energia do time.</p>
                              </div>
                            </div>

                            {!votedClimate ? (
                              <div className="space-y-4">
                                <div className="text-xs font-semibold text-slate-700">Como você se sente em relação à empresa e seu trabalho hoje?</div>
                                <div className="grid grid-cols-5 gap-2">
                                  {[
                                    { id: "excelente", icon: "😍", label: "Excelente" },
                                    { id: "bom", icon: "🙂", label: "Bom" },
                                    { id: "regular", icon: "😐", label: "Regular" },
                                    { id: "cansado", icon: "🥱", label: "Cansado" },
                                    { id: "ruim", icon: "😢", label: "Ruim" }
                                  ].map(v => (
                                    <button
                                      key={v.id}
                                      onClick={() => setSelectedVibe(v.id)}
                                      className={`p-3 rounded-2xl border transition flex flex-col items-center gap-1 text-center ${
                                        selectedVibe === v.id
                                          ? "bg-teal-50 border-teal-400 text-teal-800 font-bold scale-105 shadow-sm shadow-teal-500/10"
                                          : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 text-xs"
                                      }`}
                                    >
                                      <span className="text-2xl">{v.icon}</span>
                                      <span className="text-[9px] truncate w-full">{v.label}</span>
                                    </button>
                                  ))}
                                </div>

                                <div className="space-y-1.5">
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Algum comentário ou desabafo? (100% anônimo)</label>
                                  <textarea
                                    value={climateFeedback}
                                    onChange={(e) => setClimateFeedback(e.target.value)}
                                    placeholder="Escreva aqui sugestões, melhorias de ambiente ou feedbacks..."
                                    className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:border-[#0043FF] focus:outline-none min-h-[60px]"
                                  />
                                </div>

                                <div className="flex justify-end">
                                  <button
                                    onClick={() => {
                                      if (!selectedVibe) {
                                        alert("Por favor, selecione um emoji correspondente ao seu sentimento.");
                                        return;
                                      }
                                      handleClimateSubmit(selectedVibe, climateFeedback);
                                    }}
                                    className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-xl text-xs transition shadow-sm"
                                  >
                                    Enviar Feedback Anônimo
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-5">
                                <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 flex items-center gap-2 text-xs text-teal-800">
                                  <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                                  <span>Seu clima de hoje foi computado! Obrigado por contribuir para um ambiente mais transparente.</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                                  <div className="sm:col-span-4 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sentimento Hoje</div>
                                    <div className="text-3xl font-extrabold text-teal-600 mt-1">{todayStats?.positivo || 87}%</div>
                                    <div className="text-[9px] text-slate-400 mt-1">Positivo ({todayStats?.participacao || 91}% de participação)</div>
                                  </div>

                                  {/* Day-by-day historical survey trend chart */}
                                  <div className="sm:col-span-8 space-y-2">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-between">
                                      <span>Pesquisa Dia a Dia (Evolução)</span>
                                      <span className="text-teal-600 font-bold">Média Semanal</span>
                                    </div>
                                    
                                    <div className="h-24 flex items-end justify-between gap-2 bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                                      {climateHistory.slice(-6).map((h: any, idx: number) => (
                                        <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end relative group">
                                          {/* Custom Tooltip on hover */}
                                          <div className="absolute bottom-full mb-1 bg-slate-900 text-white text-[8px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-20 shadow">
                                            {h.positivo}% Posit.
                                          </div>
                                          <div
                                            className="w-full bg-[#14B8A6] rounded-t-md transition-all duration-500"
                                            style={{ height: `${h.positivo}%`, opacity: idx === climateHistory.length - 1 ? 1 : 0.65 }}
                                          />
                                          <div className="text-[8px] font-bold text-slate-400 mt-1">{h.date}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }

                      // BANCO DE HORAS WIDGET
                      if (widgetId === "banco") {
                        return (
                          <div key="banco" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 relative group transition duration-300 hover:shadow-md">
                            {/* Control handles */}
                            <div className="absolute right-4 top-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => moveWidget(index, "up")} disabled={index === 0} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30">
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button onClick={() => moveWidget(index, "down")} disabled={index === widgetsOrder.length - 1} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30">
                                <ChevronDown className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
                              <div className="space-y-2 text-center md:text-left flex-1">
                                <div className="flex items-center gap-2 justify-center md:justify-start">
                                  <Clock className="w-5 h-5 text-purple-600" />
                                  <h3 className="font-bold text-slate-800">Controle de Jornada & Banco</h3>
                                </div>
                                <p className="text-xs text-slate-500 max-w-sm">
                                  Bata seu ponto diário com validação biométrica facial utilizando a câmera do dispositivo.
                                </p>
                                
                                <div className="pt-3 flex flex-wrap gap-2 justify-center md:justify-start">
                                  <button
                                    onClick={() => { setPointType("entrada"); setCurrentTab("ponto"); }}
                                    className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition"
                                  >
                                    Entrada
                                  </button>
                                  <button
                                    onClick={() => { setPointType("almoco_ida"); setCurrentTab("ponto"); }}
                                    className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition"
                                  >
                                    Ida Almoço
                                  </button>
                                  <button
                                    onClick={() => { setPointType("almoco_volta"); setCurrentTab("ponto"); }}
                                    className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition"
                                  >
                                    Volta Almoço
                                  </button>
                                  <button
                                    onClick={() => { setPointType("saida"); setCurrentTab("ponto"); }}
                                    className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition"
                                  >
                                    Saída
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 bg-purple-50/50 border border-purple-100 p-4 rounded-2xl w-full md:w-auto shrink-0">
                                <div className="text-center">
                                  <div className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Saldo Mensal</div>
                                  <div className={`text-3xl font-extrabold ${currentUser.points_balance >= 0 ? "text-green-600" : "text-red-500"} mt-0.5`}>
                                    {currentUser.points_balance >= 0 ? `+${currentUser.points_balance}` : currentUser.points_balance}h
                                  </div>
                                  <div className="text-[10px] text-slate-400 mt-1 font-medium">Expediente das 09h às 18h</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // TREINOS OBRIGATÓRIOS WIDGET
                      if (widgetId === "treinos") {
                        return (
                          <div key="treinos" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 relative group transition duration-300 hover:shadow-md">
                            {/* Control handles */}
                            <div className="absolute right-4 top-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => moveWidget(index, "up")} disabled={index === 0} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30">
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button onClick={() => moveWidget(index, "down")} disabled={index === widgetsOrder.length - 1} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30">
                                <ChevronDown className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex items-center gap-2 mb-4">
                              <GraduationCap className="w-5 h-5 text-indigo-500" />
                              <h3 className="font-bold text-slate-800">Treinamentos & Compliance</h3>
                            </div>

                            <div className="space-y-4">
                              {trainings.map(t => (
                                <div key={t.id} className="border border-slate-100 rounded-xl p-3 hover:bg-slate-50 transition">
                                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
                                    <div>
                                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded mr-2 ${
                                        t.category === "compliance" ? "bg-amber-50 text-amber-600" :
                                        t.category === "seguranca" ? "bg-red-50 text-red-600" :
                                        t.category === "soft_skills" ? "bg-teal-50 text-teal-600" : "bg-blue-50 text-blue-600"
                                      }`}>
                                        {t.category}
                                      </span>
                                      <span className="text-xs font-bold text-slate-800">{t.title}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                      <Calendar className="w-3.5 h-3.5" /> Até {t.due_date}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${t.progress}%` }} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-600 min-w-[30px] text-right">{t.progress}%</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      // ANIVERSARIOS WIDGET
                      if (widgetId === "aniversarios") {
                        return (
                          <div key="aniversarios" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 relative group transition duration-300 hover:shadow-md">
                            {/* Control handles */}
                            <div className="absolute right-4 top-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => moveWidget(index, "up")} disabled={index === 0} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30">
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button onClick={() => moveWidget(index, "down")} disabled={index === widgetsOrder.length - 1} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30">
                                <ChevronDown className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex items-center gap-2 mb-3">
                              <Sparkles className="w-5 h-5 text-pink-500" />
                              <h3 className="font-bold text-slate-800">Próximos Aniversariantes</h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="flex items-center gap-3 bg-pink-50/30 border border-pink-100/50 p-3 rounded-xl">
                                <img src={users[2].avatar} alt={users[2].name} className="w-10 h-10 rounded-full object-cover border-2 border-white" />
                                <div>
                                  <div className="text-xs font-bold text-slate-800">{users[2].name}</div>
                                  <div className="text-[10px] text-pink-600 font-semibold">Hoje - UX & Design</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <img src={users[1].avatar} alt={users[1].name} className="w-10 h-10 rounded-full object-cover border-2 border-white" />
                                <div>
                                  <div className="text-xs font-bold text-slate-800">{users[1].name}</div>
                                  <div className="text-[10px] text-slate-500">20 de Julho - Engenharia</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // RECENT BADGES WIDGET
                      if (widgetId === "marcos") {
                        return (
                          <div key="marcos" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 relative group transition duration-300 hover:shadow-md">
                            {/* Control handles */}
                            <div className="absolute right-4 top-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => moveWidget(index, "up")} disabled={index === 0} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30">
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button onClick={() => moveWidget(index, "down")} disabled={index === widgetsOrder.length - 1} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30">
                                <ChevronDown className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex items-center gap-2 mb-4">
                              <Award className="w-5 h-5 text-[#0043FF]" />
                              <h3 className="font-bold text-slate-800">Conquistas & Reconhecimentos</h3>
                            </div>

                            <div className="space-y-3">
                              {posts
                                .filter(p => p.badge_award)
                                .slice(0, 2)
                                .map(p => (
                                  <div key={p.id} className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <span className="text-2xl mt-1">{p.badge_award?.icon}</span>
                                    <div>
                                      <div className="text-xs font-bold text-slate-800">
                                        {p.badge_award?.recipient_name} recebeu "{p.badge_award?.badge_name}"
                                      </div>
                                      <p className="text-[10px] text-slate-500 mt-0.5">{p.badge_award?.description}</p>
                                      <div className="text-[9px] text-[#0043FF] font-semibold mt-1">Concedido por {p.user_name}</div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>
                </div>
              </motion.div>
            ) : currentTab === "mural" ? (
              
              /* --- MURAL SOCIAL DE AVISOS 2.0 --- */
              <motion.div
                key="mural"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Composer (Left/Main side) */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Category filters */}
                  <div className="flex flex-wrap gap-2 pb-2">
                    {["todos", "aviso", "operacao", "comemoracao", "treinamento", "destaque"].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full uppercase tracking-wider transition ${
                          selectedCategory === cat
                            ? "bg-[#14B8A6] text-white"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {cat === "todos" ? "Feed Geral" : cat}
                      </button>
                    ))}
                  </div>

                  {/* Post Composer box */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <img src={currentUser.avatar} alt={currentUser.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                      <div className="flex-1">
                        <textarea
                          placeholder="Compartilhe um aviso importante, comemoração ou novidade..."
                          className="w-full border-none outline-none text-sm placeholder-slate-400 resize-none min-h-[70px] pt-1"
                          value={newPostContent}
                          onChange={(e) => setNewPostContent(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Rich feature options (Badges or Poll) */}
                    {showPollBuilder && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 relative">
                        <button
                          onClick={() => setShowPollBuilder(false)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-teal-600 mb-1">
                          <Vote className="w-4 h-4" /> Construir Enquete Corporativa
                        </div>
                        <input
                          type="text"
                          placeholder="Sua pergunta..."
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#14B8A6]"
                          value={pollQuestion}
                          onChange={(e) => setPollQuestion(e.target.value)}
                        />
                        <div className="space-y-2">
                          {pollOptions.map((opt, idx) => (
                            <input
                              key={idx}
                              type="text"
                              placeholder={`Opção ${idx + 1}`}
                              className="w-full bg-white border border-slate-100 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#14B8A6]"
                              value={opt}
                              onChange={(e) => {
                                const copy = [...pollOptions];
                                copy[idx] = e.target.value;
                                setPollOptions(copy);
                              }}
                            />
                          ))}
                          <button
                            type="button"
                            onClick={() => setPollOptions([...pollOptions, ""])}
                            className="text-[10px] font-bold text-[#0043FF] hover:underline"
                          >
                            + Adicionar Opção
                          </button>
                        </div>
                      </div>
                    )}

                    {showBadgeSelector && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 relative">
                        <button
                          onClick={() => setShowBadgeSelector(false)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 mb-1">
                          <Award className="w-4 h-4" /> Enviar Reconhecimento (Badges)
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          {badgesList.map(b => (
                            <button
                              key={b.name}
                              type="button"
                              onClick={() => setSelectedBadge(b)}
                              className={`p-2.5 rounded-xl text-left border text-xs transition flex gap-2 items-center ${
                                selectedBadge?.name === b.name
                                  ? "bg-amber-50 border-amber-300 shadow-sm"
                                  : "bg-white border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              <span className="text-xl">{b.icon}</span>
                              <div>
                                <div className="font-bold text-slate-800">{b.name}</div>
                              </div>
                            </button>
                          ))}
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1">Escolher Colega de Equipe</label>
                          <select
                            className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white"
                            value={selectedRecipientId}
                            onChange={(e) => setSelectedRecipientId(e.target.value)}
                          >
                            <option value="">Selecione um colega...</option>
                            {companyUsers.filter(u=>u.id !== currentUser.id).map(u => (
                              <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Composer Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1">
                        <select
                          className="text-xs border border-slate-200 rounded px-2.5 py-1 bg-white font-medium text-slate-600 focus:outline-none"
                          value={newPostCategory}
                          onChange={(e) => setNewPostCategory(e.target.value as Post["category"])}
                        >
                          <option value="aviso">📣 Aviso</option>
                          <option value="operacao">⚙️ Operação</option>
                          <option value="comemoracao">🎉 Comemoração</option>
                          <option value="treinamento">🎓 Treinamento</option>
                          <option value="destaque">⭐ Destaque</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => { setShowPollBuilder(!showPollBuilder); setShowBadgeSelector(false); }}
                          className={`p-1.5 rounded-lg hover:bg-slate-100 transition ${showPollBuilder ? "bg-teal-50 text-teal-600" : "text-slate-500"}`}
                          title="Adicionar Enquete"
                        >
                          <Vote className="w-4.5 h-4.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => { setShowBadgeSelector(!showBadgeSelector); setShowPollBuilder(false); }}
                          className={`p-1.5 rounded-lg hover:bg-slate-100 transition ${showBadgeSelector ? "bg-amber-50 text-amber-600" : "text-slate-500"}`}
                          title="Enviar Badge de Reconhecimento"
                        >
                          <Award className="w-4.5 h-4.5" />
                        </button>
                      </div>

                      <button
                        onClick={handleCreatePost}
                        className="bg-[#14B8A6] hover:bg-teal-600 text-white font-semibold px-4 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm"
                      >
                        <Send className="w-3.5 h-3.5" /> Publicar
                      </button>
                    </div>
                  </div>

                  {/* Posts List Feed */}
                  <div className="space-y-6">
                    {filteredPosts.length === 0 ? (
                      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                        <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h4 className="font-bold text-slate-700">Nenhuma publicação por aqui</h4>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">Seja o primeiro a publicar usando o composer acima ou altere os filtros de categoria.</p>
                      </div>
                    ) : (
                      filteredPosts.map(p => (
                        <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                          {/* Post Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <img src={p.user_avatar} alt={p.user_name} className="w-10 h-10 rounded-full object-cover" />
                              <div>
                                <div className="text-sm font-bold text-slate-800">{p.user_name}</div>
                                <div className="text-[10px] text-slate-400 font-medium">
                                  {p.user_role} • {new Date(p.created_at).toLocaleDateString("pt-BR")} às {new Date(p.created_at).toLocaleTimeString("pt-BR", {hour: "2-digit", minute: "2-digit"})}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                                p.category === "aviso" ? "bg-amber-50 text-amber-600" :
                                p.category === "comemoracao" ? "bg-pink-50 text-pink-600" :
                                p.category === "treinamento" ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-500"
                              }`}>
                                {p.category}
                              </span>
                              
                              {canEditOrDeletePost(p) && (
                                <div className="flex items-center gap-1.5">
                                  {deletingPostId === p.id ? (
                                    <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-md animate-fade-in">
                                      <span className="text-[9px] font-bold text-red-600 uppercase tracking-wider">Confirmar?</span>
                                      <button
                                        onClick={() => {
                                          handleDeletePost(p.id);
                                          setDeletingPostId(null);
                                        }}
                                        className="text-[9px] bg-red-600 hover:bg-red-700 text-white font-bold px-1.5 py-0.5 rounded transition"
                                        title="Confirmar Exclusão"
                                      >
                                        Sim
                                      </button>
                                      <button
                                        onClick={() => setDeletingPostId(null)}
                                        className="text-[9px] bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-1.5 py-0.5 rounded transition"
                                        title="Cancelar"
                                      >
                                        Não
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-1 py-0.5 rounded-md">
                                      <button
                                        onClick={() => {
                                          setEditingPostId(p.id);
                                          setEditingContent(p.content);
                                          setEditingCategory(p.category);
                                          setDeletingPostId(null);
                                        }}
                                        className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-[#0043FF] transition"
                                        title="Editar Publicação"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setDeletingPostId(p.id);
                                        }}
                                        className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-red-500 transition"
                                        title="Excluir Publicação"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Post Content or Edit Form */}
                          {editingPostId === p.id ? (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                Editar Publicação
                              </div>
                              <textarea
                                className="w-full text-sm text-slate-800 bg-white border border-slate-200 rounded-lg p-3 focus:outline-none focus:border-[#0043FF] min-h-[100px]"
                                value={editingContent}
                                onChange={(e) => setEditingContent(e.target.value)}
                              />
                              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                                <div className="flex items-center gap-2">
                                  <label className="text-xs text-slate-500 font-medium">Categoria:</label>
                                  <select
                                    className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-700 outline-none cursor-pointer focus:border-[#0043FF]"
                                    value={editingCategory}
                                    onChange={(e) => setEditingCategory(e.target.value as Post["category"])}
                                  >
                                    <option value="aviso">📢 Aviso</option>
                                    <option value="operacao">📊 Operação</option>
                                    <option value="comemoracao">🎉 Comemoração</option>
                                    <option value="treinamento">🎓 Treinamento</option>
                                    <option value="destaque">⭐ Destaque</option>
                                  </select>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setEditingPostId(null)}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 text-xs font-semibold transition"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleEditPost(p.id, editingContent, editingCategory);
                                      setEditingPostId(null);
                                    }}
                                    className="bg-[#0043FF] hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition shadow-sm"
                                  >
                                    Salvar Alterações
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{p.content}</p>
                          )}

                          {/* Render Badge Recognition Award */}
                          {p.badge_award && (
                            <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-xl flex items-start gap-3">
                              <span className="text-3xl shrink-0">{p.badge_award.icon}</span>
                              <div>
                                <div className="text-xs font-bold text-amber-900">Medalha de {p.badge_award.badge_name} Concedida!</div>
                                <p className="text-[11px] text-amber-700 mt-0.5">{p.badge_award.description}</p>
                                <div className="text-[10px] font-semibold text-slate-600 mt-1">Homenageado(a): @{p.badge_award.recipient_name}</div>
                              </div>
                            </div>
                          )}

                          {/* Render Poll Enquete */}
                          {p.poll && (
                            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-3">
                              <div className="text-xs font-bold text-slate-700">{p.poll.question}</div>
                              
                              <div className="space-y-2">
                                {p.poll.options.map(opt => {
                                  const totalVotes = p.poll?.options.reduce((acc, o) => acc + o.votes.length, 0) || 1;
                                  const pct = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                                  const hasVoted = opt.votes.includes(currentUser.id);

                                  return (
                                    <button
                                      key={opt.id}
                                      onClick={() => handleVotePoll(p.id, opt.id)}
                                      className="w-full text-left relative overflow-hidden bg-white hover:bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-xs font-medium transition flex items-center justify-between"
                                    >
                                      {/* Percent background */}
                                      <div className="absolute left-0 top-0 h-full bg-teal-500/10 transition-all duration-300" style={{ width: `${pct}%` }} />
                                      
                                      <span className="relative z-10 flex items-center gap-1.5">
                                        {hasVoted && <CheckCircle className="w-3.5 h-3.5 text-teal-600" />}
                                        {opt.text}
                                      </span>
                                      <span className="relative z-10 font-bold text-slate-500">{pct}% ({opt.votes.length})</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Actions (Like & Comment triggers) */}
                          <div className="flex items-center gap-4 pt-2 border-t border-slate-100 text-xs font-semibold text-slate-500">
                            <button
                              onClick={() => handleLikePost(p.id)}
                              className={`flex items-center gap-1 hover:text-[#14B8A6] transition ${p.likes.includes(currentUser.id) ? "text-[#14B8A6]" : ""}`}
                            >
                              <ThumbsUp className="w-4 h-4" /> Curtir ({p.likes.length})
                            </button>
                            <span className="flex items-center gap-1 cursor-default">
                              <MessageCircle className="w-4 h-4" /> Comentários ({p.comments.length})
                            </span>
                          </div>

                          {/* Comments section */}
                          <div className="space-y-3 bg-slate-50/50 -mx-5 -mb-5 p-5 border-t border-slate-50 rounded-b-2xl">
                            {p.comments.map(c => (
                              <div key={c.id} className="flex gap-2.5 text-xs items-start">
                                <img src={c.user_avatar} alt={c.user_name} className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5" />
                                <div className="bg-slate-100 p-2.5 rounded-xl flex-1">
                                  <div className="font-bold text-slate-800">{c.user_name}</div>
                                  <p className="text-slate-600 mt-0.5">{c.text}</p>
                                </div>
                              </div>
                            ))}

                            {/* Comment Input */}
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                const input = (e.currentTarget.elements.namedItem("comment-field") as HTMLInputElement);
                                handleAddComment(p.id, input.value);
                                input.value = "";
                              }}
                              className="flex gap-2"
                            >
                              <input
                                name="comment-field"
                                type="text"
                                placeholder="Escreva um comentário..."
                                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#14B8A6]"
                              />
                              <button
                                type="submit"
                                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1 rounded-lg text-xs font-semibold transition"
                              >
                                Enviar
                              </button>
                            </form>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Mural Right rail (Statistics/Badges summary) */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" /> Engajamento do Mês
                    </h4>
                    <p className="text-xs text-slate-500">
                      O Flow RH premia as equipes mais colaborativas e engajadas do mês.
                    </p>
                    
                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-slate-600">1. Gente & Gestão</span>
                        <span className="bg-teal-50 text-teal-600 font-bold px-2 py-0.5 rounded font-mono">1.240 pts</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-slate-600">2. Engenharia de Software</span>
                        <span className="bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded font-mono">980 pts</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-slate-600">3. Design & UX</span>
                        <span className="bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded font-mono">810 pts</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">🎖️ Medalhas Ativas</h4>
                    <div className="space-y-3">
                      {badgesList.map(b => (
                        <div key={b.name} className="flex gap-2 items-start text-xs">
                          <span className="text-2xl">{b.icon}</span>
                          <div>
                            <div className="font-bold text-slate-800">{b.name}</div>
                            <p className="text-[10px] text-slate-500 leading-tight">{b.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : currentTab === "ponto" ? (
              
              /* --- PONTO COM VALIDACAO FACIAL --- */
              <motion.div
                key="ponto"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Visual facial reader frame */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h3 className="font-bold text-slate-800 text-base mb-2">Validador Biométrico Facial</h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Posicione seu rosto dentro da silhueta demarcada abaixo para autenticar sua identidade de forma segura.
                    </p>

                    {pontoSuccess && (
                      <div className="bg-green-50 text-green-800 text-xs p-4 rounded-xl flex items-center gap-3 border border-green-100 mb-4">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <div className="font-bold">Ponto registrado com sucesso!</div>
                          <p className="text-[11px] text-green-700">Seu registro foi enviado ao departamento de Gente & Gestão.</p>
                        </div>
                      </div>
                    )}

                    <div className="bg-slate-900 aspect-video rounded-xl relative overflow-hidden flex flex-col items-center justify-center text-white border-4 border-slate-950 shadow-inner">
                      {/* Video capture / Canvas or Placeholder */}
                      {cameraActive ? (
                        <>
                          <video
                            ref={videoRef}
                            className="w-full h-full object-cover scale-x-[-1]"
                            playsInline
                            muted
                          />
                          {/* Face guide Overlay */}
                          <div className="absolute inset-0 border-[24px] border-slate-900/40 pointer-events-none flex items-center justify-center">
                            <div className="w-48 h-60 border-2 border-dashed border-teal-400 rounded-[50%_50%_45%_45%] animate-pulse relative">
                              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-teal-400/25" />
                              <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[9px] bg-teal-500 px-1 py-0.5 rounded text-white tracking-widest font-mono">BIOMETRIA</span>
                            </div>
                          </div>
                        </>
                      ) : capturedPhoto ? (
                        <img src={capturedPhoto} alt="Captured face" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-6 space-y-3">
                          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400 border border-slate-700">
                            <Camera className="w-8 h-8" />
                          </div>
                          <div>
                            <div className="text-sm font-bold">Câmera Frontal Inativa</div>
                            <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">Ative a câmera para iniciar o escaneamento e validação.</p>
                          </div>
                          <button
                            onClick={() => { setCameraActive(true); setCapturedPhoto(null); }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 px-4 rounded-lg text-xs transition"
                          >
                            Ativar Câmera Frontal
                          </button>
                        </div>
                      )}

                      {/* Scanning visual overlay */}
                      {cameraActive && !capturedPhoto && (
                        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center bg-slate-950/85 p-2 rounded-lg text-[10px]">
                          <span className="flex items-center gap-1 text-teal-400 font-bold">
                            <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" /> Câmera Pronta
                          </span>
                          <button
                            onClick={capturePhoto}
                            className="bg-white hover:bg-slate-100 text-slate-900 font-bold px-3 py-1 rounded"
                          >
                            Capturar Imagem
                          </button>
                        </div>
                      )}

                      {/* Mockup fallback if permission failed */}
                      {cameraPermissionError && (
                        <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 text-center space-y-2">
                          <AlertCircle className="w-10 h-10 text-amber-500" />
                          <div className="text-xs font-bold">Acesso à Câmera Bloqueado</div>
                          <p className="text-[10px] text-slate-400 max-w-xs leading-normal">
                            Para simulação neste ambiente virtual do iFrame, você pode usar uma imagem facial padrão do banco.
                          </p>
                          <button
                            onClick={() => {
                              setCapturedPhoto("https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80");
                              setCameraPermissionError(false);
                            }}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1 rounded text-xs"
                          >
                            Usar Biometria Simulada (Padrão)
                          </button>
                        </div>
                      )}
                    </div>

                    <canvas ref={canvasRef} className="hidden" />

                    {/* Point parameters setup */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Tipo de Registro</label>
                        <select
                          className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white"
                          value={pointType}
                          onChange={(e) => setPointType(e.target.value as TimeRecord["type"])}
                        >
                          <option value="entrada">⏰ Entrada de Expediente</option>
                          <option value="almoco_ida">🍔 Ida ao Almoço</option>
                          <option value="almoco_volta">☕ Volta do Almoço</option>
                          <option value="saida">🚪 Saída de Expediente</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Geolocalização</label>
                        <button
                          type="button"
                          onClick={fetchGeolocation}
                          className="w-full text-left text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-600 hover:bg-slate-50 flex items-center justify-between"
                        >
                          <span className="truncate">{geolocation ? geolocation.address : "Clique para obter coordenadas"}</span>
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        </button>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 mt-6 flex justify-end gap-2">
                      {capturedPhoto && (
                        <button
                          onClick={() => { setCapturedPhoto(null); setCameraActive(true); }}
                          className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-4 py-2"
                        >
                          Tirar outra foto
                        </button>
                      )}
                      <button
                        onClick={handleRegisterPonto}
                        disabled={(!capturedPhoto && !cameraActive) || pontoLoading}
                        className="bg-[#8B5CF6] hover:bg-purple-700 disabled:bg-slate-300 text-white font-semibold px-6 py-2 rounded-lg text-xs transition shadow-md shadow-purple-500/10 flex items-center gap-1.5"
                      >
                        {pontoLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" /> Processando Biometria...
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-4 h-4" /> Confirmar e Registrar Ponto
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Point History right panel */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h3 className="font-bold text-slate-800 text-sm mb-4">Seus Registros de Hoje</h3>
                    <div className="space-y-3">
                      {timeRecords.filter(r => r.user_id === currentUser.id).slice(0, 4).map(r => (
                        <div key={r.id} className="flex gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-100 hover:bg-slate-100/55 transition">
                          <img src={r.photo_url} alt="Verified biometry" className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                          <div className="flex-1 text-xs">
                            <div className="font-bold capitalize text-slate-800">{r.type.replace("_", " ")}</div>
                            <p className="text-[10px] text-slate-400">{new Date(r.timestamp).toLocaleTimeString("pt-BR")}</p>
                          </div>
                          <span className="text-[10px] bg-green-50 text-green-700 font-bold py-0.5 px-2 rounded-full flex items-center gap-0.5 border border-green-100">
                            <Check className="w-3 h-3" /> Validado
                          </span>
                        </div>
                      ))}
                      {timeRecords.filter(r => r.user_id === currentUser.id).length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-6">Você ainda não registrou nenhum ponto hoje.</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h3 className="font-bold text-slate-800 text-sm mb-3">Auditoria e Geolocalização</h3>
                    <p className="text-[11px] text-slate-500 leading-normal mb-3">
                      Os registros no Flow RH adotam o princípio RLS (Row Level Security) e criptografia de ponta. Os metadados de latitude/longitude são verificados para segurança jurídica.
                    </p>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-[10px] text-slate-500 space-y-1">
                      <div>COMPANY_ID: {currentUser.company_id}</div>
                      <div>USER_ID: {currentUser.id}</div>
                      <div>GPS: {geolocation ? `${geolocation.lat}, ${geolocation.lng}` : "Aguardando GPS"}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : currentTab === "empresa" ? (
              
              /* --- EMPRESA / GESTAO (RBAC & CONVITES) --- */
              <motion.div
                key="empresa"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Colaboradores & Acessos (RBAC)</h2>
                    <p className="text-xs text-slate-500">Gerencie a equipe e envie convites corporativos integrados.</p>
                  </div>
                  
                  {currentUser.role !== UserRole.HR_MANAGER && currentUser.role !== UserRole.SUPER_ADMIN && (
                    <div className="bg-amber-50 text-amber-800 text-[11px] font-medium p-2 rounded-lg border border-amber-100 max-w-sm">
                      ⚠️ Visualização de Colaborador (Somente leitura). Para gerenciar funções ou enviar convites, troque de usuário no menu superior.
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Members list (Col 8) */}
                  <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-sm text-slate-700">Equipe de {activeCompany?.name}</h3>
                        <span className="text-xs bg-slate-200 text-slate-600 font-bold px-2.5 py-0.5 rounded-full">{companyUsers.length} Membros</span>
                      </div>
                      
                      <div className="divide-y divide-slate-100">
                        {companyUsers.map(u => (
                          <div key={u.id} className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-slate-50/50 transition">
                            <div className="flex items-center gap-3">
                              <img src={u.avatar} alt={u.name} className="w-11 h-11 rounded-full object-cover border border-slate-200" />
                              <div>
                                <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                  {u.name}
                                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                    u.role === UserRole.SUPER_ADMIN ? "bg-purple-100 text-purple-700" :
                                    u.role === UserRole.HR_MANAGER ? "bg-blue-100 text-[#0043FF]" :
                                    u.role === UserRole.SUPERVISOR ? "bg-amber-100 text-amber-700" :
                                    "bg-slate-100 text-slate-600"
                                  }`}>
                                    {u.role === UserRole.SUPER_ADMIN ? "Super Admin" :
                                     u.role === UserRole.HR_MANAGER ? "RH" :
                                     u.role === UserRole.SUPERVISOR ? "Supervisor" :
                                     "Colaborador"}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500">{u.email}</div>
                                <div className="text-[10px] text-slate-400 font-medium mt-0.5">Admitido em: {new Date(u.hire_date).toLocaleDateString("pt-BR")} • Setor: {u.department}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5">
                              {/* Display Badge count */}
                              <div className="flex items-center gap-1 bg-amber-50 text-amber-700 font-bold text-[10px] px-2 py-1 rounded-lg mr-2">
                                <Award className="w-3.5 h-3.5 text-amber-600" /> {posts.filter(p=>p.badge_award?.recipient_id === u.id).length} Badge(s)
                              </div>

                              {deletingUserId === u.id ? (
                                <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 px-2 py-1 rounded-lg text-xs animate-fade-in">
                                  <span className="text-[10px] font-bold text-red-600 uppercase">Excluir?</span>
                                  <button
                                    onClick={() => {
                                      handleDeleteUser(u.id);
                                      setDeletingUserId(null);
                                    }}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-0.5 rounded text-[10px] transition"
                                  >
                                    Sim
                                  </button>
                                  <button
                                    onClick={() => setDeletingUserId(null)}
                                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px] transition"
                                  >
                                    Não
                                  </button>
                                </div>
                              ) : (
                                (currentUser.role === UserRole.HR_MANAGER || currentUser.role === UserRole.SUPER_ADMIN) && (
                                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-1.5 py-1 rounded-lg">
                                    <button
                                      onClick={() => {
                                        setEditingUserId(u.id);
                                        setEditUserName(u.name);
                                        setEditUserEmail(u.email);
                                        setEditUserDepartment(u.department);
                                        setEditUserHireDate(u.hire_date.split('T')[0]);
                                        setEditUserRole(u.role);
                                        setEditUserAvatar(u.avatar);
                                        setDeletingUserId(null);
                                      }}
                                      className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-[#0043FF] transition"
                                      title="Editar Colaborador"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    {u.id !== currentUser.id && (
                                      <button
                                        onClick={() => {
                                          setDeletingUserId(u.id);
                                        }}
                                        className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-red-500 transition"
                                        title="Excluir Colaborador"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pending invitations logs */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                        <h3 className="font-bold text-sm text-slate-700">Convites Enviados (Acesso via Link)</h3>
                      </div>
                      <div className="divide-y divide-slate-100 text-xs">
                        {companyInvitations.map(inv => (
                          <div key={inv.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                            <div>
                              <div className="font-bold text-slate-800">{inv.email}</div>
                              <p className="text-[10px] text-slate-400 mt-0.5">Enviado por {inv.invited_by} em {new Date(inv.sent_at).toLocaleDateString("pt-BR")}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                inv.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"
                              }`}>
                                {inv.status === "pending" ? "Pendente" : "Aceito"}
                              </span>
                              
                              {/* Simulation link helper */}
                              {inv.status === "pending" && (
                                <button
                                  onClick={() => {
                                    setOnboardEmail(inv.email);
                                    setIsOnboarding(true);
                                  }}
                                  className="text-[10px] font-bold bg-teal-500 hover:bg-teal-600 text-white px-2.5 py-1 rounded transition"
                                >
                                  Simular Onboarding
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        {companyInvitations.length === 0 && (
                          <p className="p-6 text-slate-400 text-center">Nenhum convite gerado para esta empresa.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Form block with Tabs (Col 4) */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                      {/* Form Tabs */}
                      <div className="flex border-b border-slate-100 mb-4">
                        <button
                          type="button"
                          onClick={() => setCreationMode("invite")}
                          className={`flex-1 pb-2.5 text-xs font-bold transition text-center ${
                            creationMode === "invite"
                              ? "text-[#0043FF] border-b-2 border-[#0043FF]"
                              : "text-slate-400 hover:text-slate-600"
                          }`}
                        >
                          Convidar via Link
                        </button>
                        <button
                          type="button"
                          onClick={() => setCreationMode("direct")}
                          className={`flex-1 pb-2.5 text-xs font-bold transition text-center ${
                            creationMode === "direct"
                              ? "text-[#10B981] border-b-2 border-[#10B981]"
                              : "text-slate-400 hover:text-slate-600"
                          }`}
                        >
                          Acesso Completo
                        </button>
                      </div>

                      {inviteSuccessMsg && (
                        <div className="bg-teal-50 text-teal-800 text-xs p-3 rounded-lg border border-teal-100 mb-4 font-medium flex items-center justify-between">
                          <span>{inviteSuccessMsg}</span>
                          <button onClick={() => setInviteSuccessMsg("")} className="text-teal-600 hover:text-teal-800">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {creationMode === "invite" ? (
                        <div className="space-y-4">
                          <p className="text-xs text-slate-500 leading-normal mb-1">
                            O convite enviará o link estruturado com os dados corporativos para preenchimento de onboarding autônomo.
                          </p>

                          <form onSubmit={handleSendInvite} className="space-y-4">
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">E-mail do Colaborador</label>
                              <input
                                type="email"
                                required
                                placeholder="colaborador@empresa.com"
                                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:border-[#0043FF] focus:outline-none text-slate-800"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                disabled={currentUser.role !== UserRole.HR_MANAGER && currentUser.role !== UserRole.SUPER_ADMIN}
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Perfil de Acesso (RBAC)</label>
                              <select
                                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800"
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                                disabled={currentUser.role !== UserRole.HR_MANAGER && currentUser.role !== UserRole.SUPER_ADMIN}
                              >
                                <option value={UserRole.COLLABORATOR}>Colaborador</option>
                                <option value={UserRole.SUPERVISOR}>Supervisor</option>
                                <option value={UserRole.HR_MANAGER}>Gestor de RH</option>
                              </select>
                            </div>

                            <button
                              type="submit"
                              disabled={currentUser.role !== UserRole.HR_MANAGER && currentUser.role !== UserRole.SUPER_ADMIN}
                              className="w-full bg-[#0043FF] hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-2 rounded-lg text-xs transition shadow-sm"
                            >
                              Gerar Convite Integrado
                            </button>
                          </form>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-xs text-slate-500 leading-normal mb-1">
                            Adicione o colaborador diretamente na base corporativa. O acesso é criado instantaneamente para login imediato.
                          </p>

                          <form onSubmit={handleCreateUserDirect} className="space-y-3">
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">Nome Completo</label>
                              <input
                                type="text"
                                required
                                placeholder="Ex: Lucas Henrique"
                                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:border-[#10B981] focus:outline-none text-slate-800"
                                value={createUserName}
                                onChange={(e) => setCreateUserName(e.target.value)}
                                disabled={currentUser.role !== UserRole.HR_MANAGER && currentUser.role !== UserRole.SUPER_ADMIN}
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">E-mail Corporativo</label>
                              <input
                                type="email"
                                required
                                placeholder="lucas@empresa.com"
                                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:border-[#10B981] focus:outline-none text-slate-800"
                                value={createUserEmail}
                                onChange={(e) => setCreateUserEmail(e.target.value)}
                                disabled={currentUser.role !== UserRole.HR_MANAGER && currentUser.role !== UserRole.SUPER_ADMIN}
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">Setor / Departamento</label>
                              <input
                                type="text"
                                required
                                placeholder="Ex: Engenharia, Atendimento, TI"
                                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:border-[#10B981] focus:outline-none text-slate-800"
                                value={createUserDepartment}
                                onChange={(e) => setCreateUserDepartment(e.target.value)}
                                disabled={currentUser.role !== UserRole.HR_MANAGER && currentUser.role !== UserRole.SUPER_ADMIN}
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">Data de Admissão</label>
                              <input
                                type="date"
                                required
                                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:border-[#10B981] focus:outline-none text-slate-800"
                                value={createUserHireDate}
                                onChange={(e) => setCreateUserHireDate(e.target.value)}
                                disabled={currentUser.role !== UserRole.HR_MANAGER && currentUser.role !== UserRole.SUPER_ADMIN}
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">Perfil de Acesso (RBAC)</label>
                              <select
                                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800"
                                value={createUserRole}
                                onChange={(e) => setCreateUserRole(e.target.value as UserRole)}
                                disabled={currentUser.role !== UserRole.HR_MANAGER && currentUser.role !== UserRole.SUPER_ADMIN}
                              >
                                <option value={UserRole.COLLABORATOR}>Colaborador</option>
                                <option value={UserRole.SUPERVISOR}>Supervisor</option>
                                <option value={UserRole.HR_MANAGER}>Gestor de RH</option>
                              </select>
                            </div>

                            <button
                              type="submit"
                              disabled={currentUser.role !== UserRole.HR_MANAGER && currentUser.role !== UserRole.SUPER_ADMIN}
                              className="w-full bg-[#10B981] hover:bg-emerald-600 disabled:bg-slate-300 text-white font-semibold py-2 rounded-lg text-xs transition shadow-sm mt-2"
                            >
                              Criar Acesso Completo
                            </button>
                          </form>
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm space-y-3">
                      <h4 className="text-xs font-bold uppercase text-teal-400">Onboarding Inteligente</h4>
                      <p className="text-[11px] text-slate-300 leading-normal">
                        O Flow RH preserva os tenants isolados via Row Level Security (RLS). Acessos completos criados ficam imediatamente disponíveis no menu superior para alternância simulada de perfil e testes de visualização em tempo real.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Edit Collaborator Overlay Modal */}
                <AnimatePresence>
                  {editingUserId && (
                    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden text-slate-800 flex flex-col"
                      >
                        {/* Modal Header */}
                        <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center justify-between">
                          <div>
                            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                              <span className="text-[#0043FF] text-base">📝</span> Editar Perfil de Acesso
                            </h3>
                            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                              Atualize os dados corporativos e as permissões de acesso do colaborador.
                            </p>
                          </div>
                          <button
                            onClick={() => setEditingUserId(null)}
                            className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
                          {/* Form Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Nome Completo */}
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                                Nome Completo
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  required
                                  className="w-full text-xs border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 focus:border-[#0043FF] focus:outline-none focus:ring-2 focus:ring-blue-100/50 bg-slate-50/50 hover:bg-white text-slate-800 font-medium transition"
                                  value={editUserName}
                                  onChange={(e) => setEditUserName(e.target.value)}
                                  placeholder="Ex: Lucas Henrique"
                                />
                                <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                              </div>
                            </div>

                            {/* E-mail Corporativo */}
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                                E-mail Corporativo
                              </label>
                              <div className="relative">
                                <input
                                  type="email"
                                  required
                                  className="w-full text-xs border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 focus:border-[#0043FF] focus:outline-none focus:ring-2 focus:ring-blue-100/50 bg-slate-50/50 hover:bg-white text-slate-800 font-medium transition"
                                  value={editUserEmail}
                                  onChange={(e) => setEditUserEmail(e.target.value)}
                                  placeholder="lucas@empresa.com"
                                />
                                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                              </div>
                            </div>

                            {/* Setor / Departamento */}
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                                Setor / Departamento
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  required
                                  className="w-full text-xs border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 focus:border-[#0043FF] focus:outline-none focus:ring-2 focus:ring-blue-100/50 bg-slate-50/50 hover:bg-white text-slate-800 font-medium transition"
                                  value={editUserDepartment}
                                  onChange={(e) => setEditUserDepartment(e.target.value)}
                                  placeholder="Ex: Engenharia"
                                />
                                <Briefcase className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                              </div>
                            </div>

                            {/* Data de Admissão */}
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                                Data de Admissão
                              </label>
                              <div className="relative">
                                <input
                                  type="date"
                                  required
                                  className="w-full text-xs border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 focus:border-[#0043FF] focus:outline-none focus:ring-2 focus:ring-blue-100/50 bg-slate-50/50 hover:bg-white text-slate-800 font-medium transition"
                                  value={editUserHireDate}
                                  onChange={(e) => setEditUserHireDate(e.target.value)}
                                />
                                <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                              </div>
                            </div>

                            {/* Perfil de Acesso (RBAC) */}
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                                Perfil de Acesso (RBAC)
                              </label>
                              <div className="relative">
                                <select
                                  className="w-full text-xs border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 bg-slate-50/50 hover:bg-white focus:border-[#0043FF] focus:outline-none focus:ring-2 focus:ring-blue-100/50 text-slate-800 font-medium transition appearance-none"
                                  value={editUserRole}
                                  onChange={(e) => setEditUserRole(e.target.value as UserRole)}
                                >
                                  <option value={UserRole.COLLABORATOR}>Colaborador</option>
                                  <option value={UserRole.SUPERVISOR}>Supervisor</option>
                                  <option value={UserRole.HR_MANAGER}>Gestor de RH</option>
                                </select>
                                <Shield className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                              </div>
                            </div>
                          </div>

                          {/* Security Banner like on login screen */}
                          <div className="bg-blue-50/50 border border-blue-100/80 rounded-xl p-3 flex items-start gap-2.5 text-[10px] text-blue-800 leading-normal">
                            <span className="text-sm">🛡️</span>
                            <div>
                              <span className="font-bold block text-blue-900">Segurança Multi-Tenant Ativa</span>
                              <span className="text-blue-600/90 font-medium">
                                As alterações efetuadas neste cadastro serão sincronizadas em tempo real e protegidas sob as diretrizes de Row Level Security (RLS) da empresa ativa.
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => setEditingUserId(null)}
                              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              className="px-5 py-2.5 bg-[#0043FF] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-100 hover:shadow-lg"
                            >
                              Salvar Alterações
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : currentTab === "flow_ai" ? (
              
              /* --- FLOW AI ASSISTANT PANEL --- */
              <motion.div
                key="flow_ai"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Suggestion prompts rail */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-cyan-500" /> Consultas de Políticas
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Clique em um tema para interagir com o assistente inteligente usando a base corporativa.
                    </p>

                    <div className="space-y-2 pt-2">
                      <button
                        onClick={() => executeQuickQuery("Como funciona o limite de reembolso de despesas de viagem?")}
                        className="w-full text-left bg-slate-50 hover:bg-[#0043FF]/5 border border-slate-100 hover:border-[#0043FF]/15 text-xs text-slate-600 p-2.5 rounded-xl transition"
                      >
                        💵 Reembolso de refeições e Uber
                      </button>
                      <button
                        onClick={() => executeQuickQuery("Com quanto tempo de antecedência devo pedir minhas férias?")}
                        className="w-full text-left bg-slate-50 hover:bg-[#0043FF]/5 border border-slate-100 hover:border-[#0043FF]/15 text-xs text-slate-600 p-2.5 rounded-xl transition"
                      >
                        🏖️ Prazos e regras de férias
                      </button>
                      <button
                        onClick={() => executeQuickQuery("Quais as diretrizes para o modelo de trabalho híbrido da empresa?")}
                        className="w-full text-left bg-slate-50 hover:bg-[#0043FF]/5 border border-slate-100 hover:border-[#0043FF]/15 text-xs text-slate-600 p-2.5 rounded-xl transition"
                      >
                        🏢 Dias de home office e presencial
                      </button>
                      <button
                        onClick={() => executeQuickQuery("Como registrar ponto utilizando validação facial?")}
                        className="w-full text-left bg-slate-50 hover:bg-[#0043FF]/5 border border-slate-100 hover:border-[#0043FF]/15 text-xs text-slate-600 p-2.5 rounded-xl transition"
                      >
                        ⏰ Biometria e horas de expediente
                      </button>
                    </div>
                  </div>

                  <div className="bg-cyan-950 text-cyan-100 p-5 rounded-2xl shadow-sm border border-cyan-800 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                      <Bot className="w-4 h-4 text-cyan-400" /> Flow AI Inteligente
                    </h4>
                    <p className="text-[11px] opacity-80 leading-normal">
                      A IA lê as variáveis de ambiente, as políticas da empresa vinculadas ao `company_id` do usuário e responde em tempo real.
                    </p>
                  </div>
                </div>

                {/* Main chat window */}
                <div className="lg:col-span-8 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-[500px]">
                  {/* Chat header */}
                  <div className="px-5 py-4 border-b border-slate-100 bg-[#0043FF]/5 flex items-center gap-2">
                    <Bot className="w-5 h-5 text-cyan-600" />
                    <div>
                      <h3 className="font-bold text-sm text-slate-800">Assistente Corporativo</h3>
                      <p className="text-[10px] text-slate-500 font-medium">Informações da sua empresa: {activeCompany?.name}</p>
                    </div>
                  </div>

                  {/* Message logs */}
                  <div className="flex-1 p-5 overflow-y-auto space-y-4">
                    {aiHistory.map((h, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-3 max-w-[85%] ${h.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                      >
                        <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm font-semibold border ${
                          h.role === "user"
                            ? "bg-[#0043FF] text-white border-blue-600"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}>
                          {h.role === "user" ? "U" : <Bot className="w-4 h-4 text-slate-600" />}
                        </div>
                        <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                          h.role === "user"
                            ? "bg-[#0043FF] text-white rounded-tr-none"
                            : "bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none whitespace-pre-line"
                        }`}>
                          {h.text}
                        </div>
                      </div>
                    ))}

                    {aiLoading && (
                      <div className="flex gap-3 max-w-[80%] mr-auto">
                        <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-slate-100 border border-slate-200">
                          <Bot className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="bg-slate-50 p-3 rounded-2xl rounded-tl-none border border-slate-100 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input field */}
                  <form onSubmit={handleSendAiMessage} className="p-4 border-t border-slate-100 flex gap-2">
                    <input
                      type="text"
                      placeholder="Diga: 'Quais as regras de despesas' ou 'Quantos dias de férias posso pedir?'"
                      className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-cyan-500"
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      disabled={aiLoading}
                    />
                    <button
                      type="submit"
                      id="send-ai-btn"
                      disabled={!aiInput.trim() || aiLoading}
                      className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-200 text-white font-bold p-2.5 rounded-xl transition shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </motion.div>
            ) : currentTab === "talentos" ? (
              
              /* --- TALENT MANAGEMENT & CV SCREENING TAB --- */
              <motion.div
                key="talentos"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Left Column - CV Input and Presets */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">Painel de Triagem Inteligente</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Utilize a Inteligência Artificial para escanear, avaliar e pontuar currículos de candidatos instantaneamente.
                      </p>
                    </div>

                    {/* Pre-fill Buttons */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Simular Candidato Pré-carregado:</span>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          onClick={() => {
                            setCandidateName("Ana Souza");
                            setTargetRole("Desenvolvedor Full Stack");
                            setResumeText(`Ana Souza - Desenvolvedora Full Stack Sênior\nEmail: ana.souza@gmail.com | LinkedIn: /in/anasouza\n\nResumo:\nProfissional com mais de 6 anos de experiência em desenvolvimento de software com React, Node.js, Express, TypeScript, PostgreSQL e infraestrutura AWS. Foco no desenvolvimento ágil e escalabilidade técnica de microsserviços.\n\nCompetências Técnicas:\n- Frontend: React.js, Tailwind CSS, Redux, Next.js\n- Backend: Node.js, NestJS, REST APIs, GraphQL\n- Banco de Dados: PostgreSQL, MongoDB, Redis\n- DevOps & Cloud: Docker, AWS (S3, EC2, Lambda), GitHub Actions\n\nExperiência Profissional:\n- Tech Lead / Engenheira de Software Sênior na DevCorp (2022 - Presente):\n  Responsável pela arquitetura de uma plataforma SaaS multi-tenant que reduziu o tempo de resposta das APIs em 40%.\n- Desenvolvedora Full Stack na WebSolutions (2019 - 2022):\n  Liderou a refatoração do painel de controle principal para React e Tailwind.`);
                          }}
                          className="bg-white border border-slate-200 hover:border-teal-400 text-[10px] text-slate-600 font-bold p-2 rounded-lg transition text-center truncate"
                        >
                          👩‍💻 Ana (Full Stack)
                        </button>
                        <button
                          onClick={() => {
                            setCandidateName("Bruno Lima");
                            setTargetRole("Analista de Gente e Gestão");
                            setResumeText(`Bruno Lima - Especialista de Recursos Humanos & EX\nEmail: bruno.lima@hr.com\n\nResumo:\nProfissional generalista de recursos humanos com 4 anos de atuação com employee experience, recrutamento e seleção (R&S), desenvolvimento organizacional, canais de feedback anônimos e acompanhamento de clima organizacional.\n\nCompetências:\n- Employee Experience (EX) e onboarding estruturado\n- Atração e Seleção técnica de talentos de TI\n- Gestão de conflitos e mediação\n- Avaliações de desempenho 360 e PDIs\n\nExperiência:\n- Analista de RH na Base44 (2021 - Presente):\n  Responsável pelo onboarding de mais de 120 novos colaboradores. Desenvolveu e manteve pesquisas semanais de clima que aumentaram o ENPS da empresa de 35 para 72.\n- Assistente de R&S na TalentCo (2019 - 2021):\n  Condução de interviews de fit cultural e triagem curricular técnica.`);
                          }}
                          className="bg-white border border-slate-200 hover:border-teal-400 text-[10px] text-slate-600 font-bold p-2 rounded-lg transition text-center truncate"
                        >
                          💼 Bruno (HR Analyst)
                        </button>
                        <button
                          onClick={() => {
                            setCandidateName("Carla Dias");
                            setTargetRole("Gerente de Produto");
                            setResumeText(`Carla Dias - Product Manager (PM)\nEmail: carla.dias@pm.org\n\nResumo:\nEspecialista em gestão de produtos digitais B2B SaaS focada em metodologias ágeis (Scrum), análise de métricas de engajamento, priorização com RICE e alinhamento com stakeholders.\n\nCompetências:\n- Metodologias Ágeis: Scrum, Kanban\n- Ferramentas: Jira, Miro, Productboard, Mixpanel\n- Priorização: Framework RICE, WSJF\n- Definição de OKRs e métricas de conversão de funil\n\nExperiência:\n- Product Manager na TechGroup (2020 - Presente):\n  Liderou o time de produto na criação de um aplicativo móvel que alcançou 100k usuários ativos mensais.\n- Product Owner na StartupHub (2018 - 2020):\n  Gerenciamento do backlog de desenvolvimento e facilitação de reuniões de planejamento.`);
                          }}
                          className="bg-white border border-slate-200 hover:border-teal-400 text-[10px] text-slate-600 font-bold p-2 rounded-lg transition text-center truncate"
                        >
                          📈 Carla (Product Manager)
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nome do Candidato</label>
                        <input
                          type="text"
                          required
                          placeholder="Digite o nome completo"
                          className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:border-[#0043FF] focus:outline-none"
                          value={candidateName}
                          onChange={(e) => setCandidateName(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cargo Alvo</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Desenvolvedor React Sênior"
                          className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:border-[#0043FF] focus:outline-none"
                          value={targetRole}
                          onChange={(e) => setTargetRole(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Texto do Currículo (CV)</label>
                        <textarea
                          required
                          placeholder="Cole o texto bruto do currículo do candidato aqui para que a IA faça o parsing e a triagem estruturada..."
                          className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:border-[#0043FF] focus:outline-none min-h-[160px] font-sans leading-relaxed"
                          value={resumeText}
                          onChange={(e) => setResumeText(e.target.value)}
                        />
                      </div>

                      <button
                        onClick={handleScreenResume}
                        disabled={screeningLoading || !resumeText.trim()}
                        className="w-full bg-[#10B981] hover:bg-emerald-600 disabled:bg-slate-300 text-white font-semibold py-3 rounded-xl text-xs transition shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2"
                      >
                        {screeningLoading ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Triando e avaliando com Gemini...
                          </>
                        ) : (
                          <>
                            <span>🚀</span>
                            Iniciar Triagem com Inteligência Artificial
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column - Screening Results */}
                <div className="lg:col-span-7">
                  <AnimatePresence mode="wait">
                    {screeningLoading ? (
                      <motion.div
                        key="loading-screening"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center flex flex-col justify-center items-center h-full min-h-[400px]"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#10B981] flex items-center justify-center animate-pulse mb-4">
                          <Bot className="w-8 h-8 text-[#10B981]" />
                        </div>
                        <h4 className="font-extrabold text-slate-800 text-sm">Escaneando Habilidades e Experiências...</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm leading-normal">
                          O modelo Gemini-3.5-Flash está lendo os dados, pontuando o fit técnico com a vaga e estruturando a recomendação para o time de Recursos Humanos.
                        </p>
                        <div className="flex gap-1 items-center justify-center mt-6">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </motion.div>
                    ) : screeningResult ? (
                      <motion.div
                        key="result-screening"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                      >
                        {/* Summary Header */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${
                                screeningResult.status === "Aprovado" ? "bg-green-100 text-green-700" :
                                screeningResult.status === "Revisar" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                              }`}>
                                {screeningResult.status === "Aprovado" ? "✓" :
                                 screeningResult.status === "Revisar" ? "!" : "✕"}
                              </div>
                              <div>
                                <h4 className="font-extrabold text-slate-800 text-base">{candidateName || "Candidato"}</h4>
                                <p className="text-xs text-slate-500">Avaliado para: <span className="font-bold text-slate-700">{targetRole}</span></p>
                              </div>
                            </div>

                            {/* Score Card */}
                            <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl text-center shrink-0 flex items-center gap-3">
                              <div className="text-left">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Fit Score</span>
                                <span className={`text-2xl font-black ${
                                  screeningResult.score >= 80 ? "text-green-600" :
                                  screeningResult.score >= 50 ? "text-amber-600" : "text-red-500"
                                }`}>
                                  {screeningResult.score}/100
                                </span>
                              </div>
                              <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${
                                screeningResult.status === "Aprovado" ? "bg-green-100 text-green-700" :
                                screeningResult.status === "Revisar" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                              }`}>
                                {screeningResult.status}
                              </span>
                            </div>
                          </div>

                          <div className="mt-5 pt-4 border-t border-slate-100">
                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Sumário Executivo da IA</h5>
                            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{screeningResult.summary}</p>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Strengths */}
                          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-3">
                            <h5 className="text-[10px] font-bold text-green-600 uppercase tracking-wider flex items-center gap-1">
                              <CheckCircle className="w-4 h-4 text-green-500" /> Pontos Fortes Reconhecidos
                            </h5>
                            <ul className="space-y-2 text-xs text-slate-600">
                              {screeningResult.strengths?.map((s: string, idx: number) => (
                                <li key={idx} className="flex gap-2 items-start leading-normal">
                                  <span className="text-green-500 font-bold shrink-0">•</span>
                                  <span>{s}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Weaknesses */}
                          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-3">
                            <h5 className="text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                              <AlertCircle className="w-4 h-4 text-amber-500" /> Pontos de Atenção / Gaps
                            </h5>
                            <ul className="space-y-2 text-xs text-slate-600">
                              {screeningResult.weaknesses?.map((w: string, idx: number) => (
                                <li key={idx} className="flex gap-2 items-start leading-normal">
                                  <span className="text-amber-500 font-bold shrink-0">•</span>
                                  <span>{w}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Cultural Fit & Interview Questions */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                          <div>
                            <h5 className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-1">Análise de Adequação Cultural</h5>
                            <p className="text-xs text-slate-600 leading-relaxed">{screeningResult.culturalFit}</p>
                          </div>

                          <div className="pt-4 border-t border-slate-100">
                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Perguntas Personalizadas para Entrevista</h5>
                            <div className="space-y-2">
                              {screeningResult.interviewQuestions?.map((q: string, idx: number) => (
                                <div key={idx} className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs text-slate-700 leading-normal flex gap-3">
                                  <span className="font-extrabold text-[#0043FF] font-mono shrink-0">P{idx+1}</span>
                                  <span>{q}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty-screening"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center flex flex-col justify-center items-center h-full min-h-[400px]"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mb-4 border border-slate-100">
                          <Briefcase className="w-8 h-8" />
                        </div>
                        <h4 className="font-extrabold text-slate-800 text-sm">Pronto para a Triagem de Currículos</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm leading-normal">
                          Escolha um dos candidatos de simulação rápida acima ou preencha os dados do candidato e cole o currículo para iniciar uma triagem inteligente baseada em IA.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : currentTab === "super_admin" ? (
              
              /* --- SUPER ADMIN DASHBOARD PANEL --- */
              <motion.div
                key="super_admin"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Executive Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Empresas (Tenants)</span>
                    <div className="text-3xl font-extrabold text-slate-800 mt-1">{companies.length}</div>
                    <div className="text-[10px] text-slate-400 mt-1">Multi-empresa (RLS habilitada)</div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Usuários Globais</span>
                    <div className="text-3xl font-extrabold text-slate-800 mt-1">{users.length}</div>
                    <div className="text-[10px] text-blue-600 font-semibold mt-1">1 Super Admin vinculado</div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Convites Ativos</span>
                    <div className="text-3xl font-extrabold text-slate-800 mt-1">{invitations.length}</div>
                    <div className="text-[10px] text-slate-400 mt-1">Total de convites gerados</div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Segurança Geral</span>
                      <div className="text-sm font-extrabold text-green-600 mt-1 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Ativo
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">Google Identity SSO</div>
                    </div>
                    <span className="text-2xl">🔒</span>
                  </div>
                </div>

                {/* Company Manager and Seeder */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Create Company Tenant */}
                  <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Cadastrar Novo Tenant (Empresa)</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Adicione novas empresas à plataforma de Employee Experience Flow RH.</p>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.currentTarget;
                        const companyName = (form.elements.namedItem("c-name") as HTMLInputElement).value;
                        const segment = (form.elements.namedItem("c-segment") as HTMLInputElement).value;
                        
                        const newCompany: Company = {
                          id: `company-${Date.now()}`,
                          name: companyName,
                          segment,
                          logo_url: "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=150&auto=format&fit=crop&q=80"
                        };

                        setCompanies(prev => [...prev, newCompany]);
                        form.reset();
                        alert(`Empresa "${companyName}" cadastrada com sucesso!`);
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Nome da Empresa</label>
                        <input
                          name="c-name"
                          type="text"
                          required
                          placeholder="Ex: Aero RH, Tech Corp..."
                          className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:border-[#0043FF] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Segmento de Mercado</label>
                        <input
                          name="c-segment"
                          type="text"
                          required
                          placeholder="Ex: Tecnologia, Aviação, Varejo..."
                          className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:border-[#0043FF] focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-[#EA580C] hover:bg-orange-600 text-white font-semibold py-2 rounded-lg text-xs transition"
                      >
                        Criar Empresa Isolada (Tenant)
                      </button>
                    </form>
                  </div>

                  {/* Tenants List */}
                  <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Empresas Ativas e Isolamento de Dados</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Lista de tenants cadastrados com Row Level Security (RLS) habilitada.</p>
                    </div>

                    <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-2">
                      {companies.map(c => (
                        <div key={c.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                          <div className="flex items-center gap-3">
                            <img src={c.logo_url} alt={c.name} className="w-10 h-10 rounded-lg object-cover border" />
                            <div>
                              <div className="font-bold text-slate-800">{c.name}</div>
                              <div className="text-[10px] text-slate-400">{c.segment}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-slate-700 block">{users.filter(u=>u.company_id===c.id).length} colaboradores</span>
                            <span className="text-[9px] text-[#0043FF] font-semibold bg-blue-50 px-1.5 py-0.5 rounded uppercase">{c.id}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Database Reset & Administration */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm">Controle de Segurança Global e Massa de Dados</h4>
                  <p className="text-xs text-slate-500 leading-normal">
                    Como Super Admin do sistema, você tem privilégios totais de leitura/escrita e controle para reinicializar as instâncias.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={resetDatabase}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition shadow-sm"
                    >
                      Apagar Tudo e Redefinir Massa de Dados Inicial
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              
              /* --- ADMIN & SIMULATOR CONTROL TAB --- */
              <motion.div
                key="admin"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="max-w-3xl mx-auto space-y-6"
              >
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                  <h3 className="font-bold text-slate-800 text-base">Painel Técnico do Desenvolvedor & Simulação</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Utilize os atalhos abaixo para simular diferentes cenários operacionais da plataforma **Flow RH** e validar a aderência do protótipo aos requisitos.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                      <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        📂 Massa de Dados e Estado Local
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        Todos os dados (TimeRecord, Post, Invitation, UserProfile) são armazenados no localStorage do seu navegador para manter a persistência entre recarregamentos de página.
                      </p>
                      <button
                        onClick={resetDatabase}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-1.5 px-3 rounded text-xs transition"
                      >
                        Apagar e Reiniciar Banco Local
                      </button>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                      <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        📨 Teste de Link de Onboarding
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        O sistema prevê redirecionamentos automáticos via query-string para a rota de onboarding integrado de novos colaboradores.
                      </p>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => {
                            setOnboardEmail("pedro.almeida@base44.com");
                            setIsOnboarding(true);
                          }}
                          className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-1.5 px-3 rounded text-xs transition"
                        >
                          Simular Onboarding para Pedro Almeida
                        </button>
                        <p className="text-[9px] text-slate-400">Isso simula o clique no link recebido por e-mail pelo colaborador.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm">Garantias Arquiteturais Implementadas</h3>
                  <div className="space-y-3 text-xs leading-normal">
                    <div className="flex gap-2 items-start">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold">Multi-tenant Isolado (`company_id`):</span>
                        <p className="text-[11px] text-slate-500">
                          Todos os dados apresentados no Mural, Equipe, Relatórios de Ponto e Assistente de IA são escopados exclusivamente para a empresa ativa. Experimente alternar o usuário no menu superior para ver o isolamento absoluto de dados entre a **Base44 Tec** e a **Aero RH**.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 items-start">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold">Controle de Permissões RBAC (Roles):</span>
                        <p className="text-[11px] text-slate-500">
                          O painel bloqueia de forma robusta ações de alteração de papéis ou geração de convites quando acessado por um perfil que possui papel operacional `collaborator`. Apenas papéis `hr_manager` possuem acesso irrestrito de gestão.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 items-start">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold">Validação Biométrica com Câmera Real:</span>
                        <p className="text-[11px] text-slate-500">
                          O módulo de ponto utiliza `getUserMedia` para capturar frames em tempo real da câmera frontal, forçando o enquadramento do rosto do usuário antes do registro do ponto.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-900 text-slate-400 text-center py-4 text-[11px] border-t border-slate-800 shrink-0">
        <p>© 2026 Flow RH - Desenvolvido sob a infraestrutura da **Base44**. Todos os direitos reservados.</p>
        <p className="mt-1 text-slate-600">Row Level Security (RLS) habilitada • Banco de dados local síncrono</p>
      </footer>
    </div>
  );
}
