import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/** Monthly (last ~30 days) weekly-volume summary. */
const MonthlyVolumeChart = ({ data = [] }) => {
  const total = data.reduce((a, d) => a + d.volume, 0);
  const sets = data.reduce((a, d) => a + d.sets, 0);

  if (data.length === 0) {
    return <div className="flex h-56 items-center justify-center text-sm text-slate-500">Log a workout to see your monthly volume.</div>;
  }
  return (
    <div>
      <div className="mb-3 flex gap-6 text-sm">
        <div><div className="text-xs text-slate-500">30-day volume</div><div className="text-xl font-bold text-slate-100">{total.toLocaleString()} kg</div></div>
        <div><div className="text-xs text-slate-500">Working sets</div><div className="text-xl font-bold text-slate-100">{sets}</div></div>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" /><stop offset="100%" stopColor="#6366F1" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis dataKey="week" tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
            <Tooltip cursor={{ fill: 'rgba(99,102,241,0.08)' }} contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: 8, color: '#F1F5F9' }} formatter={(v, n) => [`${v.toLocaleString()}${n === 'volume' ? ' kg' : ''}`, n === 'volume' ? 'Volume' : 'Sets']} labelFormatter={(l) => `Week of ${l}`} />
            <Bar dataKey="volume" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MonthlyVolumeChart;
