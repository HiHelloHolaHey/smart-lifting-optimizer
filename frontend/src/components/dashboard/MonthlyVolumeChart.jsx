import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/** Monthly (last ~30 days) weekly-volume summary. */
const MonthlyVolumeChart = ({ data = [] }) => {
  const total = data.reduce((a, d) => a + d.volume, 0);
  const sets = data.reduce((a, d) => a + d.sets, 0);

  if (data.length === 0) {
    return <div className="flex h-56 items-center justify-center text-sm text-text-muted">Log a workout to see your monthly volume.</div>;
  }
  return (
    <div>
      <div className="mb-3 flex gap-6 text-sm">
        <div>
          <div className="text-xs text-text-muted">30-day volume</div>
          <div className="text-xl font-medium tabular-nums text-text">{total.toLocaleString()} kg</div>
        </div>
        <div>
          <div className="text-xs text-text-muted">Working sets</div>
          <div className="text-xl font-medium tabular-nums text-text">{sets}</div>
        </div>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="week" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
            <Tooltip
              cursor={{ fill: 'var(--raised)' }}
              contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)' }}
              formatter={(v, n) => [`${v.toLocaleString()}${n === 'volume' ? ' kg' : ''}`, n === 'volume' ? 'Volume' : 'Sets']}
              labelFormatter={(l) => `Week of ${l}`}
            />
            <Bar dataKey="volume" fill="var(--accent)" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MonthlyVolumeChart;
