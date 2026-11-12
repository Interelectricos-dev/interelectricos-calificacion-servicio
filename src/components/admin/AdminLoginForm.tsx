'use client';

import React, { useState } from 'react';
import { adminAuthService } from '@/modules/auth/auth.service';
import { Lock, ArrowRight, AlertCircle, Shield } from 'lucide-react';
import { ENV } from '@/config/env';

interface AdminLoginFormProps {
  onSuccess: () => void;
}

export function AdminLoginForm({ onSuccess }: AdminLoginFormProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminAuthService.loginWithPin(pin)) {
      setError(false);
      onSuccess();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 flex flex-col items-center">
        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo-interelectricos.png"
          alt={ENV.companyName}
          className="h-10 w-auto object-contain mb-4"
        />

        <div className="w-12 h-12 bg-slate-100 text-slate-800 rounded-2xl flex items-center justify-center mb-3">
          <Shield className="w-6 h-6 text-blue-600" />
        </div>

        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          Panel de Administración
        </h1>
        <p className="text-xs text-slate-500 text-center mt-1 mb-6">
          Ingresa el PIN de seguridad de {ENV.companyName} para acceder a las métricas y gestión de asesores.
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <div>
            <label htmlFor="admin-pin" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              PIN de Acceso
            </label>
            <div className="relative">
              <input
                id="admin-pin"
                type="password"
                inputMode="numeric"
                maxLength={10}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="w-full text-center text-2xl tracking-widest font-mono py-3 px-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#f2e205] focus:border-slate-900 transition"
                autoFocus
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {error && (
              <p className="text-xs text-red-600 mt-2 flex items-center justify-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>PIN incorrecto. Inténtalo de nuevo.</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full mt-3 py-3.5 px-4 rounded-xl bg-[#f2e205] hover:bg-[#dfd003] active:scale-[0.99] text-slate-900 font-bold text-sm tracking-wide transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Ingresar al Panel</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-[11px] text-slate-400 text-center mt-6">
          PIN por defecto en modo desarrollo: <code className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">1234</code>
        </p>
      </div>
    </div>
  );
}

