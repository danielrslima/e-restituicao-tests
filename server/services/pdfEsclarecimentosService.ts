/**
 * Serviço de geração do PDF de Esclarecimentos
 * 
 * Baseado no modelo de referência: 0-EsclarecimentosJoseRamos.pdf
 * Layout: Logo e-Restituição + título + dados do contribuinte + valores + tabelas
 */

import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface EsclarecimentosData {
  // Dados do Contribuinte
  nomeCliente: string;
  cpf: string;
  dataNascimento: string;
  
  // Dados do Processo
  numeroProcesso: string;
  vara: string;
  comarca: string;
  fontePagadora: string;
  cnpj: string;
  
  // Valores do Exercício
  exercicio: number;
  totalRecebido: number;        // Valor total levantado (alvarás)
  irRetido: number;             // DARF pago
  valorBrutoAcao: number;       // Total da causa (alvarás + DARF)
  rendimentosTributaveis: number; // RT calculado
  proporcao: number;            // Proporção tributável (0 a 1)
  deducoes: number;             // Honorários proporcionais
  rendimentosIsentos: number;   // Rendimentos isentos
  meses: number;                // Número de meses
  inssReclamante: number;       // INSS (geralmente 0)
  
  // Observações opcionais
  observacoes?: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

function formatCPF(cpf: string): string {
  // Remove caracteres não numéricos
  const numbers = cpf.replace(/\D/g, "");
  if (numbers.length === 11) {
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  return cpf;
}

function formatCNPJ(cnpj: string): string {
  const numbers = cnpj.replace(/\D/g, "");
  if (numbers.length === 14) {
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }
  return cnpj;
}

export async function generateEsclarecimentosPDF(
  data: EsclarecimentosData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 60, left: 50, right: 50 },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageWidth = 595.28;
      const marginLeft = 50;
      const marginRight = 50;
      const contentWidth = pageWidth - marginLeft - marginRight;

      // ============================================
      // CABEÇALHO COM LOGO
      // ============================================
      
      const logoPath = path.join(__dirname, "../../assets/logo-e-restituicao.png");
      const logoWidth = 180;
      const logoHeight = 48;
      const logoX = (pageWidth - logoWidth) / 2;
      
      try {
        doc.image(logoPath, logoX, 30, {
          width: logoWidth,
          height: logoHeight,
        });
      } catch (err) {
        console.warn("Logo não encontrado, continuando sem logo");
      }

      // Linha horizontal abaixo do logo
      doc.moveTo(marginLeft, 90).lineTo(pageWidth - marginRight, 90).stroke();

      let currentY = 105;

      // ============================================
      // TÍTULO
      // ============================================
      
      doc.fontSize(10).font("Helvetica-Bold").fillColor("#000000")
        .text(
          "ESCLARECIMENTOS SOBRE OS RENDIMENTOS RECEBIDOS ACUMULADAMENTE AO SETOR DE",
          marginLeft,
          currentY,
          { width: contentWidth, align: "center" }
        );
      
      currentY += 12;
      
      doc.fontSize(10).font("Helvetica-Bold")
        .text(
          "MALHA FISCAL DA RECEITA FEDERAL DO BRASIL",
          marginLeft,
          currentY,
          { width: contentWidth, align: "center" }
        );

      // Linha horizontal após título
      currentY += 18;
      doc.moveTo(marginLeft, currentY).lineTo(pageWidth - marginRight, currentY).stroke();
      currentY += 20;

      // ============================================
      // DADOS DO CONTRIBUINTE
      // ============================================
      
      // CONTRIBUINTE com DIRPF alinhado à direita na mesma linha
      doc.fontSize(9).font("Helvetica-Bold")
        .text(`CONTRIBUINTE: ${data.nomeCliente.toUpperCase()}`, marginLeft, currentY);
      
      doc.fontSize(9).font("Helvetica-Bold")
        .text(
          `DIRPF ${data.exercicio}`,
          pageWidth - marginRight - 80,
          currentY,
          { width: 80, align: "right" }
        );
      currentY += 14;

      doc.fontSize(9).font("Helvetica-Bold")
        .text(`CPF: ${formatCPF(data.cpf)}`, marginLeft, currentY);
      currentY += 14;

      doc.fontSize(9).font("Helvetica-Bold")
        .text(`DATA DE NASCIMENTO: ${data.dataNascimento}`, marginLeft, currentY);
      currentY += 20;

      // ============================================
      // A) DADOS DA AÇÃO
      // ============================================
      
      doc.fontSize(9).font("Helvetica-Bold")
        .text("A) DADOS DA AÇÃO:", marginLeft, currentY);
      currentY += 16;

      doc.fontSize(9).font("Helvetica")
        .text(
          `Os valores declarados se referem a rendimento recebido de forma acumulada, referente a Ação Judicial Trabalhista, processo n.º ${data.numeroProcesso} que tramitou perante a ${data.vara} de ${data.comarca}.`,
          marginLeft,
          currentY,
          { width: contentWidth, align: "justify", lineGap: 2 }
        );
      currentY += 35;

      // ============================================
      // B) VALORES E DATAS
      // ============================================
      
      doc.fontSize(9).font("Helvetica-Bold")
        .text("B) VALORES E DATAS:", marginLeft, currentY);
      currentY += 16;

      // Item 2
      doc.fontSize(9).font("Helvetica")
        .text(
          `2) O valor total levantado pelo(a) contribuinte, referente ao exercício foi de `,
          marginLeft,
          currentY,
          { continued: true, width: contentWidth }
        );
      doc.font("Helvetica-Bold").text(`${formatCurrency(data.totalRecebido)};`, { continued: false });
      currentY += 20;

      // Item 3
      doc.fontSize(9).font("Helvetica")
        .text(
          `3) O imposto de renda no valor total de `,
          marginLeft,
          currentY,
          { continued: true, width: contentWidth }
        );
      doc.font("Helvetica-Bold").text(`${formatCurrency(data.irRetido)}, `, { continued: true });
      doc.font("Helvetica").text(
        `foi retido pela Reclamada ${data.fontePagadora} - CNPJ n.º ${formatCNPJ(data.cnpj)}, conforme documento(s) anexo(s);`,
        { continued: false }
      );
      currentY += 30;

      // Item 4
      doc.fontSize(9).font("Helvetica")
        .text(
          `4) O valor bruto da ação corresponde a soma entre o(s) alvará(s)/mandado(s) de levantamento e o imposto de renda retido, o que equivale, neste caso, ao valor de `,
          marginLeft,
          currentY,
          { continued: true, width: contentWidth, align: "justify" }
        );
      doc.font("Helvetica-Bold").text(`${formatCurrency(data.valorBrutoAcao)} `, { continued: true });
      doc.font("Helvetica").text(`(Item 3, da planilha);`, { continued: false });
      currentY += 35;

      // Item 5
      doc.fontSize(9).font("Helvetica")
        .text(
          `5) O valor atualizado apurado de `,
          marginLeft,
          currentY,
          { continued: true, width: contentWidth, align: "justify" }
        );
      doc.font("Helvetica-Bold").text(`${formatCurrency(data.rendimentosTributaveis)} `, { continued: true });
      doc.font("Helvetica").text(
        `(Item 8, da planilha), referente ao(s) Rendimento(s) Tributável(is), equivale(m) a ${(data.proporcao * 100).toFixed(4)}% do valor bruto da ação (Item 3), conforme apurado em planilha anexa;`,
        { continued: false }
      );
      currentY += 40;

      // Item 6
      doc.fontSize(9).font("Helvetica")
        .text(
          `6) O valor total apurado de despesas dedutíveis¹ com a ação judicial, sobre a mesma proporção dos rendimentos tributáveis, nos exatos termos da Lei, foi de `,
          marginLeft,
          currentY,
          { continued: true, width: contentWidth, align: "justify" }
        );
      doc.font("Helvetica-Bold").text(`${formatCurrency(data.deducoes)}.`, { continued: false });
      currentY += 35;

      // ============================================
      // TABELA: CAMPOS E VALORES DECLARADOS NA FICHA DE RRA*
      // ============================================
      
      doc.fontSize(9).font("Helvetica-Bold").fillColor("#000000")
        .text(
          "CAMPOS E VALORES DECLARADOS NA FICHA DE RRA* DA DIRPF,",
          marginLeft,
          currentY,
          { width: contentWidth, align: "center" }
        );
      currentY += 12;
      
      doc.fontSize(9).font("Helvetica-Bold").fillColor("#000000")
        .text(
          "NA OPÇÃO DE TRIBUTAÇÃO EXCLUSIVA NA FONTE",
          marginLeft,
          currentY,
          { width: contentWidth, align: "center" }
        );
      currentY += 18;

      // Tabela RRA
      const rowHeight = 20;
      const col1Width = contentWidth * 0.75;
      const col2Width = contentWidth * 0.25;

      // Linha A
      doc.rect(marginLeft, currentY, col1Width, rowHeight).stroke();
      doc.fontSize(8).font("Helvetica")
        .text("A) RENDIMENTOS TRIBUTÁVEIS RECEBIDOS:", marginLeft + 5, currentY + 6);
      
      doc.rect(marginLeft + col1Width, currentY, col2Width, rowHeight).stroke();
      doc.fontSize(8).font("Helvetica-Bold")
        .text(formatCurrency(data.rendimentosTributaveis), marginLeft + col1Width + 5, currentY + 6, {
          width: col2Width - 10,
          align: "right"
        });
      currentY += rowHeight;

      // Linha B
      doc.rect(marginLeft, currentY, col1Width, rowHeight).stroke();
      doc.fontSize(8).font("Helvetica")
        .text("B) INSS RECLAMANTE:", marginLeft + 5, currentY + 6);
      
      doc.rect(marginLeft + col1Width, currentY, col2Width, rowHeight).stroke();
      doc.fontSize(8).font("Helvetica-Bold")
        .text(formatCurrency(data.inssReclamante), marginLeft + col1Width + 5, currentY + 6, {
          width: col2Width - 10,
          align: "right"
        });
      currentY += rowHeight;

      // Linha C
      doc.rect(marginLeft, currentY, col1Width, rowHeight).stroke();
      doc.fontSize(8).font("Helvetica")
        .text("C) IMPOSTO DE RENDA RETIDO NA FONTE:", marginLeft + 5, currentY + 6);
      
      doc.rect(marginLeft + col1Width, currentY, col2Width, rowHeight).stroke();
      doc.fontSize(8).font("Helvetica-Bold")
        .text(formatCurrency(data.irRetido), marginLeft + col1Width + 5, currentY + 6, {
          width: col2Width - 10,
          align: "right"
        });
      currentY += rowHeight;

      // Linha D
      doc.rect(marginLeft, currentY, col1Width, rowHeight).stroke();
      doc.fontSize(8).font("Helvetica")
        .text("D) Nº DE MESES DISCUTIDOS NA AÇÃO:", marginLeft + 5, currentY + 6);
      
      doc.rect(marginLeft + col1Width, currentY, col2Width, rowHeight).stroke();
      doc.fontSize(8).font("Helvetica-Bold")
        .text(data.meses.toFixed(2), marginLeft + col1Width + 5, currentY + 6, {
          width: col2Width - 10,
          align: "right"
        });
      currentY += rowHeight + 15;

      // ============================================
      // TABELA: FICHA DE RENDIMENTOS ISENTOS
      // ============================================
      
      doc.fontSize(9).font("Helvetica-Bold").fillColor("#000000")
        .text(
          "FICHA DE RENDIMENTOS ISENTOS",
          marginLeft,
          currentY,
          { width: contentWidth, align: "center" }
        );
      currentY += 15;

      // Linha única
      doc.rect(marginLeft, currentY, col1Width, rowHeight).stroke();
      doc.fontSize(8).font("Helvetica")
        .text("RENDIMENTOS ISENTOS:", marginLeft + 5, currentY + 6);
      
      doc.rect(marginLeft + col1Width, currentY, col2Width, rowHeight).stroke();
      doc.fontSize(8).font("Helvetica-Bold")
        .text(formatCurrency(data.rendimentosIsentos), marginLeft + col1Width + 5, currentY + 6, {
          width: col2Width - 10,
          align: "right"
        });
      currentY += rowHeight + 20;

      // ============================================
      // OBSERVAÇÕES
      // ============================================
      
      doc.fontSize(9).font("Helvetica-Bold")
        .text("Obs.:", marginLeft, currentY);
      currentY += 14;

      doc.fontSize(8).font("Helvetica")
        .text(
          "a) Os honorários pagos, foram lançados na ficha de pagamentos, em item próprio;",
          marginLeft,
          currentY,
          { width: contentWidth }
        );
      currentY += 14;

      doc.fontSize(8).font("Helvetica")
        .text(
          `b) O valor referente ao rendimento isento foi lançado na ficha de rendimentos isentos e não tributáveis, no item "OUTROS", com a denominação de "Verbas Isentas Ação Judicial", com os mesmos dados da Fonte Pagadora.`,
          marginLeft,
          currentY,
          { width: contentWidth, align: "justify" }
        );
      currentY += 25;

      // Linha horizontal
      doc.moveTo(marginLeft, currentY).lineTo(pageWidth - marginRight, currentY).stroke();
      currentY += 5;

      // Referência legal
      doc.fontSize(7).font("Helvetica")
        .text("1 Art. 12.A, §2º da Lei 7.713/88", marginLeft, currentY);

      // ============================================
      // RODAPÉ COM LOGO IR360
      // ============================================
      
      const logoIR360Path = path.join(__dirname, "../../assets/logo-ir360.png");
      try {
        const logoIR360Width = 80;
        const logoIR360X = (pageWidth - logoIR360Width) / 2;
        doc.image(logoIR360Path, logoIR360X, doc.page.height - 80, {
          width: logoIR360Width,
        });
      } catch (err) {
        // Logo não encontrado, continuar sem
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
