import React from 'react';
import { Loader2 } from 'lucide-react';

export const SuspenseLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-[50vh] w-full items-center justify-center text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      }
    >
      {children}
    </React.Suspense>
  );
};
