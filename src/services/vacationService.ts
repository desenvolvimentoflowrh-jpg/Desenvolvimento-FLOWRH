import { supabase, isSupabaseConfigured } from "./supabase";
import { dataService } from "./dataService";
import {
  VacationPeriod,
  VacationRequest,
  LicenseRequest,
  VacationBalance,
  CalendarEvent,
  OverlappingValidationResult,
  ESocialEventData,
  UserProfile,
  TimeRecord
} from "../types";
import {
  calcularPeriodosAquisitivos,
  calcularSaldoFerias,
  validarRegrasCLTFerias,
  somarDiasDataISO
} from "../utils/vacationCalculations";
import { getFeriadosNacionais } from "../utils/brazilianHolidays";

export const vacationService = {
  /**
   * Retorna os períodos aquisitivos do colaborador
   */
  async getVacationPeriods(user: UserProfile): Promise<VacationPeriod[]> {
    const requests = await this.getMyVacationRequests(user.id);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("vacation_periods")
          .select("*")
          .eq("user_id", user.id)
          .order("aquisitivo_inicio", { ascending: true });

        if (!error && data && data.length > 0) {
          return data as VacationPeriod[];
        }
      } catch (err) {
        console.warn("Supabase fetch vacation_periods fallback to local calculation:", err);
      }
    }

    return calcularPeriodosAquisitivos(user.hire_date, user.id, user.company_id, requests);
  },

  /**
   * Retorna o saldo consolidado de férias
   */
  async getVacationBalance(user: UserProfile): Promise<VacationBalance> {
    const requests = await this.getMyVacationRequests(user.id);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("vacation_balances")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!error && data) {
          return data as VacationBalance;
        }
      } catch (err) {
        console.warn("Supabase fetch vacation_balance fallback to local calculation:", err);
      }
    }

    return calcularSaldoFerias(user.hire_date, user.id, user.company_id, requests);
  },

  /**
   * Retorna solicitações de férias do usuário logado
   */
  async getMyVacationRequests(userId: string): Promise<VacationRequest[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("vacation_requests")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (!error && data) {
          return data as VacationRequest[];
        }
      } catch (err) {
        console.warn("Supabase fetch my vacation_requests fallback to local:", err);
      }
    }

    const all = dataService.getVacationRequests();
    return all.filter((r) => r.user_id === userId);
  },

  /**
   * Retorna solicitações de férias de toda a equipe (para gestores e RH)
   */
  async getTeamVacationRequests(companyId: string): Promise<VacationRequest[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("vacation_requests")
          .select("*")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false });

        if (!error && data) {
          return data as VacationRequest[];
        }
      } catch (err) {
        console.warn("Supabase fetch team vacation_requests fallback to local:", err);
      }
    }

    const all = dataService.getVacationRequests();
    return all.filter((r) => r.company_id === companyId);
  },

  /**
   * Envia uma nova solicitação de férias
   */
  async createVacationRequest(
    user: UserProfile,
    dados: {
      data_inicio: string;
      data_fim: string;
      dias_solicitados: number;
      abono_pecuniario: boolean;
      dias_abono: number;
      adiantamento_decimo_terceiro: boolean;
      observacao?: string;
    }
  ): Promise<VacationRequest> {
    const params = dataService.getVacationParameters();
    const balance = await this.getVacationBalance(user);

    // Validação CLT
    const cltValidation = validarRegrasCLTFerias(
      dados.data_inicio,
      dados.dias_solicitados,
      dados.abono_pecuniario,
      dados.dias_abono,
      balance.dias_disponiveis,
      params
    );

    if (!cltValidation.isValid) {
      throw new Error(cltValidation.erros.join(" "));
    }

    const newRequest: VacationRequest = {
      id: `vac-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: user.id,
      user_name: user.name,
      user_email: user.email,
      user_department: user.department,
      user_avatar: user.avatar,
      company_id: user.company_id,
      data_inicio: dados.data_inicio,
      data_fim: dados.data_fim,
      dias_solicitados: dados.dias_solicitados,
      abono_pecuniario: dados.abono_pecuniario,
      dias_abono: dados.dias_abono,
      adiantamento_decimo_terceiro: dados.adiantamento_decimo_terceiro,
      status: "pendente",
      observacao: dados.observacao,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("vacation_requests")
          .insert([newRequest])
          .select()
          .single();

        if (!error && data) {
          return data as VacationRequest;
        }
      } catch (err) {
        console.warn("Supabase create vacation_request fallback to local:", err);
      }
    }

    // Persistência local
    const current = dataService.getVacationRequests();
    dataService.saveVacationRequests([newRequest, ...current]);
    return newRequest;
  },

  /**
   * Aprovação de solicitação de férias por gestor/RH
   */
  async approveVacationRequest(
    requestId: string,
    manager: UserProfile
  ): Promise<VacationRequest> {
    const nowISO = new Date().toISOString();
    const esocialId = `ESOC-S2230-${Date.now()}`;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("vacation_requests")
          .update({
            status: "aprovada",
            aprovado_por: manager.id,
            aprovado_em: nowISO,
            esocial_evento_id: esocialId
          })
          .eq("id", requestId)
          .select()
          .single();

        if (!error && data) {
          return data as VacationRequest;
        }
      } catch (err) {
        console.warn("Supabase approve vacation_request fallback to local:", err);
      }
    }

    const current = dataService.getVacationRequests();
    let updated: VacationRequest | null = null;
    const newList = current.map((r) => {
      if (r.id === requestId) {
        updated = {
          ...r,
          status: "aprovada",
          aprovado_por: manager.id,
          aprovado_em: nowISO,
          esocial_evento_id: esocialId
        };
        return updated;
      }
      return r;
    });

    if (updated) {
      dataService.saveVacationRequests(newList);
      return updated;
    }
    throw new Error("Solicitação não encontrada.");
  },

  /**
   * Rejeição de solicitação de férias
   */
  async rejectVacationRequest(
    requestId: string,
    motivo: string,
    manager: UserProfile
  ): Promise<VacationRequest> {
    if (!motivo || motivo.trim().length < 5) {
      throw new Error("O motivo da recusa é obrigatório e deve ter no mínimo 5 caracteres.");
    }

    const nowISO = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("vacation_requests")
          .update({
            status: "rejeitada",
            motivo_rejeicao: motivo,
            aprovado_por: manager.id,
            aprovado_em: nowISO
          })
          .eq("id", requestId)
          .select()
          .single();

        if (!error && data) {
          return data as VacationRequest;
        }
      } catch (err) {
        console.warn("Supabase reject vacation_request fallback to local:", err);
      }
    }

    const current = dataService.getVacationRequests();
    let updated: VacationRequest | null = null;
    const newList = current.map((r) => {
      if (r.id === requestId) {
        updated = {
          ...r,
          status: "rejeitada",
          motivo_rejeicao: motivo,
          aprovado_por: manager.id,
          aprovado_em: nowISO
        };
        return updated;
      }
      return r;
    });

    if (updated) {
      dataService.saveVacationRequests(newList);
      return updated;
    }
    throw new Error("Solicitação não encontrada.");
  },

  /**
   * Cancelamento de solicitação pelo colaborador
   */
  async cancelVacationRequest(requestId: string, userId: string): Promise<VacationRequest> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("vacation_requests")
          .update({ status: "cancelada" })
          .eq("id", requestId)
          .eq("user_id", userId)
          .select()
          .single();

        if (!error && data) {
          return data as VacationRequest;
        }
      } catch (err) {
        console.warn("Supabase cancel vacation_request fallback to local:", err);
      }
    }

    const current = dataService.getVacationRequests();
    let updated: VacationRequest | null = null;
    const newList = current.map((r) => {
      if (r.id === requestId && r.user_id === userId) {
        updated = { ...r, status: "cancelada" };
        return updated;
      }
      return r;
    });

    if (updated) {
      dataService.saveVacationRequests(newList);
      return updated;
    }
    throw new Error("Solicitação não encontrada ou não pertence ao usuário.");
  },

  /**
   * Retorna solicitações de licenças do usuário
   */
  async getMyLicenseRequests(userId: string): Promise<LicenseRequest[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("license_requests")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (!error && data) {
          return data as LicenseRequest[];
        }
      } catch (err) {
        console.warn("Supabase fetch my license_requests fallback to local:", err);
      }
    }

    const all = dataService.getLicenseRequests();
    return all.filter((l) => l.user_id === userId);
  },

  /**
   * Retorna solicitações de licenças da equipe
   */
  async getTeamLicenseRequests(companyId: string): Promise<LicenseRequest[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("license_requests")
          .select("*")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false });

        if (!error && data) {
          return data as LicenseRequest[];
        }
      } catch (err) {
        console.warn("Supabase fetch team license_requests fallback to local:", err);
      }
    }

    const all = dataService.getLicenseRequests();
    return all.filter((l) => l.company_id === companyId);
  },

  /**
   * Envia uma nova solicitação de licença/atestado médico
   */
  async createLicenseRequest(
    user: UserProfile,
    dados: Omit<LicenseRequest, "id" | "user_id" | "company_id" | "status" | "created_at">
  ): Promise<LicenseRequest> {
    const newLicense: LicenseRequest = {
      ...dados,
      id: `lic-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: user.id,
      user_name: user.name,
      user_email: user.email,
      user_department: user.department,
      user_avatar: user.avatar,
      company_id: user.company_id,
      status: "pendente",
      esocial_status: "pendente_envio",
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("license_requests")
          .insert([newLicense])
          .select()
          .single();

        if (!error && data) {
          return data as LicenseRequest;
        }
      } catch (err) {
        console.warn("Supabase create license_request fallback to local:", err);
      }
    }

    const current = dataService.getLicenseRequests();
    dataService.saveLicenseRequests([newLicense, ...current]);
    return newLicense;
  },

  /**
   * Aprovação de licença
   */
  async approveLicenseRequest(
    licenseId: string,
    manager: UserProfile
  ): Promise<LicenseRequest> {
    const nowISO = new Date().toISOString();
    const esocialId = `ESOC-S2230-${Date.now()}`;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("license_requests")
          .update({
            status: "aprovada",
            aprovado_por: manager.id,
            aprovado_em: nowISO,
            esocial_evento_id: esocialId,
            esocial_status: "processado"
          })
          .eq("id", licenseId)
          .select()
          .single();

        if (!error && data) {
          return data as LicenseRequest;
        }
      } catch (err) {
        console.warn("Supabase approve license fallback to local:", err);
      }
    }

    const current = dataService.getLicenseRequests();
    let updated: LicenseRequest | null = null;
    const newList = current.map((l) => {
      if (l.id === licenseId) {
        updated = {
          ...l,
          status: "aprovada",
          aprovado_por: manager.id,
          aprovado_em: nowISO,
          esocial_evento_id: esocialId,
          esocial_status: "processado"
        };
        return updated;
      }
      return l;
    });

    if (updated) {
      dataService.saveLicenseRequests(newList);
      return updated;
    }
    throw new Error("Licença não encontrada.");
  },

  /**
   * Rejeição de licença
   */
  async rejectLicenseRequest(
    licenseId: string,
    motivo: string,
    manager: UserProfile
  ): Promise<LicenseRequest> {
    if (!motivo || motivo.trim().length < 5) {
      throw new Error("O motivo da recusa é obrigatório.");
    }

    const nowISO = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("license_requests")
          .update({
            status: "rejeitada",
            motivo_rejeicao: motivo,
            aprovado_por: manager.id,
            aprovado_em: nowISO
          })
          .eq("id", licenseId)
          .select()
          .single();

        if (!error && data) {
          return data as LicenseRequest;
        }
      } catch (err) {
        console.warn("Supabase reject license fallback to local:", err);
      }
    }

    const current = dataService.getLicenseRequests();
    let updated: LicenseRequest | null = null;
    const newList = current.map((l) => {
      if (l.id === licenseId) {
        updated = {
          ...l,
          status: "rejeitada",
          motivo_rejeicao: motivo,
          aprovado_por: manager.id,
          aprovado_em: nowISO
        };
        return updated;
      }
      return l;
    });

    if (updated) {
      dataService.saveLicenseRequests(newList);
      return updated;
    }
    throw new Error("Licença não encontrada.");
  },

  /**
   * Upload de atestados e documentos médicos no Supabase Storage ou mock seguro
   */
  async uploadLicenseDocument(file: File): Promise<{ url: string; name: string }> {
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.storage
          .from("licencas-docs")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false
          });

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage
            .from("licencas-docs")
            .getPublicUrl(fileName);

          return {
            url: publicUrlData.publicUrl,
            name: file.name
          };
        }
      } catch (err) {
        console.warn("Storage upload fallback to data URI:", err);
      }
    }

    // Fallback data URL para ambiente local ou offline
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          url: (reader.result as string) || "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800",
          name: file.name
        });
      };
      reader.readAsDataURL(file);
    });
  },

  /**
   * Validação de sobreposição entre solicitações, registros de ponto e feriados
   */
  validateOverlaps(
    inicioStr: string,
    fimStr: string,
    userId: string,
    existingVacations: VacationRequest[] = [],
    existingLicenses: LicenseRequest[] = [],
    existingTimeRecords: TimeRecord[] = []
  ): OverlappingValidationResult {
    const conflicts: OverlappingValidationResult["conflicts"] = [];

    // 1. Checar sobreposição com outras férias aprovadas ou pendentes
    existingVacations.forEach((v) => {
      if (v.user_id === userId && (v.status === "aprovada" || v.status === "pendente")) {
        if (!(fimStr < v.data_inicio || inicioStr > v.data_fim)) {
          conflicts.push({
            type: "ferias",
            message: `Conflito com outra solicitação de férias (${v.data_inicio} até ${v.data_fim}) em status ${v.status}.`,
            details: v
          });
        }
      }
    });

    // 2. Checar sobreposição com licenças aprovadas ou pendentes
    existingLicenses.forEach((l) => {
      if (l.user_id === userId && (l.status === "aprovada" || l.status === "pendente")) {
        if (!(fimStr < l.data_inicio || inicioStr > l.data_fim)) {
          conflicts.push({
            type: "licenca",
            message: `Conflito com licença registrada (${l.tipo}) no período de ${l.data_inicio} a ${l.data_fim}.`,
            details: l
          });
        }
      }
    });

    // 3. Checar sobreposição com pontos já batidos no passado
    existingTimeRecords.forEach((tr) => {
      const recordDate = tr.timestamp ? tr.timestamp.substring(0, 10) : "";
      if (tr.user_id === userId && recordDate >= inicioStr && recordDate <= fimStr) {
        conflicts.push({
          type: "ponto",
          message: `Há registro de ponto realizado no dia ${recordDate}.`,
          details: tr
        });
      }
    });

    return {
      hasOverlap: conflicts.length > 0,
      conflicts,
      warningMessage: conflicts.length > 0 ? conflicts[0].message : undefined
    };
  },

  /**
   * Retorna todos os eventos para o Calendário Unificado
   */
  async getUnifiedCalendarEvents(
    companyId: string,
    ano: number = new Date().getFullYear()
  ): Promise<CalendarEvent[]> {
    const feriados = getFeriadosNacionais(ano);
    const ferias = await this.getTeamVacationRequests(companyId);
    const licencas = await this.getTeamLicenseRequests(companyId);

    const events: CalendarEvent[] = [];

    // Feriados
    feriados.forEach((f) => {
      events.push({
        id: `feriado-${f.date}`,
        title: `🇧🇷 ${f.name}`,
        start: f.date,
        end: f.date,
        type: "feriado",
        details: f,
        color: f.type === "facultativo" ? "#94A3B8" : "#0D9488"
      });
    });

    // Férias aprovadas
    ferias
      .filter((v) => v.status === "aprovada")
      .forEach((v) => {
        events.push({
          id: `ferias-${v.id}`,
          title: `🌴 Férias: ${v.user_name || "Colaborador"}`,
          start: v.data_inicio,
          end: v.data_fim,
          type: "ferias",
          status: v.status,
          user_id: v.user_id,
          user_name: v.user_name,
          user_avatar: v.user_avatar,
          department: v.user_department,
          details: v,
          color: "#0043FF"
        });
      });

    // Licenças aprovadas
    licencas
      .filter((l) => l.status === "aprovada")
      .forEach((l) => {
        const icon = l.tipo === "medica" ? "🏥" : l.tipo === "maternidade" ? "👶" : "📋";
        events.push({
          id: `licenca-${l.id}`,
          title: `${icon} Licença ${l.tipo.toUpperCase()}: ${l.user_name || "Colaborador"}`,
          start: l.data_inicio,
          end: l.data_fim,
          type: "licenca",
          status: l.status,
          user_id: l.user_id,
          user_name: l.user_name,
          user_avatar: l.user_avatar,
          department: l.user_department,
          details: l,
          color: "#D97706"
        });
      });

    return events;
  },

  /**
   * Gerador de XML de Evento eSocial (S-2230 / S-2299) para conformidade legal
   */
  generateESocialXML(
    request: VacationRequest | LicenseRequest,
    companyCnpj: string = "12.345.678/0001-90"
  ): ESocialEventData {
    const isFerias = "dias_solicitados" in request;
    const tipoEvento = isFerias ? "S-2230" : "S-2230";
    const motivo = isFerias ? "15 - Férias" : `Licença ${request.tipo}`;
    const dataTermino = isFerias ? request.data_fim : request.data_fim;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtAfastTemp/v_S_01_02_00">
  <evtAfastTemp id="ID1${companyCnpj.replace(/\D/g, "")}${Date.now()}">
    <ideEvento>
      <indRetif>1</indRetif>
      <tpAmb>1</tpAmb>
      <procEmi>1</procEmi>
      <verProc>FlowRH_v2.5</verProc>
    </ideEvento>
    <ideEmpregador>
      <tpInsc>1</tpInsc>
      <nrInsc>${companyCnpj.replace(/\D/g, "")}</nrInsc>
    </ideEmpregador>
    <ideTrabalhador>
      <cpfTrab>${request.user_id}</cpfTrab>
      <nmTrab>${request.user_name || "Colaborador Flow"}</nmTrab>
    </ideTrabalhador>
    <infoAfastamento>
      <iniAfastamento>
        <dtIniAfast>${request.data_inicio}</dtIniAfast>
        <codMotAfast>${isFerias ? "15" : "01"}</codMotAfast>
        <infoMesmoMtv>N</infoMesmoMtv>
      </iniAfastamento>
      <fimAfastamento>
        <dtTermAfast>${dataTermino}</dtTermAfast>
      </fimAfastamento>
    </infoAfastamento>
  </evtAfastTemp>
</eSocial>`;

    return {
      id: `esoc-${request.id}`,
      tipoEvento,
      descricao: `Afastamento Temporário (${motivo})`,
      colaboradorCpf: request.user_id,
      colaboradorNome: request.user_name || "Colaborador",
      dataInicio: request.data_inicio,
      dataTermino: dataTermino,
      motivoAfastamento: motivo,
      xmlPayload: xml,
      status: "gerado",
      criadoEm: new Date().toISOString()
    };
  }
};
