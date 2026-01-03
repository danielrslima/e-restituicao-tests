import Database from 'better-sqlite3';

const db = new Database('./data/local.db');

// Verificar usuário admin
const user = db.prepare("SELECT * FROM users WHERE email = 'daniel@ir360.com.br'").get();
console.log('Usuário encontrado:', user);

db.close();
