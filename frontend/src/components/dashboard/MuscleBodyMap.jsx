import React, { useMemo, useState } from 'react';

/** Green (recovered) -> amber -> red (high fatigue). */
const colorFor = (fatigue) => `hsl(${Math.round(142 - Math.min(100, fatigue) * 1.42)}, 75%, ${46 - Math.min(100, fatigue) * 0.06}%)`;
const labelFor = (f) => (f >= 70 ? 'High fatigue' : f >= 35 ? 'Moderate' : 'Recovered');

const Part = ({ muscle, data, onHover, children }) => {
  const d = data[muscle] || { fatigue: 0, sets: 0 };
  return (
    <g
      fill={colorFor(d.fatigue)} stroke="#0f172a" strokeWidth="1.2" className="cursor-pointer transition-opacity hover:opacity-80"
      tabIndex={0} role="img" aria-label={`${muscle}: ${labelFor(d.fatigue)}, ${d.sets} working sets in the last 7 days`}
      onMouseEnter={() => onHover(muscle)} onFocus={() => onHover(muscle)} onMouseLeave={() => onHover(null)} onBlur={() => onHover(null)}
    >
      <title>{`${muscle[0].toUpperCase() + muscle.slice(1)} — ${labelFor(d.fatigue)} (${d.sets} sets / 7d)`}</title>
      {children}
    </g>
  );
};

const Neutral = ({ children }) => <g fill="#1e293b" stroke="#0f172a" strokeWidth="1.2">{children}</g>;

/** Front + back SVG body map coloured by rolling 7-day fatigue per muscle group. */
const MuscleBodyMap = ({ recovery = [] }) => {
  const [hover, setHover] = useState(null);
  const data = useMemo(() => Object.fromEntries(recovery.map((r) => [r.muscle, r])), [recovery]);
  const h = hover && data[hover];

  return (
    <div>
      <div className="flex justify-center gap-6">
        {/* FRONT */}
        <figure className="text-center">
          <svg viewBox="0 0 100 205" className="h-64 w-auto" aria-label="Front body view">
            <Neutral><circle cx="50" cy="14" r="10" /><ellipse cx="16" cy="93" rx="5.5" ry="13" /><ellipse cx="84" cy="93" rx="5.5" ry="13" /></Neutral>
            <Part muscle="shoulders" data={data} onHover={setHover}><ellipse cx="29" cy="42" rx="9" ry="8" /><ellipse cx="71" cy="42" rx="9" ry="8" /></Part>
            <Part muscle="chest" data={data} onHover={setHover}><path d="M37 36 Q50 31 63 36 L62 56 Q50 61 38 56 Z" /></Part>
            <Part muscle="biceps" data={data} onHover={setHover}><ellipse cx="21" cy="66" rx="6" ry="13" /><ellipse cx="79" cy="66" rx="6" ry="13" /></Part>
            <Part muscle="core" data={data} onHover={setHover}><rect x="39" y="59" width="22" height="34" rx="6" /></Part>
            <Part muscle="legs" data={data} onHover={setHover}>
              <ellipse cx="41" cy="136" rx="11" ry="30" /><ellipse cx="59" cy="136" rx="11" ry="30" />
              <ellipse cx="40" cy="184" rx="7" ry="15" /><ellipse cx="60" cy="184" rx="7" ry="15" />
            </Part>
          </svg>
          <figcaption className="text-[10px] uppercase tracking-wider text-slate-500">Front</figcaption>
        </figure>
        {/* BACK */}
        <figure className="text-center">
          <svg viewBox="0 0 100 205" className="h-64 w-auto" aria-label="Back body view">
            <Neutral><circle cx="50" cy="14" r="10" /><ellipse cx="16" cy="93" rx="5.5" ry="13" /><ellipse cx="84" cy="93" rx="5.5" ry="13" /><rect x="39" y="82" width="22" height="12" rx="4" /></Neutral>
            <Part muscle="shoulders" data={data} onHover={setHover}><ellipse cx="29" cy="42" rx="9" ry="8" /><ellipse cx="71" cy="42" rx="9" ry="8" /></Part>
            <Part muscle="back" data={data} onHover={setHover}><path d="M37 36 Q50 31 63 36 L62 80 Q50 85 38 80 Z" /></Part>
            <Part muscle="triceps" data={data} onHover={setHover}><ellipse cx="21" cy="66" rx="6" ry="13" /><ellipse cx="79" cy="66" rx="6" ry="13" /></Part>
            <Part muscle="glutes" data={data} onHover={setHover}><ellipse cx="42" cy="101" rx="11" ry="10" /><ellipse cx="58" cy="101" rx="11" ry="10" /></Part>
            <Part muscle="legs" data={data} onHover={setHover}>
              <ellipse cx="41" cy="140" rx="10" ry="26" /><ellipse cx="59" cy="140" rx="10" ry="26" />
              <ellipse cx="40" cy="184" rx="7" ry="15" /><ellipse cx="60" cy="184" rx="7" ry="15" />
            </Part>
          </svg>
          <figcaption className="text-[10px] uppercase tracking-wider text-slate-500">Back</figcaption>
        </figure>
      </div>

      <p className="mt-2 h-5 text-center text-xs text-slate-400" aria-live="polite">
        {h ? <><span className="font-semibold capitalize text-slate-200">{hover}</span> · {labelFor(h.fatigue)} · {h.sets} sets / 7d</> : 'Hover a muscle for details'}
      </p>
      <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
        <span>Recovered</span>
        <div className="h-2 flex-1 rounded-full" style={{ background: `linear-gradient(90deg, ${colorFor(0)}, ${colorFor(50)}, ${colorFor(100)})` }} />
        <span>Fatigued</span>
      </div>
    </div>
  );
};

export default MuscleBodyMap;
