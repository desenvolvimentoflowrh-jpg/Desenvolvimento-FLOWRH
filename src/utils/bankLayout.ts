import { Payslip } from "../types/payroll";

export interface BankLayoutConfig {
  bankCode: string; // 001, 237, 341, 104, 033
  bankName: string;
  companyName: string;
  companyCnpj: string;
  companyAgency: string;
  companyAccount: string;
  paymentDate: string; // YYYYMMDD ou YYYY-MM-DD
  layout: "240" | "400";
}

export const SUPPORTED_BANKS = [
  { code: "001", name: "Banco do Brasil S.A.", layout: "240" },
  { code: "237", name: "Banco Bradesco S.A.", layout: "240" },
  { code: "341", name: "Itaú Unibanco S.A.", layout: "240" },
  { code: "104", name: "Caixa Econômica Federal", layout: "240" },
  { code: "033", name: "Banco Santander (Brasil) S.A.", layout: "240" }
];

/**
 * Preenche string com espaços à direita ou zeros à esquerda
 */
function padRight(str: string | undefined | null, length: number, char: string = " "): string {
  const s = String(str || "");
  if (s.length >= length) return s.substring(0, length);
  return s + char.repeat(length - s.length);
}

function padLeft(str: string | number | undefined | null, length: number, char: string = "0"): string {
  const s = String(str ?? "");
  if (s.length >= length) return s.substring(0, length);
  return char.repeat(length - s.length) + s;
}

/**
 * Remove caracteres não numéricos
 */
function cleanNumbers(val: string | undefined | null): string {
  return String(val || "").replace(/\D/g, "");
}

/**
 * Gera arquivo CNAB 240 padrão Febraban para pagamento de salários (Segmento A)
 */
export function generateCNAB240(payslips: Payslip[], config: BankLayoutConfig): string {
  const lines: string[] = [];
  const cnpjClean = cleanNumbers(config.companyCnpj);
  const agencyClean = cleanNumbers(config.companyAgency);
  const accountClean = cleanNumbers(config.companyAccount);
  const bankCode = padLeft(cleanNumbers(config.bankCode) || "001", 3);
  const payDate = cleanNumbers(config.paymentDate).replace(/-/g, "") || "20260830";
  const now = new Date();
  const generationDate = `${now.getFullYear()}${padLeft(now.getMonth() + 1, 2)}${padLeft(now.getDate(), 2)}`;
  const generationTime = `${padLeft(now.getHours(), 2)}${padLeft(now.getMinutes(), 2)}${padLeft(now.getSeconds(), 2)}`;

  // 1. Header de Arquivo (Registro 0) - 240 posições
  let headerArquivo = "";
  headerArquivo += bankCode; // 001 a 003: Código do Banco
  headerArquivo += "0000"; // 004 a 007: Lote de serviço
  headerArquivo += "0"; // 008: Tipo de registro (0 = Header de arquivo)
  headerArquivo += padRight("", 9); // 009 a 017: Uso FEBRABAN
  headerArquivo += "2"; // 018: Tipo inscrição (2 = CNPJ)
  headerArquivo += padLeft(cnpjClean, 14); // 019 a 032: CNPJ da empresa
  headerArquivo += padRight("", 20); // 033 a 052: Convênio no banco
  headerArquivo += padLeft(agencyClean, 5); // 053 a 057: Agência Mantenedora
  headerArquivo += " "; // 058: Dígito da agência
  headerArquivo += padLeft(accountClean, 12); // 059 a 070: Número da conta
  headerArquivo += "0"; // 071: Dígito da conta
  headerArquivo += " "; // 072: Dígito agência/conta
  headerArquivo += padRight(config.companyName.toUpperCase(), 30); // 073 a 102: Nome da empresa
  headerArquivo += padRight(config.bankName.toUpperCase(), 30); // 103 a 132: Nome do Banco
  headerArquivo += padRight("", 10); // 133 a 142: Uso FEBRABAN
  headerArquivo += "1"; // 143: Código Remessa (1)
  headerArquivo += generationDate; // 144 a 151: Data de geração DDMMAAAA/AAAAMMDD
  headerArquivo += generationTime; // 152 a 157: Hora de geração
  headerArquivo += "000001"; // 158 a 163: Sequencial do arquivo
  headerArquivo += "087"; // 164 a 166: Versão do layout
  headerArquivo += "01600"; // 167 a 171: Densidade de gravação
  headerArquivo += padRight("", 69); // 172 a 240: Reservado do banco
  lines.push(headerArquivo);

  // 2. Header de Lote (Registro 1) - Pagamento de Salários
  let headerLote = "";
  headerLote += bankCode; // 001 a 003
  headerLote += "0001"; // 004 a 007: Lote de serviço
  headerLote += "1"; // 008: Tipo de registro (1 = Header de lote)
  headerLote += "C"; // 009: Tipo de operação (C = Crédito)
  headerLote += "30"; // 010 a 011: Tipo de serviço (30 = Pagamento de Salários)
  headerLote += "01"; // 012 a 013: Forma de lançamento (01 = Crédito em Conta Corrente)
  headerLote += "045"; // 014 a 016: Versão layout do lote
  headerLote += " "; // 017: Reservado
  headerLote += "2"; // 018: Tipo inscrição (2 = CNPJ)
  headerLote += padLeft(cnpjClean, 14); // 019 a 032: CNPJ
  headerLote += padRight("", 20); // 033 a 052: Convênio
  headerLote += padLeft(agencyClean, 5); // 053 a 057: Agência
  headerLote += " "; // 058
  headerLote += padLeft(accountClean, 12); // 059 a 070: Conta
  headerLote += "0 "; // 071 a 072
  headerLote += padRight(config.companyName.toUpperCase(), 30); // 073 a 102
  headerLote += padRight("FOLHA DE PAGAMENTO", 40); // 103 a 142: Informação de mensagem
  headerLote += padRight("RUA EMPRESARIAL, 1000", 30); // 143 a 172: Logradouro
  headerLote += "01000"; // 173 a 177: Número
  headerLote += padRight("ANDAR 10", 15); // 178 a 192: Complemento
  headerLote += padRight("SAO PAULO", 20); // 193 a 212: Cidade
  headerLote += "01000000"; // 213 a 220: CEP
  headerLote += "SP"; // 221 a 222: Estado
  headerLote += padRight("", 18); // 223 a 240
  lines.push(headerLote);

  // 3. Registros Detalhe (Segmento A)
  let totalLiquidoCentavos = 0;
  let sequencialRegistro = 1;

  payslips.forEach((p) => {
    const snap = p.employee_snapshot;
    const cpfClean = cleanNumbers(snap.cpf);
    const empAgency = cleanNumbers(snap.agencia) || "0001";
    const empAccount = cleanNumbers(snap.conta) || "123456";
    const valorCentavos = Math.round(p.totals.liquido * 100);
    totalLiquidoCentavos += valorCentavos;

    let segA = "";
    segA += bankCode; // 001 a 003
    segA += "0001"; // 004 a 007: Lote
    segA += "3"; // 008: Tipo de registro (3 = Detalhe)
    segA += padLeft(sequencialRegistro, 5); // 009 a 013: Número sequencial do registro no lote
    segA += "A"; // 014: Código do segmento (A)
    segA += "0"; // 015: Tipo de movimento (0 = Inclusão)
    segA += "00"; // 016 a 017: Código de instrução
    segA += padLeft(cleanNumbers(snap.banco) || bankCode, 3); // 018 a 020: Código do banco do favorecido
    segA += padLeft(empAgency, 5); // 021 a 025: Agência do favorecido
    segA += " "; // 026: Dígito agência
    segA += padLeft(empAccount, 12); // 027 a 038: Conta do favorecido
    segA += "0"; // 039: Dígito conta
    segA += " "; // 040
    segA += padRight(snap.name.toUpperCase(), 30); // 041 a 070: Nome do colaborador
    segA += padRight(p.id.substring(0, 20), 20); // 071 a 090: Identificador no sistema
    segA += payDate; // 091 a 098: Data do pagamento
    segA += "BRL"; // 099 a 101: Moeda
    segA += padLeft(0, 15); // 102 a 116: Quantidade da moeda
    segA += padLeft(valorCentavos, 15); // 117 a 131: Valor do pagamento em centavos
    segA += padRight(p.id.substring(0, 20), 20); // 132 a 151: Nosso número
    segA += payDate; // 152 a 159: Data real efetivação
    segA += padLeft(valorCentavos, 15); // 160 a 174: Valor real
    segA += padRight("", 40); // 175 a 214: Outras informações
    segA += padRight("", 2); // 215 a 216: Tipo finalidade
    segA += "0"; // 217: Finalidade DOC/TED
    segA += padRight("", 10); // 218 a 227: Reservado
    segA += "0"; // 228: Aviso ao favorecido
    segA += padRight("", 10); // 229 a 238: Ocorrências
    segA += padRight("", 2); // 239 a 240
    lines.push(segA);
    sequencialRegistro++;
  });

  // 4. Trailer de Lote (Registro 5)
  let trailerLote = "";
  trailerLote += bankCode;
  trailerLote += "0001";
  trailerLote += "5"; // Registro 5
  trailerLote += padRight("", 9);
  trailerLote += padLeft(payslips.length + 2, 6); // Quantidade de registros do lote (header + detalhes + trailer)
  trailerLote += padLeft(totalLiquidoCentavos, 18); // Somatório dos valores em centavos
  trailerLote += padLeft(0, 18); // Quantidade de moedas
  trailerLote += padLeft(0, 6);
  trailerLote += padRight("", 165);
  lines.push(trailerLote);

  // 5. Trailer de Arquivo (Registro 9)
  let trailerArquivo = "";
  trailerArquivo += bankCode;
  trailerArquivo += "9999";
  trailerArquivo += "9"; // Registro 9
  trailerArquivo += padRight("", 9);
  trailerArquivo += "000001"; // Quantidade de lotes do arquivo
  trailerArquivo += padLeft(lines.length + 1, 6); // Quantidade de registros no arquivo total
  trailerArquivo += padLeft(0, 6); // Quantidade de contas para conciliação
  trailerArquivo += padRight("", 205);
  lines.push(trailerArquivo);

  return lines.join("\r\n");
}

/**
 * Gera arquivo tabular CSV com layout de exportação bancária e gerencial
 */
export function generateBankPaymentCSV(payslips: Payslip[], config: BankLayoutConfig): string {
  const headers = [
    "Matricula/ID",
    "Colaborador",
    "CPF",
    "PIS",
    "Cargo",
    "Departamento",
    "Banco",
    "Agencia",
    "Conta",
    "Chave PIX",
    "Salario Bruto",
    "INSS",
    "IRRF",
    "FGTS",
    "Outros Descontos",
    "Valor Liquido a Pagar (R$)",
    "Data Prevista Pagamento",
    "Status Holerite"
  ];

  const rows = payslips.map((p) => {
    const snap = p.employee_snapshot;
    return [
      `"${p.user_id}"`,
      `"${snap.name}"`,
      `"${snap.cpf}"`,
      `"${snap.pis}"`,
      `"${snap.cargo}"`,
      `"${snap.departamento}"`,
      `"${snap.banco || config.bankName}"`,
      `"${snap.agencia || config.companyAgency}"`,
      `"${snap.conta || config.companyAccount}"`,
      `"${snap.chave_pix || snap.cpf}"`,
      p.totals.bruto.toFixed(2),
      p.totals.inss.toFixed(2),
      p.totals.irrf.toFixed(2),
      p.totals.fgts.toFixed(2),
      p.totals.descontos.toFixed(2),
      p.totals.liquido.toFixed(2),
      `"${config.paymentDate || new Date().toISOString().substring(0, 10)}"`,
      `"${p.status}"`
    ].join(";");
  });

  return [headers.join(";"), ...rows].join("\r\n");
}
