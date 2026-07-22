import React from 'react';

interface LoadingSkeletonProps {
  type?: 'card' | 'table' | 'profile' | 'chart';
  count?: number;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type = 'card', count = 1 }) => {
  const skeletons = Array.from({ length: count });

  if (type === 'card') {
    return (
      <>
        {skeletons.map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-800/60 bg-slate-900/50 p-5 space-y-3">
            <div className="h-4 w-24 bg-slate-800 rounded-full animate-pulse" />
            <div className="h-8 w-16 bg-slate-800 rounded-lg animate-pulse" />
            <div className="h-3 w-32 bg-slate-800 rounded-full animate-pulse" />
          </div>
        ))}
      </>
    );
  }

  if (type === 'table') {
    return (
      <div className="space-y-3">
        <div className="h-10 bg-slate-800/50 rounded-xl animate-pulse" />
        {skeletons.map((_, i) => (
          <div key={i} className="h-12 bg-slate-800/30 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (type === 'profile') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-slate-800 animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-800 rounded-lg animate-pulse" />
            <div className="h-4 w-32 bg-slate-800 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/50 p-5">
        <div className="h-5 w-36 bg-slate-800 rounded-full animate-pulse mb-4" />
        <div className="h-48 bg-slate-800/30 rounded-xl animate-pulse" />
      </div>
    );
  }

  return null;
};

export default LoadingSkeleton;
