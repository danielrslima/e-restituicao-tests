import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

async function main() {
  // Conectar ao banco de dados
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Verificar usuário existente
  const [rows] = await connection.execute(
    "SELECT id, openId, name, email, role, password_hash FROM users WHERE email = 'daniel@ir360.com.br'"
  );
  
  console.log('Usuário encontrado:', rows[0]);
  
  // Gerar hash da senha
  const password = '@Rest#2009';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  
  console.log('Novo hash gerado:', passwordHash);
  
  // Atualizar a senha
  await connection.execute(
    "UPDATE users SET password_hash = ? WHERE email = 'daniel@ir360.com.br'",
    [passwordHash]
  );
  
  console.log('Senha atualizada com sucesso!');
  
  // Verificar atualização
  const [updated] = await connection.execute(
    "SELECT id, email, password_hash FROM users WHERE email = 'daniel@ir360.com.br'"
  );
  
  console.log('Usuário atualizado:', updated[0]);
  
  // Testar verificação
  const isValid = await bcrypt.compare(password, updated[0].password_hash);
  console.log('Verificação da senha:', isValid ? 'VÁLIDA' : 'INVÁLIDA');
  
  await connection.end();
}

main().catch(console.error);
