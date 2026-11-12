'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { Asesor, asesorService } from '@/modules/asesores';
import { adminAuthService } from '@/modules/auth/auth.service';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { ArrowLeft, Printer, Layers, Users, CheckSquare, Square } from 'lucide-react';
import { ENV } from '@/config/env';

type LayoutMode = 'vertical-2' | 'horizontal-2' | 'grid-4';

export default function GeneradorQRPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [asesores, setAsesores] = useState<Asesor[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('vertical-2');
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
    return <div className="min-h-screen bg-slate-950" />;
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
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-8 print:p-0 print:bg-white font-sans">
      {/* Controles y Filtros (Ocultos al imprimir) */}
      <div className="max-w-5xl mx-auto mb-8 print:hidden">
        {/* Barra superior de navegación */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Dashboard</span>
          </Link>

          <button
            onClick={handlePrint}
            disabled={asesoresToPrint.length === 0}
            className={`px-5 py-2.5 text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-xs transition ${
              asesoresToPrint.length === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-[#f2e205] hover:bg-[#e5d604] active:scale-[0.99] text-slate-950 cursor-pointer shadow-sm'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir {asesoresToPrint.length} Ficha{asesoresToPrint.length !== 1 ? 's' : ''}</span>
          </button>
        </div>

        {/* Panel de Configuración de Fichas (Selects de Asesores y Diseño) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs mt-5 flex flex-col md:flex-row gap-5">
          {/* Select 1: Diseño de Impresión */}
          <div className="flex-1 flex flex-col gap-1.5">
            <label htmlFor="select-layout" className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>Diseño de Hoja</span>
            </label>
            <select
              id="select-layout"
              value={layoutMode}
              onChange={(e) => setLayoutMode(e.target.value as LayoutMode)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#f2e205] focus:border-slate-900 cursor-pointer"
            >
              <option value="vertical-2">Hoja Vertical (2 grandes — Recomendado)</option>
              <option value="horizontal-2">Hoja Horizontal (2 lado a lado)</option>
              <option value="grid-4">4 por hoja (2x2 para adhesivos o soportes chicos)</option>
            </select>
            <p className="text-[11px] text-slate-400">
              {layoutMode === 'vertical-2' && 'Formato estándar carta vertical con 2 fichas de 145mm x 145mm centradas.'}
              {layoutMode === 'horizontal-2' && 'Formato apaisado con 2 fichas de 125mm x 125mm colocadas lado a lado.'}
              {layoutMode === 'grid-4' && 'Cuadrícula compacta de 4 fichas pequeñas de 88mm x 88mm por página.'}
            </p>
          </div>

          {/* Selector 2: Filtro y Selección de Asesores */}
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Asesores a Imprimir</span>
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
              >
                {selectedIds.length === asesores.length ? (
                  <>
                    <CheckSquare className="w-3.5 h-3.5 text-slate-900" />
                    <span>Deseleccionar todos</span>
                  </>
                ) : (
                  <>
                    <Square className="w-3.5 h-3.5 text-slate-400" />
                    <span>Seleccionar todos</span>
                  </>
                )}
              </button>
            </div>

            {/* Selector Múltiple / Botones de Asesores */}
            <div className="min-h-[42px] max-h-36 overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-2 flex flex-wrap gap-1.5">
              {asesores.length === 0 ? (
                <span className="text-xs text-slate-400 p-1">No hay asesores registrados.</span>
              ) : (
                asesores.map((a) => {
                  const isChecked = selectedIds.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => handleToggleSelect(a.id)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition cursor-pointer ${
                        isChecked
                          ? 'bg-[#f2e205] border-[#dfd003] text-slate-950 font-bold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isChecked ? 'bg-slate-950' : 'bg-slate-300'}`} />
                      <span>{a.nombre}</span>
                    </button>
                  );
                })
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {selectedIds.length} de {asesores.length} asesores seleccionados para impresión.
            </p>
          </div>
        </div>
      </div>

      {/* ÁREA DE IMPRESIÓN Y VISTA PREVIA */}
      <div className="max-w-5xl mx-auto print:max-w-none">
        {asesoresToPrint.length === 0 ? (
          <div className="text-center py-16 text-slate-400 print:hidden bg-white rounded-3xl border border-slate-200">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">Ningún asesor seleccionado</p>
            <p className="text-xs text-slate-400 mt-1">Selecciona uno o más asesores arriba para generar las fichas.</p>
          </div>
        ) : (
          <div
            className={`grid gap-8 print:gap-4 ${
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

                    {/* 3. Nombre y Cargo al Pie */}
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
