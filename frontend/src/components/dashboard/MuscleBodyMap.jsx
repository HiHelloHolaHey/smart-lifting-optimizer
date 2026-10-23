import React, { useMemo, useState } from 'react';

/**
 * Muted status colors per premium-color-theme-guide.md:
 * Recovered (--success #7FA68A) -> Moderate (--warning #C4A26B) -> High fatigue (--danger #B87A7A).
 * Pair status colors with a dot + label.
 */
const colorFor = (fatigue) => {
  const f = Math.min(100, Math.max(0, Number(fatigue) || 0));
  if (f < 35) return 'var(--success)';
  if (f < 70) return 'var(--warning)';
  return 'var(--danger)';
};

const dotClassFor = (f) => (f >= 70 ? 'bg-danger' : f >= 35 ? 'bg-warning' : 'bg-success');
const labelFor = (f) => (f >= 70 ? 'High fatigue' : f >= 35 ? 'Moderate' : 'Recovered');

const Part = ({ muscle, data, onHover, children }) => {
  const d = data[muscle] || { fatigue: 0, sets: 0 };
  return (
    <g
      fill={colorFor(d.fatigue)}
      stroke="var(--bg)"
      strokeWidth="1.2"
      className="cursor-pointer transition-opacity hover:opacity-80"
      tabIndex={0}
      role="img"
      aria-label={`${muscle}: ${labelFor(d.fatigue)}, ${d.sets} working sets in the last 7 days`}
      onMouseEnter={() => onHover(muscle)}
      onFocus={() => onHover(muscle)}
      onMouseLeave={() => onHover(null)}
      onBlur={() => onHover(null)}
    >
      <title>{`${muscle[0].toUpperCase() + muscle.slice(1)} — ${labelFor(d.fatigue)} (${d.sets} sets / 7d)`}</title>
      {children}
    </g>
  );
};

/** Parts we don't track (head, hands, neck, lower back) are shown as permanently "recovered". */
const Neutral = ({ children }) => (
  <g fill={colorFor(0)} stroke="var(--bg)" strokeWidth="1.2" aria-hidden="true">
    {children}
  </g>
);

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
            <Neutral>
              <circle cx="50" cy="14" r="10" />
              <ellipse cx="16" cy="93" rx="5.5" ry="13" />
              <ellipse cx="84" cy="93" rx="5.5" ry="13" />
            </Neutral>
            <Part muscle="shoulders" data={data} onHover={setHover}>
              <ellipse cx="29" cy="42" rx="9" ry="8" />
              <ellipse cx="71" cy="42" rx="9" ry="8" />
            </Part>
            <Part muscle="chest" data={data} onHover={setHover}>
              <path d="M37 36 Q50 31 63 36 L62 56 Q50 61 38 56 Z" />
            </Part>
            <Part muscle="biceps" data={data} onHover={setHover}>
              <ellipse cx="21" cy="66" rx="6" ry="13" />
              <ellipse cx="79" cy="66" rx="6" ry="13" />
            </Part>
            <Part muscle="core" data={data} onHover={setHover}>
              <rect x="39" y="59" width="22" height="34" rx="6" />
            </Part>
            <Part muscle="legs" data={data} onHover={setHover}>
              <ellipse cx="41" cy="136" rx="11" ry="30" />
              <ellipse cx="59" cy="136" rx="11" ry="30" />
              <ellipse cx="40" cy="184" rx="7" ry="15" />
              <ellipse cx="60" cy="184" rx="7" ry="15" />
            </Part>
          </svg>
          <figcaption className="text-[10px] uppercase tracking-wider text-text-muted">Front</figcaption>
        </figure>
        {/* BACK */}
        <figure className="text-center">
          <svg viewBox="0 0 100 205" className="h-64 w-auto" aria-label="Back body view">
            <Neutral>
              <circle cx="50" cy="14" r="10" />
              <ellipse cx="16" cy="93" rx="5.5" ry="13" />
              <ellipse cx="84" cy="93" rx="5.5" ry="13" />
              <rect x="39" y="82" width="22" height="12" rx="4" />
            </Neutral>
            <Part muscle="shoulders" data={data} onHover={setHover}>
              <ellipse cx="29" cy="42" rx="9" ry="8" />
              <ellipse cx="71" cy="42" rx="9" ry="8" />
            </Part>
            <Part muscle="back" data={data} onHover={setHover}>
              <path d="M37 36 Q50 31 63 36 L62 80 Q50 85 38 80 Z" />
            </Part>
            <Part muscle="triceps" data={data} onHover={setHover}>
              <ellipse cx="21" cy="66" rx="6" ry="13" />
              <ellipse cx="79" cy="66" rx="6" ry="13" />
            </Part>
            <Part muscle="glutes" data={data} onHover={setHover}>
              <ellipse cx="42" cy="101" rx="11" ry="10" />
              <ellipse cx="58" cy="101" rx="11" ry="10" />
            </Part>
            <Part muscle="legs" data={data} onHover={setHover}>
              <ellipse cx="41" cy="140" rx="10" ry="26" />
              <ellipse cx="59" cy="140" rx="10" ry="26" />
              <ellipse cx="40" cy="184" rx="7" ry="15" />
              <ellipse cx="60" cy="184" rx="7" ry="15" />
            </Part>
          </svg>
          <figcaption className="text-[10px] uppercase tracking-wider text-text-muted">Back</figcaption>
        </figure>
      </div>

      <p className="mt-2 flex h-5 items-center justify-center gap-1.5 text-center text-xs text-text-muted" aria-live="polite">
        {h ? (
          <>
            <span className={`inline-block h-2 w-2 rounded-full ${dotClassFor(h.fatigue)}`} aria-hidden />
            <span className="font-medium capitalize text-text">{hover}</span> · {labelFor(h.fatigue)} · {h.sets} sets / 7d
          </>
        ) : (
          'Hover a muscle for details'
        )}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2 border-t border-border pt-3 text-[10px] text-text-muted">
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
          Recovered
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden />
          Moderate
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-danger" aria-hidden />
          Fatigued
        </span>
      </div>
    </div>
  );
};

export default MuscleBodyMap;
