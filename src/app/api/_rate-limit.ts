// Rate limiting simple en memoria para Next.js API
// Límite: 10 peticiones por minuto por IP y por usuario

const WINDOW_SIZE = 60 * 1000; // 1 minuto
const MAX_REQUESTS = 10;

// Estructura: { key: [timestamps] }
const requestsMap: Record<string, number[]> = {};

export function rateLimit(key: string): boolean {
  const now = Date.now();
  if (!requestsMap[key]) {
    requestsMap[key] = [];
  }
  // Eliminar timestamps fuera de la ventana
  requestsMap[key] = requestsMap[key].filter(ts => now - ts < WINDOW_SIZE);
  if (requestsMap[key].length >= MAX_REQUESTS) {
    return false; // Excedió el límite
  }
  requestsMap[key].push(now);
  return true;
} 