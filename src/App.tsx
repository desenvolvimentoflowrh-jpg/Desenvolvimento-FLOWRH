import React, { useState, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
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
  Shield,
  Palette,
  HelpCircle,
  Heart,
  Download,
  FileText
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
  const [editUserBirthDate, setEditUserBirthDate] = useState("");
  const [editUserActive, setEditUserActive] = useState(true);

  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const [creationMode, setCreationMode] = useState<"invite" | "direct">("invite");
  const [createUserName, setCreateUserName] = useState("");
  const [createUserEmail, setCreateUserEmail] = useState("");
  const [createUserDepartment, setCreateUserDepartment] = useState("");
  const [createUserHireDate, setCreateUserHireDate] = useState(new Date().toISOString().split('T')[0]);
  const [createUserRole, setCreateUserRole] = useState<UserRole>(UserRole.COLLABORATOR);
  
  // --- Profile Dropdown & Theme/Support States ---
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [pageTheme, setPageTheme] = useState<"blue" | "emerald" | "amber" | "dark">("blue");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [supportCategory, setSupportCategory] = useState("dúvida");
  const [supportSuccess, setSupportSuccess] = useState(false);

  // --- Self Profile Editing States ---
  const [isEditingSelf, setIsEditingSelf] = useState(false);
  const [selfName, setSelfName] = useState("");
  const [selfEmail, setSelfEmail] = useState("");
  const [selfBirthDate, setSelfBirthDate] = useState("");
  const [selfAvatar, setSelfAvatar] = useState("");
  const [selfAvatarError, setSelfAvatarError] = useState("");
  const [selfPassword, setSelfPassword] = useState("");
  const [showSelfPassword, setShowSelfPassword] = useState(false);
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const [selfSuccessMsg, setSelfSuccessMsg] = useState("");
  
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
  const [pontoError, setPontoError] = useState<string | null>(null);
  const [pontoListTab, setPontoListTab] = useState<"hoje" | "data">("hoje");
  const [pontoSelectedDate, setPontoSelectedDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [cameraPermissionError, setCameraPermissionError] = useState(false);
  const [expedienteType, setExpedienteType] = useState<"comercial" | "flexivel" | "meio_periodo" | "12x36">(() => {
    const saved = localStorage.getItem("flow_expediente_type");
    return (saved as any) || "comercial";
  });
  const [adjustAmount, setAdjustAmount] = useState<string>("");
  const [adjustReason, setAdjustReason] = useState<string>("");
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

  // Sync self profile editing states
  useEffect(() => {
    if (showProfileModal && currentUser) {
      setSelfName(currentUser.name);
      setSelfEmail(currentUser.email);
      setSelfBirthDate(currentUser.birth_date || "");
      setSelfAvatar(currentUser.avatar || "");
      setSelfAvatarError("");
      setSelfPassword(currentUser.password || "123456");
      setShowSelfPassword(false);
      setIsEditingSelf(false);
      setSelfSuccessMsg("");
    }
  }, [showProfileModal, currentUser]);

  // Sync default pointType based on last record sequence to assist the user
  useEffect(() => {
    const userRecords = timeRecords.filter(r => r.user_id === currentUser.id);
    const lastRec = userRecords.length > 0 ? userRecords[0] : null;
    if (lastRec) {
      if (lastRec.type === "entrada" || lastRec.type === "almoco_volta") {
        setPointType("saida"); // default expected next is Saída
      } else {
        setPointType("entrada"); // default expected next is Entrada
      }
    } else {
      setPointType("entrada");
    }
    setPontoError(null);
  }, [timeRecords, currentUser]);

  useEffect(() => {
    localStorage.setItem("flow_expediente_type", expedienteType);
  }, [expedienteType]);

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
    // Validate entry/exit sequencing hierarchy
    const userRecords = timeRecords.filter(r => r.user_id === currentUser.id);
    const lastRec = userRecords.length > 0 ? userRecords[0] : null;

    const isCurrentEntry = pointType === "entrada" || pointType === "almoco_volta";
    const isCurrentExit = pointType === "saida" || pointType === "almoco_ida";

    if (lastRec) {
      const isLastEntry = lastRec.type === "entrada" || lastRec.type === "almoco_volta";
      const isLastExit = lastRec.type === "saida" || lastRec.type === "almoco_ida";

      if (isLastEntry && isCurrentEntry) {
        setPontoError("Não é possível registrar duas entradas seguidas! Por favor, selecione Saída de Expediente ou Ida ao Almoço.");
        return;
      }
      if (isLastExit && isCurrentExit) {
        setPontoError("Não é possível registrar duas saídas seguidas! Por favor, selecione Entrada de Expediente ou Volta do Almoço.");
        return;
      }
    } else {
      // First record ever must be an entry
      if (isCurrentExit) {
        setPontoError("Seu primeiro registro deve ser uma Entrada! Por favor, selecione Entrada de Expediente ou Volta do Almoço.");
        return;
      }
    }

    setPontoError(null);
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

      // Calculate dynamic balance modification if they registered a "saida" (exit)
      let balanceMod = 0;
      if (pointType === "saida") {
        const todayStr = new Date().toDateString();
        const todayRecordsBefore = timeRecords
          .filter(r => r.user_id === currentUser.id && new Date(r.timestamp).toDateString() === todayStr)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        // Combine with newRecord
        const allTodayRecords = [...todayRecordsBefore, newRecord].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        let totalMs = 0;
        let currentStart: number | null = null;
        
        for (let i = 0; i < allTodayRecords.length; i++) {
          const rec = allTodayRecords[i];
          const recTime = new Date(rec.timestamp).getTime();
          
          if (rec.type === "entrada" || rec.type === "almoco_volta") {
            currentStart = recTime;
          } else if (rec.type === "almoco_ida" || rec.type === "saida") {
            if (currentStart) {
              totalMs += (recTime - currentStart);
              currentStart = null;
            }
          }
        }

        const hoursWorked = totalMs / (1000 * 60 * 60); // decimal hours
        let dailyWorkload = 8;
        if (expedienteType === "meio_periodo") dailyWorkload = 4;
        else if (expedienteType === "12x36") dailyWorkload = 12;

        if (hoursWorked > 0.1) {
          balanceMod = Number((hoursWorked - dailyWorkload).toFixed(2));
        } else {
          // If no check-in was registered earlier on the same day, fallback to 0 or simulated default
          balanceMod = 0; 
        }
      }

      setTimeRecords(prev => [newRecord, ...prev]);
      
      // Update User Balance & Streak
      setUsers(prevUsers =>
        prevUsers.map(u => {
          if (u.id === currentUser.id) {
            return {
              ...u,
              points_balance: Number((u.points_balance + balanceMod).toFixed(2)),
              active_streak: u.active_streak + 1
            };
          }
          return u;
        })
      );

      // Refresh current user reference in state
      setCurrentUser(prev => ({
        ...prev,
        points_balance: Number((prev.points_balance + balanceMod).toFixed(2)),
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

  // --- Download Ponto Receipt PDF ---
  const handleDownloadReceipt = (record: TimeRecord) => {
    try {
      const doc = new jsPDF();
      
      // Header styles
      doc.setFillColor(15, 23, 42); // slate-900 background for top bar
      doc.rect(0, 0, 210, 35, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("COMPROVANTE DE REGISTRO DE PONTO", 15, 18);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("SISTEMA DE PONTO ELETRÔNICO MULTI-TENANT - FLOW RH", 15, 26);
      
      // Receipt Body
      doc.setTextColor(51, 65, 85); // slate-700
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("INFORMAÇÕES DO COLABORADOR", 15, 50);
      
      // Line
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(15, 52, 195, 52);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Nome Completo: ${record.user_name}`, 15, 60);
      doc.text(`ID Interno: ${record.user_id}`, 15, 66);
      doc.text(`Setor / Área: ${currentUser.department}`, 15, 72);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("DETALHES DO REGISTRO", 15, 85);
      doc.line(15, 87, 195, 87);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      
      const typeLabel = 
        record.type === "entrada" ? "Entrada de Expediente" :
        record.type === "almoco_ida" ? "Ida ao Almoço" :
        record.type === "almoco_volta" ? "Volta do Almoço" :
        record.type === "saida" ? "Saída de Expediente" : record.type;
        
      doc.text(`Tipo de Registro: ${typeLabel.toUpperCase()}`, 15, 95);
      
      const formattedDate = new Date(record.timestamp).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
      const formattedTime = new Date(record.timestamp).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
      
      doc.text(`Data do Registro: ${formattedDate}`, 15, 101);
      doc.text(`Horário do Registro: ${formattedTime}`, 15, 107);
      
      // Location
      const addressStr = record.location.address || "Não identificada (GPS Indisponível)";
      doc.text(`Localização: ${addressStr}`, 15, 113);
      doc.text(`Coordenadas: Lat ${record.location.lat.toFixed(5)}, Lng ${record.location.lng.toFixed(5)}`, 15, 119);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("AUTENTICAÇÃO E SEGURANÇA", 15, 132);
      doc.line(15, 134, 195, 134);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Método de Validação: Biometria Facial e Georreferenciamento", 15, 142);
      doc.text("Status da Assinatura: Assinado Digitalmente via RLS & Supabase Session Tokens", 15, 147);
      
      // SHA placeholder simulation
      const shaHash = `SHA-256: ${Array.from({length: 32}, () => Math.floor(Math.random()*16).toString(16)).join("")}`;
      doc.setFont("courier", "normal");
      doc.text(shaHash.toUpperCase(), 15, 153);
      
      // Bottom footer design
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(15, 165, 180, 25, "F");
      doc.setDrawColor(241, 245, 249);
      doc.rect(15, 165, 180, 25, "D");
      
      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.text("Este documento possui validade jurídica como comprovante de registro de ponto eletrônico", 20, 175);
      doc.text("conforme as diretrizes do Ministério do Trabalho e Emprego (MTE) e Lei Geral de Proteção de Dados (LGPD).", 20, 180);
      
      // Save
      doc.save(`comprovante-ponto-${record.type}-${record.timestamp.split("T")[0]}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      alert("Houve um erro ao gerar o PDF. Por favor, tente novamente.");
    }
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
      active_streak: 1,
      password: onboardPassword
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
          const updated: UserProfile = {
            ...u,
            name: editUserName.trim(),
            email: emailLower,
            department: editUserDepartment.trim(),
            hire_date: editUserHireDate,
            role: editUserRole,
            avatar: editUserAvatar || u.avatar,
            birth_date: editUserBirthDate,
            active: editUserActive
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
    setInviteSuccessMsg("Colaborador updated com sucesso!");
  };

  const handleAvatarFile = (file: File) => {
    setSelfAvatarError("");
    
    // Validate standard image formats
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setSelfAvatarError("Formato inválido. Use apenas JPG, JPEG, PNG, WEBP ou GIF.");
      return;
    }

    // Validate size (max 5MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setSelfAvatarError("Tamanho limite excedido. A imagem deve ter no máximo 5MB.");
      return;
    }

    // Read and convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setSelfAvatar(reader.result);
      }
    };
    reader.onerror = () => {
      setSelfAvatarError("Erro ao ler o arquivo de imagem.");
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingAvatar(true);
  };

  const handleAvatarDragLeave = () => {
    setIsDraggingAvatar(false);
  };

  const handleAvatarDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingAvatar(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleAvatarFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpdateSelf = (e: React.FormEvent) => {
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
    const exists = users.some(u => u.id !== currentUser.id && u.email.toLowerCase() === emailLower);
    if (exists) {
      alert("Este e-mail já está em uso por outro colaborador.");
      return;
    }

    const updated: UserProfile = {
      ...currentUser,
      name: selfName.trim(),
      email: emailLower,
      birth_date: selfBirthDate,
      avatar: selfAvatar || currentUser.avatar,
      password: selfPassword || currentUser.password || "123456"
    };

    // Update in users list
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));

    // Update in current user state
    setCurrentUser(updated);

    setSelfSuccessMsg("Informações pessoais atualizadas com sucesso!");
    setIsEditingSelf(false);
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
                    setLoginError("E-mail corporativo não encontrado. Por favor, verifique se digitou corretamente ou entre em contato com seu gestor.");
                    setLoginLoading(false);
                    return;
                  }

                  if (targetUser.company_id !== loginCompanyId) {
                    const expectedComp = companies.find(c => c.id === targetUser.company_id)?.name || "Outra empresa";
                    const triedComp = companies.find(c => c.id === loginCompanyId)?.name || "Empresa selecionada";
                    setLoginError(`Acesso Negado! O e-mail informado pertence à empresa "${expectedComp}", mas você tentou entrar na empresa "${triedComp}". O isolamento Multi-Tenant por Row Level Security (RLS) impede este login. Por favor, entre em contato com seu gestor.`);
                    setLoginLoading(false);
                    return;
                  }

                  if (targetUser.active === false) {
                    setLoginError("Acesso Negado! Esta conta de colaborador foi inativada. Por favor, entre em contato com seu gestor para reativação.");
                    setLoginLoading(false);
                    return;
                  }

                  const expectedPassword = targetUser.password || "123456";
                  if (loginPassword !== expectedPassword) {
                    setLoginError("Senha incorreta! Por favor, verifique se digitou corretamente ou entre em contato com seu gestor.");
                    setLoginLoading(false);
                    return;
                  }

                  // If email exists, tenant matches and password is correct, sign in!
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
                  <span className="text-[9px] text-slate-400 font-medium">Senha padrão para teste: 123456</span>
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
                        
                        if (u.active === false) {
                          setLoginError(`Acesso Negado! O colaborador "${u.name}" foi inativado. Ative-o novamente no painel "Empresa" com uma conta de Administrador ativa para poder testar este perfil, ou entre em contato com seu gestor.`);
                          return;
                        }

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
                      className={`w-full text-left bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-[#14B8A6] rounded-xl p-3 transition duration-200 flex items-center justify-between gap-3 group cursor-pointer ${
                        u.active === false ? "opacity-55 hover:border-red-500/30" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-200 group-hover:text-white flex items-center gap-1.5 min-w-0">
                            <span className="truncate">{u.name}</span>
                            {u.active === false && (
                              <span className="text-[7px] font-extrabold bg-red-950 text-red-400 border border-red-900 px-1 rounded uppercase shrink-0">Inativo</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate font-mono">{u.email}</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end">
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
    <div data-theme={pageTheme} className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased relative overflow-hidden">
      
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
          
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-white/30 rounded-full p-0.5 transition"
              aria-label="Menu do Usuário"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-white/50 shadow-sm cursor-pointer hover:scale-105 transition"
              />
              <ChevronDown className={`w-3.5 h-3.5 text-white/70 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180 text-white' : ''}`} />
            </button>

            <AnimatePresence>
              {isProfileMenuOpen && (
                <>
                  {/* Invisible backdrop to close the menu on click outside */}
                  <div
                    className="fixed inset-0 z-45"
                    onClick={() => setIsProfileMenuOpen(false)}
                  />
                  
                  {/* Dropdown Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2.5 w-72 bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden z-50 text-slate-800"
                  >
                    {/* User Header Section */}
                    <div className="p-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center gap-3">
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-11 h-11 rounded-full object-cover border border-slate-200"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</div>
                        <div className="text-[10px] text-slate-500 truncate mb-1">{currentUser.email}</div>
                        <span className={`inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                          currentUser.role === UserRole.SUPER_ADMIN ? "bg-purple-100 text-purple-700" :
                          currentUser.role === UserRole.HR_MANAGER ? "bg-blue-100 text-[#0043FF]" :
                          currentUser.role === UserRole.SUPERVISOR ? "bg-amber-100 text-amber-700" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {currentUser.role === UserRole.SUPER_ADMIN ? "Super Admin" :
                           currentUser.role === UserRole.HR_MANAGER ? "Gestor de RH" :
                           currentUser.role === UserRole.SUPERVISOR ? "Supervisor" :
                           "Colaborador"}
                        </span>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="p-1.5 space-y-0.5">
                      {/* My Profile option */}
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setShowProfileModal(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#0043FF] hover:bg-blue-50/50 rounded-xl transition text-left"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>Meu Perfil</span>
                      </button>

                      {/* Theme Selector Section inside dropdown */}
                      <div className="px-3 py-2 border-t border-slate-100/80">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Palette className="w-3.5 h-3.5 text-slate-400" />
                          <span>Tema da Página</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {/* Theme Blue */}
                          <button
                            onClick={() => setPageTheme("blue")}
                            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-lg border transition ${
                              pageTheme === "blue"
                                ? "bg-blue-50 border-blue-200 text-[#0043FF]"
                                : "bg-white border-slate-100 hover:bg-slate-50 text-slate-600"
                            }`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-[#0043FF]" />
                            <span>Padrão</span>
                          </button>
                          {/* Theme Emerald */}
                          <button
                            onClick={() => setPageTheme("emerald")}
                            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-lg border transition ${
                              pageTheme === "emerald"
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                : "bg-white border-slate-100 hover:bg-slate-50 text-slate-600"
                            }`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <span>Floresta</span>
                          </button>
                          {/* Theme Amber */}
                          <button
                            onClick={() => setPageTheme("amber")}
                            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-lg border transition ${
                              pageTheme === "amber"
                                ? "bg-amber-50 border-amber-200 text-amber-700"
                                : "bg-white border-slate-100 hover:bg-slate-50 text-slate-600"
                            }`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            <span>Pôr do Sol</span>
                          </button>
                          {/* Theme Dark */}
                          <button
                            onClick={() => setPageTheme("dark")}
                            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-lg border transition ${
                              pageTheme === "dark"
                                ? "bg-slate-800 border-slate-700 text-indigo-400"
                                : "bg-white border-slate-100 hover:bg-slate-50 text-slate-600"
                            }`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700" />
                            <span>Escuro</span>
                          </button>
                        </div>
                      </div>

                      {/* Support option */}
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setShowSupportModal(true);
                          setSupportSuccess(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 border-t border-slate-100 text-xs font-semibold text-slate-700 hover:text-[#0043FF] hover:bg-blue-50/50 rounded-xl transition text-left"
                      >
                        <HelpCircle className="w-4 h-4 text-slate-400" />
                        <span>Suporte Técnico</span>
                      </button>

                      {/* LogOut Option */}
                      <button
                        onClick={() => {
                          setIsLoggedIn(false);
                          localStorage.setItem("flow_is_logged_in", "false");
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 border-t border-slate-100 text-xs font-bold text-red-600 hover:bg-red-50/50 rounded-xl transition text-left"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>Sair da Conta</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
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

                    {pontoError && (
                      <div className="bg-rose-50 text-rose-800 text-xs p-4 rounded-xl flex items-center gap-3 border border-rose-100 mb-4">
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        <div>
                          <div className="font-bold">Erro de Sequenciamento de Ponto</div>
                          <p className="text-[11px] text-rose-700 leading-normal">{pontoError}</p>
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
                          className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white font-medium"
                          value={pointType}
                          onChange={(e) => {
                            setPointType(e.target.value as TimeRecord["type"]);
                            setPontoError(null);
                          }}
                        >
                          <option value="entrada">⏰ Entrada de Expediente</option>
                          <option value="almoco_ida">🍔 Ida ao Almoço</option>
                          <option value="almoco_volta">☕ Volta do Almoço</option>
                          <option value="saida">🚪 Saída de Expediente</option>
                        </select>
                        {(() => {
                          const userRecords = timeRecords.filter(r => r.user_id === currentUser.id);
                          const lastRec = userRecords.length > 0 ? userRecords[0] : null;
                          const nextExpected = lastRec 
                            ? (lastRec.type === "entrada" || lastRec.type === "almoco_volta" ? "exit" : "entry")
                            : "entry";

                          const isCurrentSelectedValid = lastRec 
                            ? (nextExpected === "exit" ? (pointType === "saida" || pointType === "almoco_ida") : (pointType === "entrada" || pointType === "almoco_volta"))
                            : (pointType === "entrada" || pointType === "almoco_volta");

                          return (
                            <div className="mt-1.5">
                              {isCurrentSelectedValid ? (
                                <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                                  <span>✅</span> Sequência Válida (Último: {lastRec ? lastRec.type.replace("_", " ") : "Nenhum"})
                                </p>
                              ) : (
                                <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1 leading-normal">
                                  <span>⚠️</span> Sequência Incorreta. Esperado: {nextExpected === "entry" ? "Entrada ou Volta Almoço" : "Saída ou Ida Almoço"}
                                </p>
                              )}
                            </div>
                          );
                        })()}
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

                  {/* Gestão de Expedientes e Banco de Horas Card */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Gestão de Expedientes & Banco de Horas</h4>
                        <p className="text-[10px] text-slate-400 font-medium">Controle de jornadas de trabalho, saldo e compliance legal</p>
                      </div>
                      <span className="p-2 bg-purple-50 text-[#8B5CF6] rounded-xl text-lg">⏳</span>
                    </div>

                    {/* Hour Bank Balance Field */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-xl p-4 relative overflow-hidden shadow-sm">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Saldo do Banco de Horas</div>
                        <div className="flex items-baseline gap-1 mt-1.5">
                          <span className={`text-2xl font-extrabold font-mono ${currentUser.points_balance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {currentUser.points_balance >= 0 ? `+${currentUser.points_balance}` : currentUser.points_balance}h
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1.5 leading-normal">
                          {currentUser.points_balance >= 0 
                            ? "✅ Saldo credor acumulado disponível para folga ou indenização." 
                            : "⚠️ Saldo devedor. Sujeito a compensação dentro do período."}
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jornada de Hoje</div>
                        {(() => {
                          // Calculate worked hours today
                          const todayStr = new Date().toDateString();
                          const todayRecords = timeRecords
                            .filter(r => r.user_id === currentUser.id && new Date(r.timestamp).toDateString() === todayStr)
                            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

                          let totalMs = 0;
                          let currentStart: number | null = null;
                          let hasEntrada = false;
                          let horaEntradaLabel = "Não registrada";

                          for (let i = 0; i < todayRecords.length; i++) {
                            const rec = todayRecords[i];
                            const recTime = new Date(rec.timestamp).getTime();

                            if (rec.type === "entrada" || rec.type === "almoco_volta") {
                              currentStart = recTime;
                              if (rec.type === "entrada") {
                                hasEntrada = true;
                                horaEntradaLabel = new Date(rec.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                              }
                            } else if (rec.type === "almoco_ida" || rec.type === "saida") {
                              if (currentStart) {
                                totalMs += (recTime - currentStart);
                                currentStart = null;
                              }
                            }
                          }

                          if (currentStart) {
                            totalMs += (new Date().getTime() - currentStart);
                          }

                          const hoursDecimal = totalMs / (1000 * 60 * 60);
                          const workedHours = Math.floor(hoursDecimal);
                          const workedMinutes = Math.round((hoursDecimal - workedHours) * 60);

                          let expectedDailyWorkload = 8;
                          if (expedienteType === "meio_periodo") expectedDailyWorkload = 4;
                          else if (expedienteType === "12x36") expectedDailyWorkload = 12;

                          return (
                            <div className="mt-1.5 space-y-1.5">
                              <div className="text-sm font-extrabold text-slate-800 flex justify-between items-baseline">
                                <span>{workedHours}h {workedMinutes}m</span>
                                <span className="text-[10px] text-slate-400 font-semibold">Meta: {expectedDailyWorkload}h/dia</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className="bg-[#8B5CF6] h-full rounded-full transition-all duration-500" 
                                  style={{ width: `${Math.min(100, (hoursDecimal / expectedDailyWorkload) * 100)}%` }}
                                />
                              </div>
                              <p className="text-[9px] text-slate-500 font-medium">
                                🚪 Entrada: <span className="font-bold text-slate-700">{horaEntradaLabel}</span>
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Work Schedule Configuration Selector */}
                    <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500">Expediente de Trabalho Ativo</label>
                          <p className="text-[10px] text-slate-400 font-medium">Parâmetros de controle de horas de entrada/saída</p>
                        </div>
                        {(currentUser.role === UserRole.HR_MANAGER || currentUser.role === UserRole.SUPERVISOR || currentUser.role === UserRole.SUPER_ADMIN) ? (
                          <select
                            value={expedienteType}
                            onChange={(e) => setExpedienteType(e.target.value as any)}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500 pointer-events-auto relative z-10"
                          >
                            <option value="comercial">💼 Comercial Padrão (8h)</option>
                            <option value="flexivel">🧘 Flexível (8h)</option>
                            <option value="meio_periodo">⏱️ Meio Período (4h)</option>
                            <option value="12x36">🚂 Escala 12x36 (12h)</option>
                          </select>
                        ) : (
                          <span className="text-[11px] font-bold bg-[#8B5CF6]/10 text-[#8B5CF6] px-2 py-0.5 rounded-md border border-[#8B5CF6]/20 uppercase">
                            {expedienteType === "comercial" ? "💼 Comercial" : expedienteType === "flexivel" ? "🧘 Flexível" : expedienteType === "meio_periodo" ? "⏱️ Meio Período" : "🚂 Escala 12x36"}
                          </span>
                        )}
                      </div>

                      {/* Display shift details */}
                      <div className="text-[11px] text-slate-500 space-y-1 bg-white p-3 rounded-lg border border-slate-100">
                        {expedienteType === "comercial" && (
                          <>
                            <div className="font-bold text-slate-700">💼 Comercial Padrão (8h diárias)</div>
                            <div>• Horário base: das <span className="font-semibold text-slate-700">09:00 às 18:00</span> com <span className="font-semibold text-slate-700">1 hora de intervalo</span>.</div>
                            <div>• Tolerância legal: <span className="font-semibold text-slate-700">10 minutos diários</span> para atrasos ou horas extras.</div>
                          </>
                        )}
                        {expedienteType === "flexivel" && (
                          <>
                            <div className="font-bold text-slate-700">🧘 Jornada Flexível (Meta de 8h diárias)</div>
                            <div>• Horário base: Livre escolha, recomendado <span className="font-semibold text-slate-700">40h semanais</span>.</div>
                            <div>• Banco de horas: Apura o saldo líquido final trabalhado contra a meta de 8h diárias.</div>
                          </>
                        )}
                        {expedienteType === "meio_periodo" && (
                          <>
                            <div className="font-bold text-slate-700">⏱️ Estágio ou Meio Período (4h diárias)</div>
                            <div>• Horário base: das <span className="font-semibold text-slate-700">08:00 às 12:00</span> ou das <span className="font-semibold text-slate-700">13:00 às 17:00</span> (sem intervalo obrigatório).</div>
                            <div>• Limite de horas extras: Conforme legislação vigente de estágio.</div>
                          </>
                        )}
                        {expedienteType === "12x36" && (
                          <>
                            <div className="font-bold text-slate-700">🚂 Escala Especial 12x36 (12h de trabalho)</div>
                            <div>• Horário base: <span className="font-semibold text-slate-700">12h contínuas</span> de trabalho seguidas por <span className="font-semibold text-slate-700">36h consecutivas de descanso</span>.</div>
                            <div>• Almoço: <span className="font-semibold text-slate-700">1 hora inclusa</span> na jornada.</div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Manual Hours Adjustment (for Supervisors and HR Managers) */}
                    {(currentUser.role === UserRole.HR_MANAGER || currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.SUPERVISOR) && (
                      <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl space-y-3">
                        <div>
                          <div className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                            <span>🛠️</span> Painel do Gestor: Ajuste Manual de Banco de Horas
                          </div>
                          <p className="text-[10px] text-amber-700/80 mt-0.5 leading-normal">
                            Como gestor, lance créditos ou débitos avulsos de horas no banco deste colaborador para fins de ajuste ou correção retroativa.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Horas a Lançar (ex: +1.5 ou -2.0)</label>
                            <input
                              type="text"
                              value={adjustAmount}
                              onChange={(e) => setAdjustAmount(e.target.value)}
                              placeholder="Ex: +2.5 ou -1.0"
                              className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Motivo / Justificativa legal</label>
                            <input
                              type="text"
                              value={adjustReason}
                              onChange={(e) => setAdjustReason(e.target.value)}
                              placeholder="Ex: Hora extra aprovada, erro de registro"
                              className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              const hrs = parseFloat(adjustAmount);
                              if (isNaN(hrs)) {
                                alert("Por favor, digite uma quantidade de horas válida (ex: 2 ou -1.5).");
                                return;
                              }
                              if (!adjustReason.trim()) {
                                alert("Por favor, informe uma justificativa legal para o ajuste de banco de horas.");
                                return;
                              }

                              // Update points_balance
                              setUsers(prevUsers =>
                                prevUsers.map(u => {
                                  if (u.id === currentUser.id) {
                                    return {
                                      ...u,
                                      points_balance: Number((u.points_balance + hrs).toFixed(2))
                                    };
                                  }
                                  return u;
                                })
                              );

                              setCurrentUser(prev => ({
                                ...prev,
                                points_balance: Number((prev.points_balance + hrs).toFixed(2))
                              }));

                              alert(`Sucesso! Ajuste de ${hrs > 0 ? `+${hrs}` : hrs}h adicionado com sucesso ao banco de horas.`);
                              setAdjustAmount("");
                              setAdjustReason("");
                            }}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-1.5 px-4 rounded-lg text-[10px] transition shadow-sm pointer-events-auto relative z-10"
                          >
                            Lançar no Banco de Horas
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Point History right panel */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    {/* Header with Switcher Tabs */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 mb-4 gap-3">
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">Histórico de Ponto</h3>
                        <p className="text-[10px] text-slate-400 font-medium">Consulte e baixe seus comprovantes válidos</p>
                      </div>
                      <div className="flex bg-slate-100 p-0.5 rounded-lg w-full sm:w-auto">
                        <button
                          onClick={() => setPontoListTab("hoje")}
                          className={`flex-1 sm:flex-none px-3 py-1 text-[11px] font-bold rounded-md transition ${pontoListTab === "hoje" ? "bg-white text-[#8B5CF6] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                        >
                          Hoje
                        </button>
                        <button
                          onClick={() => setPontoListTab("data")}
                          className={`flex-1 sm:flex-none px-3 py-1 text-[11px] font-bold rounded-md transition ${pontoListTab === "data" ? "bg-white text-[#8B5CF6] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                        >
                          Escolher Dia
                        </button>
                      </div>
                    </div>

                    {/* Date picker shown if "data" tab is selected */}
                    {pontoListTab === "data" && (
                      <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-fade-in">
                        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                          <span>📅</span> Selecione o Dia Desejado:
                        </span>
                        <input
                          type="date"
                          className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-purple-100/50 font-semibold bg-white text-slate-800"
                          value={pontoSelectedDate}
                          onChange={(e) => setPontoSelectedDate(e.target.value)}
                        />
                      </div>
                    )}

                    <div className="space-y-4">
                      {(() => {
                        const todayString = new Date().toDateString();
                        const filteredRecords = pontoListTab === "hoje" 
                          ? timeRecords.filter(r => r.user_id === currentUser.id && new Date(r.timestamp).toDateString() === todayString)
                          : timeRecords.filter(r => {
                              if (r.user_id !== currentUser.id) return false;
                              const recordDateStr = new Date(r.timestamp).toISOString().split("T")[0];
                              return recordDateStr === pontoSelectedDate;
                            });

                        if (filteredRecords.length === 0) {
                          const formattedDateLabel = pontoListTab === "data" 
                            ? new Date(pontoSelectedDate + "T00:00:00").toLocaleDateString("pt-BR") 
                            : "";
                          return (
                            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                              <p className="text-sm font-semibold text-slate-400">Nenhum registro encontrado</p>
                              <p className="text-[11px] text-slate-400 max-w-[240px] mx-auto mt-1 leading-normal">
                                {pontoListTab === "hoje" 
                                  ? "Você ainda não registrou nenhum ponto hoje nesta empresa." 
                                  : `Você não possui registros de ponto cadastrados no dia ${formattedDateLabel}.`}
                              </p>
                            </div>
                          );
                        }

                        return filteredRecords.map(r => {
                          // Beautiful type tag styling
                          const typeColors = 
                            r.type === "entrada" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                            r.type === "saida" ? "bg-rose-50 text-rose-700 border-rose-100" :
                            "bg-amber-50 text-amber-700 border-amber-100";

                          const typeName = 
                            r.type === "entrada" ? "Entrada" :
                            r.type === "saida" ? "Saída" :
                            r.type === "almoco_ida" ? "Ida Almoço" :
                            r.type === "almoco_volta" ? "Volta Almoço" : r.type;

                          return (
                            <div key={r.id} className="bg-slate-50/50 hover:bg-slate-50 p-4 rounded-xl border border-slate-100 transition flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                              {/* Left column: Biometry thumbnail */}
                              <div className="relative group shrink-0">
                                <img src={r.photo_url} alt="Verified face scan" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                                <span className="absolute -bottom-1 -right-1 bg-green-500 text-white p-0.5 rounded-full border border-white text-[8px]" title="Biometria Validada">
                                  ✓
                                </span>
                              </div>

                              {/* Middle column: Info details */}
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeColors} capitalize`}>
                                    {typeName}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono font-bold">
                                    ID: {r.id.split("-")[1] || r.id}
                                  </span>
                                </div>
                                
                                <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5 flex-wrap">
                                  <span>📅 {new Date(r.timestamp).toLocaleDateString("pt-BR")}</span>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-slate-900 font-bold">⏰ {new Date(r.timestamp).toLocaleTimeString("pt-BR", {hour: "2-digit", minute: "2-digit", second: "2-digit"})}</span>
                                </div>

                                <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate" title={r.location.address}>{r.location.address || "Sem endereço cadastrado"}</span>
                                </p>
                              </div>

                              {/* Right column: Action */}
                              <button
                                onClick={() => handleDownloadReceipt(r)}
                                className="w-full sm:w-auto shrink-0 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold py-1.5 px-3 rounded-lg text-[10px] flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                                title="Baixar comprovante assinado em PDF"
                              >
                                <Download className="w-3.5 h-3.5 text-slate-500" />
                                <span>PDF</span>
                              </button>
                            </div>
                          );
                        });
                      })()}
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
                      <div>GPS: {geolocation ? `${geolocation.lat.toFixed(5)}, ${geolocation.lng.toFixed(5)}` : "Aguardando GPS"}</div>
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
                          <div key={u.id} className={`p-4 sm:p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-slate-50/50 transition ${u.active === false ? "opacity-65 bg-slate-50/40" : ""}`}>
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
                              {/* Campo de Ativação / Inativação (On/Off Switch) */}
                              <div className="flex items-center gap-1.5 bg-slate-100/70 px-2 py-1 rounded-lg border border-slate-200/50">
                                <span className={`text-[9px] font-extrabold uppercase tracking-wider ${u.active !== false ? "text-emerald-600" : "text-slate-400"}`}>
                                  {u.active !== false ? "Ativo" : "Inativo"}
                                </span>
                                {(currentUser.role === UserRole.HR_MANAGER || currentUser.role === UserRole.SUPER_ADMIN) ? (
                                  <button
                                    type="button"
                                    disabled={u.id === currentUser.id}
                                    onClick={() => {
                                      const nextActive = u.active === false ? true : false;
                                      setUsers(prev => prev.map(usr => usr.id === u.id ? { ...usr, active: nextActive } : usr));
                                      setInviteSuccessMsg(`Colaborador "${u.name}" foi ${nextActive ? "ativado" : "inativado"} com sucesso!`);
                                    }}
                                    className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                      u.id === currentUser.id ? "opacity-40 cursor-not-allowed" : ""
                                    } ${u.active !== false ? "bg-emerald-500" : "bg-slate-300"}`}
                                    title={u.id === currentUser.id ? "Você não pode inativar a si mesmo!" : `Clique para ${u.active !== false ? "inativar" : "ativar"}`}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        u.active !== false ? "translate-x-3.5" : "translate-x-0"
                                      }`}
                                    />
                                  </button>
                                ) : (
                                  <div className={`w-2 h-2 rounded-full ${u.active !== false ? "bg-emerald-500" : "bg-slate-300"}`} />
                                )}
                              </div>

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
                                        setEditUserBirthDate(u.birth_date || "");
                                        setEditUserActive(u.active !== false);
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

                            {/* Data de Nascimento */}
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                                Data de Nascimento
                              </label>
                              <div className="relative">
                                <input
                                  type="date"
                                  className="w-full text-xs border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 focus:border-[#0043FF] focus:outline-none focus:ring-2 focus:ring-blue-100/50 bg-slate-50/50 hover:bg-white text-slate-800 font-medium transition"
                                  value={editUserBirthDate}
                                  onChange={(e) => setEditUserBirthDate(e.target.value)}
                                />
                                <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                              </div>
                            </div>

                            {/* Perfil de Acesso (RBAC) */}
                            <div>
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

                            {/* Status da Conta (On/Off Toggle Switch) */}
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                                Status do Usuário
                              </label>
                              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/50 rounded-xl px-4 py-2.5 h-[42px] transition">
                                <span className={`text-xs font-bold ${editUserActive ? "text-emerald-600" : "text-slate-500"}`}>
                                  {editUserActive ? "Conta Ativa" : "Conta Inativa"}
                                </span>
                                <button
                                  type="button"
                                  disabled={editingUserId === currentUser.id}
                                  onClick={() => setEditUserActive(!editUserActive)}
                                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ml-auto ${
                                    editingUserId === currentUser.id ? "opacity-50 cursor-not-allowed" : ""
                                  } ${editUserActive ? "bg-emerald-500" : "bg-slate-300"}`}
                                  title={editingUserId === currentUser.id ? "Você não pode inativar a si mesmo!" : "Clique para alterar status de ativação"}
                                >
                                  <span className="sr-only">Toggle Status</span>
                                  <span
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                      editUserActive ? "translate-x-5" : "translate-x-0"
                                    }`}
                                  />
                                </button>
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
      <footer className="bg-slate-900 text-slate-400 text-center py-4 text-[11px] border-t border-slate-800 shrink-0 animate-fade-in relative z-10">
        <p>© 2026 Flow RH - Desenvolvido sob a infraestrutura da **Base44**. Todos os direitos reservados.</p>
        <p className="mt-1 text-slate-600 font-mono text-[9px]">Row Level Security (RLS) habilitada • Banco de dados local síncrono</p>
      </footer>

      {/* --- MEU PERFIL MODAL --- */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden text-slate-800 flex flex-col"
            >
              {/* Header Gradient */}
              <div className={`px-6 py-8 bg-gradient-to-r ${
                pageTheme === "emerald" ? "from-emerald-600 to-emerald-500" :
                pageTheme === "amber" ? "from-amber-600 to-amber-500" :
                pageTheme === "dark" ? "from-slate-800 to-slate-700" :
                "from-blue-600 to-blue-500"
              } text-white relative`}>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="absolute top-4 right-4 p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-4">
                  <img
                    src={selfAvatar || currentUser.avatar}
                    alt={currentUser.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                  />
                  <div>
                    <h3 className="font-extrabold text-lg leading-tight">{currentUser.name}</h3>
                    <p className="text-xs text-white/80 mt-0.5">{currentUser.email}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="bg-white/20 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">
                        {currentUser.role === UserRole.SUPER_ADMIN ? "Super Admin" :
                         currentUser.role === UserRole.HR_MANAGER ? "Gestor de RH" :
                         currentUser.role === UserRole.SUPERVISOR ? "Supervisor" :
                         "Colaborador"}
                      </span>
                      <span className="bg-black/10 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                        {activeCompany?.name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Grid Info */}
              <div className="p-6 space-y-4 text-xs">
                {selfSuccessMsg && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-center font-semibold text-[11px] animate-fade-in">
                    🎉 {selfSuccessMsg}
                  </div>
                )}

                {isEditingSelf ? (
                  <form onSubmit={handleUpdateSelf} className="space-y-4">
                    <div className="bg-slate-50 border border-slate-100/80 rounded-2xl p-4 space-y-3.5">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <span>📝</span> Editar Informações Pessoais
                      </h4>

                      {/* Foto de Perfil Drag & Drop */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                          Alterar Foto de Perfil
                        </label>
                        <div
                          onDragOver={handleAvatarDragOver}
                          onDragLeave={handleAvatarDragLeave}
                          onDrop={handleAvatarDrop}
                          className={`border-2 border-dashed rounded-xl p-4 transition text-center relative ${
                            isDraggingAvatar
                              ? "border-[#0043FF] bg-blue-50/20"
                              : selfAvatarError
                              ? "border-rose-300 bg-rose-50/10"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleAvatarFile(e.target.files[0]);
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="flex flex-col items-center justify-center space-y-1.5">
                            <div className={`p-2 rounded-full ${
                              selfAvatarError ? "bg-rose-50 text-rose-500" : "bg-slate-50 text-slate-400"
                            }`}>
                              <Camera className="w-5 h-5" />
                            </div>
                            <div className="text-slate-600 font-medium text-[11px]">
                              Arraste e solte a imagem ou <span className="text-[#0043FF] hover:underline font-bold">clique para buscar</span>
                            </div>
                            <div className="text-slate-400 text-[9px] font-medium">
                              Formatos aceitos: JPG, PNG, WEBP ou GIF (Máx. 5MB)
                            </div>
                          </div>
                        </div>
                        {selfAvatarError && (
                          <p className="text-rose-500 text-[10px] font-bold mt-1.5 flex items-center gap-1 leading-normal">
                            <span>⚠️</span> {selfAvatarError}
                          </p>
                        )}
                        {selfAvatar && !selfAvatarError && (
                          <div className="mt-2 flex items-center gap-2 bg-emerald-50 border border-emerald-100 p-2 rounded-lg">
                            <span className="text-emerald-600 text-xs">📸</span>
                            <span className="text-emerald-800 text-[10px] font-bold truncate max-w-[200px]">Nova imagem carregada com sucesso!</span>
                            <button
                              type="button"
                              onClick={() => setSelfAvatar("")}
                              className="text-rose-500 hover:text-rose-700 ml-auto text-[10px] font-bold uppercase tracking-wider"
                            >
                              Remover
                            </button>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                          Nome Completo
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            className="w-full text-xs border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 focus:border-[#0043FF] focus:outline-none focus:ring-2 focus:ring-blue-100/50 bg-white text-slate-800 font-semibold transition"
                            value={selfName}
                            onChange={(e) => setSelfName(e.target.value)}
                            placeholder="Seu nome"
                          />
                          <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                          E-mail Pessoal / Contato
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            required
                            className="w-full text-xs border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 focus:border-[#0043FF] focus:outline-none focus:ring-2 focus:ring-blue-100/50 bg-white text-slate-800 font-semibold transition"
                            value={selfEmail}
                            onChange={(e) => setSelfEmail(e.target.value)}
                            placeholder="seuemail@provedor.com"
                          />
                          <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                          Data de Nascimento
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            required
                            className="w-full text-xs border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 focus:border-[#0043FF] focus:outline-none focus:ring-2 focus:ring-blue-100/50 bg-white text-slate-800 font-semibold transition"
                            value={selfBirthDate}
                            onChange={(e) => setSelfBirthDate(e.target.value)}
                          />
                          <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                          Senha de Acesso
                        </label>
                        <div className="relative">
                          <input
                            type={showSelfPassword ? "text" : "password"}
                            required
                            className="w-full text-xs border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 focus:border-[#0043FF] focus:outline-none focus:ring-2 focus:ring-blue-100/50 bg-white text-slate-800 font-semibold transition"
                            value={selfPassword}
                            onChange={(e) => setSelfPassword(e.target.value)}
                            placeholder="Sua senha secreta"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSelfPassword(!showSelfPassword)}
                            className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition"
                          >
                            <Lock className={`w-4 h-4 ${showSelfPassword ? "text-[#0043FF]" : ""}`} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Hierarchy restrictions - read-only fields */}
                    <div className="bg-slate-100/60 border border-slate-200/50 rounded-2xl p-4 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-slate-200/50 pb-1.5">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <span>🛡️</span> Dados Corporativos Protegidos
                        </h4>
                        <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider select-none">
                          Hierarquia Ativa
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-[11px]">
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Setor / Área</span>
                          <span className="font-semibold text-slate-600">{currentUser.department}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Admissão</span>
                          <span className="font-semibold text-slate-600">{new Date(currentUser.hire_date).toLocaleDateString("pt-BR")}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-[9px] text-slate-500 block leading-normal">
                            ⚠️ Por motivos de compliance e segurança multi-tenant, alterações em cargos, permissões RBAC e datas de contratação devem ser solicitadas diretamente ao <strong>Gestor de RH</strong> ou <strong>Super Admin</strong>.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions buttons for edit mode */}
                    <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingSelf(false);
                          setSelfName(currentUser.name);
                          setSelfEmail(currentUser.email);
                          setSelfBirthDate(currentUser.birth_date || "");
                        }}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className={`px-5 py-2.5 text-white font-bold rounded-xl transition shadow-md ${
                          pageTheme === "emerald" ? "bg-emerald-600 hover:bg-emerald-700" :
                          pageTheme === "amber" ? "bg-amber-600 hover:bg-amber-700" :
                          pageTheme === "dark" ? "bg-slate-800 hover:bg-slate-700" :
                          "bg-[#0043FF] hover:bg-blue-700"
                        }`}
                      >
                        Salvar Informações
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Setor / Área</span>
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Briefcase className="w-4 h-4 text-slate-400" />
                          <span>{currentUser.department}</span>
                        </div>
                      </div>

                      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Admissão</span>
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>{new Date(currentUser.hire_date).toLocaleDateString("pt-BR")}</span>
                        </div>
                      </div>

                      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nível de Acesso</span>
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Shield className="w-4 h-4 text-slate-400" />
                          <span>RBAC Ativo</span>
                        </div>
                      </div>

                      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reconhecimentos</span>
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-amber-500" />
                          <span>{posts.filter(p => p.badge_award?.recipient_id === currentUser.id).length} Badge(s)</span>
                        </div>
                      </div>

                      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Data de Nascimento</span>
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="text-sm">🎂</span>
                          <span>{currentUser.birth_date ? new Date(currentUser.birth_date + "T00:00:00").toLocaleDateString("pt-BR") : "Não informada"}</span>
                        </div>
                      </div>

                      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/50 truncate">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">E-mail de Contato</span>
                        <div className="font-bold text-slate-800 flex items-center gap-1.5 truncate">
                          <Mail className="w-4 h-4 text-slate-400 animate-pulse" />
                          <span className="truncate">{currentUser.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Recognition badges received detail */}
                    <div className="bg-amber-50/40 border border-amber-100 rounded-2xl p-4">
                      <h4 className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        <span>Badges de Conquista Recentes</span>
                      </h4>
                      {posts.filter(p => p.badge_award?.recipient_id === currentUser.id).length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {posts.filter(p => p.badge_award?.recipient_id === currentUser.id).map((p, idx) => (
                            <div key={idx} className="bg-white/80 border border-amber-100/50 rounded-xl px-2.5 py-1.5 text-[10px] font-semibold text-amber-900 flex items-center gap-1.5 shadow-sm" title={p.content}>
                              <span>{p.badge_award?.icon}</span>
                              <span>{p.badge_award?.name}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-amber-700 leading-normal font-medium">
                          Você ainda não recebeu badges de reconhecimento nesta empresa. Apoie o time e colabore para ser reconhecido no mural!
                        </p>
                      )}
                    </div>

                    {/* Privacy / Security Notice */}
                    <div className="bg-blue-50/40 border border-blue-100 p-3.5 rounded-2xl text-[10px] text-blue-800 leading-relaxed">
                      <p className="font-bold text-blue-900">🔒 Segurança de Dados Civis Conforme LGPD</p>
                      <p className="text-blue-700/80 mt-0.5">
                        Este painel opera sob as diretrizes de Row Level Security (RLS) integradas ao Supabase. Nenhum dado do seu perfil profissional é exposto a outros tenants (empresas) ou acessos não autorizados.
                      </p>
                    </div>

                    {/* Actions buttons */}
                    <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                      <button
                        onClick={() => setShowProfileModal(false)}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition"
                      >
                        Fechar Perfil
                      </button>
                      <button
                        onClick={() => setIsEditingSelf(true)}
                        className={`px-5 py-2.5 text-white font-bold rounded-xl transition shadow-sm ${
                          pageTheme === "emerald" ? "bg-emerald-600 hover:bg-emerald-700" :
                          pageTheme === "amber" ? "bg-amber-600 hover:bg-amber-700" :
                          pageTheme === "dark" ? "bg-slate-800 hover:bg-slate-700" :
                          "bg-[#0043FF] hover:bg-blue-700"
                        }`}
                      >
                        Editar Informações
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- SUPORTE TÉCNICO MODAL --- */}
      <AnimatePresence>
        {showSupportModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden text-slate-800 flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <span className="text-[#0043FF] text-base">🛠️</span> Suporte Técnico Integrado
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                    Precisa de ajuda? Abra um chamado de suporte ou envie sua dúvida para nosso time.
                  </p>
                </div>
                <button
                  onClick={() => setShowSupportModal(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {supportSuccess ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-8 text-center space-y-4"
                >
                  <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full border border-green-100 flex items-center justify-center mx-auto text-2xl shadow-sm">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-base">Chamado Aberto com Sucesso!</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                      Seu protocolo de suporte é <span className="font-bold text-slate-700">#FLOW-{Math.floor(100000 + Math.random() * 900000)}</span>.
                      Enviamos os detalhes do chamado para <span className="font-semibold text-slate-600">{currentUser.email}</span>.
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 max-w-xs mx-auto text-[10px] text-slate-500 leading-normal font-medium">
                    ⏱️ Tempo estimado de atendimento: <span className="text-blue-600 font-bold">12 minutos</span> (Buddy ativo).
                  </div>
                  <button
                    onClick={() => setShowSupportModal(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                  >
                    Fechar Janela
                  </button>
                </motion.div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!supportMessage.trim()) return;
                    setSupportSuccess(true);
                    setSupportMessage("");
                  }}
                  className="p-6 space-y-4"
                >
                  {/* Category Selection */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                      Categoria do Atendimento
                    </label>
                    <select
                      className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 hover:bg-white focus:border-[#0043FF] focus:outline-none focus:ring-2 focus:ring-blue-100/50 text-slate-800 font-medium transition"
                      value={supportCategory}
                      onChange={(e) => setSupportCategory(e.target.value)}
                    >
                      <option value="dúvida">Dúvida Operacional / Sistema</option>
                      <option value="problema">Problema Técnico / Bug</option>
                      <option value="admissão">Dificuldade com Admissão Digital</option>
                      <option value="recurso">Solicitação de Nova Funcionalidade</option>
                    </select>
                  </div>

                  {/* Support Details */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                      Descreva seu Problema ou Dúvida
                    </label>
                    <textarea
                      required
                      className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 hover:bg-white focus:border-[#0043FF] focus:outline-none focus:ring-2 focus:ring-blue-100/50 text-slate-800 font-medium transition h-32 resize-none"
                      placeholder="Descreva detalhadamente o que ocorreu ou qual sua dúvida operacional..."
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                    />
                  </div>

                  {/* Helpful Resources panel inside support */}
                  <div className="bg-blue-50/30 border border-blue-100/50 rounded-2xl p-3.5 space-y-1.5 text-[10px] leading-normal text-blue-800 font-medium">
                    <div className="font-bold text-blue-900 flex items-center gap-1">
                      <span>💡</span> Recursos Rápidos de Ajuda
                    </div>
                    <p className="text-blue-700/80 leading-relaxed">
                      Dica: Se estiver com dúvidas sobre marcação de ponto, lembre-se de autorizar a câmera no navegador. Para dúvidas sobre o PDI ou Onboarding, consulte o canal do Buddy da sua empresa.
                    </p>
                  </div>

                  {/* Form actions */}
                  <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowSupportModal(false)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className={`px-5 py-2.5 text-white font-bold text-xs rounded-xl transition shadow-md shadow-blue-100 hover:shadow-lg ${
                        pageTheme === "emerald" ? "bg-emerald-600 hover:bg-emerald-700" :
                        pageTheme === "amber" ? "bg-amber-600 hover:bg-amber-700" :
                        pageTheme === "dark" ? "bg-slate-800 hover:bg-slate-700" :
                        "bg-[#0043FF] hover:bg-blue-700"
                      }`}
                    >
                      Enviar Chamado
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
