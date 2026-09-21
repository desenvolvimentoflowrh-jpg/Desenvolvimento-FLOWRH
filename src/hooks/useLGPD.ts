import { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabase";
import { exportLgpdDataEdge, anonymizeLgpdUserEdge } from "../services/edgeFunctions";
import { UserProfile } from "../types";

export interface UserConsents {
  necessary: boolean; // Sempre true (execução de contrato e obrigação legal trabalhista)
  analytics: boolean;
  marketing: boolean;
  hrSharing: boolean; // Compartilhamento interno de aniversariantes e reconhecimentos
  updatedAt: string;
}

const DEFAULT_CONSENTS: UserConsents = {
  necessary: true,
  analytics: false,
  marketing: false,
  hrSharing: true,
  updatedAt: new Date().toISOString(),
};

const LGPD_STORAGE_KEY = "flowrh_lgpd_consents_v1";
const LGPD_BANNER_DISMISSED_KEY = "flowrh_lgpd_banner_dismissed_v1";

export function useLGPD(currentUser?: UserProfile | null) {
  const [consents, setConsents] = useState<UserConsents>(() => {
    try {
      const saved = localStorage.getItem(LGPD_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_CONSENTS, ...JSON.parse(saved), necessary: true };
      }
    } catch (e) {
      console.warn("Erro ao ler consentimentos do localStorage:", e);
    }
    return DEFAULT_CONSENTS;
  });

  const [hasPrompted, setHasPrompted] = useState<boolean>(() => {
    return localStorage.getItem(LGPD_BANNER_DISMISSED_KEY) === "true";
  });

  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"synced" | "local" | "saving">("synced");

  // Sincroniza com Supabase ao iniciar se o usuário estiver logado
  useEffect(() => {
    if (!currentUser?.id || !supabase) return;

    async function loadRemoteConsents() {
      try {
        const { data, error } = await supabase!
          .from("user_consents")
          .select("*")
          .eq("user_id", currentUser!.id)
          .maybeSingle();

        if (data && !error) {
          const remote: UserConsents = {
            necessary: true,
            analytics: Boolean(data.analytics),
            marketing: Boolean(data.marketing),
            hrSharing: data.hr_sharing !== false,
            updatedAt: data.updated_at || new Date().toISOString(),
          };
          setConsents(remote);
          localStorage.setItem(LGPD_STORAGE_KEY, JSON.stringify(remote));
        }
      } catch (err) {
        console.warn("Falha ao carregar consentimento remoto:", err);
      }
    }

    loadRemoteConsents();
  }, [currentUser?.id]);

  const saveConsents = useCallback(
    async (newPreferences: Partial<UserConsents>) => {
      setSyncStatus("saving");
      const updated: UserConsents = {
        ...consents,
        ...newPreferences,
        necessary: true, // Inegociável por força da CLT e art. 7º, II da LGPD
        updatedAt: new Date().toISOString(),
      };

      setConsents(updated);
      localStorage.setItem(LGPD_STORAGE_KEY, JSON.stringify(updated));
      localStorage.setItem(LGPD_BANNER_DISMISSED_KEY, "true");
      setHasPrompted(true);

      // Sincroniza na tabela do Supabase se disponível
      if (currentUser?.id && supabase) {
        try {
          await supabase.from("user_consents").upsert({
            user_id: currentUser.id,
            necessary: true,
            analytics: updated.analytics,
            marketing: updated.marketing,
            hr_sharing: updated.hrSharing,
            consent_version: "1.0",
            updated_at: updated.updatedAt,
          });
          setSyncStatus("synced");
        } catch (err) {
          console.warn("Consentimento gravado localmente (offline sync):", err);
          setSyncStatus("local");
        }
      } else {
        setSyncStatus("local");
      }
    },
    [consents, currentUser?.id]
  );

  const acceptAll = useCallback(() => {
    return saveConsents({
      analytics: true,
      marketing: true,
      hrSharing: true,
    });
  }, [saveConsents]);

  const acceptOnlyNecessary = useCallback(() => {
    return saveConsents({
      analytics: false,
      marketing: false,
      hrSharing: true,
    });
  }, [saveConsents]);

  const requestExport = useCallback(
    async (userId: string) => {
      setLoading(true);
      try {
        const response = await exportLgpdDataEdge(userId);
        return response.data;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const requestAnonymization = useCallback(
    async (userId: string, reason: string) => {
      setLoading(true);
      try {
        const response = await anonymizeLgpdUserEdge(userId, reason, true);
        return response.data;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    consents,
    hasPrompted,
    loading,
    syncStatus,
    saveConsents,
    acceptAll,
    acceptOnlyNecessary,
    requestExport,
    requestAnonymization,
  };
}
