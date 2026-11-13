'use client';

import React, { useEffect, useState, useTransition, useMemo, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Asesor, asesorService } from '@/modules/asesores';
import { adminAuthService } from '@/modules/auth/auth.service';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { isSupabaseConfigured, ENV } from '@/config/env';
import {
  Printer,
  Layers,
  Users,
  ChevronDown,
  CheckSquare,
  Square,
} from 'lucide-react';

type LayoutMode = 'vertical-2' | 'horizontal-2' | 'grid-4';

export default function QrCenterPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [asesores, setAsesores] = useState<Asesor[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('vertical-2');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();

  const isDbLive = isSupabaseConfigured();

  useEffect(() => {
    setIsAuthenticated(adminAuthService.isAuthenticated());
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      asesorService.getAllAsesores().then((data) => {
        startTransition(() => {
          setAsesores(data);
          setSelectedIds(data.filter((a) => a.activo).map((a) => a.id));
        });
      });
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    adminAuthService.logout();
    setIsAuthenticated(false);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === asesores.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(asesores.map((a) => a.id));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const asesoresToPrint = useMemo(() => {
    return asesores.filter((a) => selectedIds.includes(a.id));
  }, [asesores, selectedIds]);

  if (isAuthenticated === null) return <div className="min-h-screen bg-slate-950" />;
  if (!isAuthenticated) return <AdminLoginForm onSuccess={() => setIsAuthenticated(true)} />;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      <AdminHeader
        onLogout={handleLogout}
        isDbLive={isDbLive}
        totalAsesores={asesores.length}
      />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex-1 print:p-0 print:m-0 print:max-w-none">
        {/* Cabecera y Botón de Impresión */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 print:hidden">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Centro de Fichas QR para Mostrador
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Genera e imprime el material oficial listo para recortar y colocar en los mostradores.
            </p>
          </div>

          <button
            onClick={handlePrint}
            disabled={asesoresToPrint.length === 0}
            className={`px-5 py-2.5 text-xs font-black rounded-xl flex items-center justify-center gap-2 transition shadow-xs cursor-pointer shrink-0 ${
              asesoresToPrint.length === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-[#f2e205] hover:bg-[#e5d604] active:scale-95 text-slate-950'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir {asesoresToPrint.length} Ficha{asesoresToPrint.length !== 1 ? 's' : ''}</span>
          </button>
        </div>

        {/* Barra de Configuración de Formato y Asesores */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs mb-6 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center print:hidden">
          {/* Formato de Hoja */}
          <div className="flex-1 flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Formato de Hoja</span>
            </span>
            <div className="relative">
              <select
                value={layoutMode}
                onChange={(e) => setLayoutMode(e.target.value as LayoutMode)}
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f2e205] focus:border-slate-900 transition appearance-none cursor-pointer pr-9"
              >
                <option value="vertical-2">1 Ficha por Hoja (Grande centrada)</option>
                <option value="horizontal-2">2 Fichas por Hoja (Horizontal lado a lado)</option>
                <option value="grid-4">4 Fichas por Hoja (2x2 para adhesivos)</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Menú Desplegable Asesores */}
          <div className="flex-1 flex flex-col relative" ref={dropdownRef}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Asesores ({selectedIds.length} seleccionados)</span>
            </span>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 flex items-center justify-between transition cursor-pointer text-left"
            >
              <span className="truncate">
                {selectedIds.length === 0
                  ? 'Ningún asesor seleccionado'
                  : selectedIds.length === asesores.length
                  ? 'Todos los asesores seleccionados'
                  : `${selectedIds.length} de ${asesores.length} seleccionados`}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 flex flex-col gap-1 max-h-64 overflow-y-auto animate-fadeIn">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-100 flex items-center gap-2 transition cursor-pointer border-b border-slate-100"
                >
                  {selectedIds.length === asesores.length ? (
                    <CheckSquare className="w-4 h-4 text-slate-900 fill-[#f2e205]" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>Seleccionar Todos ({asesores.length})</span>
                </button>

                {asesores.map((asesor) => {
                  const isSelected = selectedIds.includes(asesor.id);
                  return (
                    <button
                      key={asesor.id}
                      type="button"
                      onClick={() => handleToggleSelect(asesor.id)}
                      className={`w-full px-3 py-1.5 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                        isSelected ? 'bg-amber-50/70 text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-slate-950' : 'bg-slate-300'}`} />
                        <span className="truncate">{asesor.nombre}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        /{asesor.codigoSlug}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Fichas Cuadradas Listas para Impresión */}
        {asesoresToPrint.length === 0 ? (
          <div className="text-center py-16 text-slate-400 bg-white rounded-3xl border border-slate-200 print:hidden">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">Ningún asesor seleccionado</p>
            <p className="text-xs text-slate-400 mt-1">Selecciona uno o más asesores arriba para generar las fichas.</p>
          </div>
        ) : (
          <div
            className={`grid gap-6 print:gap-4 ${
              layoutMode === 'vertical-2'
                ? 'grid-cols-1 md:grid-cols-2 print:grid-cols-1'
                : layoutMode === 'horizontal-2'
                ? 'grid-cols-1 md:grid-cols-2 print:grid-cols-2'
                : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4 print:grid-cols-2'
            }`}
          >
            {asesoresToPrint.map((asesor) => {
              const qrUrl = `${baseUrl}/calificar?asesor=${encodeURIComponent(asesor.codigoSlug)}`;

              return (
                <div
                  key={asesor.id}
                  className="w-full flex items-center justify-center print:break-inside-avoid print:page-break-inside-avoid print:py-4"
                >
                  <div
                    className={`w-full aspect-square bg-white rounded-3xl border-2 border-dashed border-slate-400 print:border-slate-500 p-5 sm:p-6 flex flex-col items-center justify-center gap-3 sm:gap-3.5 text-center shadow-xs print:shadow-none print:rounded-2xl transition box-border ${
                      layoutMode === 'vertical-2'
                        ? 'max-w-[340px] print:max-w-[145mm] print:max-h-[145mm] print:my-4'
                        : layoutMode === 'horizontal-2'
                        ? 'max-w-[320px] print:max-w-[125mm] print:max-h-[125mm]'
                        : 'max-w-[250px] print:max-w-[88mm] print:max-h-[88mm] p-4 gap-2'
                    }`}
                  >
                    {/* Cabecera */}
                    <div className="flex flex-col items-center w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/logo-interelectricos.png"
                        alt={ENV.companyName}
                        className={`object-contain ${layoutMode === 'grid-4' ? 'h-6 mb-1' : 'h-8 sm:h-9 mb-1.5'}`}
                      />
                      <h3 className={`font-black text-slate-900 tracking-tight leading-tight ${layoutMode === 'grid-4' ? 'text-xs' : 'text-sm sm:text-base'}`}>
                        ¿Cómo fue tu atención hoy?
                      </h3>
                      <p className={`text-slate-500 font-medium ${layoutMode === 'grid-4' ? 'text-[9px]' : 'text-[11px] sm:text-xs mt-0.5'}`}>
                        Escanea con tu celular y califica
                      </p>
                    </div>

                    {/* QR Vectorial Centrado */}
                    <div className="p-2 sm:p-2.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col items-center">
                      <QRCodeSVG
                        value={qrUrl || 'https://interelectricos.com'}
                        size={layoutMode === 'vertical-2' ? 165 : layoutMode === 'horizontal-2' ? 145 : 110}
                        level="H"
                        includeMargin={false}
                      />
                      <span className="text-[9px] text-slate-400 font-mono mt-1">
                        ID: {asesor.codigoSlug}
                      </span>
                    </div>

                    {/* Asesor */}
                    <div className="w-full bg-slate-50 rounded-2xl py-2 px-3 border border-slate-100 text-center">
                      <p className={`font-black text-slate-900 tracking-tight leading-tight ${layoutMode === 'grid-4' ? 'text-xs' : 'text-sm sm:text-base'}`}>
                        {asesor.nombre}
                      </p>
                      <p className={`font-semibold text-slate-500 ${layoutMode === 'grid-4' ? 'text-[10px]' : 'text-[11px] mt-0.5'}`}>
                        {asesor.cargo || 'Asesor Comercial'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

