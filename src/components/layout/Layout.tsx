import React, { useState } from 'react';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      <Header
        onSearch={onSearch}
        onNewNote={onNewNote}
        onNewCaja={onNewCaja}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex h-screen pt-16">
        {/* Overlay para móvil */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <Sidebar
          armarios={armarios}
          onCreateCaja={onCreateCaja}
          onCreateCajita={onCreateCajita}
          onCreateNota={onCreateNota}
          onEditArmario={onEditArmario}
          onDeleteArmario={onDeleteArmario}
          onCreateArmario={onCreateArmario}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
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