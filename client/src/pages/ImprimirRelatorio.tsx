import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";

// Função para formatar moeda (valores armazenados em centavos)
const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "R$ 0,00";
  // Dividir por 100 pois os valores estão armazenados em centavos
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
};

interface ResultadoExercicio {
  exercicio: number;
  irpfRestituir: number;
}

export default function ImprimirRelatorio() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const formId = params.id ? parseInt(params.id) : null;

  const { data: formDetails, isLoading } = trpc.irpf.getById.useQuery(
    { id: formId! },
    { enabled: !!formId }
  );

  // Auto-print quando carregar
  useEffect(() => {
    if (formDetails && !isLoading) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [formDetails, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!formDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Registro não encontrado</p>
      </div>
    );
  }

  // Parse resultados por exercício
  let resultadosExercicio: ResultadoExercicio[] = [];
  if (formDetails.resultadosPorExercicio) {
    try {
      resultadosExercicio = JSON.parse(formDetails.resultadosPorExercicio);
    } catch {
      resultadosExercicio = [];
    }
  }

  return (
    <>
      <style>{`
        @page {
          size: A4;
          margin: 10mm 15mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          font-size: 9pt;
          line-height: 1.3;
          color: #333;
          background: white;
        }
        
        .print-container {
          width: 100%;
          max-width: 210mm;
          margin: 0 auto;
          padding: 5mm;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #16a34a;
          padding-bottom: 6px;
          margin-bottom: 10px;
        }
        
        .header-left {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .header-left img {
          height: 40px;
        }
        
        .header-left .subtitle {
          font-size: 10pt;
          color: #666;
        }
        
        .header-right {
          text-align: right;
          font-size: 9pt;
          color: #666;
        }
        
        .section {
          margin-bottom: 8px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .section-title {
          background: #f9fafb;
          padding: 5px 10px;
          font-size: 8pt;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #16a34a;
        }
        
        .section-content {
          padding: 8px 10px;
        }
        
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px 15px;
        }
        
        .field {
          margin-bottom: 4px;
        }
        
        .field-label {
          font-size: 7pt;
          color: #6b7280;
          margin-bottom: 1px;
        }
        
        .field-value {
          font-size: 9pt;
          color: #111827;
          font-weight: 500;
        }
        
        .result-section {
          background: #f0fdf4;
          border: 2px solid #16a34a;
        }
        
        .result-section .section-title {
          background: #dcfce7;
          color: #15803d;
          border-bottom-color: #15803d;
        }
        
        .result-highlight {
          font-size: 12pt;
          font-weight: 700;
          color: #15803d;
        }
        
        .exercicio-section {
          background: #eff6ff;
          border: 2px solid #2563eb;
        }
        
        .exercicio-section .section-title {
          background: #dbeafe;
          color: #1d4ed8;
          border-bottom-color: #1d4ed8;
        }
        
        .exercicio-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 8px;
          background: white;
          border-radius: 3px;
          margin-bottom: 4px;
        }
        
        .exercicio-item:last-child {
          margin-bottom: 0;
        }
        
        .exercicio-positive {
          color: #15803d;
          font-weight: 600;
        }
        
        .exercicio-negative {
          color: #dc2626;
          font-weight: 600;
        }
        
        .footer {
          margin-top: 10px;
          padding-top: 6px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          font-size: 7pt;
          color: #9ca3af;
        }
        
        .no-print {
          position: fixed;
          top: 10px;
          right: 10px;
          z-index: 1000;
        }
        
        @media print {
          .no-print {
            display: none !important;
          }
          
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .print-container {
            padding: 0;
          }
        }
        
        @media screen {
          body {
            background: #f3f4f6;
            padding: 20px;
          }
          
          .print-container {
            background: white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
          }
        }
      `}</style>

      <div className="no-print">
        <button
          onClick={() => window.print()}
          style={{
            padding: "10px 20px",
            background: "#16a34a",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            marginRight: "10px",
          }}
        >
          Imprimir
        </button>
        <button
          onClick={() => setLocation("/historico")}
          style={{
            padding: "10px 20px",
            background: "#6b7280",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Voltar
        </button>
      </div>

      <div className="print-container">
        {/* Cabeçalho */}
        <div className="header">
          <div className="header-left">
            <img src="/logotipo-e-restituicaoIR.png" alt="e-Restituição" />
            <span className="subtitle">Relatório de Cálculo de Restituição</span>
          </div>
          <div className="header-right">
            <div>Data: {new Date().toLocaleDateString("pt-BR")}</div>
            <div>Hora: {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
          </div>
        </div>

        {/* Dados Pessoais */}
        <div className="section">
          <div className="section-title">Dados Pessoais</div>
          <div className="section-content">
            <div className="grid-2">
              <div className="field">
                <div className="field-label">Nome</div>
                <div className="field-value">{formDetails.nomeCliente}</div>
              </div>
              <div className="field">
                <div className="field-label">CPF</div>
                <div className="field-value">{formDetails.cpf}</div>
              </div>
              <div className="field">
                <div className="field-label">Data de Nascimento</div>
                <div className="field-value">{formDetails.dataNascimento || "-"}</div>
              </div>
              <div className="field">
                <div className="field-label">E-mail</div>
                <div className="field-value">{formDetails.email || "-"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Dados Processuais */}
        <div className="section">
          <div className="section-title">Dados Processuais</div>
          <div className="section-content">
            <div className="grid-2">
              <div className="field">
                <div className="field-label">Número do Processo</div>
                <div className="field-value">{formDetails.numeroProcesso}</div>
              </div>
              <div className="field">
                <div className="field-label">Vara</div>
                <div className="field-value">{formDetails.vara || "-"}</div>
              </div>
              <div className="field">
                <div className="field-label">Comarca</div>
                <div className="field-value">{formDetails.comarca || "-"}</div>
              </div>
              <div className="field">
                <div className="field-label">Fonte Pagadora</div>
                <div className="field-value">{formDetails.fontePagadora || "-"}</div>
              </div>
              <div className="field">
                <div className="field-label">CNPJ</div>
                <div className="field-value">{formDetails.cnpj || "-"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Valores */}
        <div className="section">
          <div className="section-title">Valores</div>
          <div className="section-content">
            <div className="grid-2">
              <div className="field">
                <div className="field-label">Bruto Homologado</div>
                <div className="field-value">{formatCurrency(formDetails.brutoHomologado)}</div>
              </div>
              <div className="field">
                <div className="field-label">Tributável Homologado</div>
                <div className="field-value">{formatCurrency(formDetails.tributavelHomologado)}</div>
              </div>
              <div className="field">
                <div className="field-label">Valor do Alvará</div>
                <div className="field-value">{formatCurrency(formDetails.alvaraValor)}</div>
              </div>
              <div className="field">
                <div className="field-label">DARF/IR Retido</div>
                <div className="field-value">{formatCurrency(formDetails.darfValor)}</div>
              </div>
              <div className="field">
                <div className="field-label">Honorários</div>
                <div className="field-value">{formatCurrency(formDetails.honorariosValor)}</div>
              </div>
              <div className="field">
                <div className="field-label">Número de Meses (RRA)</div>
                <div className="field-value">{formDetails.numeroMeses || "-"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Resultado do Cálculo */}
        <div className="section result-section">
          <div className="section-title">Resultado do Cálculo</div>
          <div className="section-content">
            <div className="grid-2">
              <div className="field">
                <div className="field-label">Proporção</div>
                <div className="field-value">{formDetails.proporcao || "-"}</div>
              </div>
              <div className="field">
                <div className="field-label">Base de Cálculo</div>
                <div className="field-value">{formatCurrency(formDetails.baseCalculo)}</div>
              </div>
              <div className="field">
                <div className="field-label">IR Devido</div>
                <div className="field-value">{formatCurrency(formDetails.irDevido)}</div>
              </div>
              <div className="field">
                <div className="field-label">IRPF a Restituir</div>
                <div className="field-value result-highlight">{formatCurrency(formDetails.irpfRestituir)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Resultados por Exercício */}
        {resultadosExercicio.length > 0 && (
          <div className="section exercicio-section">
            <div className="section-title">Resultados por Exercício</div>
            <div className="section-content">
              {resultadosExercicio.map((r) => (
                <div key={r.exercicio} className="exercicio-item">
                  <span>DIRPF {r.exercicio}</span>
                  <span className={r.irpfRestituir >= 0 ? "exercicio-positive" : "exercicio-negative"}>
                    {formatCurrency(r.irpfRestituir)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rodapé */}
        <div className="footer">
          <span>Documento gerado pelo sistema e-Restituição IRPF</span>
          <span>Este documento é meramente informativo e não substitui a declaração oficial</span>
        </div>
      </div>
    </>
  );
}
