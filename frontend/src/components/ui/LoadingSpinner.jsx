import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100">
      <Loader2 className="w-12 h-12 text-electric-indigo animate-spin mb-4" />
      <p className="text-slate-400 font-medium">Loading...</p>
    </div>
  );
};
