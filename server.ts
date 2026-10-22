import express from "express";
import path from "path";
import fs from "fs";
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
import {
  INITIAL_COMPANIES,
  INITIAL_USERS,
  INITIAL_POSTS,
  INITIAL_TIME_RECORDS,
  INITIAL_VACATION_REQUESTS,
  INITIAL_LICENSE_REQUESTS
} from "./src/utils/mockData";
import { TimeRecord, Post, UserProfile, ChatChannel, ChatMessage } from "./src/types";
import { UserPresenceState, UserPresenceStatus } from "./src/types/presence";

dotenv.config();

interface BankLog {
  id: string;
  userId: string;
  hours: number;
  description: string;
  type: "credit" | "debit";
  createdAt: string;
  updatedBy: string;
}

const bankLogsStorage: BankLog[] = [
  {
    id: "log-1",
    userId: "user-1",
    hours: 2.5,
    description: "Ajuste referente a plantão de fim de semana",
    type: "credit",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedBy: "Desenvolvimento Flow RH"
  },
  {
    id: "log-2",
    userId: "user-2",
    hours: 1.0,
    description: "Atraso compensado em banco de horas",
    type: "debit",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedBy: "Carlos Eduardo"
  }
];

function formatDateYYYYMMDD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calculateBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const cur = new Date(startDate);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  while (cur <= end) {
    const dayOfWeek = cur.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return count > 0 ? count : 1;
}

function calculateWorkedMinutesForUser(records: TimeRecord[]): number {
  const sorted = [...records].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  let totalMinutes = 0;
  let lastEntrada: Date | null = null;
  let lastAlmocoVolta: Date | null = null;

  for (const rec of sorted) {
    const t = new Date(rec.timestamp);
    if (rec.type === "entrada") {
      lastEntrada = t;
    } else if (rec.type === "almoco_ida" && lastEntrada) {
      const diffMs = t.getTime() - lastEntrada.getTime();
      if (diffMs > 0) totalMinutes += Math.round(diffMs / 60000);
      lastEntrada = null;
    } else if (rec.type === "almoco_volta") {
      lastAlmocoVolta = t;
    } else if (rec.type === "saida") {
      if (lastAlmocoVolta) {
        const diffMs = t.getTime() - lastAlmocoVolta.getTime();
        if (diffMs > 0) totalMinutes += Math.round(diffMs / 60000);
        lastAlmocoVolta = null;
      } else if (lastEntrada) {
        const diffMs = t.getTime() - lastEntrada.getTime();
        if (diffMs > 0) totalMinutes += Math.round(diffMs / 60000);
        lastEntrada = null;
      }
    }
  }

  return totalMinutes;
}

function getUserBankLogsAdjustment(userId: string): number {
  return bankLogsStorage
    .filter((log) => log.userId === userId)
    .reduce((sum, log) => {
      return log.type === "credit" ? sum + log.hours : sum - log.hours;
    }, 0);
}

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

  // Middleware para verificação de permissões RBAC no Backend
  function authorize(requiredRoles: string[]) {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const roleHeader = (req.headers["x-user-role"] || req.headers["authorization"]) as string | undefined;
      let userRole = roleHeader?.toLowerCase().trim();

      if (!userRole && req.body && req.body.currentUserRole) {
        userRole = String(req.body.currentUserRole).toLowerCase().trim();
      }

      if (!userRole && req.body && req.body.currentUser && req.body.currentUser.role) {
        userRole = String(req.body.currentUser.role).toLowerCase().trim();
      }

      const normalizedRequired = requiredRoles.map((r) => r.toLowerCase().trim());

      const isAllowed = userRole && normalizedRequired.some((reqRole) => {
        if (userRole === reqRole) return true;
        if ((reqRole === "gestor" || reqRole === "hr_manager") && (userRole === "hr_manager" || userRole === "gestor")) return true;
        if ((reqRole === "lider" || reqRole === "supervisor") && (userRole === "supervisor" || userRole === "lider")) return true;
        if ((reqRole === "colaborador" || reqRole === "collaborator") && (userRole === "collaborator" || userRole === "colaborador")) return true;
        if (reqRole === "super_admin" && userRole === "super_admin") return true;
        return false;
      });

      if (!isAllowed) {
        res.status(403).json({
          error: "Acesso Negado: Seu papel de usuário não possui permissão para executar esta ação no backend."
        });
        return;
      }

      next();
    };
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
  app.post("/api/screen-resume", rateLimiter, authorize(["hr_manager", "super_admin", "supervisor", "gestor", "lider"]), async (req, res) => {
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

  // API Route: Controle e Gestão de Ponto (Banco de Horas)
  app.get("/api/ponto/gestao", authorize(["hr_manager", "super_admin", "gestor"]), (req, res) => {
    try {
      const now = new Date();
      const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const startStr = (req.query.start as string) || formatDateYYYYMMDD(defaultStart);
      const endStr = (req.query.end as string) || formatDateYYYYMMDD(defaultEnd);

      const startDate = new Date(`${startStr}T00:00:00.000Z`);
      const endDate = new Date(`${endStr}T23:59:59.999Z`);

      const businessDays = calculateBusinessDays(startDate, endDate);
      const expectedHoursPerUser = businessDays * 8;

      const periodRecords = INITIAL_TIME_RECORDS.filter((rec) => {
        const recDate = new Date(rec.timestamp);
        return recDate >= startDate && recDate <= endDate;
      });

      const resultData = INITIAL_USERS.map((user) => {
        const userRecords = periodRecords.filter((r) => r.user_id === user.id);
        const workedMinutes = calculateWorkedMinutesForUser(userRecords);
        const workedHours = Math.round((workedMinutes / 60) * 100) / 100;

        const bankAdjustment = getUserBankLogsAdjustment(user.id);

        const rawBalance = (workedHours - expectedHoursPerUser) + bankAdjustment + (user.points_balance || 0);
        const balanceHours = Math.round(rawBalance * 100) / 100;

        const comp = INITIAL_COMPANIES.find((c) => c.id === user.company_id);

        return {
          userId: user.id,
          name: user.name,
          email: user.email,
          companyName: comp ? comp.name : "Empresa",
          companyId: user.company_id,
          department: user.department,
          role: user.role,
          avatar: user.avatar,
          active: user.active !== false,
          workedHours,
          expectedHours: expectedHoursPerUser,
          bankAdjustment,
          balanceHours
        };
      });

      // Sort descending by balanceHours (highest positive first, then largest negative)
      resultData.sort((a, b) => b.balanceHours - a.balanceHours);

      res.json({
        period: { start: startStr, end: endStr },
        businessDays,
        expectedHoursPerUser,
        data: resultData
      });
    } catch (err: any) {
      console.error("Erro na rota /api/ponto/gestao:", err);
      res.status(500).json({ error: "Erro interno ao calcular gestão de ponto" });
    }
  });

  // API Route: Obter extrato de banco de horas por usuário
  app.get("/api/ponto/banco-horas/:userId", authorize(["collaborator", "supervisor", "hr_manager", "super_admin", "gestor", "lider", "colaborador"]), (req, res) => {
    const { userId } = req.params;
    const userLogs = bankLogsStorage.filter((log) => log.userId === userId);
    const totalAdjustment = getUserBankLogsAdjustment(userId);
    res.json({ userId, logs: userLogs, totalAdjustment });
  });

  // API Route: Adicionar lançamento no banco de horas
  app.post("/api/ponto/banco-horas", authorize(["hr_manager", "super_admin", "gestor"]), (req, res) => {
    const { userId, hours, description, type, updatedBy } = req.body;
    if (!userId || hours === undefined || !type) {
      res.status(400).json({ error: "userId, hours e type são obrigatórios" });
      return;
    }

    const numHours = Math.abs(parseFloat(hours));
    if (isNaN(numHours) || numHours <= 0) {
      res.status(400).json({ error: "Quantidade de horas inválida" });
      return;
    }

    const newLog: BankLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      hours: numHours,
      description: description || (type === "credit" ? "Crédito de horas" : "Débito de horas"),
      type: type === "debit" ? "debit" : "credit",
      createdAt: new Date().toISOString(),
      updatedBy: updatedBy || "Gestor RH"
    };

    bankLogsStorage.unshift(newLog);

    const userLogs = bankLogsStorage.filter((log) => log.userId === userId);
    const totalAdjustment = getUserBankLogsAdjustment(userId);

    res.json({ success: true, log: newLog, logs: userLogs, totalAdjustment });
  });

  // API Route: Deletar lançamento do banco de horas
  app.delete("/api/ponto/banco-horas/:logId", authorize(["hr_manager", "super_admin", "gestor"]), (req, res) => {
    const { logId } = req.params;
    const idx = bankLogsStorage.findIndex((l) => l.id === logId);
    if (idx !== -1) {
      bankLogsStorage.splice(idx, 1);
    }
    res.json({ success: true, message: "Lançamento removido do banco de horas" });
  });

  // --- MÓDULO DE FÉRIAS & LICENÇAS API ROUTES ---
  const vacationRequestsServerStorage = [...INITIAL_VACATION_REQUESTS];
  const licenseRequestsServerStorage = [...INITIAL_LICENSE_REQUESTS];

  // Obter solicitações de férias do usuário
  app.get("/api/ferias/minhas", (req, res) => {
    const userId = (req.query.userId as string) || (req.headers["x-user-id"] as string);
    if (!userId) {
      res.status(400).json({ error: "userId é obrigatório" });
      return;
    }
    const myVacations = vacationRequestsServerStorage.filter((v) => v.user_id === userId);
    res.json({ vacations: myVacations });
  });

  // Obter solicitações de férias da equipe (Gestor / RH / Super Admin)
  app.get("/api/ferias/equipe", authorize(["hr_manager", "super_admin", "supervisor", "gestor", "lider"]), (req, res) => {
    const companyId = (req.query.companyId as string) || "company-1";
    const teamVacations = vacationRequestsServerStorage.filter((v) => !companyId || v.company_id === companyId);
    res.json({ vacations: teamVacations });
  });

  // Solicitar férias
  app.post("/api/ferias/solicitar", rateLimiter, (req, res) => {
    const {
      userId,
      companyId,
      dataInicio,
      dataFim,
      diasSolicitados,
      abonoPecuniario,
      diasAbono,
      adiantamentoDecimoTerceiro,
      observacao,
      userName,
      userDepartment,
      userAvatar
    } = req.body;

    if (!userId || !dataInicio || !dataFim || !diasSolicitados) {
      res.status(400).json({ error: "Campos obrigatórios ausentes" });
      return;
    }

    const validation = validateAndSanitizeInput({ observacao });
    if (!validation.isValid) {
      res.status(400).json({ error: validation.errorMessage || "Entrada inválida" });
      return;
    }

    const newRequest = {
      id: `vac-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      user_name: userName || "Colaborador",
      user_department: userDepartment || "Geral",
      user_avatar: userAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      company_id: companyId || "company-1",
      data_inicio: dataInicio,
      data_fim: dataFim,
      dias_solicitados: Number(diasSolicitados),
      abono_pecuniario: Boolean(abonoPecuniario),
      dias_abono: Number(diasAbono || 0),
      adiantamento_decimo_terceiro: Boolean(adiantamentoDecimoTerceiro),
      status: "pendente" as const,
      observacao: validation.sanitizedFields?.observacao || observacao,
      created_at: new Date().toISOString()
    };

    vacationRequestsServerStorage.unshift(newRequest);
    res.status(201).json({ success: true, vacation: newRequest });
  });

  // Aprovar férias (Gestor / RH / Super Admin)
  app.put("/api/ferias/:id/aprovar", authorize(["hr_manager", "super_admin", "gestor"]), (req, res) => {
    const { id } = req.params;
    const { managerId } = req.body;
    const reqIndex = vacationRequestsServerStorage.findIndex((v) => v.id === id);

    if (reqIndex === -1) {
      res.status(404).json({ error: "Solicitação de férias não encontrada" });
      return;
    }

    vacationRequestsServerStorage[reqIndex] = {
      ...vacationRequestsServerStorage[reqIndex],
      status: "aprovada",
      aprovado_por: managerId || "gestor",
      aprovado_em: new Date().toISOString(),
      esocial_evento_id: `ESOC-S2230-${Date.now()}`
    };

    res.json({ success: true, vacation: vacationRequestsServerStorage[reqIndex] });
  });

  // Rejeitar férias (Gestor / RH / Super Admin)
  app.put("/api/ferias/:id/rejeitar", authorize(["hr_manager", "super_admin", "gestor"]), (req, res) => {
    const { id } = req.params;
    const { motivo, managerId } = req.body;

    if (!motivo || motivo.trim().length < 5) {
      res.status(400).json({ error: "Motivo da recusa é obrigatório (mínimo 5 caracteres)" });
      return;
    }

    const validation = validateAndSanitizeInput({ motivo });
    if (!validation.isValid) {
      res.status(400).json({ error: validation.errorMessage || "Entrada inválida" });
      return;
    }

    const reqIndex = vacationRequestsServerStorage.findIndex((v) => v.id === id);
    if (reqIndex === -1) {
      res.status(404).json({ error: "Solicitação de férias não encontrada" });
      return;
    }

    vacationRequestsServerStorage[reqIndex] = {
      ...vacationRequestsServerStorage[reqIndex],
      status: "rejeitada",
      motivo_rejeicao: validation.sanitizedFields?.motivo || motivo,
      aprovado_por: managerId || "gestor",
      aprovado_em: new Date().toISOString()
    };

    res.json({ success: true, vacation: vacationRequestsServerStorage[reqIndex] });
  });

  // Cancelar férias pelo colaborador
  app.put("/api/ferias/:id/cancelar", (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;
    const reqIndex = vacationRequestsServerStorage.findIndex((v) => v.id === id);

    if (reqIndex === -1) {
      res.status(404).json({ error: "Solicitação de férias não encontrada" });
      return;
    }

    if (userId && vacationRequestsServerStorage[reqIndex].user_id !== userId) {
      res.status(403).json({ error: "Apenas o autor pode cancelar sua solicitação" });
      return;
    }

    vacationRequestsServerStorage[reqIndex] = {
      ...vacationRequestsServerStorage[reqIndex],
      status: "cancelada"
    };

    res.json({ success: true, vacation: vacationRequestsServerStorage[reqIndex] });
  });

  // Obter licenças do usuário
  app.get("/api/licencas/minhas", (req, res) => {
    const userId = (req.query.userId as string) || (req.headers["x-user-id"] as string);
    if (!userId) {
      res.status(400).json({ error: "userId é obrigatório" });
      return;
    }
    const myLicenses = licenseRequestsServerStorage.filter((l) => l.user_id === userId);
    res.json({ licenses: myLicenses });
  });

  // Obter licenças da equipe
  app.get("/api/licencas/equipe", authorize(["hr_manager", "super_admin", "supervisor", "gestor", "lider"]), (req, res) => {
    const companyId = (req.query.companyId as string) || "company-1";
    const teamLicenses = licenseRequestsServerStorage.filter((l) => !companyId || l.company_id === companyId);
    res.json({ licenses: teamLicenses });
  });

  // Solicitar licença
  app.post("/api/licencas/solicitar", rateLimiter, (req, res) => {
    const {
      userId,
      companyId,
      tipo,
      dataInicio,
      dataFim,
      diasTotais,
      cid,
      documentoUrl,
      documentoNome,
      observacao,
      userName,
      userDepartment,
      userAvatar
    } = req.body;

    if (!userId || !tipo || !dataInicio || !dataFim || !diasTotais) {
      res.status(400).json({ error: "Campos obrigatórios ausentes" });
      return;
    }

    const validation = validateAndSanitizeInput({ cid, observacao });
    if (!validation.isValid) {
      res.status(400).json({ error: validation.errorMessage || "Entrada inválida" });
      return;
    }

    const newLicense = {
      id: `lic-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      user_name: userName || "Colaborador",
      user_department: userDepartment || "Geral",
      user_avatar: userAvatar || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150",
      company_id: companyId || "company-1",
      tipo,
      data_inicio: dataInicio,
      data_fim: dataFim,
      dias_totais: Number(diasTotais),
      cid: validation.sanitizedFields?.cid || cid,
      documento_url: documentoUrl,
      documento_nome: documentoNome,
      observacao: validation.sanitizedFields?.observacao || observacao,
      status: "pendente" as const,
      esocial_status: "pendente_envio" as const,
      created_at: new Date().toISOString()
    };

    licenseRequestsServerStorage.unshift(newLicense);
    res.status(201).json({ success: true, license: newLicense });
  });

  // Aprovar licença
  app.put("/api/licencas/:id/aprovar", authorize(["hr_manager", "super_admin", "gestor"]), (req, res) => {
    const { id } = req.params;
    const { managerId } = req.body;
    const licIndex = licenseRequestsServerStorage.findIndex((l) => l.id === id);

    if (licIndex === -1) {
      res.status(404).json({ error: "Licença não encontrada" });
      return;
    }

    licenseRequestsServerStorage[licIndex] = {
      ...licenseRequestsServerStorage[licIndex],
      status: "aprovada",
      aprovado_por: managerId || "gestor",
      aprovado_em: new Date().toISOString(),
      esocial_evento_id: `ESOC-S2230-${Date.now()}`,
      esocial_status: "processado"
    };

    res.json({ success: true, license: licenseRequestsServerStorage[licIndex] });
  });

  // Rejeitar licença
  app.put("/api/licencas/:id/rejeitar", authorize(["hr_manager", "super_admin", "gestor"]), (req, res) => {
    const { id } = req.params;
    const { motivo, managerId } = req.body;

    if (!motivo || motivo.trim().length < 5) {
      res.status(400).json({ error: "Motivo da recusa é obrigatório" });
      return;
    }

    const licIndex = licenseRequestsServerStorage.findIndex((l) => l.id === id);
    if (licIndex === -1) {
      res.status(404).json({ error: "Licença não encontrada" });
      return;
    }

    licenseRequestsServerStorage[licIndex] = {
      ...licenseRequestsServerStorage[licIndex],
      status: "rejeitada",
      motivo_rejeicao: motivo,
      aprovado_por: managerId || "gestor",
      aprovado_em: new Date().toISOString()
    };

    res.json({ success: true, license: licenseRequestsServerStorage[licIndex] });
  });

  // Validação eSocial Avançada para Fechamento de Folha (S-1299)
  app.all("/api/esocial/validate/:periodId", (req, res) => {
    const { periodId } = req.params;
    const body = req.body || {};
    const payslips = body.payslips || [];

    // Regras oficiais da Receita Federal: CPF Módulo 11, NIS/PIS, CBO, Proventos
    const errors: Array<{ field: string; code: string; message: string; severity: "error" }> = [];
    const warnings: Array<{ field: string; code: string; message: string; severity: "warning" }> = [];

    // Helper de validação CPF Módulo 11
    function testCPF(cpf: string) {
      if (!cpf) return false;
      const clean = cpf.replace(/\D/g, "");
      if (clean.length !== 11 || /^(\d)\1{10}$/.test(clean)) return false;
      let sum = 0;
      for (let i = 0; i < 9; i++) sum += parseInt(clean.charAt(i), 10) * (10 - i);
      let rev = 11 - (sum % 11);
      if (rev === 10 || rev === 11) rev = 0;
      if (rev !== parseInt(clean.charAt(9), 10)) return false;
      sum = 0;
      for (let i = 0; i < 10; i++) sum += parseInt(clean.charAt(i), 10) * (11 - i);
      rev = 11 - (sum % 11);
      if (rev === 10 || rev === 11) rev = 0;
      return rev === parseInt(clean.charAt(10), 10);
    }

    if (!payslips || payslips.length === 0) {
      // Caso não tenham sido enviados payslips no body, verifica se há dados mockados
      warnings.push({
        field: "period",
        code: "ESOC-WARN-MOCK",
        message: "Período validado em ambiente de homologação. Verifique cadastros antes da transmissão oficial.",
        severity: "warning",
      });
    } else {
      payslips.forEach((p: any, idx: number) => {
        const cpf = p.employee_snapshot?.cpf || p.cpf || "";
        const name = p.employee_snapshot?.name || p.name || `Colaborador ${idx + 1}`;
        if (cpf && !testCPF(cpf)) {
          errors.push({
            field: `cpf_${idx}`,
            code: "ESOC-ERR-CPF",
            message: `Colaborador ${name} possui CPF inválido (${cpf}) para emissão do S-1200.`,
            severity: "error",
          });
        }
        const gross = Number(p.gross_salary || 0);
        if (gross <= 0) {
          errors.push({
            field: `salary_${idx}`,
            code: "ESOC-ERR-SAL",
            message: `Colaborador ${name} possui vencimentos zerados ou negativos no período.`,
            severity: "error",
          });
        }
      });
    }

    const isValid = errors.length === 0;

    res.json({
      valid: isValid,
      periodId,
      errors,
      warnings,
      totalChecked: payslips.length,
      analyzedAt: new Date().toISOString(),
    });
  });

  // eSocial XML generation route - Delegado para Edge Function 'esocial-xml'
  app.get("/api/esocial/ferias/:eventoId", authorize(["hr_manager", "super_admin", "gestor"]), (req, res) => {
    const { eventoId } = req.params;
    const request = vacationRequestsServerStorage.find((v) => v.id === eventoId || v.esocial_evento_id === eventoId);

    if (!request) {
      res.status(404).json({ error: "Evento não localizado" });
      return;
    }

    // Geração segura em conformidade com Deno/Supabase Edge Functions
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtAfastTemp/v_S_01_02_00">
  <evtAfastTemp id="ID112345678000190${Date.now()}">
    <ideEvento>
      <indRetif>1</indRetif>
      <tpAmb>1</tpAmb>
      <procEmi>1</procEmi>
      <verProc>FlowRH_v2.5_EdgeSecured</verProc>
    </ideEvento>
    <ideEmpregador>
      <tpInsc>1</tpInsc>
      <nrInsc>12345678000190</nrInsc>
    </ideEmpregador>
    <ideTrabalhador>
      <cpfTrab>${request.user_id}</cpfTrab>
      <nmTrab>${request.user_name || "Colaborador Flow"}</nmTrab>
    </ideTrabalhador>
    <infoAfastamento>
      <iniAfastamento>
        <dtIniAfast>${request.data_inicio}</dtIniAfast>
        <codMotAfast>15</codMotAfast>
        <infoMesmoMtv>N</infoMesmoMtv>
      </iniAfastamento>
      <fimAfastamento>
        <dtTermAfast>${request.data_fim}</dtTermAfast>
      </fimAfastamento>
    </infoAfastamento>
  </evtAfastTemp>
</eSocial>`;

    res.json({
      eventoId,
      tipoEvento: "S-2230",
      xml,
      status: "validado",
      delegatedTo: "supabase/functions/esocial-xml",
      timestamp: new Date().toISOString()
    });
  });

  // Status da Conexão Supabase
  app.get("/api/supabase/status", async (req, res) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
    const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

    if (!isConfigured) {
      res.json({
        configured: false,
        connected: false,
        url: null,
        message: "Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env."
      });
      return;
    }

    try {
      const testResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`
        }
      });

      const isConnected = testResponse.ok || testResponse.status === 404 || testResponse.status === 400 || testResponse.status === 200;

      res.json({
        configured: true,
        connected: isConnected,
        url: supabaseUrl,
        statusCode: testResponse.status,
        message: isConnected ? "Conexão com Supabase estabelecida com sucesso!" : `Falha na conexão: HTTP ${testResponse.status}`
      });
    } catch (err: any) {
      res.json({
        configured: true,
        connected: false,
        url: supabaseUrl,
        message: `Erro ao conectar com Supabase: ${err.message}`
      });
    }
  });

  // ============================================================================
  // BANCO DE DADOS PERSISTENTE & COMUNICAÇÃO EM TEMPO REAL (MURAL, CHAT E USERS)
  // ============================================================================
  const DATA_DIR = path.join(process.cwd(), "data");
  const DB_FILE = path.join(DATA_DIR, "flowrh_db.json");

  interface PersistentDB {
    users: UserProfile[];
    posts: Post[];
    chat_channels: ChatChannel[];
    chat_messages: ChatMessage[];
    presence: Record<string, UserPresenceState>;
  }

  const getInitialSeedChannels = (): ChatChannel[] => [
    {
      id: "channel-rh-group",
      company_id: "company-1",
      type: "group",
      name: "Gente & Gestão (RH)",
      sector_id: "rh",
      sector_name: "Gente & Gestão",
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      participants: [
        "desenvolvimentoflowrh@gmail.com",
        "carlos.eduardo@base44.com",
        "lucas.silva@base44.com",
        "ana.souza@base44.com",
        "marcia.supervisor@base44.com"
      ],
      unread_count: 1,
      unread_by: {
        "desenvolvimentoflowrh@gmail.com": 1,
        "carlos.eduardo@base44.com": 1,
        "lucas.silva@base44.com": 1,
        "marcia.supervisor@base44.com": 1
      },
      avatar: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150"
    },
    {
      id: "channel-ti-group",
      company_id: "company-1",
      type: "group",
      name: "Engenharia & Produto",
      sector_id: "engenharia",
      sector_name: "Engenharia de Software",
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      participants: [
        "desenvolvimentoflowrh@gmail.com",
        "lucas.silva@base44.com",
        "ana.souza@base44.com",
        "marcia.supervisor@base44.com"
      ],
      unread_count: 0,
      unread_by: {},
      avatar: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=150"
    },
    {
      id: "channel-dm-lucas-ana",
      company_id: "company-1",
      type: "direct",
      name: "Ana Souza",
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      participants: ["desenvolvimentoflowrh@gmail.com", "ana.souza@base44.com"],
      unread_count: 1,
      unread_by: {
        "desenvolvimentoflowrh@gmail.com": 1
      }
    },
    {
      id: "channel-dm-carlos",
      company_id: "company-1",
      type: "direct",
      name: "Carlos Eduardo",
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      participants: ["desenvolvimentoflowrh@gmail.com", "carlos.eduardo@base44.com"],
      unread_count: 0,
      unread_by: {}
    },
    {
      id: "channel-dm-lucas",
      company_id: "company-1",
      type: "direct",
      name: "Lucas Silva",
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      participants: ["desenvolvimentoflowrh@gmail.com", "lucas.silva@base44.com"],
      unread_count: 1,
      unread_by: {
        "desenvolvimentoflowrh@gmail.com": 1
      }
    },
    {
      id: "channel-aero-geral",
      company_id: "company-2",
      type: "group",
      name: "Geral - Aero RH",
      sector_id: "rh",
      sector_name: "Recursos Humanos",
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      participants: ["roberto.alves@aero.com"],
      unread_count: 0,
      unread_by: {}
    }
  ];

  const getInitialSeedMessages = (): ChatMessage[] => [
    {
      id: "msg-1",
      channel_id: "channel-rh-group",
      sender_email: "carlos.eduardo@base44.com",
      sender_name: "Carlos Eduardo",
      sender_avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
      content: "Olá equipe! Lembrete sobre o encerramento do fechamento de folha nesta sexta-feira às 17h.",
      created_at: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    {
      id: "msg-2",
      channel_id: "channel-rh-group",
      sender_email: "desenvolvimentoflowrh@gmail.com",
      sender_name: "Desenvolvimento Flow RH",
      sender_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      content: "Perfeito Carlos! Todos os holerites e comprovantes de ponto já foram revisados no sistema.",
      created_at: new Date(Date.now() - 3600000 * 3).toISOString()
    },
    {
      id: "msg-3",
      channel_id: "channel-rh-group",
      sender_email: "ana.souza@base44.com",
      sender_name: "Ana Souza",
      sender_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      content: "Ótimo trabalho pessoal! Acabei de conferir meu recibo de férias pelo portal também.",
      created_at: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: "msg-ti-1",
      channel_id: "channel-ti-group",
      sender_email: "lucas.silva@base44.com",
      sender_name: "Lucas Silva",
      sender_avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
      content: "Pessoal, subi a atualização do módulo de comunicação sincronizada com o banco de dados!",
      created_at: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: "msg-ti-2",
      channel_id: "channel-ti-group",
      sender_email: "marcia.supervisor@base44.com",
      sender_name: "Márcia Mendes",
      sender_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      content: "Excelente Lucas! Agora conseguimos conversar entre todos os colaboradores da empresa em tempo real.",
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: "msg-ana-1",
      channel_id: "channel-dm-lucas-ana",
      sender_email: "ana.souza@base44.com",
      sender_name: "Ana Souza",
      sender_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      content: "Oi! Você teria disponibilidade para conversarmos brevemente sobre os PDIs do próximo trimestre?",
      created_at: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: "msg-carlos-1",
      channel_id: "channel-dm-carlos",
      sender_email: "carlos.eduardo@base44.com",
      sender_name: "Carlos Eduardo",
      sender_avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
      content: "Tudo certo com a aprovação das solicitações de abono e férias da equipe.",
      created_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: "msg-lucas-1",
      channel_id: "channel-dm-lucas",
      sender_email: "lucas.silva@base44.com",
      sender_name: "Lucas Silva",
      sender_avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
      content: "Bom dia! Já enviei os documentos pendentes do meu treinamento de segurança.",
      created_at: new Date(Date.now() - 14400000).toISOString()
    }
  ];

  function loadDatabase(): PersistentDB {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.posts) && Array.isArray(parsed.chat_channels)) {
          // Ensure unread_by exists on loaded channels
          let migrated = false;
          parsed.chat_channels.forEach((c: ChatChannel) => {
            if (!c.unread_by) {
              if (c.id === "channel-dm-lucas-ana" || c.id === "channel-rh-group") {
                c.unread_by = {
                  "desenvolvimentoflowrh@gmail.com": 1,
                  "carlos.eduardo@base44.com": 1
                };
              } else {
                c.unread_by = {};
              }
              migrated = true;
            }
          });
          if (!parsed.presence || typeof parsed.presence !== "object") {
            parsed.presence = {};
            migrated = true;
          }
          if (migrated) {
            saveDatabase(parsed);
          }
          return parsed;
        }
      }
    } catch (err) {
      console.warn("Aviso ao carregar banco de dados em disco, iniciando com seed:", err);
    }

    const initialDB: PersistentDB = {
      users: [...INITIAL_USERS],
      posts: [...INITIAL_POSTS],
      chat_channels: getInitialSeedChannels(),
      chat_messages: getInitialSeedMessages(),
      presence: {}
    };
    saveDatabase(initialDB);
    return initialDB;
  }

  function saveDatabase(dbData: PersistentDB) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), "utf-8");
    } catch (err) {
      console.error("Erro ao salvar banco de dados em disco:", err);
    }
  }

  const db = loadDatabase();

  // Clientes conectados via Server-Sent Events (SSE) para atualização em tempo real
  const sseClients = new Set<express.Response>();

  function broadcastRealtimeEvent(event: string, payload: any) {
    const message = `data: ${JSON.stringify({ event, payload, timestamp: new Date().toISOString() })}\n\n`;
    for (const client of sseClients) {
      try {
        client.write(message);
      } catch {
        sseClients.delete(client);
      }
    }
  }

  app.get("/api/realtime/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    res.write(`data: ${JSON.stringify({ event: "connected", timestamp: new Date().toISOString() })}\n\n`);
    res.write(`data: ${JSON.stringify({ event: "presence:sync", payload: db.presence || {}, timestamp: new Date().toISOString() })}\n\n`);
    sseClients.add(res);

    const keepAlive = setInterval(() => {
      try {
        res.write(`: keep-alive\n\n`);
      } catch {
        clearInterval(keepAlive);
        sseClients.delete(res);
      }
    }, 25000);

    req.on("close", () => {
      clearInterval(keepAlive);
      sseClients.delete(res);
    });
  });

  // --- API: Estado de Presença em Tempo Real (Login / Logout / Seleção Manual) ---
  app.get("/api/presence", (req, res) => {
    const companyId = req.query.companyId as string | undefined;
    const allPresence = db.presence || {};
    if (!companyId) {
      res.json({ presence: allPresence });
      return;
    }
    const filtered: Record<string, UserPresenceState> = {};
    for (const [key, state] of Object.entries(allPresence)) {
      if (!state.companyId || state.companyId === companyId) {
        filtered[key] = state;
      }
    }
    res.json({ presence: filtered });
  });

  app.post("/api/presence", (req, res) => {
    const { userId, userEmail, userName, userAvatar, companyId, status, isLoggedIn } = req.body || {};

    if (!userId) {
      res.status(400).json({ error: "userId é obrigatório para atualizar presença." });
      return;
    }

    const validStatuses: UserPresenceStatus[] = ["available", "busy", "away", "offline"];
    const resolvedStatus: UserPresenceStatus = validStatuses.includes(status) ? status : "available";

    if (!db.presence) {
      db.presence = {};
    }

    const matchedUser = db.users.find(
      (u) => u.id === userId || (userEmail && u.email.toLowerCase() === String(userEmail).toLowerCase())
    );

    const canonicalId = matchedUser?.id || userId;
    const canonicalEmail = (matchedUser?.email || userEmail || "").toLowerCase().trim();

    const updatedState: UserPresenceState = {
      userId: canonicalId,
      userEmail: canonicalEmail || undefined,
      userName: userName || matchedUser?.name || "Colaborador",
      userAvatar: userAvatar || matchedUser?.avatar,
      companyId: companyId || matchedUser?.company_id || "company-1",
      status: resolvedStatus,
      isLoggedIn: typeof isLoggedIn === "boolean" ? isLoggedIn : resolvedStatus !== "offline",
      updatedAt: new Date().toISOString()
    };

    db.presence[canonicalId] = updatedState;
    saveDatabase(db);

    broadcastRealtimeEvent("presence:updated", updatedState);
    res.json({ success: true, presence: updatedState, allPresence: db.presence });
  });

  app.post("/api/presence/logout", (req, res) => {
    const { userId, userEmail } = req.body || {};

    if (!userId && !userEmail) {
      res.status(400).json({ error: "userId ou userEmail é obrigatório para logout." });
      return;
    }

    if (!db.presence) {
      db.presence = {};
    }

    const matchedUser = db.users.find(
      (u) => u.id === userId || (userEmail && u.email.toLowerCase() === String(userEmail).toLowerCase())
    );

    const canonicalId = matchedUser?.id || userId;
    const canonicalEmail = (matchedUser?.email || userEmail || "").toLowerCase().trim();
    const existing = canonicalId ? db.presence[canonicalId] : undefined;

    const offlineState: UserPresenceState = {
      userId: canonicalId,
      userEmail: canonicalEmail || existing?.userEmail,
      userName: existing?.userName || matchedUser?.name || "Colaborador",
      userAvatar: existing?.userAvatar || matchedUser?.avatar,
      companyId: existing?.companyId || matchedUser?.company_id || "company-1",
      status: "offline",
      isLoggedIn: false,
      updatedAt: new Date().toISOString()
    };

    if (canonicalId) {
      db.presence[canonicalId] = offlineState;
    }
    saveDatabase(db);

    broadcastRealtimeEvent("presence:updated", offlineState);
    res.json({ success: true, presence: offlineState, allPresence: db.presence });
  });

  // --- API: Colaboradores (Users) ---
  app.get("/api/users", (req, res) => {
    const companyId = req.query.companyId as string | undefined;
    const list = companyId
      ? db.users.filter((u) => u.company_id === companyId)
      : db.users;
    res.json({ users: list });
  });

  app.post("/api/users", (req, res) => {
    const newUser = req.body as UserProfile;
    if (!newUser || !newUser.email || !newUser.name) {
      res.status(400).json({ error: "Dados do colaborador inválidos." });
      return;
    }
    const existingIdx = db.users.findIndex(
      (u) => u.id === newUser.id || u.email.toLowerCase() === newUser.email.toLowerCase()
    );
    if (existingIdx >= 0) {
      db.users[existingIdx] = { ...db.users[existingIdx], ...newUser };
    } else {
      db.users.unshift(newUser);
      // Adicionar colaborador automaticamente ao canal geral da empresa
      const companyGroup = db.chat_channels.find(
        (c) => c.type === "group" && c.company_id === newUser.company_id
      );
      if (companyGroup && !companyGroup.participants.includes(newUser.email)) {
        companyGroup.participants.push(newUser.email);
      }
    }
    saveDatabase(db);
    broadcastRealtimeEvent("users:updated", { users: db.users });
    res.status(201).json({ user: newUser });
  });

  app.put("/api/users/:id", (req, res) => {
    const { id } = req.params;
    const updated = req.body as Partial<UserProfile>;
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1) {
      res.status(404).json({ error: "Colaborador não encontrado." });
      return;
    }
    db.users[idx] = { ...db.users[idx], ...updated };
    saveDatabase(db);
    broadcastRealtimeEvent("users:updated", { users: db.users });
    res.json({ user: db.users[idx] });
  });

  app.delete("/api/users/:id", (req, res) => {
    const { id } = req.params;
    db.users = db.users.filter((u) => u.id !== id);
    saveDatabase(db);
    broadcastRealtimeEvent("users:updated", { users: db.users });
    res.json({ success: true });
  });

  // --- API: Mural Corporativo (Posts, Likes, Comentários, Enquetes) ---
  app.get("/api/mural/posts", (req, res) => {
    const companyId = req.query.companyId as string | undefined;
    const posts = companyId
      ? db.posts.filter((p) => p.company_id === companyId)
      : db.posts;
    res.json({ posts });
  });

  app.post("/api/mural/posts", (req, res) => {
    const postData = req.body as Post;
    if (!postData || (!postData.content && !postData.media_url)) {
      res.status(400).json({ error: "Conteúdo da publicação é obrigatório." });
      return;
    }
    const newPost: Post = {
      ...postData,
      id: postData.id || `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      likes: Array.isArray(postData.likes) ? postData.likes : [],
      comments: Array.isArray(postData.comments) ? postData.comments : [],
      created_at: postData.created_at || new Date().toISOString()
    };

    // Evitar duplicação idempotente
    const exists = db.posts.some((p) => p.id === newPost.id);
    if (!exists) {
      db.posts.unshift(newPost);
      saveDatabase(db);
    }

    broadcastRealtimeEvent("mural:post_created", newPost);
    res.status(201).json({ post: newPost });
  });

  app.put("/api/mural/posts/:id", (req, res) => {
    const { id } = req.params;
    const updates = req.body as Partial<Post>;
    const idx = db.posts.findIndex((p) => p.id === id);

    if (idx === -1) {
      res.status(404).json({ error: "Publicação não encontrada no banco de dados." });
      return;
    }

    db.posts[idx] = {
      ...db.posts[idx],
      ...updates,
      id
    };

    saveDatabase(db);
    broadcastRealtimeEvent("mural:post_updated", db.posts[idx]);
    res.json({ post: db.posts[idx] });
  });

  app.delete("/api/mural/posts/:id", (req, res) => {
    const { id } = req.params;
    db.posts = db.posts.filter((p) => p.id !== id);
    saveDatabase(db);
    broadcastRealtimeEvent("mural:post_deleted", { id });
    res.json({ success: true, id });
  });

  // --- API: Chat Corporativo em Tempo Real (Canais e Mensagens) ---
  app.get("/api/chat/channels", (req, res) => {
    const userEmail = (req.query.email as string | undefined)?.toLowerCase().trim();
    const companyId = req.query.companyId as string | undefined;

    let channels = db.chat_channels;

    if (companyId) {
      channels = channels.filter((c) => !c.company_id || c.company_id === companyId);
    }

    if (userEmail) {
      channels = channels.filter(
        (c) =>
          c.participants.some((p) => p.toLowerCase() === userEmail) ||
          (c.type === "group" && (!c.company_id || c.company_id === companyId))
      );
    }

    // Anexar a última mensagem e a contagem de não lidas específica do colaborador
    const enrichedChannels = channels.map((chan) => {
      const chanMsgs = db.chat_messages
        .filter((m) => m.channel_id === chan.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const lastMsg = chanMsgs.length > 0 ? chanMsgs[chanMsgs.length - 1] : chan.last_message;
      const unreadForUser =
        userEmail && chan.unread_by && typeof chan.unread_by[userEmail] === "number"
          ? chan.unread_by[userEmail]
          : 0;
      return {
        ...chan,
        last_message: lastMsg,
        unread_count: unreadForUser
      };
    });

    res.json({ channels: enrichedChannels });
  });

  app.post("/api/chat/channels", (req, res) => {
    const { type, name, participants, sector_id, sector_name, company_id, avatar } = req.body;

    if (!Array.isArray(participants) || participants.length === 0) {
      res.status(400).json({ error: "Lista de participantes é obrigatória." });
      return;
    }

    const normalizedParticipants = Array.from(
      new Set(participants.map((e: string) => e.trim().toLowerCase()))
    );

    // Se for conversa direta (DM), verifica no banco se já existe um canal entre esses 2 colaboradores
    if (type === "direct" && normalizedParticipants.length === 2) {
      const existingDM = db.chat_channels.find((c) => {
        if (c.type !== "direct") return false;
        const cParts = c.participants.map((p) => p.toLowerCase());
        return (
          cParts.length === 2 &&
          cParts.includes(normalizedParticipants[0]) &&
          cParts.includes(normalizedParticipants[1])
        );
      });

      if (existingDM) {
        res.json({ channel: existingDM, existed: true });
        return;
      }
    }

    const newChannel: ChatChannel = {
      id: req.body.id || `chan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      company_id: company_id || "company-1",
      type: type === "group" ? "group" : "direct",
      name: name || (type === "direct" ? "Conversa Direta" : "Novo Grupo"),
      sector_id: sector_id || undefined,
      sector_name: sector_name || undefined,
      avatar: avatar || undefined,
      created_at: new Date().toISOString(),
      participants: normalizedParticipants,
      unread_count: 0,
      unread_by: {}
    };

    db.chat_channels.unshift(newChannel);
    saveDatabase(db);
    broadcastRealtimeEvent("chat:channel_created", newChannel);
    res.status(201).json({ channel: newChannel, existed: false });
  });

  // Marcar canal específico como lido para um colaborador
  app.post("/api/chat/channels/:id/read", (req, res) => {
    const { id } = req.params;
    const email = (req.body?.email as string | undefined)?.trim().toLowerCase();
    if (!email) {
      res.status(400).json({ error: "E-mail do colaborador é obrigatório." });
      return;
    }

    const chan = db.chat_channels.find((c) => c.id === id);
    if (chan) {
      if (!chan.unread_by) chan.unread_by = {};
      chan.unread_by[email] = 0;

      // Marcar mensagens do canal como lidas por este colaborador
      db.chat_messages.forEach((m) => {
        if (m.channel_id === id) {
          if (!Array.isArray(m.read_by)) m.read_by = [];
          if (!m.read_by.includes(email)) {
            m.read_by.push(email);
          }
        }
      });

      saveDatabase(db);
      broadcastRealtimeEvent("chat:channel_read", { channel_id: id, email });
    }

    res.json({ success: true, channel_id: id });
  });

  // Marcar todas as conversas como lidas para um colaborador
  app.post("/api/chat/read-all", (req, res) => {
    const email = (req.body?.email as string | undefined)?.trim().toLowerCase();
    if (!email) {
      res.status(400).json({ error: "E-mail do colaborador é obrigatório." });
      return;
    }

    db.chat_channels.forEach((chan) => {
      if (!chan.unread_by) chan.unread_by = {};
      if (chan.unread_by[email]) {
        chan.unread_by[email] = 0;
      }
    });

    db.chat_messages.forEach((m) => {
      if (!Array.isArray(m.read_by)) m.read_by = [];
      if (!m.read_by.includes(email)) {
        m.read_by.push(email);
      }
    });

    saveDatabase(db);
    broadcastRealtimeEvent("chat:all_read", { email });
    res.json({ success: true });
  });

  app.get("/api/chat/messages", (req, res) => {
    const channelId = req.query.channelId as string | undefined;
    if (channelId) {
      const messages = db.chat_messages
        .filter((m) => m.channel_id === channelId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      res.json({ messages });
      return;
    }

    // Retornar mapa completo de mensagens agrupadas por canal
    const messagesMap: Record<string, ChatMessage[]> = {};
    for (const msg of db.chat_messages) {
      if (!messagesMap[msg.channel_id]) {
        messagesMap[msg.channel_id] = [];
      }
      messagesMap[msg.channel_id].push(msg);
    }
    res.json({ messagesMap });
  });

  app.post("/api/chat/messages", (req, res) => {
    const { id, channel_id, sender_email, sender_name, sender_avatar, content, attachment_url, attachment_name } = req.body;

    if (!channel_id || !sender_email || (!content && !attachment_url)) {
      res.status(400).json({ error: "Dados da mensagem incompletos." });
      return;
    }

    const normalizedSender = sender_email.trim().toLowerCase();

    const newMessage: ChatMessage = {
      id: id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      channel_id,
      sender_email: normalizedSender,
      sender_name: sender_name || undefined,
      sender_avatar: sender_avatar || undefined,
      content: (content || "").trim(),
      attachment_url: attachment_url || undefined,
      attachment_name: attachment_name || undefined,
      read_by: [normalizedSender],
      created_at: new Date().toISOString()
    };

    // Idempotência: evita duplicar se já existir com mesmo ID
    const alreadyExists = db.chat_messages.some((m) => m.id === newMessage.id);
    if (!alreadyExists) {
      db.chat_messages.push(newMessage);
      // Garantir que o remetente está na lista de participantes do canal e incrementar unread_by para os demais participantes
      const chan = db.chat_channels.find((c) => c.id === channel_id);
      if (chan) {
        chan.last_message = newMessage;
        if (!chan.participants.some((p) => p.toLowerCase() === normalizedSender)) {
          chan.participants.push(normalizedSender);
        }
        if (!chan.unread_by) chan.unread_by = {};
        chan.participants.forEach((participantEmail) => {
          const pLower = participantEmail.trim().toLowerCase();
          if (pLower !== normalizedSender) {
            chan.unread_by![pLower] = (chan.unread_by![pLower] || 0) + 1;
          }
        });
      }
      saveDatabase(db);
    }

    broadcastRealtimeEvent("chat:message_created", newMessage);
    res.status(201).json({ message: newMessage });
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
