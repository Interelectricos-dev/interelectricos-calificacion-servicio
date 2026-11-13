'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ENV } from '@/config/env';
import {
  BarChart3,
  Users,
  MessageSquare,
  QrCode,
  LogOut,
} from 'lucide-react';

interface AdminHeaderProps {
  onLogout: () => void;
  isDbLive: boolean;
  totalAsesores?: number;
  totalCalificaciones?: number;
}

export function AdminHeader({
  onLogout,
  isDbLive,
  totalAsesores,
  totalCalificaciones,
}: AdminHeaderProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Métricas',
      href: '/',
      icon: BarChart3,
      isActive: pathname === '/',
    },
    {
      label: 'Asesores',
      href: '/asesores',
      icon: Users,
      isActive: pathname === '/asesores',
      count: totalAsesores,
    },
    {
      label: 'Buzón',
      href: '/buzon',
      icon: MessageSquare,
      isActive: pathname === '/buzon',
      count: totalCalificaciones,
    },
    {
      label: 'Fichas QR',
      href: '/qr',
      icon: QrCode,
      isActive: pathname === '/qr' || pathname === '/admin/qr',
    },
  ];

  return (
    <header className="bg-slate-950 text-white sticky top-0 z-30 shadow-md border-b border-slate-800 print:hidden font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Logo e Identidad Corporativa INTERELECTRICOS (1080x204 HD sin fondo blanco) */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <Link href="/" className="flex items-center transition hover:opacity-90">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo-interelectricos.png"
                alt={ENV.companyName}
                className="h-8 sm:h-9 w-auto max-w-[210px] sm:max-w-[240px] object-contain"
              />
            </Link>
            <div className="hidden md:block h-6 w-px bg-slate-800" />
            <div className="hidden md:flex flex-col">
              <span className="text-xs font-bold tracking-tight text-white leading-none">
                Gestión de Calidad
              </span>
              <span className="text-[10px] text-slate-400 font-medium leading-tight mt-1">
                Atención en Mostrador
              </span>
            </div>
          </div>

          {/* Menú de 4 Rutas Independientes (Métricas, Asesores, Buzón, Fichas QR) */}
          <nav className="hidden sm:flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-2 rounded-lg text-xs font-black transition flex items-center gap-2 ${
                    item.isActive
                      ? 'bg-[#f2e205] text-slate-950 shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        item.isActive
                          ? 'bg-slate-950/15 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Estado Supabase y Logout */}
          <div className="flex items-center gap-3">
            <div
              className="hidden lg:flex items-center gap-2 text-xs text-slate-400 font-medium"
              title={isDbLive ? 'Supabase conectado' : 'Modo demostración'}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isDbLive
                    ? 'bg-emerald-400 shadow-xs shadow-emerald-400/50'
                    : 'bg-amber-400'
                }`}
              />
              <span>Supabase</span>
            </div>

            <button
              onClick={onLogout}
              className="p-2 sm:px-3 sm:py-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>

        {/* Menú Móvil Inferior con las 4 rutas */}
        <div className="flex sm:hidden items-center justify-around py-2 border-t border-slate-850 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                  item.isActive
                    ? 'bg-[#f2e205] text-slate-950 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}

