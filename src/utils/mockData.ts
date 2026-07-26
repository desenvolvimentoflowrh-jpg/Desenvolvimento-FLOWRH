import { Company, UserProfile, UserRole, Invitation, Training, TimeRecord, Post } from "../types";

export const INITIAL_COMPANIES: Company[] = [
  {
    id: "company-1",
    name: "Base44 Tec",
    segment: "Tecnologia e Consultoria",
    logo_url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "company-2",
    name: "Aero RH Solutions",
    segment: "Recursos Humanos e Outsourcing",
    logo_url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=150&auto=format&fit=crop&q=80",
  }
];

export const INITIAL_USERS: UserProfile[] = [
  {
    id: "user-1",
    email: "desenvolvimentoflowrh@gmail.com",
    role: UserRole.SUPER_ADMIN,
    company_id: "company-1",
    name: "Desenvolvimento Flow RH",
    department: "Gente & Gestão",
    hire_date: "2024-03-15",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    points_balance: 8.5,
    active_streak: 5,
    birth_date: "1995-05-12"
  },
  {
    id: "user-2",
    email: "lucas.silva@base44.com",
    role: UserRole.COLLABORATOR,
    company_id: "company-1",
    name: "Lucas Silva",
    department: "Engenharia de Software",
    hire_date: "2025-01-10",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    points_balance: -2.0,
    active_streak: 12,
    birth_date: "1998-08-24"
  },
  {
    id: "user-3",
    email: "ana.souza@base44.com",
    role: UserRole.COLLABORATOR,
    company_id: "company-1",
    name: "Ana Souza",
    department: "Design & UX",
    hire_date: "2024-09-01",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    points_balance: 4.0,
    active_streak: 8,
    birth_date: "1997-11-03"
  },
  {
    id: "user-4",
    email: "carlos.eduardo@base44.com",
    role: UserRole.HR_MANAGER,
    company_id: "company-1",
    name: "Carlos Eduardo",
    department: "Diretoria",
    hire_date: "2022-05-20",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
    points_balance: 14.5,
    active_streak: 3,
    birth_date: "1988-02-15"
  },
  {
    id: "user-6",
    email: "marcia.supervisor@base44.com",
    role: UserRole.SUPERVISOR,
    company_id: "company-1",
    name: "Márcia Mendes",
    department: "Engenharia de Software",
    hire_date: "2023-04-10",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    points_balance: 6.0,
    active_streak: 15,
    birth_date: "1991-07-30"
  },
  // Aero RH solutions users
  {
    id: "user-5",
    email: "roberto.alves@aero.com",
    role: UserRole.HR_MANAGER,
    company_id: "company-2",
    name: "Roberto Alves",
    department: "Recursos Humanos",
    hire_date: "2023-11-01",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    points_balance: 2.0,
    active_streak: 2,
    birth_date: "1985-09-18"
  }
];

export const INITIAL_INVITATIONS: Invitation[] = [
  {
    id: "invite-1",
    email: "pedro.almeida@base44.com",
    company_id: "company-1",
    role: UserRole.COLLABORATOR,
    status: "pending",
    invited_by: "Mariana Ferreira",
    sent_at: "2026-07-14T15:30:00Z"
  },
  {
    id: "invite-2",
    email: "fernanda.lima@aero.com",
    company_id: "company-2",
    role: UserRole.COLLABORATOR,
    status: "pending",
    invited_by: "Roberto Alves",
    sent_at: "2026-07-13T10:15:00Z"
  }
];

export const INITIAL_TRAININGS: Training[] = [
  {
    id: "train-1",
    title: "Código de Conduta & Diversidade 2026",
    category: "compliance",
    status: "in_progress",
    due_date: "2026-08-10",
    progress: 65
  },
  {
    id: "train-2",
    title: "Lei Geral de Proteção de Dados (LGPD) Prática",
    category: "seguranca",
    status: "completed",
    due_date: "2026-07-01",
    progress: 100
  },
  {
    id: "train-3",
    title: "Metodologia OKR e Alinhamento Estratégico",
    category: "tecnico",
    status: "not_started",
    due_date: "2026-09-15",
    progress: 0
  },
  {
    id: "train-4",
    title: "Comunicação Não-Violenta no Trabalho",
    category: "soft_skills",
    status: "in_progress",
    due_date: "2026-08-30",
    progress: 20
  }
];

export const INITIAL_TIME_RECORDS: TimeRecord[] = [
  {
    id: "rec-1",
    user_id: "user-2",
    user_name: "Lucas Silva",
    company_id: "company-1",
    timestamp: "2026-07-15T09:02:15-03:00",
    photo_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    location: {
      lat: -23.5505,
      lng: -46.6333,
      address: "Av. Paulista, 1000 - São Paulo, SP"
    },
    type: "entrada"
  },
  {
    id: "rec-2",
    user_id: "user-1",
    user_name: "Mariana Ferreira",
    company_id: "company-1",
    timestamp: "2026-07-15T08:55:00-03:00",
    photo_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    location: {
      lat: -23.5598,
      lng: -46.6582,
      address: "Rua Augusta, 2500 - São Paulo, SP"
    },
    type: "entrada"
  },
  {
    id: "rec-3",
    user_id: "user-2",
    user_name: "Lucas Silva",
    company_id: "company-1",
    timestamp: "2026-07-14T18:05:22-03:00",
    photo_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    location: {
      lat: -23.5505,
      lng: -46.6333,
      address: "Av. Paulista, 1000 - São Paulo, SP"
    },
    type: "saida"
  }
];

export const INITIAL_POSTS: Post[] = [
  {
    id: "post-1",
    user_id: "user-1",
    user_name: "Mariana Ferreira",
    user_avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    user_role: "Gestor de RH",
    user_department: "Gente & Gestão",
    company_id: "company-1",
    content: "🚀 Boas-vindas ao novo portal **Flow RH** da Base44! Aqui você pode registrar seu ponto diário com validação biométrica, acompanhar seus treinamentos e participar ativamente do nosso mural corporativo.",
    category: "aviso",
    likes: ["user-2", "user-3"],
    comments: [
      {
        id: "c-1",
        user_name: "Lucas Silva",
        user_avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
        text: "Ficou sensacional o novo visual! Muito mais fácil registrar o ponto.",
        created_at: "2026-07-15T09:15:00Z"
      },
      {
        id: "c-2",
        user_name: "Ana Souza",
        user_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        text: "Interface super intuitiva, adorei as cores!",
        created_at: "2026-07-15T09:22:00Z"
      }
    ],
    is_pinned: true,
    created_at: "2026-07-15T08:00:00Z"
  },
  {
    id: "post-2",
    user_id: "user-4",
    user_name: "Carlos Eduardo",
    user_avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
    user_role: "Diretor de Operações",
    user_department: "Diretoria",
    company_id: "company-1",
    content: "Parabéns especial para @Ana Souza por conquistar a medalha de **Inovação Brilhante** hoje! O redesign da nossa marca institutional ficou impecável. Exemplo claro de excelência!",
    category: "comemoracao",
    badge_award: {
      badge_name: "Inovação Brilhante",
      icon: "💡",
      description: "Concedido por ideias criativas e execução de design impecável.",
      recipient_name: "Ana Souza",
      recipient_id: "user-3"
    },
    likes: ["user-1", "user-2", "user-3"],
    comments: [
      {
        id: "c-3",
        user_name: "Ana Souza",
        user_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        text: "Muito obrigada pelo reconhecimento, pessoal! Fico muito feliz em contribuir.",
        created_at: "2026-07-15T09:40:00Z"
      }
    ],
    created_at: "2026-07-14T14:20:00Z"
  },
  {
    id: "post-3",
    user_id: "user-1",
    user_name: "Mariana Ferreira",
    user_avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    user_role: "Gestor de RH",
    user_department: "Gente & Gestão",
    company_id: "company-1",
    content: "📊 **Enquete de Integração:** Queremos ouvir vocês! Qual o melhor dia da semana para realizarmos nossa dinâmica de happy hour híbrida?",
    category: "operacao",
    likes: ["user-2"],
    poll: {
      question: "Melhor dia para o Happy Hour de Integração?",
      options: [
        { id: "opt-1", text: "Quinta-feira no escritório (Presencial + Chopp)", votes: ["user-2", "user-3"] },
        { id: "opt-2", text: "Sexta-feira à tarde (Remoto + Dinâmica divertida)", votes: ["user-4"] },
        { id: "opt-3", text: "Quarta-feira pós expediente (Híbrido)", votes: [] }
      ]
    },
    comments: [],
    created_at: "2026-07-13T11:00:00Z"
  }
];
