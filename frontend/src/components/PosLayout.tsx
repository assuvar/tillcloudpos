import React from 'react';
import UnifiedLayout from './UnifiedLayout';

interface PosLayoutProps {
  children: React.ReactNode;
  currentView?: string;
}

const PosLayout: React.FC<PosLayoutProps> = ({ children, currentView = 'orders' }) => {
  return (
    <UnifiedLayout currentView={currentView}>
      {children}
    </UnifiedLayout>
  );
};

export default PosLayout;
