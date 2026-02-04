import { useState } from 'react';
import { Link } from 'react-router-dom';
import PatientFields from '../components/PatientFields';
import DoctorFields from '../components/DoctorFields';
import LabFields from '../components/LabFields';
import PharmacistFields from '../components/PharmacistFields';
import axiosInstance from '../api/axiosInstance';

const Register = () => {
    const [step, setStep] = useState(1);
    const [role, setRole] = useState('patient');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        userId: '',
        password: '',
        confirmPassword: '',
        bloodGroup: '',
        allergies: '',
        chronicDiseases: '',
        emergencyContact: ''
    });

    const handleChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleNext = (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setError('');
        setStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axiosInstance.post('/auth/register', { ...formData, role });
            window.location.href = '/register-success.html';
        } catch {
            setError('Registration failed');
        }
    };

    return (
        <div className="container-fluid min-vh-100 p-0">
            <div className="row g-0 min-vh-100">

                {/* LEFT BRANDING (REDUCED WIDTH) */}
                <div className="col-lg-5 d-none d-lg-flex bg-primary text-white align-items-center px-5">
                    <div className="w-75">
                        <div className="mb-4">
                            <div className="bg-white bg-opacity-25 rounded-circle p-3 d-inline-block mb-3">
                                <i className="bi bi-heart-pulse fs-3"></i>
                            </div>
                            <h1 className="fw-bold">HealthLink Hub</h1>
                            <p className="text-white-50 fs-5">
                                A unified healthcare platform connecting patients,
                                doctors, labs, and pharmacies.
                            </p>
                        </div>

                        <ul className="list-unstyled fs-6">
                            <li className="mb-3">
                                <i className="bi bi-check-circle-fill me-2"></i>
                                Secure role-based access
                            </li>
                            <li className="mb-3">
                                <i className="bi bi-check-circle-fill me-2"></i>
                                Centralized health records
                            </li>
                            <li>
                                <i className="bi bi-check-circle-fill me-2"></i>
                                Seamless care coordination
                            </li>
                        </ul>
                    </div>
                </div>

                {/* RIGHT SIDE (WIDER) */}
                <div className="col-12 col-lg-7 d-flex align-items-center justify-content-center bg-light px-3 px-md-5">

                    {/* FORM CONTAINER (WIDER) */}
                    <div
                        className="bg-white w-100 p-4 p-md-5 rounded-4 shadow-sm"
                        style={{ maxWidth: '600px' }}
                    >
                        {/* Header */}
                        <div className="text-center mb-4">
                            <div className="mb-3">
                                <div className="bg-primary bg-opacity-10 rounded-circle p-3 d-inline-block">
                                    <i className="bi bi-person-plus text-primary fs-4"></i>
                                </div>
                            </div>
                            <h3 className="fw-bold">Create an account</h3>
                            <p className="text-muted">
                                Join our secure healthcare network today
                            </p>
                        </div>

                        {/* Progress */}
                        <div className="mb-4">
                            <div className="d-flex justify-content-between small text-muted mb-1">
                                <span className={step === 1 ? 'fw-bold text-primary' : ''}>
                                    Account Info
                                </span>
                                <span className={step === 2 ? 'fw-bold text-primary' : ''}>
                                    Role Details
                                </span>
                            </div>
                            <div className="progress" style={{ height: '4px' }}>
                                <div
                                    className="progress-bar bg-primary"
                                    style={{ width: step === 1 ? '50%' : '100%' }}
                                />
                            </div>
                        </div>

                        {error && <div className="alert alert-danger py-2">{error}</div>}

                        {/* FORM */}
                        <form onSubmit={step === 1 ? handleNext : handleSubmit}>
                            {step === 1 ? (
                                <div className="row g-3">

                                    <div className="col-12">
                                        <label className="form-label">Full Name</label>
                                        <input
                                            className="form-control form-control-lg"
                                            name="fullName"
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">Phone</label>
                                        <input
                                            className="form-control form-control-lg"
                                            name="phone"
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">Email</label>
                                        <input
                                            type="email"
                                            className="form-control form-control-lg"
                                            name="email"
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">User ID</label>
                                        <input
                                            className="form-control form-control-lg"
                                            name="userId"
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">Register As</label>
                                        <select
                                            className="form-select form-select-lg"
                                            value={role}
                                            onChange={(e) => setRole(e.target.value)}
                                        >
                                            <option value="patient">Patient</option>
                                            <option value="doctor">Doctor</option>
                                            <option value="labTechnician">Lab Technician</option>
                                            <option value="pharmacist">Pharmacist</option>
                                        </select>
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">Password</label>
                                        <div className="position-relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                className="form-control form-control-lg pe-5"
                                                name="password"
                                                onChange={handleChange}
                                                required
                                            />
                                            <i
                                                className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} position-absolute top-50 end-0 translate-middle-y me-3 text-muted`}
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => setShowPassword(!showPassword)}
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">Confirm Password</label>
                                        <div className="position-relative">
                                            <input
                                                type={showConfirm ? 'text' : 'password'}
                                                className="form-control form-control-lg pe-5"
                                                name="confirmPassword"
                                                onChange={handleChange}
                                                required
                                            />
                                            <i
                                                className={`bi ${showConfirm ? 'bi-eye-slash' : 'bi-eye'} position-absolute top-50 end-0 translate-middle-y me-3 text-muted`}
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => setShowConfirm(!showConfirm)}
                                            />
                                        </div>
                                    </div>

                                    <button className="btn btn-primary btn-lg w-100 mt-4">
                                        Next Step →
                                    </button>

                                    <div className="text-center mt-3">
                                        <small className="text-muted">
                                            Already have an account?{' '}
                                            <Link to="/login" className="text-primary fw-bold">
                                                Login here
                                            </Link>
                                        </small>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        className="btn btn-link mb-3"
                                        onClick={() => setStep(1)}
                                    >
                                        ← Back
                                    </button>

                                    <div className="alert alert-primary small">
                                        A unique ID will be automatically generated for your profile.
                                    </div>

                                    {role === 'patient' && <PatientFields formData={formData} handleChange={handleChange} />}
                                    {role === 'doctor' && <DoctorFields formData={formData} handleChange={handleChange} />}
                                    {role === 'labTechnician' && <LabFields formData={formData} handleChange={handleChange} />}
                                    {role === 'pharmacist' && <PharmacistFields formData={formData} handleChange={handleChange} />}

                                    <div className="d-flex gap-3 mt-4">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary w-50"
                                            onClick={() => setStep(1)}
                                        >
                                            Back
                                        </button>
                                        <button className="btn btn-primary w-50">
                                            Create Account
                                        </button>
                                    </div>
                                </>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
