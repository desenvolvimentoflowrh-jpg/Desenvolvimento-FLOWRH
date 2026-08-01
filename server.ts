import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import {
  PORT,
  GEMINI_MODEL,
  SCORE_BASE,
  SCORE_MAX,
  SCORE_MIN_CLAMP,
  SCORE_THRESHOLD_APROVADO,
  SCORE_THRESHOLD_ARQUIVADO,
  POLICY_CONTEXT,
  RESUME_SCREENING_PROMPT
} from "./config";

dotenv.config();

async function startServer() {
  const app = express();

  // CORS Middleware
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "10mb" }));

  // Initialize Gemini if key is present
  let ai: GoogleGenAI | null = null;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    try {
      ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      console.log("Gemini API client initialized successfully.");
    } catch (err) {
      console.error("Failed to initialize Gemini Client:", err);
    }
  } else {
    console.warn("GEMINI_API_KEY is not defined. Flow AI questions will fallback to local simulated answers.");
  }

  // Input sanitization and validation function for AI model inputs
  function validateAndSanitizeInput(fields: Record<string, any>): {
    isValid: boolean;
    errorMessage?: string;
    sanitizedFields?: Record<string, any>;
  } {
    const FORBIDDEN_SEQUENCES = [
      "```",
      "`",
      "<!--",
      "-->",
      "/*",
      "*/",
      "<<",
      ">>",
      "{{",
      "}}",
      "${",
      "}"
    ];

    const extractStrings = (val: any): string[] => {
      if (typeof val === "string") return [val];
      if (Array.isArray(val)) return val.flatMap(extractStrings);
      if (val !== null && typeof val === "object") {
        return Object.values(val).flatMap(extractStrings);
      }
      return [];
    };

    const sanitizeStr = (str: string): string => {
      let cleaned = str.replace(/\n{6,}/g, "\n\n");
      for (const seq of FORBIDDEN_SEQUENCES) {
        cleaned = cleaned.split(seq).join("");
      }
      return cleaned;
    };

    const sanitizeValue = (val: any): any => {
      if (typeof val === "string") {
        return sanitizeStr(val);
      }
      if (Array.isArray(val)) {
        return val.map(sanitizeValue);
      }
      if (val !== null && typeof val === "object") {
        const res: Record<string, any> = {};
        for (const [k, v] of Object.entries(val)) {
          res[k] = sanitizeValue(v);
        }
        return res;
      }
      return val;
    };

    const sanitizedFields: Record<string, any> = {};

    for (const [fieldName, fieldValue] of Object.entries(fields)) {
      if (fieldValue === undefined || fieldValue === null) continue;

      if (typeof fieldValue === "string") {
        if (fieldValue.length > 2000) {
          return {
            isValid: false,
            errorMessage: "Entrada inválida: tamanho excedido ou conteúdo não permitido"
          };
        }
      } else if (typeof fieldValue === "object") {
        if (JSON.stringify(fieldValue).length > 2000) {
          return {
            isValid: false,
            errorMessage: "Entrada inválida: tamanho excedido ou conteúdo não permitido"
          };
        }
      }

      const stringsToCheck = extractStrings(fieldValue);
      for (const str of stringsToCheck) {
        if (str.length > 2000) {
          return {
            isValid: false,
            errorMessage: "Entrada inválida: tamanho excedido ou conteúdo não permitido"
          };
        }
        for (const seq of FORBIDDEN_SEQUENCES) {
          if (str.includes(seq)) {
            return {
              isValid: false,
              errorMessage: "Entrada inválida: tamanho excedido ou conteúdo não permitido"
            };
          }
        }
      }

      sanitizedFields[fieldName] = sanitizeValue(fieldValue);
    }

    return {
      isValid: true,
      sanitizedFields
    };
  }

  // Rate limiting middleware (500 requests per minute per IP)
  const rateLimitMap = new Map<string, number[]>();
  const RATE_LIMIT_WINDOW_MS = 60 * 1000;
  const MAX_REQUESTS_PER_WINDOW = 500;

  function rateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
    const ip = (req.ip || req.socket.remoteAddress || "unknown").toString();
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;

    const timestamps = (rateLimitMap.get(ip) || []).filter((ts) => ts > windowStart);

    if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
      res.status(429).json({ error: "Muitas requisições. Por favor, tente novamente mais tarde." });
      return;
    }

    timestamps.push(now);
    rateLimitMap.set(ip, timestamps);
    next();
  }

  // API Route: Flow AI assistant
  app.post("/api/flow-ai", rateLimiter, async (req, res) => {
    const { message, history, context } = req.body;

    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    const validation = validateAndSanitizeInput({ message, history, context });
    if (!validation.isValid) {
      res.status(400).json({ error: validation.errorMessage || "Entrada inválida: tamanho excedido ou conteúdo não permitido" });
      return;
    }

    const cleanMessage = validation.sanitizedFields?.message || message;
    const cleanHistory = validation.sanitizedFields?.history || history;
    const cleanContext = validation.sanitizedFields?.context || context;

    const companyName = cleanContext?.companyName || "Base44 Tec";
    const userName = cleanContext?.userName || "Colaborador";
    const userRole = cleanContext?.userRole || "Colaborador";

    // Default policy context to feed the LLM
    const policyContext = POLICY_CONTEXT
      .replace(/\${companyName}/g, companyName)
      .replace(/\${userName}/g, userName)
      .replace(/\${userRole}/g, userRole);

    if (ai) {
      try {
        const contents = [
          { role: "user", parts: [{ text: policyContext }] }
        ];

        // Format history
        if (cleanHistory && Array.isArray(cleanHistory)) {
          cleanHistory.forEach((h: any) => {
            contents.push({
              role: h.role === "user" ? "user" : "model",
              parts: [{ text: h.text }]
            });
          });
        }

        // Add current question
        contents.push({
          role: "user",
          parts: [{ text: cleanMessage }]
        });

        const result = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents,
        });

        res.json({ answer: result.text || "Desculpe, não consegui obter uma resposta da IA." });
      } catch (err: any) {
        console.error("Error generating content from Gemini:", err);
        res.status(500).json({ error: "Erro interno do servidor" });
      }
    } else {
      // Fallback local simulated expert response
      const lowercaseMsg = cleanMessage.toLowerCase();
      let answer = "";
      if (lowercaseMsg.includes("férias") || lowercaseMsg.includes("ferias") || lowercaseMsg.includes("dia") || lowercaseMsg.includes("quando")) {
        answer = `Olá! De acordo com as diretrizes do **Flow RH** para a **${cleanContext?.companyName || "Base44 Tec"}**, você adquire **30 dias de férias** remuneradas após completar **12 meses (1 ano)** de serviço contínuo.

Para solicitar suas férias:
- Faça o pedido com no mínimo **30 dias de antecedência** pelo painel.
- Alinhe o período desejado com seu **Gestor de RH** (${cleanContext?.companyName || "Base44 Tec"}).

Gostaria de iniciar uma simulação de agendamento de férias?`;
      } else if (lowercaseMsg.includes("reembolso") || lowercaseMsg.includes("reembolsar") || lowercaseMsg.includes("uber") || lowercaseMsg.includes("alimentação") || lowercaseMsg.includes("despesa") || lowercaseMsg.includes("nota")) {
        answer = `Olá! A política de reembolso de despesas da **${cleanContext?.companyName || "Base44 Tec"}** define o seguinte:
- 🍔 **Alimentação:** Limite de até **R$ 50,00** por refeição, mediante apresentação de cupom ou nota fiscal.
- 🚗 **Transporte (Uber/Táxi):** Reembolsado integralmente se justificado no relatório para compromissos corporativos.
- 📆 **Prazo de Envio:** Todos os comprovantes e o relatório mensal devem ser submetidos até o **dia 25 de cada mês**.

Você pode carregar os arquivos de notas fiscais digitalizadas e cadastrar no seu menu para aprovação imediata do RH!`;
      } else if (lowercaseMsg.includes("ponto") || lowercaseMsg.includes("ponto eletrônico") || lowercaseMsg.includes("ponto facial") || lowercaseMsg.includes("horas") || lowercaseMsg.includes("expediente")) {
        answer = `O controle de jornada do **Flow RH** é simples e seguro! 

**Principais Regras:**
- **Jornada Padrão:** Segunda a Sexta, das **09:00 às 18:00** (com 1 hora de intervalo para descanso/alimentação).
- **Validação Biométrica:** Ao registrar o ponto, você deve realizar a **validação biométrica facial** através do visor da câmera frontal para assegurar a autenticidade.
- **Banco de Horas:** Horas extras são salvas no banco de horas e podem ser compensadas conforme acordado com seu gestor de RH.

Para bater o ponto agora, basta navegar até a aba ⏰ **Ponto** no painel lateral!`;
      } else if (lowercaseMsg.includes("híbrido") || lowercaseMsg.includes("remoto") || lowercaseMsg.includes("presencial") || lowercaseMsg.includes("escritório") || lowercaseMsg.includes("home office")) {
        answer = `A **${cleanContext?.companyName || "Base44 Tec"}** adota o modelo de **Trabalho Híbrido**:
- 🏠 **3 dias de Home Office** (Remoto).
- 🏢 **2 dias presenciais** no escritório de São Paulo.
- 🗓️ Os dias recomendados para comparecimento presencial para integração do time são **Terças** e **Quintas-feiras**.

Isso promove o equilíbrio entre produtividade individual e momentos valiosos de sinergia presencial da equipe!`;
      } else {
        answer = `Olá! Eu sou a **Flow AI**, sua assistente inteligente integrada do **Flow RH** (Plataforma Base44).

Como a chave da API do Gemini não está configurada neste ambiente ou está usando a chave padrão de teste, estou respondendo com base em nossa **base de conhecimento local corporativa**.

Você pode me perguntar sobre:
- 🏖️ **Direito a Férias** e prazos de solicitação.
- 🍽️ Limites de **Reembolso de Refeição** e transporte.
- ⏱️ Normas de **Controle de Ponto** e jornada de expediente.
- 💻 Dias de **Home Office** e modelo híbrido da empresa.

Como posso ajudar você hoje?`;
      }
      res.json({ answer });
    }
  });

  // API Route: Resume Screening / Triagem de Currículos
  app.post("/api/screen-resume", rateLimiter, async (req, res) => {
    const { resumeText, candidateName, targetRole } = req.body;

    if (!resumeText) {
      res.status(400).json({ error: "O texto do currículo é obrigatório." });
      return;
    }

    const validation = validateAndSanitizeInput({ resumeText, candidateName, targetRole });
    if (!validation.isValid) {
      res.status(400).json({ error: validation.errorMessage || "Entrada inválida: tamanho excedido ou conteúdo não permitido" });
      return;
    }

    const cleanResumeText = validation.sanitizedFields?.resumeText || resumeText;
    const cleanCandidateName = validation.sanitizedFields?.candidateName || candidateName;
    const cleanTargetRole = validation.sanitizedFields?.targetRole || targetRole;

    const candidate = cleanCandidateName || "Candidato";
    const role = cleanTargetRole || "Vaga Geral";

    const prompt = RESUME_SCREENING_PROMPT
      .replace("${role}", role)
      .replace("${candidate}", candidate)
      .replace("${resumeText}", cleanResumeText);

    if (ai) {
      try {
        const result = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
        });

        const rawText = result.text || "";
        // Clean markdown backticks if any
        let cleanJson = rawText.trim();
        if (cleanJson.startsWith("```")) {
          cleanJson = cleanJson.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
        }

        const evaluation = JSON.parse(cleanJson);
        res.json(evaluation);
      } catch (err: any) {
        console.error("Error screening resume with Gemini:", err);
        const fallbackEval = generateSimulatedScreening(candidate, role, cleanResumeText);
        res.json(fallbackEval);
      }
    } else {
      const fallbackEval = generateSimulatedScreening(candidate, role, cleanResumeText);
      res.json(fallbackEval);
    }
  });

  // Serve static files in production or inject Vite in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Flow RH Full-Stack server running on port ${PORT}`);
  });
}

function generateSimulatedScreening(candidate: string, role: string, text: string) {
  let strengths: string[] = [];
  let weaknesses: string[] = [];
  let summary = "";
  let culturalFit = "";
  let interviewQuestions: string[] = [];

  const lowercaseText = text.toLowerCase();
  
  let score = SCORE_BASE;
  const keywords: Record<string, number> = {
    "react": 8, "typescript": 8, "node": 6, "javascript": 5, "figma": 7, "design": 5,
    "gestão": 7, "liderança": 6, "scrum": 5, "agile": 4, "api": 5, "rh": 8, "recursos humanos": 8,
    "vendas": 6, "marketing": 6, "sql": 5, "cloud": 5, "ingles": 4, "inglês": 4
  };

  for (const [kw, val] of Object.entries(keywords)) {
    if (lowercaseText.includes(kw)) {
      score += val;
    }
  }

  if (score > SCORE_MAX) score = SCORE_MAX;
  if (score < SCORE_MIN_CLAMP) score = SCORE_MIN_CLAMP + 5;

  let status: "Aprovado" | "Segunda Fase" | "Arquivado" = "Segunda Fase";
  if (score >= SCORE_THRESHOLD_APROVADO) status = "Aprovado";
  else if (score < SCORE_THRESHOLD_ARQUIVADO) status = "Arquivado";

  if (role.toLowerCase().includes("desenvolvedor") || role.toLowerCase().includes("stack") || role.toLowerCase().includes("tech")) {
    summary = `O candidato ${candidate} apresenta um perfil técnico com boa base no ecossistema web moderno. Demonstra experiências práticas relevantes que se conectam bem com as demandas de desenvolvimento ágil da vaga de ${role}. Contudo, é necessário aprofundar seu conhecimento em arquiteturas escaláveis.`;
    
    if (lowercaseText.includes("react")) strengths.push("Sólida experiência com React e componentes reativos");
    if (lowercaseText.includes("typescript")) strengths.push("Domínio prático de tipagem estática com TypeScript");
    strengths.push("Aderência a boas práticas de código e desenvolvimento ágil");
    if (strengths.length < 3) strengths.push("Boa comunicação interpessoal para times de tecnologia");

    weaknesses.push("Menor exposição a arquiteturas de microsserviços e mensageria distribuída");
    if (!lowercaseText.includes("sql") && !lowercaseText.includes("postgres")) {
      weaknesses.push("Pouca menção a bancos de dados relacionais avançados ou ORM");
    }
    weaknesses.push("Necessidade de validar autonomia para tomada de decisões arquiteturais");

    culturalFit = "Demonstra perfil dinâmico, motivado por desafios técnicos complexos e adaptável ao modelo híbrido com foco em entregas contínuas.";
    
    interviewQuestions = [
      `Como você estruturaria o gerenciamento de estados globais em uma aplicação React complexa de grande escala?`,
      `Pode compartilhar uma situação onde um bug crítico afetou a produção e qual foi sua estratégia para resolução rápida?`,
      `Explique como você lida com testes automatizados (unitários/integração) em seu fluxo diário de desenvolvimento.`
    ];
  } else if (role.toLowerCase().includes("rh") || role.toLowerCase().includes("gente") || role.toLowerCase().includes("gestão") || role.toLowerCase().includes("talent")) {
    summary = `O perfil de ${candidate} indica forte atuação na área de recursos humanos e processos de recrutamento e seleção. Demonstra foco no bem-estar dos colaboradores e gestão de clima organizacional, o que possui excelente sinergia com a plataforma Flow RH.`;
    
    strengths.push("Forte capacidade empática e habilidade de comunicação");
    strengths.push("Experiência no desenho de jornadas de Onboarding de colaboradores");
    strengths.push("Domínio em metodologias de pesquisa de clima organizacional e NPS");

    weaknesses.push("Pouca familiaridade prática com ferramentas analíticas de People Analytics baseadas em Python/R");
    weaknesses.push("Necessidade de demonstrar maior liderança na mediação de conflitos executivos");

    culturalFit = "Total alinhamento com a cultura centrada em pessoas (People-First), valorizando a transparência e a colaboração contínua.";
    
    interviewQuestions = [
      `Qual técnica você utiliza para engajar colaboradores resistentes em responder pesquisas de clima diárias?`,
      `Como você mensura o sucesso de um processo de onboarding nos primeiros 90 dias do novo colaborador?`,
      `Descreva uma iniciativa de Employee Experience que você liderou e quais foram os impactos práticos na retenção de talentos.`
    ];
  } else {
    summary = `O currículo de ${candidate} mostra-se versátil e com experiências ricas em sua área de atuação. O candidato expressa boa comunicação e clareza em suas conquistas profissionais anteriores, demonstrando potencial de adaptação para a vaga de ${role}.`;
    
    strengths.push("Histórico consistente de entrega de metas e projetos");
    strengths.push("Excelente comunicação e documentação de processos");
    strengths.push("Iniciativa para resolver problemas operacionais de forma ágil");

    weaknesses.push("Necessidade de maior aprofundamento específico em métricas corporativas avançadas");
    weaknesses.push("Experiência prévia de liderança de equipes ainda em fase inicial de consolidação");

    culturalFit = "Perfil colaborativo e proativo, com grande abertura para feedback contínuo e desenvolvimento acelerado na carreira.";

    interviewQuestions = [
      `O que mais lhe atrai na cultura da nossa empresa e como você acredita que suas habilidades acelerarão nossos resultados?`,
      `Como você organiza suas prioridades semanais frente a múltiplas demandas simultâneas de diferentes áreas?`,
      `Fale sobre uma inovação ou melhoria de processo que você sugeriu e implementou em seu emprego anterior.`
    ];
  }

  return {
    score,
    status,
    summary,
    strengths,
    weaknesses,
    culturalFit,
    interviewQuestions
  };
}

startServer();
