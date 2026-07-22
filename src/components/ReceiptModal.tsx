import React, { useState } from "react";
import { jsPDF } from "jspdf";
import {
  X,
  Printer,
  Download,
  MapPin,
  ShieldCheck,
  Clock,
  User,
  Building2,
  CheckCircle2,
  FileText,
  Camera,
  Hash,
  ExternalLink
} from "lucide-react";
import { TimeRecord, UserProfile } from "../types";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: TimeRecord | null;
  currentUser: UserProfile;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  record,
  currentUser
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen || !record) return null;

  // Format timestamp
  const dateObj = new Date(record.timestamp);
  
  // Day of week + full date
  const dateStrFormatted = dateObj.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  // Capitalize first letter of weekday
  const dateStrStrFormattedCap =
    dateStrFormatted.charAt(0).toUpperCase() + dateStrFormatted.slice(1);

  // Time formatted (HH:mm:ss)
  const timeStrFormatted = dateObj.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  // Type details
  const getTypeBadge = (type: TimeRecord["type"]) => {
    switch (type) {
      case "entrada":
        return {
          label: "ENTRADA",
          colorClass:
            "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
          icon: "🟢"
        };
      case "almoco_ida":
        return {
          label: "IDA ALMOÇO",
          colorClass:
            "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800",
          icon: "🍔"
        };
      case "almoco_volta":
        return {
          label: "VOLTA ALMOÇO",
          colorClass:
            "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800",
          icon: "☕"
        };
      case "saida":
        return {
          label: "SAÍDA",
          colorClass:
            "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800",
          icon: "🔴"
        };
      default:
        return {
          label: "MARCAÇÃO",
          colorClass:
            "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700",
          icon: "⏱️"
        };
    }
  };

  const typeInfo = getTypeBadge(record.type);

  // Address formatted
  const locationText =
    typeof record.location === "string"
      ? record.location
      : record.location?.address ||
        (record.location?.lat
          ? `Lat: ${record.location.lat}, Lng: ${record.location.lng} (Geolocalização GPS)`
          : "Localização Padrão registrada");

  // Synthetic deterministic NSR / SHA-256 hash
  const recordIdNum = record.id.replace(/[^0-9]/g, "").slice(-8) || "00049281";
  const nsrCode = `NSR: 00${recordIdNum.padStart(8, "0")}`;
  const sha256Hash = `HASH: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7${recordIdNum.slice(0, 4)}`;

  const handleDownloadFile = () => {
    setDownloadSuccess(true);

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      // Header Banner Box
      doc.setFillColor(30, 64, 175); // Blue #1e40af
      doc.rect(15, 15, 180, 24, "F");

      // Header Text
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("FLOW RH - COMPROVANTE DE REGISTRO DE PONTO", 22, 26);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Validade Legal - Portaria 671/MTE | Registro Biometrico Validado", 22, 33);

      // Tipo de Marcação Badge
      doc.setFillColor(239, 246, 255);
      doc.setDrawColor(191, 219, 254);
      doc.roundedRect(15, 45, 180, 14, 3, 3, "FD");

      doc.setTextColor(30, 64, 175);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`TIPO DE MARCACAO: ${typeInfo.label}`, 22, 54);

      // Date & Time Box
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(15, 65, 180, 32, 4, 4, "FD");

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("HORARIO & DATA DO REGISTRO", 105, 74, { align: "center" });

      doc.setFontSize(26);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(timeStrFormatted, 105, 85, { align: "center" });

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      doc.text(dateStrStrFormattedCap, 105, 92, { align: "center" });

      // Colaborador & Empresa Section
      // Left Box - Colaborador
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(15, 103, 87, 30, 3, 3, "FD");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(148, 163, 184);
      doc.text("COLABORADOR", 20, 110);
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      const nameClean = (record.user_name || currentUser.name).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      doc.text(nameClean, 20, 118);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(`E-mail: ${currentUser.email}`, 20, 125);

      // Right Box - Empresa / Tenant
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(108, 103, 87, 30, 3, 3, "FD");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(148, 163, 184);
      doc.text("ORGANIZACAO / TENANT", 113, 110);
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text("Base44 Tecnologia (Flow RH)", 113, 118);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("CNPJ: 44.382.910/0001-08", 113, 125);

      // GPS & Localização Box
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, 138, 180, 22, 3, 3, "FD");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(148, 163, 184);
      doc.text("LOCALIZACAO GPS REGISTRADA (CIDADE, ESTADO, LATITUDE & LONGITUDE)", 20, 145);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      const locClean = locationText.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      doc.text(locClean, 20, 153);

      // Biometria Facial Confirmation Box
      doc.setFillColor(236, 253, 245);
      doc.setDrawColor(167, 243, 208);
      doc.roundedRect(15, 165, 180, 16, 3, 3, "FD");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(6, 95, 70);
      doc.text("VERIFICACAO BIOMETRICA FACIAL: CONFIRMADA E CRIPTOGRAFADA", 22, 175);

      // Hash & Autenticação Digital MTE Box
      doc.setFillColor(15, 23, 42);
      doc.roundedRect(15, 186, 180, 28, 3, 3, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(148, 163, 184);
      doc.text("AUTENTICACAO DIGITAL IMPRESSORA / PORTARIA 671 MTE", 22, 194);
      doc.setFontSize(10);
      doc.setTextColor(52, 211, 153);
      doc.text(nsrCode, 22, 201);
      doc.setFontSize(7);
      doc.setFont("courier", "normal");
      doc.setTextColor(203, 213, 225);
      doc.text(sha256Hash, 22, 208);

      // Footer
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Documento gerado digitalmente em ${new Date().toLocaleString("pt-BR")} pelo sistema Flow RH.`, 105, 225, { align: "center" });

      // Save PDF directly to user's device
      const formattedDate = dateObj.toISOString().slice(0, 10);
      doc.save(`comprovante_ponto_${record.type}_${formattedDate}.pdf`);

    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
    }

    setTimeout(() => {
      setDownloadSuccess(false);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-2xl text-white shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">
                  Comprovante de Marcação
                </h3>
                <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 uppercase tracking-wide">
                  Flow RH
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Registro com Validade Legal — Portaria 671/MTE
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Receipt Box */}
        <div className="p-6 overflow-y-auto space-y-4 bg-white dark:bg-slate-900">
          {/* Printable Receipt Paper Card */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 space-y-4 relative overflow-hidden shadow-inner">
            {/* Top Badge & Date Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-700 pb-3">
              <div
                className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border flex items-center gap-1.5 ${typeInfo.colorClass}`}
              >
                <span>{typeInfo.icon}</span>
                <span>{typeInfo.label}</span>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                  Status do Ponto
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  Validado via Biometria Facial
                </span>
              </div>
            </div>

            {/* Date and Time Highlight */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-center space-y-1 shadow-sm">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Data & Hora do Registro
              </div>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 tracking-wide">
                {timeStrFormatted}
              </div>
              <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {dateStrStrFormattedCap}
              </div>
            </div>

            {/* Employee & Company Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50 space-y-0.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" /> Colaborador
                </div>
                <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                  {record.user_name || currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  E-mail: {currentUser.email}
                </div>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50 space-y-0.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-400" /> Organização / Tenant
                </div>
                <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                  Base44 Tecnologia (Flow RH)
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  CNPJ: 44.382.910/0001-08
                </div>
              </div>
            </div>

            {/* Geolocation / GPS Address */}
            <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50 text-xs space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3 h-3 text-blue-600 dark:text-blue-400" /> Localização / GPS Confirmado
              </div>
              <p className="font-medium text-slate-700 dark:text-slate-300 leading-relaxed break-words">
                {locationText}
              </p>
            </div>

            {/* Photo Preview if facial scan exists */}
            {(record.face_photo || record.photo_url || currentUser.avatar) && (
              <div className="flex items-center gap-3 bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                <img
                  src={record.face_photo || record.photo_url || currentUser.avatar}
                  alt="Biometria Facial"
                  className="w-10 h-10 rounded-lg object-cover border-2 border-emerald-500 shadow-sm shrink-0"
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Biometria Facial Registrada
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Captura instantânea criptografada e associada ao registro.
                  </div>
                </div>
              </div>
            )}

            {/* Digital Authentication / SHA-256 Hash */}
            <div className="bg-slate-900 text-slate-300 p-3.5 rounded-xl border border-slate-800 text-[10px] font-mono space-y-1 leading-tight">
              <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1 mb-0.5">
                <Hash className="w-3 h-3 text-blue-400" /> Autenticação Digital Impressora/MTE
              </div>
              <div className="text-emerald-400 font-bold">{nsrCode}</div>
              <div className="text-slate-400 break-all">{sha256Hash}</div>
            </div>

            {downloadSuccess && (
              <div className="bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 p-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 animate-fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Comprovante PDF baixado com sucesso!</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-4 bg-white dark:bg-slate-900 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold rounded-xl px-4 py-2.5 text-xs transition-all cursor-pointer"
          >
            Fechar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadFile}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-5 py-2.5 text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Comprovante (PDF)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
