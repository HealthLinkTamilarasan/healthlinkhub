import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import Calendar from '../../components/Calendar';

const DoctorDashboard = () => {
    const [stats, setStats] = useState(null);
    const [activeCard, setActiveCard] = useState(''); // attended, attend-patient, emergency, request

    const [selectedDateEvents, setSelectedDateEvents] = useState(null);

    // Attend Patient Form State
    const [patientId, setPatientId] = useState('');
    const [consultationStep, setConsultationStep] = useState(1); // 1: ID, 2: Form
    const [patientInfo, setPatientInfo] = useState(null);
    const [diagnosis, setDiagnosis] = useState('');
    const [medicines, setMedicines] = useState([{ name: '', dosage: '', frequency: '', duration: '' }]);
    const [vitals, setVitals] = useState({ bloodPressure: '', sugarLevel: '', heartRate: '', weight: '', temperature: '' });
    const [prescriptionNotes, setPrescriptionNotes] = useState('');
    const [prescriptionDuration, setPrescriptionDuration] = useState(5); // Default 5 days
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadedFileUrl, setUploadedFileUrl] = useState('');

    // Next Visit State
    const [nextVisitDate, setNextVisitDate] = useState('');
    const [nextVisitTime, setNextVisitTime] = useState('');

    // Request Form State
    const [reqStep, setReqStep] = useState(1); // 1: Patient ID, 2: Type, 3: Target ID, 4: Details
    const [reqPatientId, setReqPatientId] = useState('');
    const [reqPatientValid, setReqPatientValid] = useState(false);
    const [requestType, setRequestType] = useState('Lab Report');
    const [targetId, setTargetId] = useState(''); // Lab Technician ID or Pharmacist ID
    const [targetStaffName, setTargetStaffName] = useState(''); // Store valid staff name
    const [reqDetails, setReqDetails] = useState('');

    // Attended View State
    const [selectedAttendedPatient, setSelectedAttendedPatient] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await axiosInstance.get('/dashboard/doctor');
            setStats(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // Validate Patient exists
    const validatePatient = async (id) => {
        try {
            const res = await axiosInstance.get(`/dashboard/validate-patient/${id}`);
            return res.data;
        } catch {
            return null;
        }
    };

    // Validate Staff exists
    const validateStaff = async (id, type) => {
        try {
            const res = await axiosInstance.get(`/dashboard/validate-staff/${id}`);
            // Check if role matches needed type
            const neededRole = type === 'Lab Report' ? 'labTechnician' : 'pharmacist';
            if (res.data.role !== neededRole) {
                alert(`User found but is a ${res.data.role}, not a ${neededRole}. Please enter a valid ID.`);
                return null;
            }
            return res.data;
        } catch {
            return null;
        }
    };

    const handleStartConsultation = async (e) => {
        e.preventDefault();
        if (!patientId) return;
        const patient = await validatePatient(patientId);
        if (patient) {
            setPatientInfo(patient);
            setConsultationStep(2);
        } else {
            alert('Patient not found. Please check the ID.');
        }
    };

    const handleMedicineChange = (index, field, value) => {
        const newMeds = [...medicines];
        newMeds[index][field] = value;
        setMedicines(newMeds);
    };

    const addMedicineRow = () => {
        setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '' }]);
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
            setSelectedFile(file);
            alert('File uploaded successfully!');
        } catch (error) {
            alert('Error uploading file');
            console.error(error);
        }
    };

    const submitConsultation = async () => {
        try {
            // Submit RX
            await axiosInstance.post('/dashboard/prescription', {
                patientId,
                diagnosis,
                medicines,
                notes: prescriptionNotes,
                durationDays: prescriptionDuration,
                fileUrls: uploadedFileUrl ? [uploadedFileUrl] : [],
                nextVisitDate,
                nextVisitTime,
            });
            // Submit Vitals
            await axiosInstance.post('/dashboard/vitals', {
                patientId,
                ...vitals
            });

            alert('Consultation Submitted Successfully!');
            // Reset and close
            resetConsultationForm();
            setActiveCard('attended'); // Auto-switch to attended list
            fetchStats();
        } catch (error) {
            alert(error.response?.data?.message || 'Error submitting consultation');
        }
    };

    const resetConsultationForm = () => {
        setPatientId('');
        setPatientInfo(null);
        setConsultationStep(1);
        setDiagnosis('');
        setMedicines([{ name: '', dosage: '', frequency: '', duration: '' }]);
        setVitals({ bloodPressure: '', sugarLevel: '', heartRate: '', weight: '', temperature: '' });
        setPrescriptionNotes('');
        setSelectedFile(null);
        setSelectedFile(null);
        setUploadedFileUrl('');
        setNextVisitDate('');
        setNextVisitTime('');
    };

    // Request Flow Handlers
    const handleReqPatientValidate = async (e) => {
        e.preventDefault();
        const patient = await validatePatient(reqPatientId);
        if (patient) {
            setReqPatientValid(true);
            setReqStep(2);
        } else {
            alert('Patient not found. Please check the Patient ID.');
        }
    };

    const handleReqTypeSelect = (type) => {
        setRequestType(type);
        setReqStep(3);
    };

    const handleBack = () => {
        if (reqStep > 1) {
            setReqStep(reqStep - 1);
        }
    };

    const handleReqTargetSubmit = async (e) => {
        e.preventDefault();
        // If empty, skip validation (it means generic request)
        if (!targetId || targetId.trim() === '') {
            setTargetStaffName('Any Available Staff');
            setReqStep(4);
            return;
        }

        const staff = await validateStaff(targetId, requestType);
        if (staff) {
            setTargetStaffName(staff.fullName);
            setReqStep(4);
        } else {
            alert('Staff user not found. Please ensure the ID is correct (e.g., LAB-001) and matches the selected Request Type.');
        }
    };

    const submitRequest = async (e) => {
        e.preventDefault();
        try {
            const targetRole = requestType === 'Lab Report' ? 'labTechnician' : 'pharmacist';
            await axiosInstance.post('/dashboard/request', {
                patientId: reqPatientId,
                targetRole,
                targetUserId: targetId || null, // Allow empty
                requestType,
                details: reqDetails
            });
            alert('Request Sent Successfully');
            resetRequestForm();
            setActiveCard(''); // Strictly close the card
        } catch (error) {
            alert(error.response?.data?.message || 'Error sending request.');
        }
    };

    const resetRequestForm = () => {
        setReqStep(1);
        setReqPatientId('');
        setReqPatientValid(false);
        setRequestType('Lab Report');
        setTargetId('');
        setTargetStaffName('');
        setReqDetails('');
    };

    return (
        <div className="row g-4">
            {/* SECTION 1: ACTION CARDS */}
            <div className="col-12">
                <div className="row g-4">
                    {/* Card 1: Attended Today */}
                    <div className="col-md-3">
                        <div
                            className={`card h-100 border-0 shadow-sm cursor-pointer ${activeCard === 'attended' ? 'border-primary border-2' : ''}`}
                            onClick={() => { setActiveCard('attended'); fetchStats(); setSelectedAttendedPatient(null); }}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="card-body p-4 text-center">
                                <h2 className="fw-bold text-primary mb-0">{stats?.totalPatientsAttended || 0}</h2>
                                <p className="text-muted small mb-0">Total Patients Attended Today</p>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Attend Patient */}
                    <div className="col-md-3">
                        <div
                            className={`card h-100 border-0 shadow-sm cursor-pointer ${activeCard === 'attend-patient' ? 'border-primary border-2' : ''}`}
                            onClick={() => setActiveCard('attend-patient')}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="card-body p-4 text-center">
                                <div className="mb-2 mx-auto bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: 45, height: 45 }}>
                                    <i className="bi bi-person-fill-add fs-4"></i>
                                </div>
                                <h6 className="fw-bold mb-0">Attended Patients</h6>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Emergency */}
                    <div className="col-md-3">
                        <div
                            className={`card h-100 border-0 shadow-sm cursor-pointer ${activeCard === 'emergency' ? 'border-primary border-2' : ''}`}
                            onClick={() => setActiveCard('emergency')}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="card-body p-4 text-center">
                                <div className="mb-2 mx-auto bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center" style={{ width: 45, height: 45 }}>
                                    <i className="bi bi-exclamation-triangle-fill fs-4"></i>
                                </div>
                                <h6 className="fw-bold mb-0">Emergency Cases</h6>
                            </div>
                        </div>
                    </div>

                    {/* Card 4: Request Lab/Pharm */}
                    <div className="col-md-3">
                        <div
                            className={`card h-100 border-0 shadow-sm cursor-pointer ${activeCard === 'request' ? 'border-primary border-2' : ''}`}
                            onClick={() => { setActiveCard('request'); resetRequestForm(); }}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="card-body p-4 text-center">
                                <div className="mb-2 mx-auto bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center" style={{ width: 45, height: 45 }}>
                                    <i className="bi bi-send-fill fs-4"></i>
                                </div>
                                <h6 className="fw-bold mb-0">Lab / Pharmacy Requests</h6>
                            </div>
                        </div>
                    </div>




                </div>
            </div>

            {/* Card 5: Task History - Next Row or Wrap */}
            <div className="col-12">
                {/* Wrapper if we want it in same row, we should have edited previous block. 
                   But since I am correcting, let's just make it a separate row or fix the previous row closure.
                   Actually, let's reopen the row.
               */}
            </div>

            {/* To fix cleanly without huge replace, I will assume the previous row is closed. 
               I'll add a new row for the 5th card to look nice, or just append. 
               The cleanest is to have it in the same row. 
            */}

            {/* SECTION 2: ARTICLE AREA */}
            <div className="col-12">
                <div id="doctor-dashboard-content" className="card border-0 shadow-sm h-100">
                    <div className="card-body p-4">
                        {!activeCard && <p className="text-center text-muted my-5">Select an action card above to begin.</p>}

                        {/* ... EXISTING VIEWS ... */}



                        {/* 1. Attended List */}
                        {activeCard === 'attended' && (
                            <div>
                                <h5 className="fw-bold mb-3">Patients Attended Today</h5>
                                {stats?.patientsAttendedToday?.length > 0 ? (
                                    <div className="row">
                                        <div className="col-md-5">
                                            <div className="list-group">
                                                {stats.patientsAttendedToday.map(p => (
                                                    <button
                                                        key={p._id}
                                                        className={`list-group-item list-group-item-action ${selectedAttendedPatient?._id === p._id ? 'active' : ''}`}
                                                        onClick={() => setSelectedAttendedPatient(p)}
                                                    >
                                                        <div className="d-flex w-100 justify-content-between">
                                                            <h6 className="mb-1">{p.patientId?.fullName}</h6>
                                                            <small>{new Date(p.createdAt).toLocaleTimeString()}</small>
                                                        </div>
                                                        <small className={`${selectedAttendedPatient?._id === p._id ? 'text-white' : 'text-muted'}`}>ID: {p.patientId?.roleId || p.patientId?.userId}</small>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="col-md-7">
                                            {selectedAttendedPatient ? (
                                                <div className="card">
                                                    <div className="card-header bg-light fw-bold">Consultation Details</div>
                                                    <div className="card-body">
                                                        <p><strong>Diagnosis:</strong> {selectedAttendedPatient.diagnosis || '-'}</p>
                                                        <h6>Medicines:</h6>
                                                        <ul className="small">
                                                            {selectedAttendedPatient.medicines?.map((m, i) => (
                                                                <li key={i}>{m.name} ({m.dosage}, {m.frequency})</li>
                                                            ))}
                                                        </ul>
                                                        {selectedAttendedPatient.fileUrls?.length > 0 && (
                                                            <div className="mt-2">
                                                                <strong>Attachments:</strong><br />
                                                                {selectedAttendedPatient.fileUrls.map((url, i) => (
                                                                    <a key={i} href={url} target="_blank" rel="noreferrer" className="btn btn-sm btn-link px-0">
                                                                        View Attachment {i + 1}
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center text-muted py-5 border rounded bg-light">
                                                    Select a patient to view details
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : <p className="text-muted">No patients attended yet.</p>}
                            </div>
                        )}

                        {/* 2. Attend Patient */}
                        {activeCard === 'attend-patient' && (
                            <div>
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h5 className="fw-bold mb-0">Patient Consultation</h5>
                                    {consultationStep > 1 && (
                                        <button className="btn btn-sm btn-outline-secondary" onClick={resetConsultationForm}>
                                            <i className="bi bi-x-lg me-1"></i> Cancel
                                        </button>
                                    )}
                                </div>

                                {consultationStep === 1 ? (
                                    <form onSubmit={handleStartConsultation} className="mx-auto" style={{ maxWidth: 400 }}>
                                        <label className="form-label fw-bold">Enter Patient ID</label>
                                        <div className="input-group">
                                            <input type="text" className="form-control" value={patientId} onChange={e => setPatientId(e.target.value)} required placeholder="e.g. PAT-123456" />
                                            <button className="btn btn-primary" type="submit">Begin</button>
                                        </div>
                                    </form>
                                ) : (
                                    <div>
                                        <div className="alert alert-info py-2 d-flex justify-content-between align-items-center">
                                            <span><strong>Patient:</strong> {patientInfo?.fullName || patientId}</span>
                                            <span className="badge bg-primary">{patientId}</span>
                                        </div>

                                        <div className="row g-4 mt-2">
                                            {/* Prescription */}
                                            <div className="col-md-7">
                                                <div className="card bg-light border-0">
                                                    <div className="card-header bg-success text-white fw-bold py-2">
                                                        <i className="bi bi-capsule me-2"></i>Prescription
                                                    </div>
                                                    <div className="card-body">
                                                        <div className="mb-3">
                                                            <label className="form-label small fw-bold">Diagnosis</label>
                                                            <input className="form-control" placeholder="e.g. Viral Fever" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
                                                        </div>

                                                        {medicines.map((m, i) => (
                                                            <div className="row g-2 mb-2" key={i}>
                                                                <div className="col-5"><input className="form-control form-control-sm" placeholder="Medicine" value={m.name} onChange={e => handleMedicineChange(i, 'name', e.target.value)} /></div>
                                                                <div className="col-2"><input className="form-control form-control-sm" placeholder="Dose" value={m.dosage} onChange={e => handleMedicineChange(i, 'dosage', e.target.value)} /></div>
                                                                <div className="col-2"><input className="form-control form-control-sm" placeholder="Freq" value={m.frequency} onChange={e => handleMedicineChange(i, 'frequency', e.target.value)} /></div>
                                                                <div className="col-3"><input className="form-control form-control-sm" placeholder="Duration" value={m.duration} onChange={e => handleMedicineChange(i, 'duration', e.target.value)} /></div>
                                                            </div>
                                                        ))}
                                                        <button type="button" className="btn btn-sm btn-outline-success mb-3" onClick={addMedicineRow}>+ Add Medicine</button>

                                                        <div className="mb-3">
                                                            <label className="form-label small fw-bold">Prescription Validity (Days)</label>
                                                            <input type="number" className="form-control form-control-sm" value={prescriptionDuration} onChange={e => setPrescriptionDuration(e.target.value)} min="1" placeholder="5" />
                                                            <div className="form-text small">Prescription will expire after these many days.</div>
                                                        </div>

                                                        <div className="mb-3">
                                                            <label className="form-label small fw-bold">Upload File (PDF/Image)</label>
                                                            <input type="file" className="form-control form-control-sm" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx" />
                                                            {uploadedFileUrl && <div className="small text-success mt-1">File uploaded successfully!</div>}
                                                        </div>

                                                        <div>
                                                            <label className="form-label small fw-bold">Notes / Instructions</label>
                                                            <textarea className="form-control" rows="2" value={prescriptionNotes} onChange={e => setPrescriptionNotes(e.target.value)} placeholder="Additional notes for patient..."></textarea>
                                                        </div>

                                                        {/* Schedule Next Visit Section */}
                                                        <div className="mt-4 pt-3 border-top">
                                                            <h6 className="fw-bold text-primary"><i className="bi bi-calendar-event me-2"></i>Schedule Next Visit</h6>
                                                            <div className="row g-2">
                                                                <div className="col-md-6">
                                                                    <label className="form-label small">Date</label>
                                                                    <input type="date" className="form-control form-control-sm" value={nextVisitDate} onChange={e => setNextVisitDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                                                                </div>
                                                                <div className="col-md-6">
                                                                    <label className="form-label small">Time</label>
                                                                    <input type="time" className="form-control form-control-sm" value={nextVisitTime} onChange={e => setNextVisitTime(e.target.value)} />
                                                                </div>
                                                                {nextVisitDate && (
                                                                    <div className="col-12 mt-2">
                                                                        <div className="alert alert-light border small py-2 mb-0">
                                                                            <strong>Day:</strong> {new Date(nextVisitDate).toLocaleDateString('en-US', { weekday: 'long' })} <br />
                                                                            <strong>Doctor:</strong> {stats?.doctorName || 'Loading...'} <br />
                                                                            <strong>Hospital:</strong> {stats?.hospitalName || 'HealthLink Hospital'}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Vitals */}
                                            <div className="col-md-5">
                                                <div className="card bg-light border-0">
                                                    <div className="card-header bg-danger text-white fw-bold py-2">
                                                        <i className="bi bi-heart-pulse me-2"></i>Vitals
                                                    </div>
                                                    <div className="card-body">
                                                        <div className="row g-2">
                                                            <div className="col-6">
                                                                <label className="form-label small">Blood Pressure</label>
                                                                <input className="form-control form-control-sm" placeholder="120/80" value={vitals.bloodPressure} onChange={e => setVitals({ ...vitals, bloodPressure: e.target.value })} />
                                                            </div>
                                                            <div className="col-6">
                                                                <label className="form-label small">Sugar Level</label>
                                                                <input className="form-control form-control-sm" placeholder="mg/dL" value={vitals.sugarLevel} onChange={e => setVitals({ ...vitals, sugarLevel: e.target.value })} />
                                                            </div>
                                                            <div className="col-6">
                                                                <label className="form-label small">Heart Rate</label>
                                                                <input className="form-control form-control-sm" placeholder="bpm" value={vitals.heartRate} onChange={e => setVitals({ ...vitals, heartRate: e.target.value })} />
                                                            </div>
                                                            <div className="col-6">
                                                                <label className="form-label small">Temperature</label>
                                                                <input className="form-control form-control-sm" placeholder="°C" value={vitals.temperature} onChange={e => setVitals({ ...vitals, temperature: e.target.value })} />
                                                            </div>
                                                            <div className="col-12">
                                                                <label className="form-label small">Weight</label>
                                                                <input className="form-control form-control-sm" placeholder="kg" value={vitals.weight} onChange={e => setVitals({ ...vitals, weight: e.target.value })} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <button className="btn btn-primary btn-lg w-100 mt-4" onClick={submitConsultation}>
                                            <i className="bi bi-check-circle me-2"></i>Submit Consultation
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 3. Emergency */}
                        {activeCard === 'emergency' && (
                            <div className="text-center py-5 text-muted">
                                <i className="bi bi-exclamation-triangle display-4 d-block mb-3 text-warning"></i>
                                <h5>Emergency Cases</h5>
                                <p>No emergency cases at this time.</p>
                            </div>
                        )}

                        {/* 4. Request Lab/Pharmacy - STEP FLOW */}
                        {activeCard === 'request' && (
                            <div>
                                <h5 className="fw-bold mb-4">Send Request to Lab / Pharmacy</h5>

                                <div className="d-flex justify-content-center mb-4">
                                    {[1, 2, 3, 4].map(step => (
                                        <div key={step} className="d-flex align-items-center">
                                            <div className={`rounded-circle d-flex align-items-center justify-content-center ${reqStep >= step ? 'bg-primary text-white' : 'bg-light text-muted'}`} style={{ width: 30, height: 30 }}>
                                                {step}
                                            </div>
                                            {step < 4 && <div className={`mx-2 ${reqStep > step ? 'bg-primary' : 'bg-light'}`} style={{ width: 40, height: 3 }}></div>}
                                        </div>
                                    ))}
                                </div>

                                <div className="mx-auto" style={{ maxWidth: 500 }}>
                                    {/* Step 1: Patient ID */}
                                    {reqStep === 1 && (
                                        <form onSubmit={handleReqPatientValidate}>
                                            <label className="form-label fw-bold">Step 1: Enter Patient ID</label>
                                            <div className="input-group">
                                                <input className="form-control" value={reqPatientId} onChange={e => setReqPatientId(e.target.value)} required placeholder="PAT-123456" />
                                                <button className="btn btn-primary" type="submit">Validate</button>
                                            </div>
                                        </form>
                                    )}

                                    {/* Step 2: Request Type */}
                                    {reqStep === 2 && (
                                        <div>
                                            <label className="form-label fw-bold">Step 2: Select Request Type</label>
                                            <div className="d-grid gap-2 mb-3">
                                                <button className={`btn btn-lg ${requestType === 'Lab Report' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => handleReqTypeSelect('Lab Report')}>
                                                    <i className="bi bi-file-earmark-medical me-2"></i>Lab Report
                                                </button>
                                                <button className={`btn btn-lg ${requestType === 'Medicine' ? 'btn-success' : 'btn-outline-success'}`} onClick={() => handleReqTypeSelect('Medicine')}>
                                                    <i className="bi bi-capsule me-2"></i>Medicine
                                                </button>
                                            </div>
                                            <button className="btn btn-sm btn-outline-secondary w-100" onClick={handleBack}>
                                                <i className="bi bi-arrow-left me-2"></i>Back
                                            </button>
                                        </div>
                                    )}

                                    {/* Step 3: Target ID */}
                                    {reqStep === 3 && (
                                        <form onSubmit={handleReqTargetSubmit}>
                                            <label className="form-label fw-bold">
                                                Step 3: Enter Target ID (Optional)
                                            </label>
                                            <div className="small text-muted mb-2">
                                                ID for specific {requestType === 'Lab Report' ? 'Lab Technician' : 'Pharmacist'}. Leave empty for generic request.
                                            </div>
                                            <div className="input-group mb-3">
                                                <input className="form-control" value={targetId} onChange={e => setTargetId(e.target.value)} placeholder={requestType === 'Lab Report' ? 'LAB-123456' : 'PHARM-123456'} />
                                                <button className="btn btn-primary" type="submit">Next</button>
                                            </div>
                                            <button type="button" className="btn btn-sm btn-outline-secondary w-100" onClick={handleBack}>
                                                <i className="bi bi-arrow-left me-2"></i>Back
                                            </button>
                                        </form>
                                    )}

                                    {/* Step 4: Details */}
                                    {reqStep === 4 && (
                                        <form onSubmit={submitRequest}>
                                            <label className="form-label fw-bold">Step 4: Enter Details / Notes</label>
                                            <textarea className="form-control mb-3" rows="4" value={reqDetails} onChange={e => setReqDetails(e.target.value)} required placeholder={requestType === 'Lab Report' ? 'e.g. Full Blood Count, Liver Function Test...' : 'e.g. Paracetamol 500mg x 10, Cetrizine...'} />

                                            <div className="alert alert-secondary py-2 small">
                                                <strong>Summary:</strong> Requesting <span className="text-primary">{requestType}</span> for Patient <span className="badge bg-primary">{reqPatientId}</span> <br />
                                                to: <strong>{targetStaffName || 'Any Staff'}</strong>
                                            </div>

                                            <div className="d-flex gap-2">
                                                <button type="button" className="btn btn-outline-secondary" onClick={handleBack}>
                                                    <i className="bi bi-arrow-left me-2"></i>Back
                                                </button>
                                                <button className="btn btn-primary flex-grow-1" type="submit">
                                                    <i className="bi bi-send me-2"></i>Submit Request
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div >
        </div >
    );
};

export default DoctorDashboard;
