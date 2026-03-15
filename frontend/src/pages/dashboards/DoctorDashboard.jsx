import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import axiosInstance from '../../api/axiosInstance';
import { Sidebar, Header, Toast } from '../../components/DashboardLayoutComponents';
import DoctorSettingsPage from '../../components/DoctorSettingsPage';
import QRScannerModal from '../../components/QRScannerModal';
import '../../patient-dashboard.css';

/* ══════════════════════════════════════════
   NAV ITEMS — doctor version
══════════════════════════════════════════ */
const MAIN_NAV = [
  { key: 'overview',      icon: 'bi-grid-1x2-fill',       label: 'Overview' },
  { key: 'consultation',  icon: 'bi-clipboard2-pulse',    label: 'Consultation' },
  { key: 'attended',      icon: 'bi-people-fill',         label: 'Attended' },
  { key: 'requests',      icon: 'bi-send-fill',           label: 'Requests' },
  { key: 'emergency',     icon: 'bi-exclamation-triangle-fill', label: 'Emergency' },
];

const BOTTOM_NAV = [
  { key: 'settings', icon: 'bi-gear', label: 'Settings' },
];

const MOBILE_NAV = [
  { key: 'overview',      icon: 'bi-grid-1x2-fill',       label: 'Dashboard' },
  { key: 'attended',      icon: 'bi-people-fill',         label: 'Patients' },
  { key: 'consultation',  icon: 'bi-qr-code-scan',        label: 'Scan QR' },
  { key: 'requests',      icon: 'bi-send-fill',           label: 'Requests' },
  { key: 'settings',      icon: 'bi-person-circle',       label: 'Profile' },
];

/* ══════════════════════════════════════════
   DOCTOR DASHBOARD COMPONENT
══════════════════════════════════════════ */
const DoctorDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [active, setActive] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [toast, setToast] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Consultation State
  const [patientId, setPatientId] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [consultationStep, setConsultationStep] = useState(1);
  const [patientInfo, setPatientInfo] = useState(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', frequency: '', duration: '' }]);
  const [vitals, setVitals] = useState({ bloodPressure: '', sugarLevel: '', heartRate: '', weight: '', height: '', bmi: '', spo2: '', temperature: '' });
  const [prescriptionNotes, setPrescriptionNotes] = useState('');
  const [prescriptionDuration, setPrescriptionDuration] = useState(5);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');
  const [nextVisitDate, setNextVisitDate] = useState('');
  const [nextVisitTime, setNextVisitTime] = useState('');

  // Request State
  const [reqStep, setReqStep] = useState(1);
  const [reqPatientId, setReqPatientId] = useState('');
  const [reqPatientValid, setReqPatientValid] = useState(false);
  const [requestType, setRequestType] = useState('Lab Report');
  const [targetId, setTargetId] = useState('');
  const [targetStaffName, setTargetStaffName] = useState('');
  const [reqDetails, setReqDetails] = useState('');

  // Attended
  const [selectedAttendedPatient, setSelectedAttendedPatient] = useState(null);

  // Emergency Cases State
  const [emergencyCases, setEmergencyCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseDetails, setCaseDetails] = useState(null);
  const [loadingCase, setLoadingCase] = useState(false);

  useEffect(() => { fetchStats(); fetchEmergencyCases(); }, []);

  // Poll emergency cases every 15 seconds
  useEffect(() => {
    const interval = setInterval(fetchEmergencyCases, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e) => { setIsMobile(e.matches); if (e.matches) setMobileSidebar(false); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const effectiveSidebarOpen = isMobile ? mobileSidebar : sidebarOpen;

  const handleNav = (key) => { setActive(key); setMobileSidebar(false); };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/dashboard/doctor');
      setStats(res.data);
    } catch (err) {
      setToast({ msg: 'Failed to load dashboard data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmergencyCases = async () => {
    try {
      const res = await axiosInstance.get('/emergency/doctor-cases');
      setEmergencyCases(res.data);
    } catch { /* silent */ }
  };

  const fetchCaseDetails = async (caseId) => {
    try {
      setLoadingCase(true);
      const res = await axiosInstance.get(`/emergency/case-details/${caseId}`);
      setCaseDetails(res.data);
    } catch {
      setToast({ msg: 'Failed to load case details.', type: 'error' });
    } finally {
      setLoadingCase(false);
    }
  };

  const handleAcceptCase = async (caseId) => {
    try {
      await axiosInstance.put(`/emergency/accept-case/${caseId}`);
      setToast({ msg: 'Emergency case accepted!', type: 'success' });
      fetchEmergencyCases();
      if (caseDetails?.emergencyCase?._id === caseId) fetchCaseDetails(caseId);
    } catch (err) {
      setToast({ msg: err.response?.data?.message || 'Error accepting case.', type: 'error' });
    }
  };

  const handleCompleteCase = async (caseId) => {
    try {
      await axiosInstance.put(`/emergency/complete-case/${caseId}`);
      setToast({ msg: 'Treatment completed!', type: 'success' });
      fetchEmergencyCases();
      setSelectedCase(null);
      setCaseDetails(null);
    } catch (err) {
      setToast({ msg: err.response?.data?.message || 'Error completing case.', type: 'error' });
    }
  };

  const doctorName = user?.fullName || 'Doctor';
  const doctorId = user?.userId || user?.roleId || 'DOC-000';
  const specialization = user?.specialization || 'General Medicine';

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  /* ════════════ VALIDATION HELPERS ════════════ */
  const validatePatient = async (id) => {
    try { const res = await axiosInstance.get(`/dashboard/validate-patient/${id}`); return res.data; }
    catch { return null; }
  };

  const validateStaff = async (id, type) => {
    try {
      const res = await axiosInstance.get(`/dashboard/validate-staff/${id}`);
      const neededRole = type === 'Lab Report' ? 'labTechnician' : 'pharmacist';
      if (res.data.role !== neededRole) {
        setToast({ msg: `User is a ${res.data.role}, not a ${neededRole}.`, type: 'error' });
        return null;
      }
      return res.data;
    } catch { return null; }
  };

  /* ════════════ CONSULTATION HANDLERS ════════════ */
  const handleStartConsultation = async (e, scannedId) => {
    if (e) e.preventDefault();
    const pid = scannedId || patientId;
    if (!pid) return;
    const patient = await validatePatient(pid);
    if (patient) {
      setPatientId(pid);
      setPatientInfo(patient);
      setConsultationStep(2);
      setToast({ msg: `Patient ${patient.fullName} found!`, type: 'success' });
    } else {
      setToast({ msg: 'Patient not found. Please check the ID.', type: 'error' });
    }
  };

  const handleQRScanSuccess = (scannedId) => {
    setShowQRScanner(false);
    setActive('consultation');
    setConsultationStep(1);
    setTimeout(() => handleStartConsultation(null, scannedId), 100);
  };

  const handleMedicineChange = (index, field, value) => {
    const newMeds = [...medicines];
    newMeds[index][field] = value;
    setMedicines(newMeds);
  };

  const addMedicineRow = () => setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '' }]);

  const removeMedicineRow = (index) => {
    if (medicines.length > 1) setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axiosInstance.post('/dashboard/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadedFileUrl(res.data.fileUrl);
      setSelectedFile(file);
      setToast({ msg: 'File uploaded successfully!', type: 'success' });
    } catch (error) {
      setToast({ msg: 'Error uploading file', type: 'error' });
    }
  };

  const submitConsultation = async () => {
    try {
      await axiosInstance.post('/dashboard/prescription', {
        patientId, diagnosis, medicines, notes: prescriptionNotes,
        durationDays: prescriptionDuration, fileUrls: uploadedFileUrl ? [uploadedFileUrl] : [],
        nextVisitDate, nextVisitTime,
      });
      await axiosInstance.post('/dashboard/vitals', { patientId, ...vitals });
      setToast({ msg: 'Consultation submitted successfully!', type: 'success' });
      resetConsultationForm();
      setActive('attended');
      fetchStats();
    } catch (error) {
      setToast({ msg: error.response?.data?.message || 'Error submitting consultation', type: 'error' });
    }
  };

  const resetConsultationForm = () => {
    setPatientId(''); setPatientInfo(null); setConsultationStep(1);
    setDiagnosis(''); setMedicines([{ name: '', dosage: '', frequency: '', duration: '' }]);
    setVitals({ bloodPressure: '', sugarLevel: '', heartRate: '', weight: '', height: '', bmi: '', spo2: '', temperature: '' });
    setPrescriptionNotes(''); setSelectedFile(null); setUploadedFileUrl('');
    setNextVisitDate(''); setNextVisitTime('');
  };

  /* ════════════ REQUEST HANDLERS ════════════ */
  const handleReqPatientValidate = async (e) => {
    e.preventDefault();
    const patient = await validatePatient(reqPatientId);
    if (patient) { setReqPatientValid(true); setReqStep(2); }
    else setToast({ msg: 'Patient not found.', type: 'error' });
  };

  const handleReqTypeSelect = (type) => { setRequestType(type); setReqStep(3); };
  const handleReqBack = () => { if (reqStep > 1) setReqStep(reqStep - 1); };

  const handleReqTargetSubmit = async (e) => {
    e.preventDefault();
    if (!targetId || targetId.trim() === '') { setTargetStaffName('Any Available Staff'); setReqStep(4); return; }
    const staff = await validateStaff(targetId, requestType);
    if (staff) { setTargetStaffName(staff.fullName); setReqStep(4); }
    else setToast({ msg: 'Staff not found. Check the ID.', type: 'error' });
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    try {
      const targetRole = requestType === 'Lab Report' ? 'labTechnician' : 'pharmacist';
      await axiosInstance.post('/dashboard/request', { patientId: reqPatientId, targetRole, targetUserId: targetId || null, requestType, details: reqDetails });
      setToast({ msg: 'Request sent successfully!', type: 'success' });
      resetRequestForm(); setActive('overview');
    } catch (error) { setToast({ msg: error.response?.data?.message || 'Error sending request.', type: 'error' }); }
  };

  const resetRequestForm = () => {
    setReqStep(1); setReqPatientId(''); setReqPatientValid(false);
    setRequestType('Lab Report'); setTargetId(''); setTargetStaffName(''); setReqDetails('');
  };

  /* ════════════════════════════════════════
     OVERVIEW — Hero + Stat Cards + Quick Actions
  ════════════════════════════════════════ */
  const renderOverview = () => {
    if (loading) return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
      </div>
    );

    const attended = stats?.totalPatientsAttended || 0;

    return (
      <>
        {/* HERO BANNER */}
        <div className="pd-hero" style={{ background: 'linear-gradient(130deg, #1A47DB 0%, #2563EB 40%, #0EA5E9 100%)' }}>
          <div className="pd-hero-sub">{getGreeting()},</div>
          <div className="pd-hero-name">Dr. {doctorName}</div>
          <div className="pd-hero-desc">Here's your practice summary for today.</div>
          <div className="pd-hero-tags">
            <span className="pd-hero-tag">ID: {doctorId}</span>
            <span className="pd-hero-tag">{specialization}</span>
            <span className="pd-hero-tag">🏥 {stats?.hospitalName || 'HealthLink Hospital'}</span>
          </div>
          <div className="pd-hero-icon">
            <i className="bi bi-heart-pulse-fill" />
          </div>
        </div>

        {/* 4 STAT CARDS */}
        <div className="pd-stats-grid">
          <div className="pd-stat" onClick={() => handleNav('attended')}>
            <div className="pd-stat-icon-wrap">
              <span style={{ display: 'inline-flex', width: 44, height: 44, borderRadius: 12, background: '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-people-fill" style={{ fontSize: 20, color: '#1A47DB' }} />
              </span>
            </div>
            <div className="pd-stat-num">{attended}</div>
            <div className="pd-stat-lbl">Patients Today</div>
            <div className="pd-stat-sub">Total attended</div>
          </div>

          <div className="pd-stat" onClick={() => handleNav('consultation')}>
            <div className="pd-stat-icon-wrap">
              <span style={{ display: 'inline-flex', width: 44, height: 44, borderRadius: 12, background: '#F0FDF4', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-clipboard2-pulse" style={{ fontSize: 20, color: '#16A34A' }} />
              </span>
            </div>
            <div className="pd-stat-lbl" style={{ marginTop: 16, fontSize: 15 }}>Start Consultation</div>
            <div className="pd-stat-sub">Scan QR / Enter ID</div>
          </div>

          <div className="pd-stat" onClick={() => handleNav('emergency')}>
            <div className="pd-stat-icon-wrap">
              <span style={{ display: 'inline-flex', width: 44, height: 44, borderRadius: 12, background: '#FEF2F2', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: 20, color: '#DC2626' }} />
                {emergencyCases.length > 0 && <span style={{ position:'absolute',top:-4,right:-4,width:18,height:18,borderRadius:'50%',background:'#DC2626',color:'#fff',fontSize:10,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center' }}>{emergencyCases.length}</span>}
              </span>
            </div>
            <div className="pd-stat-num" style={{ color: emergencyCases.length > 0 ? '#DC2626' : undefined }}>{emergencyCases.length}</div>
            <div className="pd-stat-lbl">Emergency Cases</div>
            <div className="pd-stat-sub">{emergencyCases.length > 0 ? 'Needs attention' : 'All clear'}</div>
          </div>

          <div className="pd-stat" onClick={() => handleNav('requests')}>
            <div className="pd-stat-icon-wrap">
              <span style={{ display: 'inline-flex', width: 44, height: 44, borderRadius: 12, background: '#FAF5FF', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-send-fill" style={{ fontSize: 20, color: '#9333EA' }} />
              </span>
            </div>
            <div className="pd-stat-lbl" style={{ marginTop: 16, fontSize: 15 }}>Lab / Pharmacy</div>
            <div className="pd-stat-sub">Send requests</div>
          </div>
        </div>

        {/* BOTTOM ROW: Quick Consultation + Recent Patients */}
        <div className="pd-bottom-row">
          {/* QUICK CONSULTATION CARD */}
          <div className="pd-card" style={{ marginBottom: 0 }}>
            <div className="pd-card-head">
              <div className="pd-card-title"><span>Patient Consultation</span></div>
              <button className="pd-card-link" onClick={() => handleNav('consultation')}>
                Full View <i className="bi bi-arrow-right" />
              </button>
            </div>
            <div style={{ padding: '14px 22px 22px' }}>
              <div style={{ background: '#F0F7FF', borderRadius: 16, padding: '20px', border: '1px solid #DBEAFE' }}>
                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>Enter Patient ID or scan QR code to begin consultation</div>
                <div className="doc-consult-input-row">
                  <input type="text" value={patientId} onChange={e => setPatientId(e.target.value)} placeholder="PAT-123456"
                    className="doc-consult-input"
                    onKeyDown={e => { if (e.key === 'Enter') { handleStartConsultation(e); handleNav('consultation'); } }}
                  />
                  <div className="doc-consult-btn-group">
                    <button onClick={() => setShowQRScanner(true)} className="doc-consult-qr-btn">
                      <i className="bi bi-qr-code-scan" />
                    </button>
                    <button onClick={() => { handleStartConsultation(null); handleNav('consultation'); }} className="doc-consult-begin-btn">
                      Begin
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RECENT ATTENDED */}
          <div className="pd-card" style={{ marginBottom: 0 }}>
            <div className="pd-card-head">
              <div className="pd-card-title"><span>Recent Patients</span></div>
              <button className="pd-card-link" onClick={() => handleNav('attended')}>
                View all <i className="bi bi-arrow-right" />
              </button>
            </div>
            <div>
              {stats?.patientsAttendedToday?.length > 0 ? stats.patientsAttendedToday.slice(0, 3).map((p, i) => (
                <div className="pd-row" key={i} onClick={() => { setSelectedAttendedPatient(p); handleNav('attended'); }}>
                  <div className="pd-row-icon" style={{ background: '#EFF6FF' }}>
                    <i className="bi bi-person-fill" style={{ color: '#1A47DB' }} />
                  </div>
                  <div className="pd-row-info">
                    <div className="pd-row-main">{p.patientId?.fullName || 'Patient'}</div>
                    <div className="pd-row-spec">{p.diagnosis || 'Consultation'}</div>
                  </div>
                  <span className="pd-badge pd-b-confirmed">{new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )) : (
                <div className="pd-empty">
                  <i className="bi bi-people" />
                  <p>No patients attended yet today.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

  /* ════════════════════════════════════════
     CONSULTATION PAGE
  ════════════════════════════════════════ */
  const renderConsultation = () => (
    <div className="pd-card">
      <div className="pd-section-head">
        <div className="pd-sect-title">
          <i className="bi bi-clipboard2-pulse" style={{ color: '#16A34A' }} /> Patient Consultation
        </div>
        <div className="pd-sect-sub">Enter Patient ID or scan QR to begin</div>
      </div>

      <div style={{ padding: '0 22px 22px' }}>
        {consultationStep === 1 ? (
          <form onSubmit={handleStartConsultation} style={{ maxWidth: 500, margin: '0 auto', padding: '20px 0' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1F36', marginBottom: 8 }}>Enter Patient ID</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" value={patientId} onChange={e => setPatientId(e.target.value)} required placeholder="PAT-123456"
                className="pd-form-input" style={{ flex: 1 }} />
              <button type="button" onClick={() => setShowQRScanner(true)}
                style={{ padding: '11px 16px', background: '#F3F4F6', border: '1.5px solid #E5E7EB', borderRadius: 10, cursor: 'pointer', fontSize: 18, color: '#374151', display: 'flex', alignItems: 'center' }}>
                <i className="bi bi-qr-code-scan" />
              </button>
              <button className="pd-save-btn" type="submit">Begin Consultation</button>
            </div>
          </form>
        ) : (
          <div>
            {/* Patient info banner */}
            <div style={{ background: '#EFF6FF', borderRadius: 14, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #DBEAFE' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1A47DB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                  <i className="bi bi-person-fill" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1A1F36' }}>{patientInfo?.fullName || patientId}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>ID: {patientId}</div>
                </div>
              </div>
              <button onClick={resetConsultationForm} style={{ padding: '6px 14px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                <i className="bi bi-x-lg" style={{ marginRight: 4 }} /> Cancel
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr', gap: 18 }}>
              {/* LEFT: Prescription */}
              <div style={{ background: '#F9FAFB', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                <div style={{ padding: '12px 18px', background: 'linear-gradient(90deg, #16A34A, #22C55E)', color: '#fff', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="bi bi-capsule" /> Prescription
                </div>
                <div style={{ padding: 18 }}>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.8px', marginBottom: 6, display: 'block' }}>Diagnosis</label>
                    <input className="pd-form-input" placeholder="e.g. Viral Fever" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
                  </div>

                  <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.8px', marginBottom: 6, display: 'block' }}>Medicines</label>
                  {medicines.map((m, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 6, marginBottom: 6 }}>
                      <input className="pd-form-input" style={{ padding: '8px 10px', fontSize: 13 }} placeholder="Medicine" value={m.name} onChange={e => handleMedicineChange(i, 'name', e.target.value)} />
                      <input className="pd-form-input" style={{ padding: '8px 10px', fontSize: 13 }} placeholder="Dose" value={m.dosage} onChange={e => handleMedicineChange(i, 'dosage', e.target.value)} />
                      <input className="pd-form-input" style={{ padding: '8px 10px', fontSize: 13 }} placeholder="Freq" value={m.frequency} onChange={e => handleMedicineChange(i, 'frequency', e.target.value)} />
                      <input className="pd-form-input" style={{ padding: '8px 10px', fontSize: 13 }} placeholder="Duration" value={m.duration} onChange={e => handleMedicineChange(i, 'duration', e.target.value)} />
                      <button type="button" onClick={() => removeMedicineRow(i)} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>×</button>
                    </div>
                  ))}
                  <button type="button" onClick={addMedicineRow} style={{ padding: '6px 14px', background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', marginBottom: 14 }}>
                    + Add Medicine
                  </button>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.8px', marginBottom: 6, display: 'block' }}>Validity (Days)</label>
                    <input type="number" className="pd-form-input" value={prescriptionDuration} onChange={e => setPrescriptionDuration(e.target.value)} min="1" style={{ maxWidth: 120 }} />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.8px', marginBottom: 6, display: 'block' }}>Upload File</label>
                    <input type="file" className="pd-form-input" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx" style={{ padding: 8 }} />
                    {uploadedFileUrl && <div style={{ fontSize: 12, color: '#16A34A', marginTop: 4, fontWeight: 500 }}>✓ File uploaded</div>}
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.8px', marginBottom: 6, display: 'block' }}>Notes</label>
                    <textarea className="pd-form-input" rows="2" value={prescriptionNotes} onChange={e => setPrescriptionNotes(e.target.value)} placeholder="Additional notes..." style={{ resize: 'vertical' }} />
                  </div>

                  {/* Next Visit */}
                  <div style={{ borderTop: '1px solid #E5E7EB', marginTop: 16, paddingTop: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1A47DB', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <i className="bi bi-calendar-event" /> Schedule Next Visit
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.8px', marginBottom: 6, display: 'block' }}>Date</label>
                        <input type="date" className="pd-form-input" value={nextVisitDate} onChange={e => setNextVisitDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.8px', marginBottom: 6, display: 'block' }}>Time</label>
                        <input type="time" className="pd-form-input" value={nextVisitTime} onChange={e => setNextVisitTime(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: Vitals */}
              <div style={{ background: '#F9FAFB', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden', alignSelf: 'start' }}>
                <div style={{ padding: '12px 18px', background: 'linear-gradient(90deg, #DC2626, #EF4444)', color: '#fff', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="bi bi-heart-pulse" /> Vitals
                </div>
                <div style={{ padding: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Blood Pressure', key: 'bloodPressure', placeholder: '120/80' },
                    { label: 'Sugar Level', key: 'sugarLevel', placeholder: 'mg/dL' },
                    { label: 'Heart Rate', key: 'heartRate', placeholder: 'bpm' },
                    { label: 'Temperature', key: 'temperature', placeholder: '°F' },
                    { label: 'SpO₂', key: 'spo2', placeholder: '%' },
                    { label: 'Weight', key: 'weight', placeholder: 'kg' },
                    { label: 'Height', key: 'height', placeholder: 'cm' },
                    { label: 'BMI', key: 'bmi', placeholder: 'Index' },
                  ].map(v => (
                    <div key={v.key}>
                      <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.8px', marginBottom: 4, display: 'block' }}>{v.label}</label>
                      <input className="pd-form-input" style={{ padding: '8px 10px', fontSize: 13 }} placeholder={v.placeholder} value={vitals[v.key]} onChange={e => setVitals({ ...vitals, [v.key]: e.target.value })} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button onClick={submitConsultation} className="pd-save-btn" style={{ width: '100%', marginTop: 20, padding: '14px', justifyContent: 'center', fontSize: 16, borderRadius: 14 }}>
              <i className="bi bi-check-circle" /> Submit Consultation
            </button>
          </div>
        )}
      </div>
    </div>
  );

  /* ════════════════════════════════════════
     ATTENDED PATIENTS
  ════════════════════════════════════════ */
  const renderAttended = () => (
    <div className="pd-card">
      <div className="pd-section-head">
        <div className="pd-sect-title">
          <i className="bi bi-people-fill" style={{ color: '#1A47DB' }} /> Patients Attended Today
        </div>
        <div className="pd-sect-sub">Select a patient to view consultation details</div>
      </div>

      {stats?.patientsAttendedToday?.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.3fr', borderTop: '1px solid #E5E7EB' }}>
          {/* Left: Patient list */}
          <div style={{ borderRight: isMobile ? 'none' : '1px solid #E5E7EB', maxHeight: 500, overflowY: 'auto' }}>
            {stats.patientsAttendedToday.map((p, i) => (
              <div key={i} className="pd-row" style={{ background: selectedAttendedPatient?._id === p._id ? '#EFF6FF' : 'transparent' }}
                onClick={() => setSelectedAttendedPatient(p)}>
                <div className="pd-row-icon" style={{ background: selectedAttendedPatient?._id === p._id ? '#1A47DB' : '#EFF6FF' }}>
                  <i className="bi bi-person-fill" style={{ color: selectedAttendedPatient?._id === p._id ? '#fff' : '#1A47DB' }} />
                </div>
                <div className="pd-row-info">
                  <div className="pd-row-main">{p.patientId?.fullName || 'Patient'}</div>
                  <div className="pd-row-spec">ID: {p.patientId?.roleId || p.patientId?.userId}</div>
                </div>
                <span className="pd-badge pd-b-confirmed">{new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
          {/* Right: Details */}
          <div style={{ padding: 22 }}>
            {selectedAttendedPatient ? (
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, color: '#1A1F36' }}>Consultation Details</div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.8px', marginBottom: 4 }}>Diagnosis</div>
                  <div style={{ fontWeight: 600, color: '#1A1F36' }}>{selectedAttendedPatient.diagnosis || '—'}</div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.8px', marginBottom: 8 }}>Medicines</div>
                  {selectedAttendedPatient.medicines?.map((m, i) => (
                    <div key={i} style={{ padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: 10, marginBottom: 6, background: '#F9FAFB' }}>
                      <div style={{ fontWeight: 600, color: '#1A1F36', fontSize: 14 }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>{m.dosage} · {m.frequency}</div>
                    </div>
                  ))}
                </div>
                {selectedAttendedPatient.fileUrls?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.8px', marginBottom: 6 }}>Attachments</div>
                    {selectedAttendedPatient.fileUrls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#EFF6FF', color: '#1A47DB', borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: 'none', marginRight: 8 }}>
                        <i className="bi bi-paperclip" /> Attachment {i + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="pd-empty">
                <i className="bi bi-clipboard2-check" />
                <p>Select a patient to view details</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="pd-empty">
          <i className="bi bi-people" />
          <p>No patients attended yet today.</p>
        </div>
      )}
    </div>
  );

  /* ════════════════════════════════════════
     REQUESTS PAGE
  ════════════════════════════════════════ */
  const renderRequests = () => (
    <div className="pd-card">
      <div className="pd-section-head">
        <div className="pd-sect-title">
          <i className="bi bi-send-fill" style={{ color: '#9333EA' }} /> Lab / Pharmacy Requests
        </div>
        <div className="pd-sect-sub">Send requests to lab technicians or pharmacists</div>
      </div>

      <div style={{ padding: '0 22px 22px' }}>
        {/* Step indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 0, marginBottom: 24, marginTop: 8 }}>
          {[1, 2, 3, 4].map(step => (
            <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: reqStep >= step ? '#1A47DB' : '#F3F4F6', color: reqStep >= step ? '#fff' : '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, transition: 'all 0.2s' }}>
                {step}
              </div>
              {step < 4 && <div style={{ width: 40, height: 3, background: reqStep > step ? '#1A47DB' : '#E5E7EB', borderRadius: 2, transition: 'background 0.2s' }} />}
            </div>
          ))}
        </div>

        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          {reqStep === 1 && (
            <form onSubmit={handleReqPatientValidate}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: '#1A1F36' }}>Step 1: Enter Patient ID</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="pd-form-input" value={reqPatientId} onChange={e => setReqPatientId(e.target.value)} required placeholder="PAT-123456" style={{ flex: 1 }} />
                <button className="pd-save-btn" type="submit">Validate</button>
              </div>
            </form>
          )}

          {reqStep === 2 && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#1A1F36' }}>Step 2: Select Request Type</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <button onClick={() => handleReqTypeSelect('Lab Report')} style={{ padding: '18px 16px', borderRadius: 14, border: '2px solid #DBEAFE', background: '#EFF6FF', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                  <i className="bi bi-file-earmark-medical" style={{ fontSize: 28, color: '#1A47DB', display: 'block', marginBottom: 8 }} />
                  <div style={{ fontWeight: 700, color: '#1A1F36', fontSize: 14 }}>Lab Report</div>
                </button>
                <button onClick={() => handleReqTypeSelect('Medicine')} style={{ padding: '18px 16px', borderRadius: 14, border: '2px solid #BBF7D0', background: '#F0FDF4', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                  <i className="bi bi-capsule" style={{ fontSize: 28, color: '#16A34A', display: 'block', marginBottom: 8 }} />
                  <div style={{ fontWeight: 700, color: '#1A1F36', fontSize: 14 }}>Medicine</div>
                </button>
              </div>
              <button onClick={handleReqBack} style={{ width: '100%', padding: '10px', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#6B7280' }}>
                <i className="bi bi-arrow-left" style={{ marginRight: 6 }} /> Back
              </button>
            </div>
          )}

          {reqStep === 3 && (
            <form onSubmit={handleReqTargetSubmit}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: '#1A1F36' }}>Step 3: Target ID (Optional)</div>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>
                Enter specific {requestType === 'Lab Report' ? 'Lab Technician' : 'Pharmacist'} ID or leave empty.
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input className="pd-form-input" value={targetId} onChange={e => setTargetId(e.target.value)} placeholder={requestType === 'Lab Report' ? 'LAB-123456' : 'PHARM-123456'} style={{ flex: 1 }} />
                <button className="pd-save-btn" type="submit">Next</button>
              </div>
              <button type="button" onClick={handleReqBack} style={{ width: '100%', padding: '10px', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#6B7280' }}>
                <i className="bi bi-arrow-left" style={{ marginRight: 6 }} /> Back
              </button>
            </form>
          )}

          {reqStep === 4 && (
            <form onSubmit={submitRequest}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: '#1A1F36' }}>Step 4: Details</div>
              <textarea className="pd-form-input" rows="4" value={reqDetails} onChange={e => setReqDetails(e.target.value)} required
                placeholder={requestType === 'Lab Report' ? 'e.g. Full Blood Count, Liver Function Test...' : 'e.g. Paracetamol 500mg x 10, Cetrizine...'} style={{ resize: 'vertical', marginBottom: 12 }} />
              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13 }}>
                <strong>Summary:</strong> {requestType} for <span style={{ color: '#1A47DB', fontWeight: 600 }}>{reqPatientId}</span> → <strong>{targetStaffName || 'Any Staff'}</strong>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={handleReqBack} style={{ padding: '12px 20px', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#6B7280' }}>
                  <i className="bi bi-arrow-left" /> Back
                </button>
                <button className="pd-save-btn" type="submit" style={{ flex: 1, justifyContent: 'center' }}>
                  <i className="bi bi-send" /> Submit Request
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  /* ════════════════════════════════════════
     EMERGENCY — Full implementation
  ════════════════════════════════════════ */
  const renderEmergency = () => {
    // Detail view
    if (selectedCase) {
      const ec = caseDetails?.emergencyCase || selectedCase;
      const pt = ec.patientId || {};
      const vt = caseDetails?.vitals;
      const rxList = caseDetails?.prescriptions || [];
      const reports = caseDetails?.labReports || [];
      const team = ec.emergencyTeamId || {};
      const urgColor = ec.urgencyLevel === 'Critical' ? '#DC2626' : ec.urgencyLevel === 'High' ? '#D97706' : '#16A34A';
      const urgBg = ec.urgencyLevel === 'Critical' ? '#FEE2E2' : ec.urgencyLevel === 'High' ? '#FEF3C7' : '#D1FAE5';

      return (
        <div className="pd-card">
          <div className="pd-section-head" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
            <div>
              <div className="pd-sect-title"><i className="bi bi-exclamation-triangle-fill" style={{ color: '#DC2626' }} /> Emergency Case Details</div>
              <div className="pd-sect-sub">Case ID: {ec._id?.slice(-8)?.toUpperCase()}</div>
            </div>
            <button onClick={() => { setSelectedCase(null); setCaseDetails(null); }} style={{ padding:'6px 14px', background:'#F3F4F6', border:'1px solid #E5E7EB', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600, color:'#6B7280' }}>
              <i className="bi bi-arrow-left" style={{ marginRight:4 }} /> Back to List
            </button>
          </div>

          {loadingCase ? <div style={{ padding:40, textAlign:'center' }}><div className="spinner-border text-danger" /></div> : (
          <div style={{ padding:'0 22px 22px' }}>
            {/* Urgency Banner */}
            <div style={{ background: urgBg, border:`1.5px solid ${urgColor}`, borderRadius:14, padding:'12px 18px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:22 }}>{ec.urgencyLevel==='Critical'?'🔴':ec.urgencyLevel==='High'?'🟡':'🟢'}</span>
              <div>
                <div style={{ fontWeight:700, color:urgColor, fontSize:15 }}>{ec.urgencyLevel} Emergency</div>
                <div style={{ fontSize:12, color:'#6B7280' }}>{ec.requestType} • {new Date(ec.createdAt).toLocaleString()}</div>
              </div>
              <span className="pd-badge" style={{ marginLeft:'auto', background: ec.status==='Pending'?'#FEF3C7':ec.status==='Accepted'?'#DBEAFE':'#D1FAE5', color: ec.status==='Pending'?'#92400E':ec.status==='Accepted'?'#1E40AF':'#065F46', fontWeight:700 }}>{ec.status}</span>
            </div>

            <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:14, marginBottom:16 }}>
              {/* Section 1: Patient Info */}
              <div style={{ background:'#F9FAFB', borderRadius:16, border:'1px solid #E5E7EB', overflow:'hidden' }}>
                <div style={{ padding:'10px 16px', background:'linear-gradient(90deg,#DC2626,#EF4444)', color:'#fff', fontWeight:700, fontSize:13 }}><i className="bi bi-person-lines-fill me-2" />Patient Information</div>
                <div style={{ padding:14 }}>
                  {[{l:'Name',v:pt.fullName},{l:'Patient ID',v:pt.roleId},{l:'Phone',v:pt.phone},{l:'Emergency Contact',v:typeof pt.emergencyContact==='object'?pt.emergencyContact?.phone:pt.emergencyContact},{l:'Address',v:pt.address},{l:'Blood Group',v:pt.bloodGroup},{l:'DOB',v:pt.dateOfBirth},{l:'Allergies',v:pt.allergies},{l:'Conditions',v:pt.chronicDiseases}].map((r,i)=>(
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom: i<8?'1px solid #E5E7EB':'none', fontSize:13 }}>
                      <span style={{ color:'#6B7280', fontWeight:600, textTransform:'uppercase', fontSize:11, letterSpacing:'.5px' }}>{r.l}</span>
                      <span style={{ fontWeight:600, color:'#1A1F36', textAlign:'right', maxWidth:'60%', wordBreak:'break-word' }}>{r.v||'—'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2: Health Metrics */}
              <div style={{ background:'#F9FAFB', borderRadius:16, border:'1px solid #E5E7EB', overflow:'hidden', alignSelf:'start' }}>
                <div style={{ padding:'10px 16px', background:'linear-gradient(90deg,#1A47DB,#2563EB)', color:'#fff', fontWeight:700, fontSize:13 }}><i className="bi bi-heart-pulse me-2" />Health Metrics</div>
                <div style={{ padding:14 }}>
                  {vt ? (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                      {[{l:'BP',v:vt.bloodPressure,e:'💓'},{l:'Heart Rate',v:vt.heartRate?`${vt.heartRate} bpm`:null,e:'❤️'},{l:'SpO₂',v:vt.spo2?`${vt.spo2}%`:null,e:'🫁'},{l:'Temp',v:vt.temperature?`${vt.temperature}°F`:null,e:'🌡️'},{l:'Sugar',v:vt.sugarLevel,e:'🩸'},{l:'Weight',v:vt.weight?`${vt.weight}kg`:null,e:'⚖️'}].map((x,i)=>(
                        <div key={i} style={{ background:'#fff', borderRadius:10, padding:8, textAlign:'center', border:'1px solid #E5E7EB' }}>
                          <div style={{ fontSize:18 }}>{x.e}</div>
                          <div style={{ fontSize:15, fontWeight:800, color:'#1A1F36' }}>{x.v||'—'}</div>
                          <div style={{ fontSize:10, color:'#6B7280' }}>{x.l}</div>
                        </div>
                      ))}
                    </div>
                  ) : <div style={{ textAlign:'center', padding:20, color:'#6B7280', fontSize:13 }}>No vitals recorded</div>}
                </div>
              </div>
            </div>

            {/* Section 3: Prescriptions */}
            <div style={{ background:'#F9FAFB', borderRadius:16, border:'1px solid #E5E7EB', overflow:'hidden', marginBottom:14 }}>
              <div style={{ padding:'10px 16px', background:'linear-gradient(90deg,#16A34A,#22C55E)', color:'#fff', fontWeight:700, fontSize:13 }}><i className="bi bi-capsule me-2" />Prescriptions ({rxList.length})</div>
              <div style={{ padding:14 }}>
                {rxList.length>0 ? rxList.slice(0,5).map((rx,i)=>(
                  <div key={i} style={{ border:'1px solid #E5E7EB', borderRadius:10, padding:'10px 14px', marginBottom:6, background:'#fff' }}>
                    <div style={{ fontWeight:600, fontSize:13, color:'#1A1F36' }}>{rx.diagnosis||'Prescription'} <span style={{ fontSize:11, color:'#6B7280' }}>• {rx.status}</span></div>
                    <div style={{ fontSize:11, color:'#6B7280' }}>By Dr. {rx.doctorId?.fullName||'Unknown'} • {new Date(rx.createdAt).toLocaleDateString()}</div>
                    {rx.medicines?.map((m,j)=><div key={j} style={{ fontSize:11, color:'#374151', marginTop:2 }}>💊 {m.name} — {m.dosage} ({m.frequency})</div>)}
                  </div>
                )) : <div style={{ textAlign:'center', padding:16, color:'#6B7280', fontSize:13 }}>No prescriptions found</div>}
              </div>
            </div>

            {/* Section 4: Lab Reports */}
            <div style={{ background:'#F9FAFB', borderRadius:16, border:'1px solid #E5E7EB', overflow:'hidden', marginBottom:14 }}>
              <div style={{ padding:'10px 16px', background:'linear-gradient(90deg,#7C3AED,#8B5CF6)', color:'#fff', fontWeight:700, fontSize:13 }}><i className="bi bi-file-earmark-medical me-2" />Medical Reports ({reports.length})</div>
              <div style={{ padding:14 }}>
                {reports.length>0 ? reports.slice(0,5).map((r,i)=>(
                  <div key={i} style={{ border:'1px solid #E5E7EB', borderRadius:10, padding:'10px 14px', marginBottom:6, background:'#fff', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:13, color:'#1A1F36' }}>{r.reportTitle||'Lab Report'}</div>
                      <div style={{ fontSize:11, color:'#6B7280' }}>{r.reportType} • {new Date(r.createdAt).toLocaleDateString()}</div>
                    </div>
                    {r.fileUrl && <a href={r.fileUrl} target="_blank" rel="noreferrer" style={{ fontSize:12, color:'#7C3AED', fontWeight:600 }}><i className="bi bi-download me-1" />View</a>}
                  </div>
                )) : <div style={{ textAlign:'center', padding:16, color:'#6B7280', fontSize:13 }}>No reports found</div>}
              </div>
            </div>

            {/* Section 5: Emergency Team Info */}
            <div style={{ background:'#F9FAFB', borderRadius:16, border:'1px solid #E5E7EB', overflow:'hidden', marginBottom:14 }}>
              <div style={{ padding:'10px 16px', background:'linear-gradient(90deg,#F97316,#FB923C)', color:'#fff', fontWeight:700, fontSize:13 }}><i className="bi bi-people-fill me-2" />Emergency Team Info</div>
              <div style={{ padding:14 }}>
                {[{l:'Team Member',v:team.fullName},{l:'EMG ID',v:team.roleId||ec.emergencyRoleId},{l:'Team Name',v:ec.teamName||team.teamName},{l:'Team Number',v:ec.teamNumber||team.teamNumber},{l:'Emergency Role',v:team.emergencyRole},{l:'Phone',v:team.phone}].map((r,i)=>(
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom: i<5?'1px solid #E5E7EB':'none', fontSize:13 }}>
                    <span style={{ color:'#6B7280', fontWeight:600, textTransform:'uppercase', fontSize:11 }}>{r.l}</span>
                    <span style={{ fontWeight:600, color:'#1A1F36' }}>{r.v||'—'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 6: Emergency Notes */}
            <div style={{ background:'#F9FAFB', borderRadius:16, border:'1px solid #E5E7EB', overflow:'hidden', marginBottom:18 }}>
              <div style={{ padding:'10px 16px', background:'linear-gradient(90deg,#DC2626,#EF4444)', color:'#fff', fontWeight:700, fontSize:13 }}><i className="bi bi-journal-text me-2" />Emergency Notes</div>
              <div style={{ padding:14 }}>
                {[{l:'Emergency Notes',v:ec.emergencyNotes},{l:'First Aid Given',v:ec.firstAidGiven},{l:'Situation',v:ec.situationDescription}].map((r,i)=>(
                  r.v ? <div key={i} style={{ marginBottom:10 }}>
                    <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', color:'#6B7280', marginBottom:4 }}>{r.l}</div>
                    <div style={{ padding:'10px 14px', border:'1px solid #E5E7EB', borderRadius:10, background:'#fff', fontSize:13, whiteSpace:'pre-wrap' }}>{r.v}</div>
                  </div> : null
                ))}
                {!ec.emergencyNotes && !ec.firstAidGiven && !ec.situationDescription && <div style={{ textAlign:'center', padding:16, color:'#6B7280', fontSize:13 }}>No notes provided</div>}
              </div>
            </div>

            {/* Action Buttons */}
            {ec.status !== 'Completed' && (
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                {ec.status === 'Pending' && (
                  <button onClick={() => handleAcceptCase(ec._id)} className="pd-save-btn" style={{ flex:1, justifyContent:'center', background:'#1A47DB', padding:'14px' }}>
                    <i className="bi bi-check-circle" /> Attend Case
                  </button>
                )}
                <button onClick={() => handleCompleteCase(ec._id)} className="pd-save-btn" style={{ flex:1, justifyContent:'center', background:'#16A34A', padding:'14px' }}>
                  <i className="bi bi-check2-all" /> Treatment Completed
                </button>
              </div>
            )}
            {ec.status === 'Completed' && (
              <div style={{ background:'#D1FAE5', border:'1px solid #A7F3D0', borderRadius:12, padding:'14px 18px', textAlign:'center', fontWeight:600, color:'#065F46' }}>
                <i className="bi bi-check-circle-fill me-2" />Treatment completed by Dr. {ec.completedBy?.fullName || ec.acceptedBy?.fullName || 'Doctor'}
              </div>
            )}
          </div>
          )}
        </div>
      );
    }

    // List view
    return (
      <div className="pd-card">
        <div className="pd-section-head">
          <div className="pd-sect-title"><i className="bi bi-exclamation-triangle-fill" style={{ color:'#DC2626' }} /> Emergency Cases</div>
          <div className="pd-sect-sub">Emergency treatment requests from the Emergency Team</div>
        </div>
        {emergencyCases.length > 0 ? (
          <div>
            {emergencyCases.map((c, i) => {
              const urgColor2 = c.urgencyLevel==='Critical'?'#991B1B':c.urgencyLevel==='High'?'#92400E':'#065F46';
              const urgBg2 = c.urgencyLevel==='Critical'?'#FEE2E2':c.urgencyLevel==='High'?'#FEF3C7':'#D1FAE5';
              return (
                <div key={i} className="pd-row" onClick={() => { setSelectedCase(c); fetchCaseDetails(c._id); }} style={{ cursor:'pointer' }}>
                  <div className="pd-row-icon" style={{ background:'#FEF2F2' }}>
                    <i className="bi bi-exclamation-triangle-fill" style={{ color:'#DC2626' }} />
                  </div>
                  <div className="pd-row-info">
                    <div className="pd-row-main">{c.patientId?.fullName || 'Patient'}</div>
                    <div className="pd-row-spec">ID: {c.patientId?.roleId || '—'} • {c.requestType} • Team: {c.teamName || '—'}</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                    <span className="pd-badge" style={{ background: urgBg2, color: urgColor2 }}>{c.urgencyLevel}</span>
                    <span style={{ fontSize:11, color:'#6B7280' }}>{new Date(c.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="pd-empty" style={{ padding:'50px 20px' }}>
            <div style={{ width:70, height:70, borderRadius:'50%', background:'#F0FDF4', margin:'0 auto 16px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <i className="bi bi-check-circle-fill" style={{ fontSize:32, color:'#16A34A' }} />
            </div>
            <p style={{ fontWeight:600, fontSize:16, color:'#1A1F36', marginBottom:4 }}>All Clear</p>
            <p style={{ margin:0 }}>No emergency cases at this time.</p>
          </div>
        )}
      </div>
    );
  };

  /* ════════════════════════════════════════
     CONTENT ROUTER
  ════════════════════════════════════════ */
  const renderContent = () => {
    switch (active) {
      case 'overview': return renderOverview();
      case 'consultation': return renderConsultation();
      case 'attended': return renderAttended();
      case 'requests': return renderRequests();
      case 'emergency': return renderEmergency();
      case 'settings': return <DoctorSettingsPage user={user} />;
      default: return renderOverview();
    }
  };

  return (
    <div className="pd-shell">
      <Sidebar active={active} setActive={handleNav} open={effectiveSidebarOpen} setOpen={isMobile ? setMobileSidebar : setSidebarOpen} mainNav={MAIN_NAV} bottomNav={BOTTOM_NAV} />
      <div className={`pd-overlay ${mobileSidebar ? 'visible' : ''}`} onClick={() => setMobileSidebar(false)} />

      <div className={`pd-main ${effectiveSidebarOpen && !isMobile ? 'open' : ''}`}>
        <Header user={user} logout={logout} setActive={handleNav} onHamburger={() => setMobileSidebar(o => !o)} />
        <div className="pd-content">{renderContent()}</div>
      </div>

      {/* BOTTOM NAV — Mobile */}
      <div className="pd-bottom-nav">
        <div className="pd-bottom-nav-inner">
          {MOBILE_NAV.map(n => (
            <button key={n.key} className={`pd-bnav-item ${active === n.key ? 'active' : ''}`} onClick={() => handleNav(n.key)}>
              <i className={`bi ${n.icon}`} />
              <span>{n.label}</span>
            </button>
          ))}
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <QRScannerModal show={showQRScanner} onClose={() => setShowQRScanner(false)} onScanSuccess={handleQRScanSuccess} />
    </div>
  );
};

export default DoctorDashboard;
