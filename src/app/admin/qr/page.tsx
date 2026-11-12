'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { Asesor, asesorService } from '@/modules/asesores';
import { adminAuthService } from '@/modules/auth/auth.service';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { ArrowLeft, Printer, CheckSquare, Square, Layers } from 'lucide-react';
import { ENV } from '@/config/env';

type LayoutMode = 'vertical-2' | 'horizontal-2' | 'grid-4';

export default function GeneradorQRPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [asesores, setAsesores] = useState<Asesor[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('vertical-2'); // Por defecto vertical 2 por hoja (arriba y abajo)
  const [baseUrl, setBaseUrl] = useState('');
  const [, startTransition] = useTransition();

  useEffect(() => {
    setIsAuthenticated(adminAuthService.isAuthenticated());
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
    if (isAuthenticated) {
      asesorService.getAllAsesores().then((data) => {
        startTransition(() => {
          setAsesores(data);
          // Por defecto seleccionar todos los activos
          setSelectedIds(data.filter((a) => a.activo).map((a) => a.id));
        });
      });
    }
  }, [isAuthenticated]);

  if (isAuthenticated === null) {
    return <div className="min-h-screen bg-slate-900" />;
  }

  if (!isAuthenticated) {
    return <AdminLoginForm onSuccess={() => setIsAuthenticated(true)} />;
  }

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

  const asesoresToPrint = asesores.filter((a) => selectedIds.includes(a.id));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-8 print:p-0 print:bg-white">
      {/* Barra superior de controles (Oculta al imprimir) */}
      <div className="max-w-5xl mx-auto mb-8 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Dashboard</span>
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            {/* Selector de Orientación y Formato */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 text-xs">
              <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                <span>Diseño de hoja:</span>
              </span>

              <button
                type="button"
                onClick={() => setLayoutMode('vertical-2')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  layoutMode === 'vertical-2'
                    ? 'bg-slate-900 text-[#f2e205] shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Hoja Vertical estándar: coloca 2 fichas grandes (una arriba y otra abajo)"
              >
                Hoja Vertical (2 grandes)
              </button>

              <button
                type="button"
                onClick={() => setLayoutMode('horizontal-2')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  layoutMode === 'horizontal-2'
                    ? 'bg-slate-900 text-[#f2e205] shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Hoja Apaisada: coloca 2 fichas lado a lado"
              >
                Hoja Horizontal (2 lado a lado)
              </button>

              <button
                type="button"
                onClick={() => setLayoutMode('grid-4')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  layoutMode === 'grid-4'
                    ? 'bg-slate-900 text-[#f2e205] shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Cuadrícula 2x2 para soportes pequeños o adhesivos"
              >
                4 por hoja (2x2)
              </button>
            </div>

            {/* Botón de Imprimir */}
            <button
              onClick={handlePrint}
              disabled={asesoresToPrint.length === 0}
              className={`px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition ${
                asesoresToPrint.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-[#f2e205] hover:bg-[#dfd003] active:scale-[0.99] text-slate-900 cursor-pointer'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir {asesoresToPrint.length} Ficha{asesoresToPrint.length !== 1 ? 's' : ''}</span>
            </button>
          </div>
        </div>

        {/* Panel de Selección de Asesores */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
            >
              {selectedIds.length === asesores.length ? (
                <CheckSquare className="w-4 h-4 text-slate-900" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>
                {selectedIds.length === asesores.length ? 'Deseleccionar todos' : 'Seleccionar todos los asesores'}
              </span>
            </button>
            <span className="text-xs text-slate-400">
              ({selectedIds.length} de {asesores.length} seleccionados)
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {asesores.map((a) => {
              const isChecked = selectedIds.includes(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => handleToggleSelect(a.id)}
                  className={`text-xs px-3 py-1.5 rounded-xl border font-medium flex items-center gap-1.5 transition cursor-pointer ${
                    isChecked
                      ? 'bg-yellow-50 border-yellow-400 text-slate-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isChecked ? 'bg-[#f2e205]' : 'bg-slate-300'}`} />
                  <span>{a.nombre}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ÁREA DE IMPRESIÓN Y VISTA PREVIA */}
      <div className="max-w-5xl mx-auto print:max-w-none">
        {asesoresToPrint.length === 0 ? (
          <div className="text-center py-12 text-slate-400 print:hidden bg-white rounded-3xl border border-slate-200">
            <p className="text-sm font-semibold">No has seleccionado ningún asesor para imprimir.</p>
            <p className="text-xs text-slate-400 mt-1">Marca las casillas superiores para generar las fichas.</p>
          </div>
        ) : (
          <div
            className={`grid gap-8 print:gap-4 ${
              layoutMode === 'vertical-2'
                ? 'grid-cols-1 md:grid-cols-2 print:grid-cols-1' // En print vertical: 1 columna centrada
                : layoutMode === 'horizontal-2'
                ? 'grid-cols-1 md:grid-cols-2 print:grid-cols-2' // En print horizontal: 2 columnas
                : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4 print:grid-cols-2' // Cuadrícula 2x2
            }`}
          >
            {asesoresToPrint.map((asesor) => {
              const qrUrl = `${baseUrl}/calificar?asesor=${encodeURIComponent(asesor.codigoSlug)}`;

              return (
                <div
                  key={asesor.id}
                  className="w-full flex items-center justify-center print:break-inside-avoid print:page-break-inside-avoid print:py-2"
                >
                  {/* Tarjeta de corte Cuadrada con Borde Punteado */}
                  <div
                    className={`w-full aspect-square bg-white rounded-3xl border-2 border-dashed border-slate-400 print:border-slate-500 p-6 flex flex-col items-center justify-between text-center shadow-xs print:shadow-none print:rounded-2xl transition box-border ${
                      layoutMode === 'vertical-2'
                        ? 'max-w-[340px] print:max-w-[145mm] print:max-h-[145mm] print:my-2'
                        : layoutMode === 'horizontal-2'
                        ? 'max-w-[320px] print:max-w-[125mm] print:max-h-[125mm]'
                        : 'max-w-[250px] print:max-w-[88mm] print:max-h-[88mm] p-4'
                    }`}
                  >
                    {/* 1. Cabecera superior: Logo y Pregunta */}
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

                    {/* 2. Código QR Centrado */}
                    <div className="p-2.5 sm:p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col items-center my-auto">
                      <QRCodeSVG
                        value={qrUrl || 'https://interelectricos.com'}
                        size={layoutMode === 'vertical-2' ? 155 : layoutMode === 'horizontal-2' ? 135 : 105}
                        level="H"
                        includeMargin={false}
                      />
                      <span className="text-[9px] text-slate-400 font-mono mt-1">
                        ID: {asesor.codigoSlug}
                      </span>
                    </div>

                    {/* 3. Nombre y Cargo al Pie con fondo suave y separación */}
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
      </div>
    </div>
  );
}
