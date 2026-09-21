import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Payslip } from "../types/payroll";
import { formatCurrencyBRL } from "./payrollCalculations";

/**
 * Remove acentos e caracteres incompatíveis para evitar problemas de encode no jsPDF e nomes de arquivo
 */
function sanitizeText(str?: string): string {
  if (!str) return "";
  return String(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Aplica autoTable no documento de forma segura contra variações de bundling (ESM/CJS)
 */
function safeApplyAutoTable(doc: jsPDF, options: any): number {
  try {
    const fn = typeof autoTable === "function" ? autoTable : (autoTable as any)?.default;
    if (typeof fn === "function") {
      fn(doc, options);
      return (doc as any).lastAutoTable?.finalY || 150;
    }
    if (typeof (doc as any).autoTable === "function") {
      (doc as any).autoTable(options);
      return (doc as any).lastAutoTable?.finalY || 150;
    }
  } catch (err) {
    console.warn("safeApplyAutoTable falhou, desenhando linhas manualmente:", err);
  }

  // Fallback manual caso autoTable não esteja disponível
  let currentY = options.startY || 65;
  const startX = options.margin?.left || 14;
  const tableWidth = doc.internal.pageSize.getWidth() - startX * 2;

  // Header
  doc.setFillColor(240, 244, 248);
  doc.rect(startX, currentY, tableWidth, 7, "F");
  doc.rect(startX, currentY, tableWidth, 7, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("Cod.", startX + 2, currentY + 5);
  doc.text("Descricao", startX + 20, currentY + 5);
  doc.text("Ref.", startX + 95, currentY + 5);
  doc.text("Vencimentos", startX + 120, currentY + 5);
  doc.text("Descontos", startX + 155, currentY + 5);
  currentY += 7;

  // Rows
  const body = options.body || [];
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);

  for (const row of body) {
    doc.rect(startX, currentY, tableWidth, 6, "S");
    if (row[0]) doc.text(String(row[0]), startX + 2, currentY + 4.5);
    if (row[1]) doc.text(String(row[1]).substring(0, 38), startX + 20, currentY + 4.5);
    if (row[2]) doc.text(String(row[2]), startX + 95, currentY + 4.5);
    if (row[3]) doc.text(String(row[3]), startX + 140, currentY + 4.5, { align: "right" });
    if (row[4]) doc.text(String(row[4]), startX + 175, currentY + 4.5, { align: "right" });
    currentY += 6;
  }

  return currentY + 2;
}

/**
 * Gera a instância do documento PDF do holerite oficial
 */
export function generatePayslipPDF(
  payslip: Payslip,
  companyName: string = "FLOW RH TECNOLOGIA S.A.",
  companyCnpj: string = "12.345.678/0001-90"
): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const snap = payslip.employee_snapshot || ({} as any);
  const periodStr = payslip.payroll_period_id
    ? payslip.payroll_period_id.replace("period_", "").replace("_", "/")
    : "08/2026";

  // Dimensões
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  const safeCompanyName = sanitizeText(companyName || "FLOW RH TECNOLOGIA S.A.");
  const safeCompanyCnpj = companyCnpj || "12.345.678/0001-90";
  const empName = sanitizeText(snap.name || "COLABORADOR");
  const empCargo = sanitizeText(snap.cargo || "Analista");
  const empCbo = snap.cbo || "4110-05";
  const empCpf = snap.cpf || "000.000.000-00";
  const empPis = snap.pis || "000.00000.00-0";
  const empDepto = sanitizeText(snap.departamento || "Geral");
  const empAdmissao = snap.admitido_em || "01/01/2023";
  const empBanco = snap.banco || "001";
  const empAgencia = snap.agencia || "0001";
  const empConta = snap.conta || "12345-6";
  const empPix = sanitizeText(snap.chave_pix || empCpf);

  // 1. Cabeçalho da Empresa
  doc.setFillColor(245, 247, 250);
  doc.rect(margin, 10, pageWidth - margin * 2, 22, "F");
  doc.setDrawColor(200, 205, 215);
  doc.rect(margin, 10, pageWidth - margin * 2, 22, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(safeCompanyName.toUpperCase(), margin + 4, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`CNPJ: ${safeCompanyCnpj}`, margin + 4, 21);
  doc.text("Endereco: Av. Paulista, 1000 - Bela Vista - Sao Paulo / SP", margin + 4, 26);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 67, 255);
  doc.text("RECIBO DE PAGAMENTO DE SALARIO", pageWidth - margin - 4, 16, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`Referencia: Competencia ${periodStr}`, pageWidth - margin - 4, 22, { align: "right" });

  // 2. Dados do Colaborador
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, 34, pageWidth - margin * 2, 24, "S");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("CODIGO / ID", margin + 3, 39);
  doc.text("NOME DO FUNCIONARIO", margin + 35, 39);
  doc.text("CBO", margin + 115, 39);
  doc.text("CARGO", margin + 135, 39);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text((payslip.user_id || "EMP001").substring(0, 8).toUpperCase(), margin + 3, 44);
  doc.text(empName.toUpperCase(), margin + 35, 44);
  doc.text(empCbo, margin + 115, 44);
  doc.text(empCargo, margin + 135, 44);

  // Linha 2 do Colaborador
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("CPF", margin + 3, 51);
  doc.text("PIS / PASEP", margin + 40, 51);
  doc.text("DEPARTAMENTO", margin + 80, 51);
  doc.text("ADMISSAO", margin + 135, 51);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(empCpf, margin + 3, 56);
  doc.text(empPis, margin + 40, 56);
  doc.text(empDepto, margin + 80, 56);
  doc.text(empAdmissao, margin + 135, 56);

  // 3. Tabela de Rubricas (Proventos e Descontos)
  const tableData: (string | number)[][] = [];

  const earnings = Array.isArray(payslip.earnings) ? payslip.earnings : [];
  earnings.forEach((e) => {
    tableData.push([
      e.code || "101",
      sanitizeText(e.desc || "Provento"),
      typeof e.ref === "number" ? e.ref.toFixed(1) : (e.ref || "30d"),
      formatCurrencyBRL(e.val || 0),
      ""
    ]);
  });

  const deductions = Array.isArray(payslip.deductions) ? payslip.deductions : [];
  deductions.forEach((d) => {
    tableData.push([
      d.code || "201",
      sanitizeText(d.desc || "Desconto"),
      typeof d.ref === "number" ? d.ref.toFixed(1) : (d.ref || "-"),
      "",
      formatCurrencyBRL(d.val || 0)
    ]);
  });

  // Preencher linhas vazias para manter o padrão estético
  while (tableData.length < 8) {
    tableData.push(["", "", "", "", ""]);
  }

  const finalY = safeApplyAutoTable(doc, {
    startY: 60,
    margin: { left: margin, right: margin },
    head: [["Cod.", "Descricao dos Proventos / Descontos", "Ref.", "Vencimentos", "Descontos"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [240, 244, 248],
      textColor: [15, 23, 42],
      fontStyle: "bold",
      fontSize: 8,
      halign: "center"
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 15 },
      1: { halign: "left" },
      2: { halign: "center", cellWidth: 20 },
      3: { halign: "right", cellWidth: 32 },
      4: { halign: "right", cellWidth: 32 }
    }
  });

  const bruto = payslip.totals?.bruto ?? 0;
  const descontos = payslip.totals?.descontos ?? 0;
  const liquido = payslip.totals?.liquido ?? (bruto - descontos);
  const fgts = payslip.totals?.fgts ?? (bruto * 0.08);
  const baseInss = payslip.totals?.base_inss ?? bruto;
  const baseFgts = payslip.totals?.base_fgts ?? bruto;
  const baseIrrf = payslip.totals?.base_irrf ?? 0;
  const faixaIrrf = payslip.totals?.faixa_irrf || "Isento";

  // 4. Totais (Bruto, Descontos, Líquido)
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, finalY + 2, pageWidth - margin * 2, 16, "F");
  doc.rect(margin, finalY + 2, pageWidth - margin * 2, 16, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("TOTAL DE VENCIMENTOS", margin + 10, finalY + 7);
  doc.text("TOTAL DE DESCONTOS", margin + 65, finalY + 7);
  doc.text("VALOR LIQUIDO A RECEBER", margin + 125, finalY + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrencyBRL(bruto), margin + 10, finalY + 13);
  doc.setTextColor(225, 29, 72);
  doc.text(formatCurrencyBRL(descontos), margin + 65, finalY + 13);

  doc.setFontSize(11);
  doc.setTextColor(0, 67, 255);
  doc.text(formatCurrencyBRL(liquido), margin + 125, finalY + 14);

  // 5. Bases de Cálculo Legais
  const basesY = finalY + 20;
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, basesY, pageWidth - margin * 2, 14, "S");

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("SALARIO BASE", margin + 3, basesY + 5);
  doc.text("SAL. CONTR. INSS", margin + 33, basesY + 5);
  doc.text("BASE CALC. FGTS", margin + 68, basesY + 5);
  doc.text("FGTS DO MES (8%)", margin + 103, basesY + 5);
  doc.text("BASE CALC. IRRF", margin + 138, basesY + 5);
  doc.text("FAIXA IRRF", margin + 168, basesY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrencyBRL(snap.salario_base || bruto), margin + 3, basesY + 10);
  doc.text(formatCurrencyBRL(baseInss), margin + 33, basesY + 10);
  doc.text(formatCurrencyBRL(baseFgts), margin + 68, basesY + 10);
  doc.text(formatCurrencyBRL(fgts), margin + 103, basesY + 10);
  doc.text(formatCurrencyBRL(baseIrrf), margin + 138, basesY + 10);
  doc.text(faixaIrrf, margin + 168, basesY + 10);

  // 6. Dados Bancários
  const infoY = basesY + 16;
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, infoY, pageWidth - margin * 2, 10, "F");
  doc.rect(margin, infoY, pageWidth - margin * 2, 10, "S");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Dados Bancarios: Banco ${empBanco} | Agencia: ${empAgencia} | Conta: ${empConta} | Chave PIX: ${empPix}`,
    margin + 3,
    infoY + 6
  );

  // 7. Canhoto de Assinatura / Protocolo de Entrega
  const receiptY = infoY + 14;
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(margin, receiptY, pageWidth - margin, receiptY);
  doc.setLineDashPattern([], 0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("RECIBO DE ENTREGA E AUTENTICACAO DIGITAL", margin, receiptY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "DECLARO TER RECEBIDO A IMPORTANCIA LIQUIDA DISCRIMINADA NESTE RECIBO DE PAGAMENTO.",
    margin,
    receiptY + 10
  );
  doc.text(
    `Autenticacao Digital: FLOW-${(payslip.id || "HOL").substring(0, 12).toUpperCase()} | Emissao: ${new Date(payslip.generated_at || Date.now()).toLocaleDateString("pt-BR")}`,
    margin,
    receiptY + 14
  );

  // Linhas de Data e Assinatura
  doc.line(margin + 5, receiptY + 28, margin + 45, receiptY + 28);
  doc.text("DATA", margin + 20, receiptY + 32);

  doc.line(pageWidth - margin - 70, receiptY + 28, pageWidth - margin - 5, receiptY + 28);
  doc.text("ASSINATURA DO FUNCIONARIO", pageWidth - margin - 55, receiptY + 32);

  return doc;
}

/**
 * Salva ou baixa o arquivo PDF com estratégias resilientes para navegador e iframe
 */
export function savePdfDocument(doc: jsPDF, filename: string): boolean {
  const cleanFilename = sanitizeText(filename)
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");

  const finalName = cleanFilename.endsWith(".pdf") ? cleanFilename : `${cleanFilename}.pdf`;

  // 1. Tentar doc.save nativo do jsPDF (método oficial)
  try {
    doc.save(finalName);
    return true;
  } catch (err1) {
    console.warn("doc.save falhou, tentando download via Blob âncora:", err1);
  }

  // 2. Tentar Blob URL via createElement('a')
  try {
    const blob = doc.output("blob");
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = finalName;
    link.target = "_blank";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      try {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } catch (e) {
        // Ignora erros de limpeza
      }
    }, 2000);

    return true;
  } catch (err2) {
    console.warn("Blob âncora falhou, tentando Data URI:", err2);
  }

  // 3. Fallback Data URI
  try {
    const dataUri = doc.output("datauristring");
    const fallbackLink = document.createElement("a");
    fallbackLink.href = dataUri;
    fallbackLink.download = finalName;
    fallbackLink.target = "_blank";
    fallbackLink.style.display = "none";
    document.body.appendChild(fallbackLink);
    fallbackLink.click();
    setTimeout(() => {
      try {
        document.body.removeChild(fallbackLink);
      } catch (e) {
        // Ignora
      }
    }, 1000);
    return true;
  } catch (err3) {
    console.error("Data URI falhou, tentando abrir janela com Blob:", err3);
  }

  // 4. Fallback final: Abrir em nova aba/janela para impressão ou salvamento manual
  try {
    const blob = doc.output("blob");
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank");
    return true;
  } catch (err4) {
    console.error("Todas as tentativas de download do PDF falharam:", err4);
    return false;
  }
}

/**
 * Função utilitária completa para gerar e baixar o Holerite
 */
export function downloadPayslipPDF(
  payslip: Payslip,
  companyName: string = "FLOW RH TECNOLOGIA S.A.",
  companyCnpj: string = "12.345.678/0001-90"
): boolean {
  try {
    const doc = generatePayslipPDF(payslip, companyName, companyCnpj);
    const snap = payslip.employee_snapshot || ({} as any);
    const rawName = snap.name || "Colaborador";
    const period = payslip.payroll_period_id ? payslip.payroll_period_id.replace("period_", "") : "2026_08";
    const filename = `Holerite_${rawName}_${period}.pdf`;

    return savePdfDocument(doc, filename);
  } catch (e) {
    console.error("Erro ao processar download do holerite:", e);
    return false;
  }
}

/**
 * Abre o PDF diretamente na janela de impressão do navegador
 */
export function printPayslipPDF(
  payslip: Payslip,
  companyName: string = "FLOW RH TECNOLOGIA S.A.",
  companyCnpj: string = "12.345.678/0001-90"
): void {
  try {
    const doc = generatePayslipPDF(payslip, companyName, companyCnpj);
    const blob = doc.output("blob");
    const blobUrl = URL.createObjectURL(blob);

    const printIframe = document.createElement("iframe");
    printIframe.style.position = "fixed";
    printIframe.style.right = "0";
    printIframe.style.bottom = "0";
    printIframe.style.width = "0";
    printIframe.style.height = "0";
    printIframe.style.border = "0";
    printIframe.src = blobUrl;

    document.body.appendChild(printIframe);

    printIframe.onload = () => {
      setTimeout(() => {
        try {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
        } catch (err) {
          window.open(blobUrl, "_blank");
        }
      }, 500);
    };
  } catch (err) {
    console.error("Erro ao imprimir holerite:", err);
  }
}
