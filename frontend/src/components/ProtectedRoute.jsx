import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return <div className="text-center mt-5">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Role Check
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to their allowed dashboard if they try to access another
        switch (user.role) {
            case 'patient': return <Navigate to="/dashboard/patient" replace />;
            case 'doctor': return <Navigate to="/dashboard/doctor" replace />;
            case 'labTechnician': return <Navigate to="/dashboard/lab" replace />;
            case 'pharmacist': return <Navigate to="/dashboard/pharmacy" replace />;
            default: return <Navigate to="/login" replace />;
        }
    }

    return <Outlet />;
};

export default ProtectedRoute;
