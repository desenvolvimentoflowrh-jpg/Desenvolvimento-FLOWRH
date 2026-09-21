import React from "react";
import {
  Stethoscope,
  Baby,
  Heart,
  BookOpen,
  UserX,
  FileQuestion,
  Info,
  Calendar
} from "lucide-react";
import { LicenseType } from "../../types/vacation";

interface LicenseTypeSelectorProps {
  selectedType: LicenseType;
  onSelectType: (type: LicenseType) => void;
  disabled?: boolean;
}

interface LicenseMeta {
  type: LicenseType;
  title: string;
  subtitle: string;
  diasSugeridos: number;
  maxLegal: string;
  icon: React.ElementType;
  colorClass: string;
  requiresMedicalDoc: boolean;
  cltRef: string;
}

export const TIPOS_LICENCA: LicenseMeta[] = [
  {
    type: "medica",
    title: "Licença Médica / Atestado",
    subtitle: "Afastamento por motivo de saúde ou consulta médica comprovada",
    diasSugeridos: 1,
    maxLegal: "Conforme atestado (até 15 dias pela empresa, após INSS)",
    icon: Stethoscope,
    colorClass: "text-blue-600 bg-blue-50 border-blue-200",
    requiresMedicalDoc: true,
    cltRef: "Art. 473 e Art. 6º da Lei 605/49"
  },
  {
    type: "maternidade",
    title: "Licença Maternidade",
    subtitle: "Parto, adoção ou guarda judicial com fins de adoção",
    diasSugeridos: 120,
    maxLegal: "120 dias (ou 180 dias se Empresa Cidadã)",
    icon: Baby,
    colorClass: "text-purple-600 bg-purple-50 border-purple-200",
    requiresMedicalDoc: true,
    cltRef: "Art. 392 da CLT e Lei 11.770/2008"
  },
  {
    type: "paternidade",
    title: "Licença Paternidade",
    subtitle: "Nascimento de filho, adoção ou guarda judicial",
    diasSugeridos: 5,
    maxLegal: "5 dias corridos (ou 20 dias Empresa Cidadã)",
    icon: Baby,
    colorClass: "text-indigo-600 bg-indigo-50 border-indigo-200",
    requiresMedicalDoc: true,
    cltRef: "Art. 473, III da CLT e CF/88"
  },
  {
    type: "casamento",
    title: "Licença Gala (Casamento)",
    subtitle: "Casamento civil ou união estável formalizada",
    diasSugeridos: 3,
    maxLegal: "3 dias consecutivos",
    icon: Heart,
    colorClass: "text-rose-600 bg-rose-50 border-rose-200",
    requiresMedicalDoc: false,
    cltRef: "Art. 473, II da CLT"
  },
  {
    type: "luto",
    title: "Licença Nojo (Luto)",
    subtitle: "Falecimento de cônjuge, pais, filhos, irmãos ou dependentes",
    diasSugeridos: 2,
    maxLegal: "2 dias consecutivos",
    icon: UserX,
    colorClass: "text-slate-600 bg-slate-100 border-slate-200",
    requiresMedicalDoc: false,
    cltRef: "Art. 473, I da CLT"
  },
  {
    type: "estudo",
    title: "Licença Estudo / Exame",
    subtitle: "Realização de provas de vestibular ou exame oficial",
    diasSugeridos: 1,
    maxLegal: "Dias de exame comprovados",
    icon: BookOpen,
    colorClass: "text-emerald-600 bg-emerald-50 border-emerald-200",
    requiresMedicalDoc: false,
    cltRef: "Art. 473, VII da CLT"
  },
  {
    type: "nao_remunerada",
    title: "Licença Não Remunerada",
    subtitle: "Interrupção temporária acordada entre empregado e empregador",
    diasSugeridos: 30,
    maxLegal: "A combinar via aditivo contratual",
    icon: Calendar,
    colorClass: "text-amber-600 bg-amber-50 border-amber-200",
    requiresMedicalDoc: false,
    cltRef: "Art. 444 da CLT"
  },
  {
    type: "outras",
    title: "Outras Justificativas Legais",
    subtitle: "Doação de sangue, serviço militar, alistamento eleitoral, tribunal do júri",
    diasSugeridos: 1,
    maxLegal: "Conforme convocação/lei específica",
    icon: FileQuestion,
    colorClass: "text-teal-600 bg-teal-50 border-teal-200",
    requiresMedicalDoc: false,
    cltRef: "Art. 473 da CLT"
  }
];

export const LicenseTypeSelector: React.FC<LicenseTypeSelectorProps> = ({
  selectedType,
  onSelectType,
  disabled = false
}) => {
  const currentMeta = TIPOS_LICENCA.find((t) => t.type === selectedType) || TIPOS_LICENCA[0];

  return (
    <div className="space-y-4">
      <label className="block text-xs font-bold text-slate-700">
        Tipo de Licença / Afastamento Legal
      </label>

      {/* Grid de Seleção Rápida */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {TIPOS_LICENCA.map((item) => {
          const isSelected = selectedType === item.type;
          const Icon = item.icon;

          return (
            <button
              key={item.type}
              type="button"
              disabled={disabled}
              onClick={() => onSelectType(item.type)}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                isSelected
                  ? "border-[#0043FF] bg-blue-50/70 ring-2 ring-[#0043FF]/20"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${item.colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-[#0043FF]"></span>
                )}
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 line-clamp-1">{item.title}</div>
                <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{item.cltRef}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Card Informativo com Regras Legais da Seleção Atual */}
      <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-3 text-xs text-slate-700">
        <Info className="w-4 h-4 text-[#0043FF] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-bold text-slate-900 flex items-center gap-2">
            <span>{currentMeta.title}</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
              {currentMeta.cltRef}
            </span>
          </div>
          <p className="text-[11px] text-slate-600">{currentMeta.subtitle}</p>
          <div className="text-[11px] text-slate-500 font-medium pt-1">
            <strong>Limite Legal CLT:</strong> {currentMeta.maxLegal}
          </div>
        </div>
      </div>
    </div>
  );
};
