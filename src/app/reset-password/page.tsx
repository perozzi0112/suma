"use client";
import { Suspense } from "react";
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ResetPasswordPageWrapper() {
  return (
    <Suspense fallback={<div className='p-8 text-center'>Cargando...</div>}>
      <ResetPasswordPage />
    </Suspense>
  );
}

function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [valid, setValid] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    async function validateToken() {
      if (!token || !email) {
        setError('Enlace inválido.');
        return;
      }
      setLoading(true);
      const res = await fetch('/api/validate-password-reset-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email }),
      });
      const data = await res.json();
      setLoading(false);
      if (data.valid) setValid(true);
      else setError(data.error || 'Enlace inválido o expirado.');
    }
    validateToken();
  }, [token, email]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      setSuccess(true);
      setTimeout(() => router.push('/auth/login'), 2000);
    } else {
      setError(data.error || 'Error al restablecer la contraseña.');
    }
  }

  if (loading) return <div className="p-8 text-center">Cargando...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (success) return <div className="p-8 text-center text-green-600">¡Contraseña restablecida! Redirigiendo...</div>;

  if (!valid) return null;

  return (
    <div className="max-w-md mx-auto mt-16 p-8 border rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Restablecer contraseña</h1>
      <form onSubmit={handleSubmit}>
        <label className="block mb-2">Nueva contraseña</label>
        <input
          type="password"
          className="w-full mb-4 p-2 border rounded"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <label className="block mb-2">Confirmar contraseña</label>
        <input
          type="password"
          className="w-full mb-4 p-2 border rounded"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          Restablecer contraseña
        </button>
      </form>
    </div>
  );
} 