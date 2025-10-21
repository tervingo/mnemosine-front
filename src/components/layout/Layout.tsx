import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { Armario } from '../../types';

interface LayoutProps {
  armarios: Armario[];
  isLoadingArmarios?: boolean;
  onSearch?: (query: string) => void;
  onNewNote?: () => void;
  onNewCaja?: () => void;
  onCreateCaja?: (armarioId: string) => void;
  onCreateCajita?: (cajaId: string) => void;
  onCreateNota?: (parentId: string, parentType: 'caja' | 'cajita') => void;
  onEditArmario?: (armario: Armario) => void;
  onDeleteArmario?: (armarioId: string) => void;
  onCreateArmario?: () => void;
}

const Layout: React.FC<LayoutProps> = ({
  armarios,
  isLoadingArmarios = false,
  onSearch,
  onNewNote,
  onNewCaja,
  onCreateCaja,
  onCreateCajita,
  onCreateNota,
  onEditArmario,
  onDeleteArmario,
  onCreateArmario,
}) => {
  const { isLoading } = useAuth();

  if (isLoading || isLoadingArmarios) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-primary-600 rounded-full animate-pulse"></div>
          <div className="w-4 h-4 bg-primary-600 rounded-full animate-pulse delay-75"></div>
          <div className="w-4 h-4 bg-primary-600 rounded-full animate-pulse delay-150"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 dark:bg-gray-600">
      <Header onSearch={onSearch} onNewNote={onNewNote} onNewCaja={onNewCaja} />

      <div className="flex">
        <Sidebar
          armarios={armarios}
          onCreateCaja={onCreateCaja}
          onCreateCajita={onCreateCajita}
          onCreateNota={onCreateNota}
          onEditArmario={onEditArmario}
          onDeleteArmario={onDeleteArmario}
          onCreateArmario={onCreateArmario}
        />

        <main className="flex-1 overflow-hidden">
          <div className="h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;