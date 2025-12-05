import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import DesignsPage from './pages/DesignsPage';
import AdminLogin from './components/AdminLogin';

const AdminApp: React.FC = () => {
  const [isAuthed, setIsAuthed] = useState(false);
  const [checkedAuth, setCheckedAuth] = useState(false);

  // On mount, check localStorage flag
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const flag = localStorage.getItem('admin_authed');
      if (flag === '1') {
        setIsAuthed(true);
      }
    }
    setCheckedAuth(true);
  }, []);

  // Optional: while checking auth, render nothing / small placeholder
  if (!checkedAuth) {
    return null;
  }

  // If not authed, show the admin login gate
  if (!isAuthed) {
    return (
      <AdminLogin
        onSuccess={() => {
          // AdminLogin already sets localStorage, we just flip state
          setIsAuthed(true);
        }}
      />
    );
  }

  // Once authed, show the real admin layout + routes
  return (
    <AdminLayout>
      <Routes>
        {/* /admin -> redirect to /admin/designs */}
        <Route index element={<Navigate to="designs" replace />} />

        {/* /admin/designs -> pending jobs */}
        <Route
          path="designs"
          element={<DesignsPage initialStatus="pending" />}
        />

        {/* /admin/designs/completed -> completed jobs */}
        <Route
          path="designs/completed"
          element={<DesignsPage initialStatus="completed" />}
        />

        {/* Anything else under /admin -> back to designs */}
        <Route path="*" element={<Navigate to="designs" replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminApp;
