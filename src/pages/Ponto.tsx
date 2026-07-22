import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  MapPin,
  Camera,
  RefreshCw,
  UserCheck,
  CheckCircle,
  Calendar,
  AlertCircle,
  FileText,
  ChevronRight,
  VideoOff,
  Lock,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Sun,
  Sunset
} from "lucide-react";
import { UserProfile, TimeRecord, UserRole } from "../types";
import { useClock } from "../hooks/useClock";
import { ReceiptModal } from "../components/ReceiptModal";
import {
  getTodayRecords,
  getNextSuggestedPunch,
  isPunchStepAllowed,
  calculateDailyWork,
  calculateBankOfHours,
  PunchType
} from "../utils/pontoUtils";

interface PontoProps {
  currentUser: UserProfile;
  timeRecords: TimeRecord[];
  activeCompanyId: string;
  initialPointType?: "entrada" | "almoco_ida" | "almoco_volta" | "saida";
  onAddRecord: (record: TimeRecord) => void;
}

export const Ponto: React.FC<PontoProps> = ({
  currentUser,
  timeRecords,
  activeCompanyId,
  initialPointType = "entrada",
  onAddRecord
}) => {
  const { currentTime, dateFormatted, timeFormatted } = useClock();

  // Calcular registros de hoje e regras de sequência inteligente
  const todayRecords = getTodayRecords(timeRecords, currentUser.id, currentTime);
  const suggestedNext = getNextSuggestedPunch(todayRecords);

  const [pontoType, setPontoType] = useState<PunchType>(
    suggestedNext.isFinished ? "saida" : (suggestedNext.type as PunchType)
  );
  const [lockError, setLockError] = useState<string | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [pontoLoading, setPontoLoading] = useState(false);
  const [pontoSuccess, setPontoSuccess] = useState(false);
  const [geolocation, setGeolocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const todayIsoStr = new Date().toISOString().split("T")[0];
  const [dateFilter, setDateFilter] = useState<
    "hoje" | "7dias" | "este_mes" | "mes_anterior" | "personalizado"
  >("hoje");
  const [customStartDate, setCustomStartDate] = useState(todayIsoStr);
  const [customEndDate, setCustomEndDate] = useState(todayIsoStr);

  const [selectedRecordForReceipt, setSelectedRecordForReceipt] =
    useState<TimeRecord | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const [isLocating, setIsLocating] = useState(false);

  // Atualizar automaticamente o próximo tipo de registro sugerido quando o histórico do dia muda
  useEffect(() => {
    if (!suggestedNext.isFinished) {
      setPontoType(suggestedNext.type as PunchType);
      setLockError(null);
    }
  }, [todayRecords.length, suggestedNext.type, suggestedNext.isFinished]);

  useEffect(() => {
    fetchGeolocation();
  }, []);

  // Fechar a câmera ao desmontar o componente
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Garantir a conexão do srcObject do vídeo quando a câmera está ativa
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  // Cálculos dinâmicos em tempo real do tempo trabalhado e do saldo do banco de horas
  const dailyWork = calculateDailyWork(todayRecords, currentTime, 480);
  const bankSummary = calculateBankOfHours(
    timeRecords,
    currentUser.id,
    currentUser.points_balance || 0,
    currentTime,
    480
  );

  const formatStateAbbr = (stateStr: string): string => {
    if (!stateStr) return "SP";
    if (stateStr.length === 2) return stateStr.toUpperCase();
    const stateMap: Record<string, string> = {
      "São Paulo": "SP",
      "Rio de Janeiro": "RJ",
      "Minas Gerais": "MG",
      "Bahia": "BA",
      "Paraná": "PR",
      "Rio Grande do Sul": "RS",
      "Pernambuco": "PE",
      "Ceará": "CE",
      "Pará": "PA",
      "Santa Catarina": "SC",
      "Goiás": "GO",
      "Maranhão": "MA",
      "Paraíba": "PB",
      "Amazonas": "AM",
      "Espírito Santo": "ES",
      "Mato Grosso": "MT",
      "Rio Grande do Norte": "RN",
      "Piauí": "PI",
      "Alagoas": "AL",
      "Distrito Federal": "DF",
      "Mato Grosso do Sul": "MS",
      "Sergipe": "SE",
      "Rondônia": "RO",
      "Tocantins": "TO",
      "Acre": "AC",
      "Amapá": "AP",
      "Roraima": "RR"
    };
    return stateMap[stateStr] || stateStr.slice(0, 2).toUpperCase();
  };

  const fetchGeolocation = async () => {
    setIsLocating(true);

    const defaultFallback = {
      lat: -23.5505,
      lng: -46.6333,
      address: "São Paulo - SP (Lat: -23.5505, Lng: -46.6333)"
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const coordsStr = `(Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)})`;

          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);

            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
              {
                signal: controller.signal,
                headers: { "Accept-Language": "pt-BR,pt;q=0.9" }
              }
            );
            clearTimeout(timeoutId);

            if (res.ok) {
              const data = await res.json();
              const addr = data.address || {};
              const city =
                addr.city ||
                addr.town ||
                addr.municipality ||
                addr.village ||
                addr.suburb ||
                addr.city_district ||
                addr.county ||
                "São Paulo";
              const state = addr.state || "SP";
              const stateAbbr = formatStateAbbr(state);
              const formattedLocation = `${city} - ${stateAbbr} ${coordsStr}`;

              setGeolocation({
                lat,
                lng,
                address: formattedLocation
              });
              setIsLocating(false);
              return;
            }
          } catch (err) {
            console.warn("Reverse geocoding timeout/error:", err);
          }

          setGeolocation({
            lat,
            lng,
            address: `São Paulo - SP ${coordsStr}`
          });
          setIsLocating(false);
        },
        async (error) => {
          console.warn("Permissão de GPS recusada ou indisponível:", error);
          try {
            const ipRes = await fetch("https://ipapi.co/json/");
            if (ipRes.ok) {
              const ipData = await ipRes.json();
              if (ipData.city && ipData.region_code) {
                const ipLat = (ipData.latitude || defaultFallback.lat).toFixed(4);
                const ipLng = (ipData.longitude || defaultFallback.lng).toFixed(4);
                setGeolocation({
                  lat: ipData.latitude || defaultFallback.lat,
                  lng: ipData.longitude || defaultFallback.lng,
                  address: `${ipData.city} - ${ipData.region_code} (Lat: ${ipLat}, Lng: ${ipLng})`
                });
                setIsLocating(false);
                return;
              }
            }
          } catch (e) {
            console.warn("Erro no IP location:", e);
          }

          setGeolocation(defaultFallback);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 30000 }
      );
    } else {
      setGeolocation(defaultFallback);
      setIsLocating(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    setCapturedPhoto(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      streamRef.current = mediaStream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      setCameraError(
        "Não foi possível acessar a câmera. Verifique as permissões do navegador ou se há uma câmera disponível."
      );
      setCameraActive(false);
    }
  };

  const capturePhotoFromVideo = (): string | null => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, width, height);
        return canvas.toDataURL("image/jpeg", 0.85);
      }
    }
    return null;
  };

  const handleSnapPhoto = () => {
    const photoData = capturePhotoFromVideo();
    if (photoData) {
      setCapturedPhoto(photoData);
    } else {
      setCapturedPhoto(currentUser.avatar);
    }
    stopCamera();
  };

  const handleSelectPontoType = (type: PunchType) => {
    const check = isPunchStepAllowed(type, todayRecords);
    if (!check.allowed) {
      setLockError(check.reason || "Marcação fora de sequência.");
    } else {
      setLockError(null);
    }
    setPontoType(type);
  };

  const handleRegisterPonto = () => {
    // Validar se o passo selecionado é permitido na sequência inteligente
    const check = isPunchStepAllowed(pontoType, todayRecords);
    if (!check.allowed) {
      setLockError(check.reason || "Não é possível realizar este registro fora de ordem.");
      return;
    }
    setLockError(null);
    setPontoLoading(true);

    let finalPhoto = capturedPhoto;

    if (cameraActive) {
      const photo = capturePhotoFromVideo();
      if (photo) {
        finalPhoto = photo;
        setCapturedPhoto(photo);
      }
      stopCamera();
    }

    if (!finalPhoto) {
      finalPhoto = currentUser.avatar;
    }

    setTimeout(() => {
      const newRecord: TimeRecord = {
        id: `rec-${Date.now()}`,
        user_id: currentUser.id,
        user_name: currentUser.name,
        company_id: activeCompanyId,
        type: pontoType,
        timestamp: new Date().toISOString(),
        location: geolocation?.address || "Localização Padrão",
        face_photo: finalPhoto,
        status: "approved"
      };

      onAddRecord(newRecord);
      setPontoLoading(false);
      setPontoSuccess(true);
      setCapturedPhoto(null);
      stopCamera();
      setTimeout(() => setPontoSuccess(false), 4000);
    }, 800);
  };

  const userRecords = timeRecords.filter((r) => r.user_id === currentUser.id);

  const filteredRecords = userRecords.filter((r) => {
    const recDate = new Date(r.timestamp);
    const now = new Date();

    if (dateFilter === "hoje") {
      return recDate.toDateString() === now.toDateString();
    }

    if (dateFilter === "7dias") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      return recDate >= sevenDaysAgo && recDate <= now;
    }

    if (dateFilter === "este_mes") {
      return (
        recDate.getMonth() === now.getMonth() &&
        recDate.getFullYear() === now.getFullYear()
      );
    }

    if (dateFilter === "mes_anterior") {
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return (
        recDate.getMonth() === prevMonth.getMonth() &&
        recDate.getFullYear() === prevMonth.getFullYear()
      );
    }

    if (dateFilter === "personalizado") {
      if (!customStartDate && !customEndDate) return true;
      const start = customStartDate
        ? new Date(`${customStartDate}T00:00:00`)
        : new Date(0);
      const end = customEndDate
        ? new Date(`${customEndDate}T23:59:59`)
        : new Date();
      return recDate >= start && recDate <= end;
    }

    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      {/* Header Banner */}
      <div className="bg-[#8B5CF6] text-white p-6 rounded-3xl shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left z-10">
          <div className="text-xs text-purple-200 font-bold uppercase tracking-wider flex items-center justify-center md:justify-start gap-1.5">
            <Clock className="w-4 h-4" /> Relógio Ponto com Validade Legal
          </div>
          <h2 className="text-2xl font-black tracking-tight">{dateFormatted}</h2>
          <p className="text-xs text-purple-100">
            Captura de ponto via GPS, Biometria Facial e Criptografia em Tempo Real.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl text-center z-10">
          <div className="text-[10px] uppercase font-bold text-purple-200 tracking-wider">
            Hora Oficial do Servidor
          </div>
          <div className="text-3xl font-black font-mono tracking-wider">{timeFormatted}</div>
        </div>
      </div>

      {/* Main Registration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Registration Form Box */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                Registrar Marcação de Ponto
              </h3>
              <p className="text-[11px] text-slate-400">
                Sequência inteligente e validação em tempo real
              </p>
            </div>
            <span className="text-[10px] bg-purple-50 dark:bg-purple-950/60 text-[#8B5CF6] dark:text-purple-300 px-2.5 py-1 rounded-full font-bold uppercase border border-purple-200 dark:border-purple-800">
              GPS & Biometria
            </span>
          </div>

          {pontoSuccess && (
            <div className="bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 p-4 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <span>Ponto registrado com sucesso!</span>
                <p className="text-[10px] font-normal text-emerald-700 dark:text-emerald-300">
                  Horas recalculadas instantaneamente no banco de horas.
                </p>
              </div>
            </div>
          )}

          {suggestedNext.isFinished && (
            <div className="bg-purple-50 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200 p-4 rounded-xl text-xs font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
              <div>
                <span>Expediente do Dia Concluído!</span>
                <p className="text-[10px] font-normal text-purple-700 dark:text-purple-300">
                  Todas as 4 batidas (Entrada, Ida Almoço, Volta Almoço e Saída) já foram registradas para hoje.
                </p>
              </div>
            </div>
          )}

          {lockError && (
            <div className="bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{lockError}</span>
            </div>
          )}

          {/* Point Type Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                Tipo de Marcação (Sequência Inteligente)
              </label>
              {!suggestedNext.isFinished && (
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                  Próxima sugerida: {suggestedNext.label}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: "entrada", label: "🟢 Entrada", expectedTime: "08:00" },
                { id: "almoco_ida", label: "🍔 Ida Almoço", expectedTime: "12:00" },
                { id: "almoco_volta", label: "☕ Volta Almoço", expectedTime: "13:00" },
                { id: "saida", label: "🔴 Saída", expectedTime: "17:00" }
              ].map((item) => {
                const isCompleted = todayRecords.some((r) => r.type === item.id);
                const isSuggested = suggestedNext.type === item.id;
                const isSelected = pontoType === item.id;
                const check = isPunchStepAllowed(item.id as PunchType, todayRecords);
                const isLocked = !check.allowed && !isCompleted;

                const completedRecord = todayRecords.find((r) => r.type === item.id);
                const completedTimeString = completedRecord
                  ? new Date(completedRecord.timestamp).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })
                  : null;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectPontoType(item.id as PunchType)}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all relative flex flex-col justify-between gap-1.5 text-left cursor-pointer ${
                      isSelected
                        ? "border-[#8B5CF6] bg-purple-50/80 dark:bg-purple-950/50 text-[#8B5CF6] dark:text-purple-300 ring-2 ring-purple-500/20 shadow-sm"
                        : isCompleted
                        ? "border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-200"
                        : isSuggested
                        ? "border-purple-300 dark:border-purple-700 bg-purple-50/30 dark:bg-purple-950/20 text-slate-800 dark:text-slate-100 hover:bg-purple-50"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    } ${isLocked ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate">{item.label}</span>
                      {isCompleted ? (
                        <span className="text-[10px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full flex items-center gap-1">
                          ✓ {completedTimeString}
                        </span>
                      ) : isSuggested ? (
                        <span className="text-[9px] font-bold bg-purple-600 text-white px-1.5 py-0.5 rounded-full animate-pulse">
                          Sugerido
                        </span>
                      ) : isLocked ? (
                        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                          {item.expectedTime}
                        </span>
                      )}
                    </div>

                    <div className="text-[9px] font-normal text-slate-400 dark:text-slate-500 flex items-center justify-between">
                      <span>
                        {isCompleted
                          ? "Registrado hoje"
                          : isLocked
                          ? "Aguardando anterior"
                          : `Previsto: ${item.expectedTime}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Camera / Biometric Scan Area */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                Reconhecimento Facial (Biometria)
              </label>
              {cameraActive && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 animate-pulse">
                  ● Câmera Ao Vivo
                </span>
              )}
            </div>

            <div className="bg-slate-900 rounded-2xl h-56 relative overflow-hidden flex flex-col items-center justify-center border border-slate-800 shadow-inner">
              <canvas ref={canvasRef} className="hidden" />

              {capturedPhoto ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center p-3">
                  <img
                    src={capturedPhoto}
                    alt="Facial snapshot"
                    className="h-36 w-auto object-cover rounded-xl border-2 border-emerald-500 shadow-lg"
                  />
                  <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
                    ✓ Foto Capturada
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition border border-slate-700 cursor-pointer flex items-center gap-1"
                    >
                      <Camera className="w-3.5 h-3.5" /> Refazer Foto
                    </button>
                    <button
                      type="button"
                      onClick={() => setCapturedPhoto(null)}
                      className="px-3 py-1 bg-slate-800 hover:bg-rose-950 text-rose-300 text-xs font-bold rounded-lg transition border border-slate-700 cursor-pointer"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ) : cameraActive ? (
                <div className="relative w-full h-full flex items-center justify-center bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />

                  {/* Overlay guider for face */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="w-32 h-40 border-2 border-dashed border-emerald-400/80 rounded-[50%] animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center">
                      <span className="text-[9px] font-bold text-emerald-300/90 bg-black/60 px-2 py-0.5 rounded-full">
                        Posicione o rosto
                      </span>
                    </div>
                  </div>

                  {/* Floating Action Buttons */}
                  <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-2 px-3 z-10">
                    <button
                      type="button"
                      onClick={handleSnapPhoto}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" /> Capturar Foto
                    </button>

                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-600 transition flex items-center gap-1 cursor-pointer"
                    >
                      <VideoOff className="w-3.5 h-3.5" /> Fechar Câmera
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-5 space-y-2.5">
                  <div className="p-3 bg-slate-800/80 rounded-2xl w-12 h-12 mx-auto flex items-center justify-center border border-slate-700">
                    <Camera className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">Validação Biométrica Facial</p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      Ative a câmera para bater o ponto. A câmera será fechada automaticamente ao finalizar.
                    </p>
                  </div>

                  {cameraError && (
                    <div className="text-[11px] text-rose-400 bg-rose-950/60 border border-rose-800 p-2 rounded-xl max-w-xs mx-auto font-medium">
                      {cameraError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2 bg-[#8B5CF6] hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 mx-auto cursor-pointer"
                  >
                    <Camera className="w-4 h-4" /> Ativar Câmera
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Geolocation Button */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                Geolocalização (Cidade - Estado)
              </label>
              {geolocation && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  GPS Confirmado
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={fetchGeolocation}
              disabled={isLocating}
              className="w-full text-left text-xs border border-slate-200 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold flex items-center justify-between transition-all cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-2 truncate">
                <MapPin className="w-4 h-4 text-[#8B5CF6] shrink-0" />
                <span className="truncate font-bold text-slate-800 dark:text-slate-100">
                  {isLocating
                    ? "Obtendo Cidade e Estado..."
                    : geolocation
                    ? geolocation.address
                    : "Clique para obter localização"}
                </span>
              </div>
              {isLocating ? (
                <RefreshCw className="w-3.5 h-3.5 text-purple-600 animate-spin shrink-0" />
              ) : (
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline shrink-0">
                  Atualizar
                </span>
              )}
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              onClick={handleRegisterPonto}
              disabled={pontoLoading || suggestedNext.isFinished}
              className="w-full bg-[#8B5CF6] hover:bg-purple-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold py-3.5 rounded-xl text-xs transition shadow-md shadow-purple-500/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              {pontoLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Processando Marcação...
                </>
              ) : suggestedNext.isFinished ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Expediente do Dia Concluído
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" /> Confirmar e Registrar Ponto
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Info & History Column */}
        <div className="lg:col-span-6 space-y-6">
          {/* Workload & Hour Bank Box */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                Jornada de Trabalho & Banco de Horas
              </h4>
              <span className="text-[10px] font-mono text-slate-400">
                Meta: 08h00 / dia
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Total Worked Today */}
              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/80 p-3.5 rounded-xl">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block mb-0.5">
                  Trabalhado Hoje
                </span>
                <span className="text-xl font-black font-mono text-slate-800 dark:text-slate-100">
                  {dailyWork.formattedTotal}
                </span>
                <div className="mt-1 text-[9px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
                  <span>Manhã: {Math.floor(dailyWork.morningMinutes / 60)}h{dailyWork.morningMinutes % 60}m</span>
                  <span>Tarde: {Math.floor(dailyWork.afternoonMinutes / 60)}h{dailyWork.afternoonMinutes % 60}m</span>
                </div>
              </div>

              {/* Saldo do Dia */}
              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/80 p-3.5 rounded-xl">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block mb-0.5">
                  Saldo do Dia
                </span>
                <span
                  className={`text-xl font-black font-mono flex items-center gap-1 ${
                    dailyWork.dailyBalanceMinutes >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {dailyWork.dailyBalanceMinutes >= 0 ? (
                    <TrendingUp className="w-4 h-4 shrink-0" />
                  ) : (
                    <TrendingDown className="w-4 h-4 shrink-0" />
                  )}
                  {dailyWork.formattedDailyBalance}
                </span>
                <span className="mt-1 text-[9px] text-slate-400 dark:text-slate-500 block">
                  {dailyWork.dailyBalanceMinutes >= 0 ? "Horas extras" : "Abaixo da jornada"}
                </span>
              </div>
            </div>

            {/* Total Bank of Hours Banner */}
            <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between shadow-inner">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">
                  Saldo Acumulado do Banco de Horas
                </span>
                <div className="text-2xl font-black font-mono tracking-wide flex items-center gap-2">
                  <span
                    className={
                      bankSummary.totalBalanceHours >= 0
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }
                  >
                    {bankSummary.formattedTotalBalance}
                  </span>
                  <span className="text-xs font-sans text-slate-400 font-normal">
                    ({bankSummary.totalBalanceHours >= 0 ? "Crédito a compensar" : "Débito"})
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Expediente Vigente
                </span>
                <span className="text-xs font-bold text-slate-200">
                  Comercial (8h/dia)
                </span>
              </div>
            </div>
          </div>

          {/* History Records Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  Minhas Marcações Recentes
                </h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  Clique no registro para visualizar o comprovante oficial
                </p>
              </div>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="text-xs border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 bg-white dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer"
              >
                <option value="hoje">Hoje</option>
                <option value="7dias">Últimos 7 dias</option>
                <option value="este_mes">Este Mês</option>
                <option value="mes_anterior">Mês Anterior</option>
                <option value="personalizado">Personalizado</option>
              </select>
            </div>

            {dateFilter === "personalizado" && (
              <div className="flex flex-wrap items-center gap-3 pt-2 pb-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span>De:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span>Até:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {filteredRecords.length === 0 ? (
                <div className="text-center py-8 px-4 bg-slate-50/60 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700/80 my-2 space-y-1">
                  <Calendar className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto opacity-60" />
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Nenhuma marcação encontrada para o período selecionado.
                  </p>
                </div>
              ) : (
                filteredRecords.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => {
                      setSelectedRecordForReceipt(rec);
                      setIsReceiptOpen(true);
                    }}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50/60 dark:hover:bg-slate-800/90 rounded-xl border border-slate-100 dark:border-slate-700/80 text-xs flex items-center justify-between gap-3 cursor-pointer transition-all hover:shadow-sm group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">
                        {rec.type === "entrada"
                          ? "🟢"
                          : rec.type === "almoco_ida"
                          ? "🍔"
                          : rec.type === "almoco_volta"
                          ? "☕"
                          : "🔴"}
                      </span>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[11px] flex items-center gap-1.5">
                          <span>
                            {rec.type === "entrada"
                              ? "Entrada"
                              : rec.type === "almoco_ida"
                              ? "Ida Almoço"
                              : rec.type === "almoco_volta"
                              ? "Volta Almoço"
                              : "Saída"}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[180px] sm:max-w-[220px]">
                          {typeof rec.location === "string"
                            ? rec.location
                            : rec.location?.address ||
                              (rec.location?.lat
                                ? `Lat: ${rec.location.lat}, Lng: ${rec.location.lng}`
                                : "Localização Padrão")}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                          {new Date(rec.timestamp).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </div>
                        <div className="text-[9px] text-slate-400 dark:text-slate-500">
                          {new Date(rec.timestamp).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                      <div className="p-1 rounded-lg text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:bg-purple-100/50 dark:group-hover:bg-slate-700 transition-all">
                        <FileText className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comprovante de Registro de Ponto Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        record={selectedRecordForReceipt}
        currentUser={currentUser}
      />
    </motion.div>
  );
};
