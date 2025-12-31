import { getDb } from './server/db.js';
import { irpfForms } from './drizzle/schema.js';
import { like, desc } from 'drizzle-orm';

async function main() {
  const db = await getDb();
  if (!db) {
    console.error('Banco de dados não disponível');
    process.exit(1);
  }
  
  const results = await db.select({
    id: irpfForms.id,
    nome: irpfForms.nomeCliente,
    alvaraValor: irpfForms.alvaraValor,
    alvaraData: irpfForms.alvaraData,
    darfValor: irpfForms.darfValor,
    darfData: irpfForms.darfData,
    honorariosValor: irpfForms.honorariosValor,
    honorariosAno: irpfForms.honorariosAno,
    irpfRestituir: irpfForms.irpfRestituir,
    createdAt: irpfForms.createdAt
  }).from(irpfForms)
    .where(like(irpfForms.nomeCliente, '%SIDINEI%'))
    .orderBy(desc(irpfForms.createdAt))
    .limit(3);
  
  console.log('Resultados encontrados:', results.length);
  for (const r of results) {
    console.log('---');
    console.log('Nome:', r.nome);
    console.log('Alvará:', r.alvaraValor / 100, 'em', r.alvaraData);
    console.log('DARF:', r.darfValor / 100, 'em', r.darfData);
    console.log('Honorários:', r.honorariosValor / 100, 'ano', r.honorariosAno);
    console.log('IRPF a Restituir:', r.irpfRestituir / 100);
    console.log('Criado em:', r.createdAt);
  }
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
