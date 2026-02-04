import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './components/DashboardLayout';
import PatientDashboard from './pages/dashboards/PatientDashboard';
import DoctorDashboard from './pages/dashboards/DoctorDashboard';
import LabDashboard from './pages/dashboards/LabDashboard';
import PharmacistDashboard from './pages/dashboards/PharmacistDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { useContext } from 'react';
import AuthContext from './context/AuthContext';

// Role Redirect Component (Root /dashboard access)
const DashboardRedirect = () => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" />;

  switch (user.role) {
    case 'patient': return <Navigate to="/dashboard/patient" />;
    case 'doctor': return <Navigate to="/dashboard/doctor" />;
    case 'labTechnician': return <Navigate to="/dashboard/lab" />;
    case 'pharmacist': return <Navigate to="/dashboard/pharmacy" />;
    default: return <Navigate to="/login" />;
  }
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-vh-100 bg-light">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* PROTECTED ROUTES WITH STRICT ROLE ISOLATION */}
            <Route path="/dashboard" element={<DashboardLayout />}>

              {/* 1. Root Dashboard Redirect - Wrapped in Layout Route */}
              <Route element={<ProtectedRoute allowedRoles={['patient', 'doctor', 'labTechnician', 'pharmacist']} />}>
                <Route index element={<DashboardRedirect />} />
              </Route>

              {/* 2. Patient Dashboard */}
              <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
                <Route path="patient" element={<PatientDashboard />} />
              </Route>

              {/* 3. Doctor Dashboard */}
              <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
                <Route path="doctor" element={<DoctorDashboard />} />
              </Route>

              {/* 4. Lab Dashboard */}
              <Route element={<ProtectedRoute allowedRoles={['labTechnician']} />}>
                <Route path="lab" element={<LabDashboard />} />
              </Route>

              {/* 5. Pharmacist Dashboard */}
              <Route element={<ProtectedRoute allowedRoles={['pharmacist']} />}>
                <Route path="pharmacy" element={<PharmacistDashboard />} />
              </Route>

            </Route>

            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
