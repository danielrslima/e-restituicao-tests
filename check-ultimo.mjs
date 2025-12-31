import { getDb } from './server/db.js';
import { irpfForms } from './drizzle/schema.js';
import { desc } from 'drizzle-orm';

async function main() {
  const db = await getDb();
  if (!db) {
    console.error('Banco de dados não disponível');
    process.exit(1);
  }
  
  const results = await db.select().from(irpfForms)
    .orderBy(desc(irpfForms.createdAt))
    .limit(1);
  
  if (results.length === 0) {
    console.log('Nenhum registro encontrado');
    process.exit(0);
  }
  
  const r = results[0];
  console.log('=== ÚLTIMO REGISTRO ===');
  console.log('ID:', r.id);
  console.log('Nome:', r.nomeCliente);
  console.log('CPF:', r.cpf);
  console.log('Data Nascimento:', r.dataNascimento);
  console.log('Email:', r.email);
  console.log('Telefone:', r.telefone);
  console.log('');
  console.log('=== DADOS PROCESSUAIS ===');
  console.log('Número Processo:', r.numeroProcesso);
  console.log('Vara:', r.vara);
  console.log('Comarca:', r.comarca);
  console.log('Fonte Pagadora:', r.fontePagadora);
  console.log('CNPJ:', r.cnpj);
  console.log('');
  console.log('=== VALORES DE ENTRADA ===');
  console.log('Bruto Homologado:', r.brutoHomologado / 100);
  console.log('Tributável Homologado:', r.tributavelHomologado / 100);
  console.log('Número de Meses:', r.numeroMeses);
  console.log('');
  console.log('=== ALVARÁS/DARFS/HONORÁRIOS ===');
  console.log('Alvará Valor:', r.alvaraValor / 100);
  console.log('Alvará Data:', r.alvaraData);
  console.log('DARF Valor:', r.darfValor / 100);
  console.log('DARF Data:', r.darfData);
  console.log('Honorários Valor:', r.honorariosValor / 100);
  console.log('Honorários Ano:', r.honorariosAno);
  console.log('');
  console.log('=== VALORES CALCULADOS ===');
  console.log('Proporção:', r.proporcao);
  console.log('Rend. Trib. Alvará:', r.rendimentosTributavelAlvara / 100);
  console.log('Rend. Trib. Honorários:', r.rendimentosTributavelHonorarios / 100);
  console.log('Base de Cálculo:', r.baseCalculo / 100);
  console.log('RRA:', r.rra);
  console.log('IR Mensal:', r.irMensal);
  console.log('IR Devido:', r.irDevido / 100);
  console.log('IRPF a Restituir:', r.irpfRestituir / 100);
  console.log('');
  console.log('Criado em:', r.createdAt);
  
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
