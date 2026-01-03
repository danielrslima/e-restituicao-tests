import bcrypt from 'bcryptjs';
import { getDb } from '../db';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Serviço de autenticação com login/senha próprio
 */

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createUserWithPassword(
  email: string,
  password: string,
  name?: string
): Promise<{ id: number; email: string; name?: string }> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Verificar se email já existe
  const existingUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (existingUsers.length > 0) {
    throw new Error('Email já cadastrado');
  }

  // Gerar hash da senha
  const passwordHash = await hashPassword(password);

  // Criar usuário com openId único baseado no email
  const openId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const result = await db.insert(users).values({
    openId,
    email,
    name: name || email.split('@')[0],
    loginMethod: 'password',
    passwordHash,
    role: 'user',
    canEdit: 'no',
  });

  // Obter o ID do usuário criado
  const newUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const newUser = newUsers[0];

  return {
    id: newUser.id,
    email,
    name: name || email.split('@')[0],
  };
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<{ id: number; email: string; name?: string } | null> {
  const db = await getDb();
  if (!db) return null;

  const userResults = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = userResults.length > 0 ? userResults[0] : null;

  if (!user || !user.passwordHash) {
    return null;
  }

  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    return null;
  }

  // Atualizar lastSignedIn
  await db
    .update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, user.id));

  return {
    id: user.id,
    email: user.email || '',
    name: user.name || undefined,
  };
}

export async function updatePassword(
  userId: number,
  newPassword: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const passwordHash = await hashPassword(newPassword);

  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, userId));
}
