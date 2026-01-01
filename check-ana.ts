import { getDb } from './server/db';
import { irpfForms } from './drizzle/schema';
import { like } from 'drizzle-orm';

async function main() {
  const db = await getDb();
  if (!db) {
    console.log('Banco não disponível');
    return;
  }
  
  const rows = await db.select({
    id: irpfForms.id,
    nomeCliente: irpfForms.nomeCliente,
    irpfRestituir: irpfForms.irpfRestituir,
    resultadosPorExercicio: irpfForms.resultadosPorExercicio
  }).from(irpfForms).where(like(irpfForms.nomeCliente, '%ANA CARMEN COLLODETTI%')).limit(1);
  
  if (rows.length > 0) {
    const row = rows[0];
    console.log('=== REGISTRO ANA CARMEN ===');
    console.log('ID:', row.id);
    console.log('Nome:', row.nomeCliente);
    console.log('IRPF Restituir (centavos):', row.irpfRestituir);
    console.log('IRPF Restituir (reais):', (Number(row.irpfRestituir) / 100).toFixed(2));
    console.log('');
    console.log('=== RESULTADOS POR EXERCÍCIO (JSON) ===');
    if (row.resultadosPorExercicio) {
      const dados = JSON.parse(row.resultadosPorExercicio);
      console.log(JSON.stringify(dados, null, 2));
    } else {
      console.log('Campo vazio');
    }
  }
  
  process.exit(0);
}

main();
