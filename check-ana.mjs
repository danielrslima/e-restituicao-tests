import { getDb } from "./server/db.ts";
import { irpfForms } from "./drizzle/schema.ts";
import { like } from "drizzle-orm";

const db = getDb();
const result = await db.select().from(irpfForms).where(like(irpfForms.nomeCliente, '%ANA CARMEN%')).limit(1);
console.log(JSON.stringify(result[0], null, 2));
process.exit(0);
