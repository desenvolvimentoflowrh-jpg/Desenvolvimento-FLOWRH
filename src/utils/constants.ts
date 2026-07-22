import { Goal } from "../types";

export const BADGE_OPTIONS = [
  { name: "Inovação Brilhante", icon: "💡", description: "Concedido por ideias criativas e execução de design/solução impecável." },
  { name: "Trabalho em Equipe", icon: "🤝", description: "Concedido por colaboração exemplar, empatia e apoio constante aos colegas." },
  { name: "Superação & Foco", icon: "🚀", description: "Concedido por entregar resultados com alto impacto e velocidade superlativa." },
  { name: "Qualidade & Rigor", icon: "💎", description: "Concedido por atenção minuciosa aos detalhes e excelência técnica." },
  { name: "Liderança Inspiradora", icon: "👑", description: "Concedido por motivar o time e guiar projetos com visão e clareza." }
];

export const POST_CATEGORIES = [
  { id: "todos", label: "Todos" },
  { id: "aviso", label: "Avisos" },
  { id: "comemoracao", label: "Comemorações" },
  { id: "operacao", label: "Operação" },
  { id: "treinamento", label: "Treinamentos" },
  { id: "destaque", label: "Destaques" },
];

export const SWIRL_SNOWFLAKES = Array.from({ length: 35 }, (_, i) => {
  const size = Math.random() * 8 + 3;
  const duration = Math.random() * 8 + 6;
  const delay = Math.random() * 5;
  const startX = Math.random() * 100;
  const endXOffset = (Math.random() - 0.5) * 200;
  return { id: i, size, duration, delay, startX, endXOffset };
});

export const INITIAL_GOALS: Goal[] = [
  {
    id: "g1",
    user_id: "user-1",
    title: "Arquitetura Next.js & Isolamento Multi-Tenant",
    description: "Concluir a refatoração modular da plataforma HR Tech com RLS e rotas protegidas.",
    progress: 85
  },
  {
    id: "g2",
    user_id: "user-1",
    title: "Liderança de Squad & Avaliação 360",
    description: "Facilitar treinamentos de feedback contínuo e desenvolvimento para o time de produto.",
    progress: 60
  },
  {
    id: "g3",
    user_id: "user-1",
    title: "Certificação em Segurança de Dados & LGPD",
    description: "Concluir o curso avançado de compliance de dados corporativos e privacidade.",
    progress: 100
  }
];
