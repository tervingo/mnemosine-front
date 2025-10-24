import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './contexts/ThemeContext';
import { apiService } from './services/api';
import { Armario, NotaCreate, CajaCreate, CajitaCreate, ArmarioCreate, ArmarioUpdate } from './types';

// Layout components
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Auth components
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';

// Page components
import Dashboard from './pages/Dashboard';
import NotaView from './pages/NotaView';

// Components
import NotaModal from './components/notas/NotaModal';
import CajaModal from './components/cajas/CajaModal';
import CajitaModal from './components/cajitas/CajitaModal';
import ArmarioModal from './components/armarios/ArmarioModal';

// Placeholder components para las rutas que faltan
const NotFound: React.FC = () => (
  <div className="p-8 text-center">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">404 - Página no encontrada</h1>
    <p className="text-gray-600">La página que buscas no existe.</p>
  </div>
);

const SearchPage: React.FC = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">Buscar Notas</h1>
    <p className="text-gray-600">Funcionalidad de búsqueda - Próximamente</p>
  </div>
);


const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [armarios, setArmarios] = useState<Armario[]>([]);
  const [isLoadingArmarios, setIsLoadingArmarios] = useState(false);
  const [isNotaModalOpen, setIsNotaModalOpen] = useState(false);
  const [isCajaModalOpen, setIsCajaModalOpen] = useState(false);
  const [isCajitaModalOpen, setIsCajitaModalOpen] = useState(false);
  const [isArmarioModalOpen, setIsArmarioModalOpen] = useState(false);
  const [selectedArmarioId, setSelectedArmarioId] = useState<string>('');
  const [selectedCajaId, setSelectedCajaId] = useState<string>('');
  const [editingArmario, setEditingArmario] = useState<Armario | undefined>(undefined);

  useEffect(() => {
    if (isAuthenticated) {
      loadArmarios();
    }
  }, [isAuthenticated]);

  const loadArmarios = async () => {
    try {
      setIsLoadingArmarios(true);
      const armariosData = await apiService.getArmarios();
      setArmarios(armariosData);
    } catch (error) {
      console.error('Error cargando armarios:', error);
    } finally {
      setIsLoadingArmarios(false);
    }
  };

  const handleSearch = (query: string) => {
    // Implementar búsqueda
    console.log('Buscar:', query);
  };

  const handleNewNote = () => {
    setIsNotaModalOpen(true);
  };

  const handleNewCaja = () => {
    setSelectedArmarioId('');
    setIsCajaModalOpen(true);
  };

  const handleNewArmario = () => {
    setEditingArmario(undefined);
    setIsArmarioModalOpen(true);
  };

  const handleEditArmario = (armario: Armario) => {
    setEditingArmario(armario);
    setIsArmarioModalOpen(true);
  };

  const handleDeleteArmario = async (armarioId: string) => {
    const armario = armarios.find(a => a.id === armarioId);
    if (!armario) return;

    if (armario.cajas.length > 0) {
      alert('No se puede eliminar un armario que contiene cajas. Elimina primero todas las cajas.');
      return;
    }

    const confirmDelete = window.confirm(
      `¿Estás seguro de que quieres eliminar el armario "${armario.nombre}"? Esta acción no se puede deshacer.`
    );

    if (confirmDelete) {
      try {
        await apiService.deleteArmario(armarioId);
        await loadArmarios();
      } catch (error: any) {
        console.error('Error eliminando armario:', error);
        alert(error.response?.data?.detail || 'Error al eliminar el armario');
      }
    }
  };

  const handleSaveNota = async (notaData: NotaCreate) => {
    try {
      await apiService.createNota(notaData);
      // Recargar armarios para mostrar la nueva nota
      await loadArmarios();
    } catch (error) {
      console.error('Error creando nota:', error);
      throw error;
    }
  };

  const handleSaveCaja = async (cajaData: CajaCreate) => {
    try {
      await apiService.createCaja(cajaData);
      // Recargar armarios para mostrar la nueva caja
      await loadArmarios();
    } catch (error) {
      console.error('Error creando caja:', error);
      throw error;
    }
  };

  const handleSaveCajita = async (cajitaData: CajitaCreate) => {
    try {
      await apiService.createCajita(cajitaData);
      // Recargar armarios para mostrar la nueva cajita
      await loadArmarios();
    } catch (error) {
      console.error('Error creando cajita:', error);
      throw error;
    }
  };

  const handleSaveArmario = async (armarioData: ArmarioCreate | ArmarioUpdate) => {
    try {
      if (editingArmario) {
        // Editar armario existente
        await apiService.updateArmario(editingArmario.id, armarioData as ArmarioUpdate);
      } else {
        // Crear nuevo armario
        await apiService.createArmario(armarioData as ArmarioCreate);
      }
      // Recargar armarios
      await loadArmarios();
    } catch (error) {
      console.error('Error guardando armario:', error);
      throw error;
    }
  };

  const handleCreateCaja = (armarioId: string) => {
    setSelectedArmarioId(armarioId);
    setIsCajaModalOpen(true);
  };

  const handleCreateCajita = (cajaId: string) => {
    setSelectedCajaId(cajaId);
    setIsCajitaModalOpen(true);
  };

  const handleCreateNota = (parentId: string, parentType: 'caja' | 'cajita') => {
    // Implementar crear nota
    console.log('Crear nota en:', parentType, parentId);
  };

  if (isLoading) {
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
    <>
      <Routes>
        {/* Rutas públicas */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <LoginForm />
          }
        />
        <Route
          path="/registro"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <RegisterForm />
          }
        />

        {/* Rutas protegidas */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout
                armarios={armarios}
                isLoadingArmarios={isLoadingArmarios}
                onSearch={handleSearch}
                onNewNote={handleNewNote}
                onNewCaja={handleNewCaja}
                onCreateCaja={handleCreateCaja}
                onCreateCajita={handleCreateCajita}
                onCreateNota={handleCreateNota}
                onEditArmario={handleEditArmario}
                onDeleteArmario={handleDeleteArmario}
                onCreateArmario={handleNewArmario}
                onRefresh={loadArmarios}
              />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="buscar" element={<SearchPage />} />
          <Route path="nota/:id" element={<NotaView />} />
          <Route path="armario/:id" element={<Dashboard />} />
          <Route path="cajita/:id" element={<Dashboard />} />
        </Route>

        {/* Ruta por defecto */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Modal de Nueva Nota */}
      <NotaModal
        isOpen={isNotaModalOpen}
        onClose={() => setIsNotaModalOpen(false)}
        onSave={handleSaveNota}
        armarios={armarios}
      />

      {/* Modal de Nueva Caja */}
      <CajaModal
        isOpen={isCajaModalOpen}
        onClose={() => setIsCajaModalOpen(false)}
        onSave={handleSaveCaja}
        armarios={armarios}
        selectedArmarioId={selectedArmarioId}
      />

      {/* Modal de Nueva Cajita */}
      <CajitaModal
        isOpen={isCajitaModalOpen}
        onClose={() => setIsCajitaModalOpen(false)}
        onSave={handleSaveCajita}
        cajaId={selectedCajaId}
        cajaNombre={armarios.flatMap(a => a.cajas).find(c => c.id === selectedCajaId)?.nombre}
      />

      {/* Modal de Armario */}
      <ArmarioModal
        isOpen={isArmarioModalOpen}
        onClose={() => {
          setIsArmarioModalOpen(false);
          setEditingArmario(undefined);
        }}
        onSave={handleSaveArmario}
        armario={editingArmario}
        mode={editingArmario ? 'edit' : 'create'}
      />
    </>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
