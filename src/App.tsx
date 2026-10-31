import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CreateVolunteer } from './pages/CreateVolunteer';
import { VolunteersList } from './pages/VolunteersList';
import { EditVolunteer } from './pages/EditVolunteer';
import { SevaVibhagManagement } from './pages/SevaVibhagManagement';
import { AdminManagement } from './pages/AdminManagement';
import { VerifyVolunteer } from './pages/VerifyVolunteer';

// Protected Layout wrapping all authenticated admin pages
const ProtectedLayout: React.FC = () => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFDF5] flex items-center justify-center font-gujarati">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-[#C59B27] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-700">પોર્ટલ લોડ થઈ રહ્યું છે...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-gujarati">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        © 2026 BAPS Swaminarayan Mandir, Tithal - Valsad. સ્વયંસેવક આઈડી કાર્ડ સિસ્ટમ.
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Verification Route (Used by QR codes) */}
          <Route path="/verify/:id" element={<VerifyVolunteer />} />

          {/* Admin Login */}
          <Route path="/login" element={<Login />} />

          {/* Protected Admin Routes */}
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create" element={<CreateVolunteer />} />
            <Route path="/volunteers" element={<VolunteersList />} />
            <Route path="/volunteers/edit/:id" element={<EditVolunteer />} />
            <Route path="/departments" element={<SevaVibhagManagement />} />
            <Route path="/admins" element={<AdminManagement />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
