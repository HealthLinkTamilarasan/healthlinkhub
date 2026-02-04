import React, { useContext, useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const DashboardLayout = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const today = new Date();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getDashboardTitle = () => {
        switch (user?.role) {
            case 'patient': return 'Patient Dashboard';
            case 'doctor': return 'Doctor Dashboard';
            case 'labTechnician': return 'Lab Technician Dashboard';
            case 'pharmacist': return 'Pharmacist Dashboard';
            default: return 'Dashboard';
        }
    };

    const getRoleLabel = () => {
        switch (user?.role) {
            case 'patient': return 'Patient';
            case 'doctor': return 'Doctor';
            case 'labTechnician': return 'Lab Technician';
            case 'pharmacist': return 'Pharmacist';
            default: return 'User';
        }
    };

    return (
        <div className="min-vh-100 bg-light d-flex flex-column">

            {/* ================= TOP HEADER ================= */}
            <header className="bg-white border-bottom shadow-sm sticky-top" style={{ zIndex: 1020 }}>
                <div className="container-fluid px-4">
                    <div className="row align-items-center" style={{ height: 64 }}>

                        {/* LEFT: LOGO */}
                        <div className="col-6 col-md-4 d-flex align-items-center">
                            <i className="bi bi-heart-pulse-fill text-primary fs-4 me-2"></i>
                            <span className="fw-bold fs-5 text-dark">
                                HealthLink Hub
                            </span>
                        </div>

                        {/* CENTER: DASHBOARD TITLE */}
                        <div className="col-md-4 d-none d-md-flex justify-content-center">
                            <span className="fw-bold fs-6 text-primary text-uppercase">
                                {getDashboardTitle()}
                            </span>
                        </div>

                        {/* RIGHT: PROFILE ICON (NO DOWN ARROW) */}
                        <div className="col-6 col-md-4 d-flex justify-content-end align-items-center position-relative">
                            <div
                                className="d-flex align-items-center"
                                role="button"
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                            >
                                <div
                                    className="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center"
                                    style={{ width: 36, height: 36 }}
                                >
                                    <i className="bi bi-person-fill"></i>
                                </div>
                            </div>

                            {showProfileMenu && (
                                <div
                                    className="position-absolute end-0 mt-2 bg-white border rounded shadow-sm p-2"
                                    style={{ width: 180, top: '100%', zIndex: 1030 }}
                                >
                                    <button
                                        className="btn btn-sm btn-danger w-100 text-start"
                                        onClick={handleLogout}
                                    >
                                        <i className="bi bi-box-arrow-right me-2"></i>
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </header>

            {/* ================= INFO HEADER ================= */}
            <section className="bg-white border-bottom">
                <div className="container-fluid px-4 py-3">
                    <div className="row align-items-center gy-3">

                        {/* USER INFO */}
                        <div className="col-md-4">
                            <div>
                                <div className="fw-bold fs-5 text-dark">
                                    {user?.fullName}
                                </div>
                                <div className="text-muted small">
                                    ID:
                                    <span className="text-primary fw-bold ms-1">
                                        {user?.userId || user?.roleId || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ROLE BADGE */}
                        <div className="col-md-4 d-flex justify-content-md-center">
                            <span className="badge bg-primary bg-opacity-10 text-primary border border-primary rounded-pill px-4 py-2 fw-bold text-uppercase">
                                {getRoleLabel()}
                            </span>
                        </div>

                        {/* DATE */}
                        <div className="col-md-4 d-flex justify-content-md-end">
                            <div className="text-md-end">
                                <div className="fw-bold text-dark">
                                    {today.toLocaleDateString('en-US', { weekday: 'long' })}
                                </div>
                                <div className="text-muted small">
                                    {today.toLocaleDateString('en-US', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* ================= MAIN CONTENT ================= */}
            <main className="flex-grow-1 container-fluid p-4" style={{ maxWidth: 1600 }}>
                <Outlet />
            </main>

        </div>
    );
};

export default DashboardLayout;
