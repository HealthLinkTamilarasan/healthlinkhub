import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import AuthContext from '../context/AuthContext';

const Login = () => {
    const [role, setRole] = useState('patient');
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await axiosInstance.post('/auth/login', {
                identifier,
                password,
                role
            });
            login(res.data);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="container-fluid min-vh-100 p-0">
            <div className="row g-0 min-vh-100">

                {/* LEFT BRANDING */}
                <div className="col-lg-6 d-none d-lg-flex bg-primary text-white align-items-center px-5">
                    <div className="w-75">
                        <div className="mb-4">
                            <div className="bg-white bg-opacity-25 rounded-circle p-3 d-inline-block mb-3">
                                <i className="bi bi-heart-pulse fs-3"></i>
                            </div>
                            <h1 className="fw-bold">Welcome Back</h1>
                            <p className="text-white-50 fs-5">
                                Access your health dashboard securely.
                                Connect with your healthcare ecosystem.
                            </p>
                        </div>

                        <ul className="list-unstyled fs-6">
                            <li className="mb-3">
                                <i className="bi bi-check-circle-fill me-2"></i>
                                Secure 256-bit encryption
                            </li>
                            <li className="mb-3">
                                <i className="bi bi-check-circle-fill me-2"></i>
                                Real-time health updates
                            </li>
                            <li>
                                <i className="bi bi-check-circle-fill me-2"></i>
                                Instant access to medical records
                            </li>
                        </ul>
                    </div>
                </div>

                {/* RIGHT SIDE */}
                <div className="col-12 col-lg-6 d-flex align-items-center justify-content-center bg-light px-3 px-md-5">

                    {/* FORM CONTAINER (WIDER) */}
                    <div
                        className="bg-white w-100 p-4 p-md-5 rounded-4 shadow-sm"
                        style={{ maxWidth: '480px' }}
                    >
                        <div className="text-center mb-4">
                            <div className="mb-3">
                                <div className="bg-primary bg-opacity-10 rounded-circle p-3 d-inline-block">
                                    <i className="bi bi-heart-pulse text-primary fs-4"></i>
                                </div>
                            </div>
                            <h3 className="fw-bold">Sign in</h3>
                            <p className="text-muted">
                                Please enter your credentials to continue
                            </p>
                        </div>

                        {error && <div className="alert alert-danger py-2">{error}</div>}

                        <form onSubmit={handleSubmit}>

                            {/* Login As */}
                            <div className="mb-3">
                                <label className="form-label">Login As</label>
                                <select
                                    className="form-select form-select-lg rounded-3"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                >
                                    <option value="patient">Patient</option>
                                    <option value="doctor">Doctor</option>
                                    <option value="labTechnician">Lab Technician</option>
                                    <option value="pharmacist">Pharmacist</option>
                                </select>
                            </div>


                            {/* Identifier */}
                            <div className="mb-3">
                                <label className="form-label">Identifier</label>
                                <input
                                    type="text"
                                    className="form-control form-control-lg rounded-3"
                                    placeholder="Patient ID or Email"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Password */}
                            <div className="mb-3">
                                <label className="form-label d-flex justify-content-between">
                                    <span>Password</span>
                                    <Link
                                        to="/forgot-password"
                                        className="small text-primary text-decoration-none"
                                    >
                                        Forgot password?
                                    </Link>
                                </label>
                                <div className="position-relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="form-control form-control-lg rounded-3 pe-5"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <i
                                        className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} position-absolute top-50 end-0 translate-middle-y me-3 text-muted`}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setShowPassword(!showPassword)}
                                    />
                                </div>
                            </div>

                            <button className="btn btn-primary btn-lg w-100 mt-3">
                                Login <i className="bi bi-arrow-right ms-1"></i>
                            </button>

                            <div className="d-flex align-items-center my-4">
                                <hr className="flex-grow-1" />
                                <span className="mx-3 text-muted small">OR</span>
                                <hr className="flex-grow-1" />
                            </div>

                            <div className="text-center">
                                <small className="text-muted">
                                    Don’t have an account?{' '}
                                    <Link to="/register" className="text-primary fw-bold">
                                        Register here
                                    </Link>
                                </small>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
