import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';

const PharmacistDashboard = () => {
    const [requests, setRequests] = useState([]);
    const [completedToday, setCompletedToday] = useState(0);
    const [activeCard, setActiveCard] = useState('requests');

    // Patient State
    const [patientId, setPatientId] = useState('');
    const [patientData, setPatientData] = useState(null);
    const [searchStep, setSearchStep] = useState(1);
    const [currentRequestId, setCurrentRequestId] = useState(null);

    const [attendedList, setAttendedList] = useState([]);

    // Manual Process State
    const [selectedPrescriptionId, setSelectedPrescriptionId] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await axiosInstance.get('/dashboard/lab-pharmacy');
            setRequests(res.data.requests || []);
            setCompletedToday(res.data.completedToday || 0);
            setAttendedList(res.data.attendedList || []);
        } catch (err) {
            console.error(err);
        }
    };

    const searchPatient = async (e) => {
        e.preventDefault();
        try {
            const res = await axiosInstance.get(`/dashboard/patient-data/${patientId}`);
            setPatientData(res.data);
            setSearchStep(2);
        } catch (error) {
            alert('Patient not found');
        }
    };

    const acceptRequest = async (id) => {
        try {
            await axiosInstance.put(`/dashboard/accept-request/${id}`);
            alert('Request Accepted! You can now process it.');
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error accepting request');
        }
    };

    const handleDeliver = async () => {
        try {
            if (currentRequestId) {
                // If it was a request, complete it normally
                await axiosInstance.post(`/dashboard/complete-request/${currentRequestId}`);
            } else {
                // Manual issue (no request) - use new endpoint to record stat
                // Must have a selected prescription? Not strictly required by backend but good for logic.
                // Assuming we want to mark specific prescription as done.
                await axiosInstance.post('/dashboard/pharmacy/manual-issue', {
                    patientId: patientData.patient._id,
                    notes: 'Manual Medicine Issue',
                    prescriptionId: selectedPrescriptionId
                });
            }
            alert('Medicine Issued Successfully!');
            resetForm();
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error issuing medicine');
        }
    };

    const processRequest = (req) => {
        setPatientId(req.patientId?.roleId || req.patientId?._id);
        setCurrentRequestId(req._id);
        setActiveCard('take-patient');
        // Auto-search
        axiosInstance.get(`/dashboard/patient-data/${req.patientId?._id}`).then(res => {
            setPatientData(res.data);
            setSearchStep(2);
        }).catch(() => {
            setSearchStep(1);
        });
    };

    const resetForm = () => {
        setPatientId('');
        setPatientData(null);
        setSearchStep(1);
        setCurrentRequestId(null);
        setSelectedPrescriptionId(null);
        // Do not reset activeCard here
    };

    return (
        <div className="row g-4">
            {/* SECTION 1: ACTION CARDS */}
            <div className="col-12">
                <div className="row g-4">
                    <div className="col-md-4">
                        <div className={`card h-100 border-0 shadow-sm ${activeCard === 'attended' ? 'border-primary border-2' : ''}`} onClick={() => setActiveCard('attended')} style={{ cursor: 'pointer' }}>
                            <div className="card-body p-4 text-center">
                                <h2 className="fw-bold text-primary mb-0">{completedToday}</h2>
                                <p className="text-muted small mb-0">Medicines Issued Today</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className={`card h-100 border-0 shadow-sm ${activeCard === 'take-patient' ? 'border-primary border-2' : ''}`} onClick={() => { setActiveCard('take-patient'); resetForm(); }} style={{ cursor: 'pointer' }}>
                            <div className="card-body p-4 text-center">
                                <i className="bi bi-basket-fill fs-2 text-success mb-2 d-block"></i>
                                <h6 className="fw-bold mb-0">Issue Medicine (Manual)</h6>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className={`card h-100 border-0 shadow-sm ${activeCard === 'requests' ? 'border-primary border-2' : ''}`} onClick={() => { setActiveCard('requests'); fetchData(); }} style={{ cursor: 'pointer' }}>
                            <div className="card-body p-4 text-center">
                                <h2 className="fw-bold text-danger mb-0">{requests.length}</h2>
                                <p className="text-muted small mb-0">Active Requests</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 2: ARTICLE BODY */}
            <div className="col-12">
                <div className="card border-0 shadow-sm">
                    <div className="card-body p-4">

                        {activeCard === 'attended' && (
                            <div>
                                <h5 className="fw-bold mb-4">Meds Issued Today</h5>
                                {attendedList.length > 0 ? (
                                    <ul className="list-group">
                                        {attendedList.map(item => (
                                            <li key={item._id} className="list-group-item d-flex justify-content-between align-items-center">
                                                <div>
                                                    <h6 className="mb-0">{item.patientName} <small className="text-muted">({item.patientId})</small></h6>
                                                    <small className="text-muted">{new Date(item.time).toLocaleTimeString()}</small>
                                                </div>
                                                <span className="badge bg-success rounded-pill">Issued</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="text-muted">No medicines issued today.</p>}
                            </div>
                        )}

                        {activeCard === 'requests' && (
                            <div>
                                <h5 className="fw-bold mb-4">Doctor Requests</h5>
                                {requests.length > 0 ? (
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle">
                                            <thead className="table-light">
                                                <tr><th>Patient</th><th>Status</th><th>Doctor</th><th>Details</th><th>Action</th></tr>
                                            </thead>
                                            <tbody>
                                                {requests.map(req => (
                                                    <tr key={req._id}>
                                                        <td>
                                                            <div className="fw-bold">{req.patientId?.fullName}</div>
                                                            <small className="text-muted">{req.patientId?.roleId}</small>
                                                        </td>
                                                        <td>
                                                            {req.status === 'Pending' && <span className="badge bg-warning text-dark">Pending</span>}
                                                            {req.status === 'Accepted' && <span className="badge bg-success">Accepted</span>}
                                                        </td>
                                                        <td>Dr. {req.doctorId?.fullName}</td>
                                                        <td className="text-muted small" style={{ maxWidth: 200 }}>{req.details}</td>
                                                        <td>
                                                            {req.status === 'Pending' ? (
                                                                <button className="btn btn-sm btn-outline-success" onClick={() => acceptRequest(req._id)}>
                                                                    <i className="bi bi-check-lg me-1"></i>Accept
                                                                </button>
                                                            ) : (
                                                                <button className="btn btn-sm btn-primary" onClick={() => processRequest(req)}>
                                                                    <i className="bi bi-play-fill me-1"></i>Process
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : <p className="text-muted text-center py-4">No active requests.</p>}
                            </div>
                        )}

                        {activeCard === 'take-patient' && (
                            <div>
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h5 className="fw-bold mb-0">Issue Medicine</h5>
                                    {searchStep > 1 && <button className="btn btn-sm btn-outline-secondary" onClick={resetForm}>Cancel</button>}
                                </div>

                                {searchStep === 1 && (
                                    <form onSubmit={searchPatient} className="mx-auto" style={{ maxWidth: 400 }}>
                                        <label className="form-label fw-bold">Enter Patient ID</label>
                                        <div className="input-group">
                                            <input className="form-control" value={patientId} onChange={e => setPatientId(e.target.value)} required placeholder="PAT-123456" />
                                            <button className="btn btn-primary" type="submit">Search</button>
                                        </div>
                                    </form>
                                )}

                                {searchStep === 2 && patientData && (
                                    <div className="row g-4">
                                        {/* Left: Patient Info */}
                                        <div className="col-md-4">
                                            <div className="card bg-light border-0">
                                                <div className="card-body">
                                                    <h6 className="fw-bold text-primary mb-2">Patient Info</h6>
                                                    <p className="mb-1"><strong>{patientData.patient.fullName}</strong></p>
                                                    <p className="mb-1 small text-muted">ID: {patientData.patient.roleId}</p>
                                                    <p className="mb-0 small text-muted">{patientData.patient.age} yrs, {patientData.patient.gender}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Middle: Prescriptions */}
                                        <div className="col-md-4">
                                            <div className="card border-0 h-100">
                                                <div className="card-header bg-success text-white py-2 fw-bold">
                                                    Prescriptions (Select to Process)
                                                </div>
                                                <div className="card-body p-0" style={{ maxHeight: 300, overflowY: 'auto' }}>
                                                    {patientData.prescriptions?.length > 0 ? (
                                                        <div className="list-group list-group-flush">
                                                            {patientData.prescriptions.map(rx => (
                                                                <button
                                                                    key={rx._id}
                                                                    className={`list-group-item list-group-item-action ${selectedPrescriptionId === rx._id ? 'active' : ''}`}
                                                                    onClick={() => setSelectedPrescriptionId(rx._id === selectedPrescriptionId ? null : rx._id)}
                                                                >
                                                                    <div className="d-flex w-100 justify-content-between">
                                                                        <strong>{rx.diagnosis}</strong>
                                                                        <small>{rx.status === 'Completed' ? 'Delivered' : 'Pending'}</small>
                                                                    </div>
                                                                    <div className="mt-1 small">
                                                                        {rx.medicines?.map(m => m.name).join(', ')}
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    ) : <p className="text-muted p-3 mb-0">No prescriptions.</p>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Lab Reports */}
                                        <div className="col-md-4">
                                            <div className="card border-0 h-100">
                                                <div className="card-header bg-info text-white py-2 fw-bold">
                                                    Lab Reports
                                                </div>
                                                <div className="card-body p-0" style={{ maxHeight: 300, overflowY: 'auto' }}>
                                                    {patientData.labReports?.length > 0 ? (
                                                        <div className="list-group list-group-flush">
                                                            {patientData.labReports.map(rep => (
                                                                <a key={rep._id} href={rep.fileUrl} target="_blank" rel="noreferrer" className="list-group-item list-group-item-action">
                                                                    <strong>{rep.reportTitle}</strong>
                                                                    <small className="d-block text-muted">{rep.reportType} - {new Date(rep.createdAt).toLocaleDateString()}</small>
                                                                </a>
                                                            ))}
                                                        </div>
                                                    ) : <p className="text-muted p-3 mb-0">No lab reports.</p>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div className="col-12">
                                            <button
                                                className="btn btn-success btn-lg w-100 mt-3"
                                                onClick={handleDeliver}
                                                disabled={!currentRequestId && !selectedPrescriptionId}
                                            >
                                                <i className="bi bi-check-circle me-2"></i>
                                                {currentRequestId ? 'Complete Request' : 'Mark Prescription as Delivered'}
                                            </button>
                                            {!currentRequestId && !selectedPrescriptionId && (
                                                <p className="text-muted text-center small mt-2">
                                                    Please select a prescription to mark as delivered, or complete a doctor's request.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PharmacistDashboard;
