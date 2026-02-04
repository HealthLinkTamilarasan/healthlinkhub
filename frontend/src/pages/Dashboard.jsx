import React, { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="container mt-5">
            <div className="card shadow-lg border-0 rounded-4">
                {/* Header */}
                <div className="card-header bg-gradient bg-primary text-white d-flex justify-content-between align-items-center rounded-top-4">
                    <div>
                        <h4 className="mb-0">Dashboard</h4>
                        <small className="opacity-75">
                            Role: {user?.role?.toUpperCase()}
                        </small>
                    </div>
                    <button
                        className="btn btn-outline-light btn-sm px-3"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>

                {/* Body */}
                <div className="card-body p-4">
                    <h5 className="mb-3">
                        Welcome, <span className="text-primary">{user?.fullName}</span>
                    </h5>

                    {/* User Info Section */}
                    <div className="row g-3">
                        <div className="col-md-6">
                            <div className="border rounded-3 p-3 bg-light">
                                <small className="text-muted">Email</small>
                                <p className="mb-0 fw-semibold">{user?.email}</p>
                            </div>
                        </div>

                        <div className="col-md-6">
                            <div className="border rounded-3 p-3 bg-light">
                                <small className="text-muted">Role ID</small>
                                <p className="mb-0 fw-semibold">{user?.roleId}</p>
                            </div>
                        </div>

                        <div className="col-md-12">
                            <div className="border rounded-3 p-3 bg-light">
                                <small className="text-muted">User ID</small>
                                <p className="mb-0 fw-semibold text-break">
                                    {user?._id}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Info Alert */}
                    <div className="alert alert-info mt-4 rounded-3">
                        <strong>{user?.role?.toUpperCase()} Dashboard</strong>
                        <br />
                        You will see role-specific features and actions assigned to your account.
                    </div>
                </div>
            </div>
        </div>
    );

};

export default Dashboard;
