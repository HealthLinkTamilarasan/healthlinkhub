import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';

const LabDashboard = () => {
    const [attendedList, setAttendedList] = useState([]);
    const [requests, setRequests] = useState([]);
    const [completedToday, setCompletedToday] = useState(0);
    const [activeCard, setActiveCard] = useState('requests');

    // Patient & Form State
    const [patientId, setPatientId] = useState('');
    const [patientData, setPatientData] = useState(null);
    const [searchStep, setSearchStep] = useState(1);
    const [currentRequestId, setCurrentRequestId] = useState(null);

    // Upload Form State
    const [reportTitle, setReportTitle] = useState('');
    const [reportType, setReportType] = useState('General');
    const [uploadedFileUrl, setUploadedFileUrl] = useState('');

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

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axiosInstance.post('/dashboard/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUploadedFileUrl(res.data.fileUrl);
            alert('File uploaded successfully!');
        } catch (error) {
            alert('Error uploading file');
            console.error(error);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!uploadedFileUrl) {
            alert('Please upload a file first.');
            return;
        }

        try {
            if (currentRequestId) {
                await axiosInstance.post('/dashboard/report', {
                    patientId: patientData.patient._id,
                    reportTitle,
                    reportType,
                    fileUrl: uploadedFileUrl,
                    requestId: currentRequestId
                });
            } else {
                // Manual Issue
                await axiosInstance.post('/dashboard/lab/manual-issue', {
                    patientId: patientData.patient._id,
                    reportTitle,
                    // Map "Other" to "General" or keep as is. The backend creates a LabReport with this type.
                    // The Request detail uses the reportTitle.
                    fileUrl: uploadedFileUrl,
                    notes: `Manual Report: ${reportTitle} (${reportType})`
                });
            }
            alert('Report Uploaded Successfully!');
            resetForm();
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error uploading');
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
        setReportTitle('');
        setReportType('General');
        setUploadedFileUrl('');
        setCurrentRequestId(null);
        // Do not reset activeCard here, as it closes the form when we just want to clear inputs
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
                                <p className="text-muted small mb-0">Reports Uploaded Today</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className={`card h-100 border-0 shadow-sm ${activeCard === 'take-patient' ? 'border-primary border-2' : ''}`} onClick={() => { setActiveCard('take-patient'); resetForm(); }} style={{ cursor: 'pointer' }}>
                            <div className="card-body p-4 text-center">
                                <i className="bi bi-person-bounding-box fs-2 text-success mb-2 d-block"></i>
                                <h6 className="fw-bold mb-0">Take Patient (Manual)</h6>
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
                                <h5 className="fw-bold mb-4">Reports Uploaded Today</h5>
                                {attendedList.length > 0 ? (
                                    <ul className="list-group">
                                        {attendedList.map(item => (
                                            <li key={item._id} className="list-group-item d-flex justify-content-between align-items-center">
                                                <div>
                                                    <h6 className="mb-0">{item.patientName} <small className="text-muted">({item.patientId})</small></h6>
                                                    <small className="text-muted">{item.details} - {new Date(item.time).toLocaleTimeString()}</small>
                                                </div>
                                                <span className="badge bg-success rounded-pill">Uploaded</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="text-muted">No reports uploaded today.</p>}
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
                                                                <div className="d-flex gap-2">
                                                                    <button className="btn btn-sm btn-outline-success" onClick={() => acceptRequest(req._id)}>
                                                                        <i className="bi bi-check-lg me-1"></i>Accept
                                                                    </button>
                                                                </div>
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
                                    <h5 className="fw-bold mb-0">Take Patient - Upload Lab Report</h5>
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
                                        {/* Left: Patient Info & Prescriptions */}
                                        <div className="col-md-6">
                                            <div className="card bg-light border-0 mb-3">
                                                <div className="card-body">
                                                    <h6 className="fw-bold text-primary mb-2">Patient Info</h6>
                                                    <p className="mb-1"><strong>{patientData.patient.fullName}</strong></p>
                                                    <p className="mb-1 small text-muted">ID: {patientData.patient.roleId}</p>
                                                    <p className="mb-0 small text-muted">{patientData.patient.age} yrs, {patientData.patient.gender}</p>
                                                </div>
                                            </div>

                                            <div className="card border-0">
                                                <div className="card-header bg-success text-white py-2 fw-bold">
                                                    Doctor Prescriptions (Read-Only)
                                                </div>
                                                <div className="card-body p-0" style={{ maxHeight: 300, overflowY: 'auto' }}>
                                                    {patientData.prescriptions?.length > 0 ? (
                                                        <div className="list-group list-group-flush">
                                                            {patientData.prescriptions.map(rx => (
                                                                <div key={rx._id} className="list-group-item">
                                                                    <div className="d-flex justify-content-between">
                                                                        <strong>{rx.diagnosis}</strong>
                                                                        <small className="text-muted">{new Date(rx.createdAt).toLocaleDateString()}</small>
                                                                    </div>
                                                                    <small className="text-muted">Dr. {rx.doctorId?.fullName}</small>
                                                                    <div className="mt-1">
                                                                        {rx.medicines?.map((m, i) => (
                                                                            <span key={i} className="badge bg-secondary me-1">{m.name}</span>
                                                                        ))}
                                                                    </div>
                                                                    {rx.fileUrls?.length > 0 && (
                                                                        <div className="mt-1">
                                                                            {rx.fileUrls.map((url, i) => (
                                                                                <a key={i} href={url} target="_blank" rel="noreferrer" className="badge bg-info text-decoration-none me-1">
                                                                                    File {i + 1}
                                                                                </a>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : <p className="text-muted p-3 mb-0">No prescriptions found.</p>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Upload Form */}
                                        <div className="col-md-6">
                                            <div className="card border-0">
                                                <div className="card-header bg-primary text-white py-2 fw-bold">
                                                    Upload Lab Report
                                                </div>
                                                <div className="card-body">
                                                    <form onSubmit={handleUpload}>
                                                        <div className="mb-3">
                                                            <label className="form-label">Report Title</label>
                                                            <input className="form-control" value={reportTitle} onChange={e => setReportTitle(e.target.value)} required placeholder="e.g. Complete Blood Count" />
                                                        </div>
                                                        <div className="mb-3">
                                                            <label className="form-label">Report Type</label>
                                                            <select className="form-select" value={reportType} onChange={e => setReportType(e.target.value)}>
                                                                <option>General</option>
                                                                <option>Blood Test</option>
                                                                <option>Urine Test</option>
                                                                <option>X-Ray</option>
                                                                <option>MRI</option>
                                                                <option>CT Scan</option>
                                                                <option>Other</option>
                                                            </select>
                                                        </div>
                                                        <div className="mb-3">
                                                            <label className="form-label">Upload File (PDF/Image)</label>
                                                            <input type="file" className="form-control" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx" />
                                                            {uploadedFileUrl ? (
                                                                <div className="small text-success mt-1">File uploaded: <a href={uploadedFileUrl} target="_blank" rel="noreferrer">View</a></div>
                                                            ) : <div className="small text-muted mt-1">Files supported: PDF, Images, Word, Excel (Max 10MB)</div>}
                                                        </div>
                                                        <button className="btn btn-primary w-100" type="submit">
                                                            <i className="bi bi-cloud-upload me-2"></i>Upload Report
                                                        </button>
                                                    </form>
                                                </div>
                                            </div>
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

export default LabDashboard;
