import React, { useMemo, useState } from 'react';
import { Search, Plus } from 'lucide-react';

/** Searchable exercise list with muscle-group filter. Used for "Add exercise" and manual swap. */
const ExercisePicker = ({ catalog, excludeIds = [], initialGroup = 'all', onPick, actionLabel }) => {
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState(initialGroup);

  const groups = useMemo(() => ['all', ...new Set(catalog.map((c) => c.muscle_group))], [catalog]);
  const list = useMemo(() => {
    const ex = new Set(excludeIds);
    return catalog.filter((c) => !ex.has(c.id) && (group === 'all' || c.muscle_group === group) && c.name.toLowerCase().includes(search.toLowerCase()));
  }, [catalog, excludeIds, group, search]);

  return (
    <div>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input className="input-field !pl-9" placeholder="Search exercises…" aria-label="Search exercises" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {groups.map((g) => (
          <button key={g} type="button" onClick={() => setGroup(g)} className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${group === g ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>{g}</button>
        ))}
      </div>
      <ul className="max-h-72 space-y-1 overflow-y-auto pr-1">
        {list.map((c) => (
          <li key={c.id}>
            <button type="button" onClick={() => onPick(c)} className="group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-slate-800">
              <span>
                <span className="block text-sm font-medium text-slate-100">{c.name}</span>
                <span className="text-xs text-slate-500">{c.muscle_group} · {(c.equipment_needed || []).join(', ')}</span>
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-600 group-hover:text-indigo-400">{actionLabel}<Plus className="h-4 w-4" /></span>
            </button>
          </li>
        ))}
        {list.length === 0 && <li className="py-6 text-center text-sm text-slate-500">No matching exercises</li>}
      </ul>
    </div>
  );
};

export default ExercisePicker;
