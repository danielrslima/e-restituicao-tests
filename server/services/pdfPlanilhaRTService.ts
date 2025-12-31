/**
 * Serviço de geração do PDF de Planilha RT (Demonstrativo de Apuração)
 * 
 * Baseado no modelo de referência: 6-PLanilhaRTJoséRamos.pdf
 * Layout: Logo IR360 + tabelas com dados do contribuinte, processo e valores
 */

import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface PlanilhaRTData {
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
  mesRecebimento: string;        // Mês do recebimento (ex: "DEZEMBRO")
  
  // Valores da Causa
  totalRendimentos: number;      // 1 - Total de rendimentos retirado pelo autor (alvarás)
  totalDarf: number;             // 2 - Total de DARF paga
  totalCausa: number;            // 3 - Total da causa (alvarás + DARF)
  
  // Apuração dos Rendimentos
  brutoHomologado: number;       // 4 - Rendimentos bruto homologado/atualizado
  tributaveisHomologado: number; // 5 - Rendimentos tributáveis calculados na mesma data base
  proporcao: number;             // 6 - Proporção de rendimentos tributáveis (0 a 1)
  rendimentosIsentos: number;    // 7 - Total de rendimentos isentos
  rendimentosTributaveis: number;// 8 - Rendimentos sujeitos à tributação normal
  totalDespesas: number;         // 9 - Total de despesas pagas com advogado
  proporcaoDespesas: number;     // 10 - Proporção a deduzir de despesas pagas
  
  // Valores para Declaração
  meses: number;                 // 17 - Meses discutidos na ação
  inssReclamante: number;        // 14 - Contribuição previdência oficial (INSS)
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

function formatCPF(cpf: string): string {
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

export async function generatePlanilhaRTPDF(
  data: PlanilhaRTData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageWidth = 595.28;
      const marginLeft = 40;
      const marginRight = 40;
      const contentWidth = pageWidth - marginLeft - marginRight;

      // ============================================
      // CABEÇALHO COM LOGO IR360
      // ============================================
      
      const logoPath = path.join(__dirname, "../../assets/logo-ir360.png");
      const logoWidth = 150;
      const logoHeight = 60;
      const logoX = (pageWidth - logoWidth) / 2;
      
      try {
        doc.image(logoPath, logoX, 20, {
          width: logoWidth,
          height: logoHeight,
        });
      } catch (err) {
        console.warn("Logo não encontrado, continuando sem logo");
      }

      let currentY = 90;

      // ============================================
      // TÍTULO PRINCIPAL
      // ============================================
      
      const titleHeight = 35;
      const titleCol1Width = contentWidth * 0.7;
      const titleCol2Width = contentWidth * 0.15;
      const titleCol3Width = contentWidth * 0.15;

      // Fundo preto para o título
      doc.fillColor("#000000")
        .rect(marginLeft, currentY, titleCol1Width, titleHeight)
        .fill();
      
      doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold")
        .text(
          "DEMONSTRATIVO DE APURAÇÃO DAS VERBAS TRIBUTÁVEIS",
          marginLeft + 5,
          currentY + 8,
          { width: titleCol1Width - 10 }
        );
      doc.text(
          "REFERENTES À RECLAMAÇÃO TRABALHISTA",
          marginLeft + 5,
          currentY + 18,
          { width: titleCol1Width - 10 }
        );

      // Coluna DIRPF
      doc.fillColor("#e5e7eb")
        .rect(marginLeft + titleCol1Width, currentY, titleCol2Width, titleHeight)
        .fill();
      doc.rect(marginLeft + titleCol1Width, currentY, titleCol2Width, titleHeight).stroke();
      doc.fillColor("#000000").fontSize(9).font("Helvetica-Bold")
        .text("DIRPF", marginLeft + titleCol1Width + 5, currentY + 12, {
          width: titleCol2Width - 10,
          align: "center"
        });

      // Coluna ANO
      doc.fillColor("#e5e7eb")
        .rect(marginLeft + titleCol1Width + titleCol2Width, currentY, titleCol3Width, titleHeight)
        .fill();
      doc.rect(marginLeft + titleCol1Width + titleCol2Width, currentY, titleCol3Width, titleHeight).stroke();
      doc.fillColor("#000000").fontSize(9).font("Helvetica-Bold")
        .text(data.exercicio.toString(), marginLeft + titleCol1Width + titleCol2Width + 5, currentY + 12, {
          width: titleCol3Width - 10,
          align: "center"
        });

      currentY += titleHeight + 10;

      // ============================================
      // DADOS DO CONTRIBUINTE
      // ============================================
      
      const sectionHeaderHeight = 18;
      const rowHeight = 18;
      const col1Width = contentWidth * 0.35;
      const col2Width = contentWidth * 0.65;

      // Cabeçalho da seção
      doc.fillColor("#d1d5db")
        .rect(marginLeft, currentY, contentWidth, sectionHeaderHeight)
        .fill();
      doc.fillColor("#000000").fontSize(8).font("Helvetica-BoldOblique")
        .text("DADOS DO CONTRIBUINTE", marginLeft + 5, currentY + 5, {
          width: contentWidth - 10,
          align: "center"
        });
      currentY += sectionHeaderHeight;

      // Nome do Cliente
      doc.rect(marginLeft, currentY, col1Width, rowHeight).stroke();
      doc.fontSize(8).font("Helvetica-Bold")
        .text("Nome do Cliente:", marginLeft + 5, currentY + 5);
      doc.rect(marginLeft + col1Width, currentY, col2Width, rowHeight).stroke();
      doc.fontSize(8).font("Helvetica")
        .text(data.nomeCliente.toUpperCase(), marginLeft + col1Width + 5, currentY + 5, {
          width: col2Width - 10,
          align: "center"
        });
      currentY += rowHeight;

      // CPF
      doc.rect(marginLeft, currentY, col1Width, rowHeight).stroke();
      doc.fontSize(8).font("Helvetica-Bold")
        .text("CPF:", marginLeft + 5, currentY + 5);
      doc.rect(marginLeft + col1Width, currentY, col2Width, rowHeight).stroke();
      doc.fontSize(8).font("Helvetica")
        .text(formatCPF(data.cpf), marginLeft + col1Width + 5, currentY + 5, {
          width: col2Width - 10,
          align: "center"
        });
      currentY += rowHeight;

      // Data de Nascimento
      doc.rect(marginLeft, currentY, col1Width, rowHeight).stroke();
      doc.fontSize(8).font("Helvetica-Bold")
        .text("Data de Nascimento:", marginLeft + 5, currentY + 5);
      doc.rect(marginLeft + col1Width, currentY, col2Width, rowHeight).stroke();
      doc.fontSize(8).font("Helvetica")
        .text(data.dataNascimento, marginLeft + col1Width + 5, currentY + 5, {
          width: col2Width - 10,
          align: "center"
        });
      currentY += rowHeight + 10;

      // ============================================
      // DADOS DO PROCESSO
      // ============================================
      
      doc.fillColor("#d1d5db")
        .rect(marginLeft, currentY, contentWidth, sectionHeaderHeight)
        .fill();
      doc.fillColor("#000000").fontSize(8).font("Helvetica-BoldOblique")
        .text("DADOS DO PROCESSO", marginLeft + 5, currentY + 5, {
          width: contentWidth - 10,
          align: "center"
        });
      currentY += sectionHeaderHeight;

      // Nº Processo
      doc.rect(marginLeft, currentY, col1Width, rowHeight).stroke();
      doc.fontSize(8).font("Helvetica-Bold")
        .text("Nº Processo", marginLeft + 5, currentY + 5);
      doc.rect(marginLeft + col1Width, currentY, col2Width, rowHeight).stroke();
      doc.fontSize(8).font("Helvetica")
        .text(data.numeroProcesso, marginLeft + col1Width + 5, currentY + 5, {
          width: col2Width - 10,
          align: "center"
        });
      currentY += rowHeight;

      // Comarca
      doc.rect(marginLeft, currentY, col1Width, rowHeight).stroke();
      doc.fontSize(8).font("Helvetica-Bold")
        .text("Comarca:", marginLeft + 5, currentY + 5);
      doc.rect(marginLeft + col1Width, currentY, col2Width, rowHeight).stroke();
      doc.fontSize(8).font("Helvetica")
        .text(data.comarca, marginLeft + col1Width + 5, currentY + 5, {
          width: col2Width - 10,
          align: "center"
        });
      currentY += rowHeight;

      // Vara
      doc.rect(marginLeft, currentY, col1Width, rowHeight).stroke();
      doc.fontSize(8).font("Helvetica-Bold")
        .text("Vara:", marginLeft + 5, currentY + 5);
      doc.rect(marginLeft + col1Width, currentY, col2Width, rowHeight).stroke();
      doc.fontSize(8).font("Helvetica")
        .text(data.vara, marginLeft + col1Width + 5, currentY + 5, {
          width: col2Width - 10,
          align: "center"
        });
      currentY += rowHeight + 10;

      // ============================================
      // VALORES DA CAUSA
      // ============================================
      
      const valueCol1Width = contentWidth * 0.75;
      const valueCol2Width = contentWidth * 0.25;

      // Item 1
      doc.rect(marginLeft, currentY, valueCol1Width, rowHeight).stroke();
      doc.fontSize(8).font("Helvetica")
        .text("1 - TOTAL DE RENDIMENTOS RETIRADO PELO AUTOR:", marginLeft + 5, currentY + 5);
      doc.rect(marginLeft + valueCol1Width, currentY, valueCol2Width, rowHeight).stroke();
      doc.fontSize(8).font("Helvetica")
        .text(formatCurrency(data.totalRendimentos), marginLeft + valueCol1Width + 5, currentY + 5, {
          width: valueCol2Width - 10,
          align: "right"
        });
      currentY += rowHeight;

      // Item 2
      doc.rect(marginLeft, currentY, valueCol1Width, rowHeight).stroke();
      doc.fontSize(8).font("Helvetica")
        .text("2 - TOTAL DE DARF PAGA:", marginLeft + 5, currentY + 5);
      doc.rect(marginLeft + valueCol1Width, currentY, valueCol2Width, rowHeight).stroke();
      doc.fontSize(8).font("Helvetica")
        .text(formatCurrency(data.totalDarf), marginLeft + valueCol1Width + 5, currentY + 5, {
          width: valueCol2Width - 10,
          align: "right"
        });
      currentY += rowHeight;

      // Item 3 (destacado)
      doc.fillColor("#f3f4f6")
        .rect(marginLeft, currentY, valueCol1Width, rowHeight)
        .fill();
      doc.rect(marginLeft, currentY, valueCol1Width, rowHeight).stroke();
      doc.fillColor("#000000").fontSize(8).font("Helvetica-Bold")
        .text("3 - TOTAL DA CAUSA", marginLeft + 5, currentY + 5);
      doc.fillColor("#f3f4f6")
        .rect(marginLeft + valueCol1Width, currentY, valueCol2Width, rowHeight)
        .fill();
      doc.rect(marginLeft + valueCol1Width, currentY, valueCol2Width, rowHeight).stroke();
      doc.fillColor("#000000").fontSize(8).font("Helvetica-Bold")
        .text(formatCurrency(data.totalCausa), marginLeft + valueCol1Width + 5, currentY + 5, {
          width: valueCol2Width - 10,
          align: "right"
        });
      currentY += rowHeight + 10;

      // ============================================
      // APURAÇÃO DOS RENDIMENTOS ISENTOS
      // ============================================
      
      doc.fillColor("#d1d5db")
        .rect(marginLeft, currentY, contentWidth, sectionHeaderHeight)
        .fill();
      doc.fillColor("#000000").fontSize(8).font("Helvetica-BoldOblique")
        .text("APURAÇÃO DOS RENDIMENTOS ISENTOS DE TRIBUTAÇÃO", marginLeft + 5, currentY + 5, {
          width: contentWidth - 10,
          align: "center"
        });
      currentY += sectionHeaderHeight;

      // Itens 4-10
      const apuracaoItems = [
        { num: 4, label: "RENDIMENTOS BRUTO HOMOLOGADO/ATUALIZADO", value: formatCurrency(data.brutoHomologado) },
        { num: 5, label: "RENDIMENTOS TRIBUTÁVEIS CALCULADOS NA MESMA DATA BASE", value: formatCurrency(data.tributaveisHomologado) },
        { num: 6, label: "PROPORÇÃO DE RENDIMENTOS TRIBUTÁVEIS", value: (data.proporcao * 100).toFixed(4) + "%" },
        { num: 7, label: "TOTAL DE RENDIMENTOS ISENTOS", value: formatCurrency(data.rendimentosIsentos) },
        { num: 8, label: "RENDIMENTOS SUJEITOS À TRIBUTAÇÃO NORMAL", value: formatCurrency(data.rendimentosTributaveis) },
        { num: 9, label: "TOTAL DE DESPESAS PAGAS COM ADVOGADO, PERITO E CUSTAS:", value: formatCurrency(data.totalDespesas) },
        { num: 10, label: "PROPORÇÃO A DEDUZIR DE DESPESAS PAGAS", value: formatCurrency(data.proporcaoDespesas) },
      ];

      apuracaoItems.forEach((item, index) => {
        const bgColor = index % 2 === 0 ? "#ffffff" : "#f9fafb";
        doc.fillColor(bgColor)
          .rect(marginLeft, currentY, valueCol1Width, rowHeight)
          .fill();
        doc.rect(marginLeft, currentY, valueCol1Width, rowHeight).stroke();
        doc.fillColor("#000000").fontSize(8).font("Helvetica")
          .text(`${item.num} - ${item.label}`, marginLeft + 5, currentY + 5);
        
        doc.fillColor(bgColor)
          .rect(marginLeft + valueCol1Width, currentY, valueCol2Width, rowHeight)
          .fill();
        doc.rect(marginLeft + valueCol1Width, currentY, valueCol2Width, rowHeight).stroke();
        doc.fillColor("#000000").fontSize(8).font("Helvetica")
          .text(item.value, marginLeft + valueCol1Width + 5, currentY + 5, {
            width: valueCol2Width - 10,
            align: "right"
          });
        currentY += rowHeight;
      });

      currentY += 10;

      // ============================================
      // VALORES ESPERADOS DA DECLARAÇÃO
      // ============================================
      
      doc.fillColor("#d1d5db")
        .rect(marginLeft, currentY, contentWidth, sectionHeaderHeight)
        .fill();
      doc.fillColor("#000000").fontSize(8).font("Helvetica-BoldOblique")
        .text("VALORES ESPERADOS DA DECLARAÇÃO DE AJUSTE ANUAL DO IR", marginLeft + 5, currentY + 5, {
          width: contentWidth - 10,
          align: "center"
        });
      currentY += sectionHeaderHeight;

      // Itens 11-18
      const declaracaoItems = [
        { num: 11, label: "CNPJ:", value: formatCNPJ(data.cnpj) },
        { num: 12, label: "FONTE PAGADORA:", value: data.fontePagadora },
        { num: 13, label: "RENDIMENTOS TRIBUTÁVEIS", value: formatCurrency(data.rendimentosTributaveis) },
        { num: 14, label: "CONTRIBUIÇÃO PREVIDÊNCIA OFICIAL (INSS):", value: data.inssReclamante > 0 ? formatCurrency(data.inssReclamante) : "-" },
        { num: 15, label: "IMPOSTO DE RENDA RETIDO NA FONTE", value: formatCurrency(data.totalDarf) },
        { num: 16, label: "MÊS DO RECEBIMENTO", value: data.mesRecebimento },
        { num: 17, label: "MESES DISCUTIDOS NA AÇÃO", value: data.meses.toFixed(2) },
        { num: 18, label: "RENDIMENTOS ISENTOS E NÃO TRIBUTÁVEIS:", value: formatCurrency(data.rendimentosIsentos) },
      ];

      declaracaoItems.forEach((item, index) => {
        const bgColor = index % 2 === 0 ? "#ffffff" : "#f9fafb";
        doc.fillColor(bgColor)
          .rect(marginLeft, currentY, valueCol1Width, rowHeight)
          .fill();
        doc.rect(marginLeft, currentY, valueCol1Width, rowHeight).stroke();
        doc.fillColor("#000000").fontSize(8).font("Helvetica")
          .text(`${item.num} - ${item.label}`, marginLeft + 5, currentY + 5);
        
        doc.fillColor(bgColor)
          .rect(marginLeft + valueCol1Width, currentY, valueCol2Width, rowHeight)
          .fill();
        doc.rect(marginLeft + valueCol1Width, currentY, valueCol2Width, rowHeight).stroke();
        doc.fillColor("#000000").fontSize(8).font("Helvetica")
          .text(item.value, marginLeft + valueCol1Width + 5, currentY + 5, {
            width: valueCol2Width - 10,
            align: "right"
          });
        currentY += rowHeight;
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
