import { useEffect, useState } from 'react';
import { getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface AuditLog {
  id: string;
  userId: string;
  email?: string;
  role?: string;
  ip?: string;
  action: string;
  details?: unknown;
  result: 'success' | 'error';
  message?: string;
  timestamp: string;
}

export function AuditLogTable() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const db = getFirestore();
        const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(100));
        // Filtros básicos (solo en frontend, para simplicidad)
        const snapshot = await getDocs(q);
        let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AuditLog[];
        if (userFilter) data = data.filter(l => l.userId.includes(userFilter) || (l.email && l.email.includes(userFilter)));
        if (actionFilter) data = data.filter(l => l.action.includes(actionFilter));
        if (resultFilter) data = data.filter(l => l.result === resultFilter);
        setLogs(data);
      } catch {
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [userFilter, actionFilter, resultFilter]);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Historial de Auditoría</CardTitle>
        <div className="flex flex-wrap gap-2 mt-2">
          <Input placeholder="Filtrar por usuario/email" value={userFilter} onChange={e => setUserFilter(e.target.value)} className="w-48" />
          <Input placeholder="Filtrar por acción" value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="w-40" />
          <select value={resultFilter} onChange={e => setResultFilter(e.target.value)} className="border rounded px-2 py-1">
            <option value="">Todos</option>
            <option value="success">Éxito</option>
            <option value="error">Error</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Cargando logs...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8">No hay registros de auditoría.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs md:text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="px-2 py-1">Fecha/Hora</th>
                  <th className="px-2 py-1">Usuario</th>
                  <th className="px-2 py-1">Email</th>
                  <th className="px-2 py-1">Rol</th>
                  <th className="px-2 py-1">IP</th>
                  <th className="px-2 py-1">Acción</th>
                  <th className="px-2 py-1">Resultado</th>
                  <th className="px-2 py-1">Mensaje</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className={log.result === 'error' ? 'bg-red-50' : ''}>
                    <td className="px-2 py-1 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="px-2 py-1">{log.userId}</td>
                    <td className="px-2 py-1">{log.email}</td>
                    <td className="px-2 py-1">{log.role}</td>
                    <td className="px-2 py-1">{log.ip}</td>
                    <td className="px-2 py-1">{log.action}</td>
                    <td className="px-2 py-1 font-bold" style={{ color: log.result === 'error' ? '#dc2626' : '#16a34a' }}>{log.result}</td>
                    <td className="px-2 py-1 max-w-xs truncate" title={log.message}>{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 