import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

import { Login } from './pages/Login';
import { Layout } from './components/layout/Layout';
import { PurchaseList } from './pages/PurchaseList';
import { PurchaseDetails } from './pages/PurchaseDetails';
import { PurchaseCreate } from './pages/PurchaseCreate';
import { UsersList } from './pages/UsersList';
import { UserCreate } from './pages/UserCreate';
import { DepartmentList } from './pages/DepartmentList';
import { DepartmentCreate } from './pages/DepartmentCreate';
import { lazy } from 'react';
import { SuspenseLoader } from './components/ui/SuspenseLoader';
import { WorkflowList } from './pages/WorkflowList';
import { WorkflowEdit } from './pages/WorkflowEdit';

// Lazy loaded features (Suspense compliance)
const Dashboard = lazy(() => import('./features/dashboard/components/Dashboard'));
const Settings = lazy(() => import('./features/settings/components/Settings'));

import type { ReactNode } from 'react';

function PrivateRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="/login" element={<Login />} />

      <Route path="/app/*" element={
        <PrivateRoute>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={
                <SuspenseLoader>
                  <Dashboard />
                </SuspenseLoader>
              } />
              <Route path="purchases" element={<PurchaseList />} />
              <Route path="purchases/new" element={<PurchaseCreate />} />
              <Route path="purchases/:id" element={<PurchaseDetails />} />
              <Route path="users" element={<UsersList />} />
              <Route path="users/new" element={<UserCreate />} />
              <Route path="departments" element={<DepartmentList />} />
              <Route path="departments/new" element={<DepartmentCreate />} />
              <Route path="workflows" element={<WorkflowList />} />
              <Route path="workflows/new" element={<WorkflowEdit />} />
              <Route path="workflows/:id/edit" element={<WorkflowEdit />} />
              <Route path="settings" element={
                <SuspenseLoader>
                  <Settings />
                </SuspenseLoader>
              } />
            </Routes>
          </Layout>
        </PrivateRoute>
      } />
    </Routes>
  );
}
