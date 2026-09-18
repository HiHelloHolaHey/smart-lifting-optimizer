import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-70 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-electric-indigo hover:bg-indigo-500 text-white',
    ghost: 'bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 text-slate-300',
    danger: 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
      ) : Icon ? (
        <Icon className="w-5 h-5 mr-2" />
      ) : null}
      {children}
    </button>
  );
};
