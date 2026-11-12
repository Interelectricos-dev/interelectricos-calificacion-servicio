'use client';

import React, { useState } from 'react';
import { adminAuthService } from '@/modules/auth/auth.service';
import { Lock, ArrowRight, AlertCircle } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Sutil resplandor con el amarillo corporativo #F2E205 en el fondo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#f2e205]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-xl border border-slate-100/80 flex flex-col items-center relative z-10">
        {/* Identidad Corporativa */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo-interelectricos.png"
          alt={ENV.companyName}
          className="h-9 w-auto object-contain mb-6"
        />

        <div className="w-full text-center mb-6">
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Panel Administrativo
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestión y Métricas de Atención
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div>
            <div className="relative">
              <input
                id="admin-pin"
                type="password"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (error) setError(false);
                }}
                placeholder="PIN de acceso"
                className={`w-full text-center text-lg tracking-widest font-mono py-3 px-10 rounded-xl border transition focus:outline-none ${
                  error
                    ? 'border-red-400 bg-red-50/40 text-red-900 focus:ring-2 focus:ring-red-400'
                    : 'border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#f2e205] focus:border-slate-900'
                }`}
                autoFocus
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {error && (
              <p className="text-xs text-red-600 mt-2 flex items-center justify-center gap-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>PIN incorrecto. Inténtalo de nuevo.</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-[#f2e205] hover:bg-[#e5d604] active:scale-[0.99] text-slate-900 font-bold text-sm tracking-wide transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Ingresar</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Pie discreto corporativo */}
      <p className="text-[11px] text-slate-500 text-center mt-6">
        © {new Date().getFullYear()} {ENV.companyName} · Acceso Autorizado
      </p>
    </div>
  );
}

