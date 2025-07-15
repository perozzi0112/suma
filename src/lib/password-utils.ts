import bcrypt from 'bcryptjs';

// Factor de costo para bcrypt (10 es un buen balance entre seguridad y rendimiento)
const SALT_ROUNDS = 10;

/**
 * Encripta una contraseña usando bcrypt
 * @param password - Contraseña en texto plano
 * @returns Promise<string> - Contraseña encriptada
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifica si una contraseña coincide con su hash encriptado
 * @param password - Contraseña en texto plano
 * @param hashedPassword - Contraseña encriptada
 * @returns Promise<boolean> - true si coinciden, false si no
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * Verifica si una contraseña ya está encriptada
 * @param password - Contraseña a verificar
 * @returns boolean - true si parece estar encriptada, false si no
 */
export function isPasswordHashed(password: string): boolean {
  // bcrypt genera hashes que empiezan con $2a$, $2b$, $2x$, $2y$ y tienen una longitud específica
  return password.startsWith('$2') && password.length === 60;
} 