import React from 'react';
import { RankingAsesor } from '@/modules/metricas/services/analitica.service';
import { Trophy, Zap, Award, Medal } from 'lucide-react';

interface AdvisorLeaderboardProps {
  ranking: RankingAsesor[];
}

function getInitials(name?: string | null): string {
  if (!name) return 'AS';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AdvisorLeaderboard({ ranking }: AdvisorLeaderboardProps) {
  const getBadgeIcon = (pos: number) => {
    switch (pos) {
      case 1:
        return <Trophy className="w-4 h-4 text-amber-500 fill-[#f2e205]" />;
      case 2:
        return <Medal className="w-4 h-4 text-slate-400" />;
      case 3:
        return <Award className="w-4 h-4 text-amber-700" />;
      default:
        return <span className="text-xs font-bold text-slate-400">#{pos}</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden font-sans">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Ranking de Desempeño de Asesores
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Clasificación ordenada por promedio de satisfacción y volumen de atenciones.
          </p>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
          {ranking.length} Asesores con votos
        </span>
      </div>

      {ranking.length === 0 ? (
        <div className="py-12 text-center text-slate-400 px-4">
          <Trophy className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-bold text-slate-700">No hay atenciones en este periodo</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Ajusta los filtros temporales para visualizar el ranking histórico.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-5 text-center w-14">Lugar</th>
                <th className="py-3 px-5">Asesor</th>
                <th className="py-3 px-5 text-center">Promedio</th>
                <th className="py-3 px-5 text-center">CSAT</th>
                <th className="py-3 px-5 text-center">Atenciones</th>
                <th className="py-3 px-5 text-center">Con Comentarios</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ranking.map((item) => (
                <tr
                  key={item.asesor.id}
                  className={`hover:bg-slate-50/70 transition ${
                    item.posicion === 1 ? 'bg-amber-50/30' : ''
                  }`}
                >
                  {/* Posición / Medalla */}
                  <td className="py-3.5 px-5 text-center">
                    <div className="flex items-center justify-center">
                      {getBadgeIcon(item.posicion)}
                    </div>
                  </td>

                  {/* Asesor */}
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs tracking-wide shrink-0 ${
                          item.posicion === 1
                            ? 'bg-slate-950 text-[#f2e205] ring-2 ring-yellow-400/50'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {getInitials(item.asesor.nombre)}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-sm text-slate-900 block truncate">
                          {item.asesor.nombre}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate block">
                          {item.asesor.cargo || 'Asesor Comercial'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Promedio */}
                  <td className="py-3.5 px-5 text-center">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/60 font-bold text-slate-900">
                      <Zap className="w-3.5 h-3.5 fill-[#f2e205] text-slate-900" />
                      <span>{item.promedio.toFixed(1)}</span>
                    </div>
                  </td>

                  {/* CSAT */}
                  <td className="py-3.5 px-5 text-center">
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {item.csat}%
                    </span>
                  </td>

                  {/* Atenciones */}
                  <td className="py-3.5 px-5 text-center font-bold text-slate-800">
                    {item.totalVotos}
                  </td>

                  {/* Con Comentarios */}
                  <td className="py-3.5 px-5 text-center text-slate-500 font-medium">
                    {item.conComentarios} ({Math.round((item.conComentarios / item.totalVotos) * 100)}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

