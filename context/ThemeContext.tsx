import React, { useEffect, ReactNode } from 'react';

export const useTheme = () => {};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);
  return <>{children}</>;
};
