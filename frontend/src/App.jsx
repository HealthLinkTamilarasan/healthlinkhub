import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './components/DashboardLayout';
import PatientDashboard from './pages/dashboards/PatientDashboard';
import DoctorDashboard from './pages/dashboards/DoctorDashboard';
import LabDashboard from './pages/dashboards/LabDashboard';
import PharmacistDashboard from './pages/dashboards/PharmacistDashboard';
import EmergencyDashboard from './pages/dashboards/EmergencyDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { useContext } from 'react';
import AuthContext from './context/AuthContext';
import { ToastContainer } from 'react-toastify';

// Role Redirect Component (Root /dashboard access)
const DashboardRedirect = () => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" />;

  switch (user.role) {
    case 'patient': return <Navigate to="/dashboard/patient" />;
    case 'doctor': return <Navigate to="/dashboard/doctor" />;
    case 'labTechnician': return <Navigate to="/dashboard/lab" />;
    case 'pharmacist': return <Navigate to="/dashboard/pharmacy" />;
    case 'emergencyTeam': return <Navigate to="/dashboard/emergency" />;
    default: return <Navigate to="/login" />;
  }
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-vh-100 bg-light">
          <ToastContainer position="top-right" autoClose={3000} />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* PROTECTED ROUTES WITH STRICT ROLE ISOLATION */}
            {/* Patient has its own layout (sidebar + header), separate from others */}
            <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
              <Route path="/dashboard/patient" element={<PatientDashboard />} />
            </Route>

            {/* Doctor has its own layout (sidebar + header), same style as patient */}
            <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
              <Route path="/dashboard/doctor" element={<DoctorDashboard />} />
            </Route>

            {/* Lab Technician has its own layout (sidebar + header), same style as patient/doctor */}
            <Route element={<ProtectedRoute allowedRoles={['labTechnician']} />}>
              <Route path="/dashboard/lab" element={<LabDashboard />} />
            </Route>

            {/* Pharmacist has its own layout (sidebar + header), same style as Lab */}
            <Route element={<ProtectedRoute allowedRoles={['pharmacist']} />}>
              <Route path="/dashboard/pharmacy" element={<PharmacistDashboard />} />
            </Route>

            {/* Emergency Team has its own layout (sidebar + header), same style as others */}
            <Route element={<ProtectedRoute allowedRoles={['emergencyTeam']} />}>
              <Route path="/dashboard/emergency" element={<EmergencyDashboard />} />
            </Route>

            <Route path="/dashboard" element={<DashboardLayout />}>

              {/* 1. Root Dashboard Redirect */}
              <Route element={<ProtectedRoute allowedRoles={['patient', 'doctor', 'labTechnician', 'pharmacist', 'emergencyTeam']} />}>
                <Route index element={<DashboardRedirect />} />
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
