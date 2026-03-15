import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import axiosInstance from '../../api/axiosInstance';
import { Sidebar, Header, Toast } from '../../components/DashboardLayoutComponents';
import EmergencySettingsPage from '../../components/EmergencySettingsPage';
import QRScannerModal from '../../components/QRScannerModal';
import '../../patient-dashboard.css';

/* ══════════════════════════════════════════
   NAV ITEMS — Emergency Team version
══════════════════════════════════════════ */
const MAIN_NAV = [
  { key: 'overview',      icon: 'bi-grid-1x2-fill',       label: 'Dashboard' },
  { key: 'attended',      icon: 'bi-people-fill',         label: 'Attended' },
  { key: 'attend',        icon: 'bi-qr-code-scan',        label: 'Attend Patient' },
  { key: 'request',       icon: 'bi-send-fill',           label: 'Request Treatment' },
];

const BOTTOM_NAV = [
  { key: 'settings', icon: 'bi-gear', label: 'Settings' },
];

const MOBILE_NAV = [
  { key: 'overview',  icon: 'bi-grid-1x2-fill',  label: 'Dashboard' },
  { key: 'attended',  icon: 'bi-people-fill',     label: 'Attended' },
  { key: 'attend',    icon: 'bi-qr-code-scan',    label: 'Attend' },
  { key: 'request',   icon: 'bi-send-fill',       label: 'Request' },
  { key: 'settings',  icon: 'bi-person-circle',   label: 'Profile' },
];

/* ══════════════════════════════════════════
   EMERGENCY DASHBOARD COMPONENT
══════════════════════════════════════════ */
const EmergencyDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [active, setActive] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [toast, setToast] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Attend Patient State
  const [attendStep, setAttendStep] = useState(1);
  const [attendPatientId, setAttendPatientId] = useState('');
  const [attendPatientData, setAttendPatientData] = useState(null);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Request Treatment State
  const [reqStep, setReqStep] = useState(1);
  const [reqPatientId, setReqPatientId] = useState('');
  const [reqPatientData, setReqPatientData] = useState(null);
  const [reqType, setReqType] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [doctorResults, setDoctorResults] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [emergencyNotes, setEmergencyNotes] = useState('');
  const [firstAidGiven, setFirstAidGiven] = useState('');
  const [situationDesc, setSituationDesc] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState('High');

  // Attended detail
  const [selectedAttendedPatient, setSelectedAttendedPatient] = useState(null);

  useEffect(() => { fetchStats(); }, []);

  // Poll dashboard every 15 seconds for real-time doctor status updates
  useEffect(() => {
    const interval = setInterval(fetchStats, 15000);
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
      const res = await axiosInstance.get('/emergency/dashboard');
      setStats(res.data);
    } catch (err) {
      setToast({ msg: 'Failed to load dashboard data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const teamName = user?.teamName || 'Emergency Team';
  const memberName = user?.fullName || 'Team Member';
  const emgId = user?.roleId || user?.userId || 'EMG-000';
  const teamNumber = user?.teamNumber || '';

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  /* ════════════ PATIENT LOOKUP ════════════ */
  const lookupPatient = async (id) => {
    try {
      const res = await axiosInstance.get(`/emergency/patient-data/${id}`);
      return res.data;
    } catch { return null; }
  };

  const handleAttendPatient = async (e, scannedId) => {
    if (e) e.preventDefault();
    const pid = scannedId || attendPatientId;
    if (!pid) return;
    const data = await lookupPatient(pid);
    if (data) {
      setAttendPatientId(pid);
      setAttendPatientData(data);
      setAttendStep(2);
      setToast({ msg: `Patient ${data.patient.fullName} found!`, type: 'success' });
    } else {
      setToast({ msg: 'Patient not found. Please check the ID.', type: 'error' });
    }
  };

  const handleQRScanSuccess = (scannedId) => {
    setShowQRScanner(false);
    if (active === 'attend' || active === 'overview') {
      setActive('attend');
      setAttendStep(1);
      setTimeout(() => handleAttendPatient(null, scannedId), 100);
    } else if (active === 'request') {
      setReqStep(1);
      setTimeout(() => handleReqPatientValidate(null, scannedId), 100);
    }
  };

  const resetAttend = () => {
    setAttendStep(1);
    setAttendPatientId('');
    setAttendPatientData(null);
  };

  /* ════════════ REQUEST HANDLERS ════════════ */
  const handleReqPatientValidate = async (e, scannedId) => {
    if (e) e.preventDefault();
    const pid = scannedId || reqPatientId;
    if (!pid) return;
    const data = await lookupPatient(pid);
    if (data) {
      setReqPatientId(pid);
      setReqPatientData(data);
      setReqStep(2);
      setToast({ msg: `Patient ${data.patient.fullName} verified!`, type: 'success' });
    } else {
      setToast({ msg: 'Patient not found.', type: 'error' });
    }
  };

  const handleDoctorSearch = async (q) => {
    setDoctorSearch(q);
    if (q.length < 2) { setDoctorResults([]); return; }
    try {
      const res = await axiosInstance.get(`/emergency/search-doctors?q=${encodeURIComponent(q)}`);
      setDoctorResults(res.data);
    } catch { setDoctorResults([]); }
  };

  const submitEmergencyRequest = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/emergency/request', {
        patientId: reqPatientId,
        requestType: reqType,
        targetDoctorId: selectedDoctor?._id || null,
        emergencyNotes,
        firstAidGiven,
        situationDescription: situationDesc,
        urgencyLevel,
      });
      setToast({ msg: 'Emergency request sent successfully!', type: 'success' });
      resetRequest();
      setActive('overview');
      fetchStats();
    } catch (error) {
      setToast({ msg: error.response?.data?.message || 'Error sending request.', type: 'error' });
    }
  };

  const resetRequest = () => {
    setReqStep(1);
    setReqPatientId('');
    setReqPatientData(null);
    setReqType('');
    setDoctorSearch('');
    setDoctorResults([]);
    setSelectedDoctor(null);
    setEmergencyNotes('');
    setFirstAidGiven('');
    setSituationDesc('');
    setUrgencyLevel('High');
  };

  /* ════════════════════════════════════════
     OVERVIEW
  ════════════════════════════════════════ */
  const renderOverview = () => {
    if (loading) return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="spinner-border text-danger" role="status"><span className="visually-hidden">Loading...</span></div>
      </div>
    );

    const attended = stats?.totalPatientsAttended || 0;

    return (
      <>
        {/* HERO BANNER */}
        <div className="pd-hero" style={{ background: 'linear-gradient(130deg, #DC2626 0%, #EF4444 40%, #F97316 100%)' }}>
          <div className="pd-hero-sub">{getGreeting()},</div>
          <div className="pd-hero-name">{memberName}</div>
          <div className="pd-hero-desc">Emergency Team Dashboard — Ready to respond.</div>
          <div className="pd-hero-tags">
            <span className="pd-hero-tag">ID: {emgId}</span>
            <span className="pd-hero-tag">{teamName}</span>
            {teamNumber && <span className="pd-hero-tag">Team #{teamNumber}</span>}
            <span className="pd-hero-tag">🚑 Emergency Response</span>
          </div>
          <div className="pd-hero-icon">
            <i className="bi bi-ambulance-fill" />
          </div>
        </div>

        {/* 3 STAT CARDS */}
        <div className="pd-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="pd-stat" onClick={() => handleNav('attended')}>
            <div className="pd-stat-icon-wrap">
              <span style={{ display: 'inline-flex', width: 44, height: 44, borderRadius: 12, background: '#FEF2F2', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-people-fill" style={{ fontSize: 20, color: '#DC2626' }} />
              </span>
            </div>
            <div className="pd-stat-num">{attended}</div>
            <div className="pd-stat-lbl">Patients Attended Today</div>
            <div className="pd-stat-sub">Click to view list</div>
          </div>

          <div className="pd-stat" onClick={() => handleNav('attend')}>
            <div className="pd-stat-icon-wrap">
              <span style={{ display: 'inline-flex', width: 44, height: 44, borderRadius: 12, background: '#F0FDF4', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-qr-code-scan" style={{ fontSize: 20, color: '#16A34A' }} />
              </span>
            </div>
            <div className="pd-stat-lbl" style={{ marginTop: 16, fontSize: 15 }}>Attend Patient</div>
            <div className="pd-stat-sub">Scan QR / Enter ID</div>
          </div>

          <div className="pd-stat" onClick={() => handleNav('request')}>
            <div className="pd-stat-icon-wrap">
              <span style={{ display: 'inline-flex', width: 44, height: 44, borderRadius: 12, background: '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-send-fill" style={{ fontSize: 20, color: '#1A47DB' }} />
              </span>
            </div>
            <div className="pd-stat-lbl" style={{ marginTop: 16, fontSize: 15 }}>Request Treatment</div>
            <div className="pd-stat-sub">Send to doctor</div>
          </div>
        </div>

        {/* BOTTOM ROW: Quick Attend + Recent Patients */}
        <div className="pd-bottom-row">
          {/* QUICK ATTEND */}
          <div className="pd-card" style={{ marginBottom: 0 }}>
            <div className="pd-card-head">
              <div className="pd-card-title"><span>Quick Attend Patient</span></div>
              <button className="pd-card-link" onClick={() => handleNav('attend')}>
                Full View <i className="bi bi-arrow-right" />
              </button>
            </div>
            <div style={{ padding: '14px 22px 22px' }}>
              <div style={{ background: '#FEF2F2', borderRadius: 16, padding: '20px', border: '1px solid #FECACA' }}>
                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>Enter Patient ID or scan QR code to identify patient</div>
                <div className="doc-consult-input-row">
                  <input type="text" value={attendPatientId} onChange={e => setAttendPatientId(e.target.value)} placeholder="PAT-123456"
                    className="doc-consult-input"
                    onKeyDown={e => { if (e.key === 'Enter') { handleAttendPatient(e); handleNav('attend'); } }}
                  />
                  <div className="doc-consult-btn-group">
                    <button onClick={() => setShowQRScanner(true)} className="doc-consult-qr-btn">
                      <i className="bi bi-qr-code-scan" />
                    </button>
                    <button onClick={() => { handleAttendPatient(null); handleNav('attend'); }} className="doc-consult-begin-btn" style={{ background: '#DC2626' }}>
                      Identify
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RECENT ATTENDED */}
          <div className="pd-card" style={{ marginBottom: 0 }}>
            <div className="pd-card-head">
              <div className="pd-card-title"><span>Recent Activity</span></div>
              <button className="pd-card-link" onClick={() => handleNav('attended')}>
                View all <i className="bi bi-arrow-right" />
              </button>
            </div>
            <div>
              {stats?.patientsAttendedToday?.length > 0 ? stats.patientsAttendedToday.slice(0, 3).map((p, i) => (
                <div className="pd-row" key={i} onClick={() => { setSelectedAttendedPatient(p); handleNav('attended'); }}>
                  <div className="pd-row-icon" style={{ background: '#FEF2F2' }}>
                    <i className="bi bi-person-fill" style={{ color: '#DC2626' }} />
                  </div>
                  <div className="pd-row-info">
                    <div className="pd-row-main">{p.patientId?.fullName || 'Patient'}</div>
                    <div className="pd-row-spec">{p.urgencyLevel || 'Emergency'} • {p.status}</div>
                  </div>
                  <span className="pd-badge" style={{ background: p.urgencyLevel === 'Critical' ? '#FEE2E2' : p.urgencyLevel === 'High' ? '#FEF3C7' : '#D1FAE5', color: p.urgencyLevel === 'Critical' ? '#991B1B' : p.urgencyLevel === 'High' ? '#92400E' : '#065F46' }}>
                    {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )) : (
                <div className="pd-empty">
                  <i className="bi bi-people" />
                  <p>No emergency activity yet today.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

  /* ════════════════════════════════════════
     PATIENTS ATTENDED TODAY
  ════════════════════════════════════════ */
  const renderAttended = () => (
    <div className="pd-card">
      <div className="pd-section-head">
        <div className="pd-sect-title">
          <i className="bi bi-people-fill" style={{ color: '#DC2626' }} /> Patients Attended Today
        </div>
        <div className="pd-sect-sub">Select a patient to view emergency details</div>
      </div>

      {stats?.patientsAttendedToday?.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.3fr', borderTop: '1px solid #E5E7EB' }}>
          <div style={{ borderRight: isMobile ? 'none' : '1px solid #E5E7EB', maxHeight: 500, overflowY: 'auto' }}>
            {stats.patientsAttendedToday.map((p, i) => (
              <div key={i} className="pd-row" style={{ background: selectedAttendedPatient?._id === p._id ? '#FEF2F2' : 'transparent' }}
                onClick={() => setSelectedAttendedPatient(p)}>
                <div className="pd-row-icon" style={{ background: selectedAttendedPatient?._id === p._id ? '#DC2626' : '#FEF2F2' }}>
                  <i className="bi bi-person-fill" style={{ color: selectedAttendedPatient?._id === p._id ? '#fff' : '#DC2626' }} />
                </div>
                <div className="pd-row-info">
                  <div className="pd-row-main">{p.patientId?.fullName || 'Patient'}</div>
                  <div className="pd-row-spec">ID: {p.patientId?.roleId || p.patientId?.userId || '—'}</div>
                </div>
                <span className="pd-badge" style={{ background: p.urgencyLevel === 'Critical' ? '#FEE2E2' : p.urgencyLevel === 'High' ? '#FEF3C7' : '#D1FAE5', color: p.urgencyLevel === 'Critical' ? '#991B1B' : p.urgencyLevel === 'High' ? '#92400E' : '#065F46' }}>
                  {p.urgencyLevel || 'Emergency'}
                </span>
              </div>
            ))}
          </div>
          <div style={{ padding: 22 }}>
            {selectedAttendedPatient ? (
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, color: '#1A1F36' }}>Emergency Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '12px 16px', border: '1px solid #E5E7EB' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.8px', marginBottom: 4 }}>Patient</div>
                    <div style={{ fontWeight: 600, color: '#1A1F36' }}>{selectedAttendedPatient.patientId?.fullName || '—'}</div>
                  </div>
                  <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '12px 16px', border: '1px solid #E5E7EB' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.8px', marginBottom: 4 }}>Urgency</div>
                    <div style={{ fontWeight: 700, color: selectedAttendedPatient.urgencyLevel === 'Critical' ? '#DC2626' : selectedAttendedPatient.urgencyLevel === 'High' ? '#D97706' : '#16A34A' }}>
                      {selectedAttendedPatient.urgencyLevel || '—'}
                    </div>
                  </div>
                </div>
                {selectedAttendedPatient.emergencyNotes && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.8px', marginBottom: 4 }}>Emergency Notes</div>
                    <div style={{ padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: 10, background: '#F9FAFB', fontSize: 14 }}>{selectedAttendedPatient.emergencyNotes}</div>
                  </div>
                )}
                {selectedAttendedPatient.firstAidGiven && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.8px', marginBottom: 4 }}>First Aid Given</div>
                    <div style={{ padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: 10, background: '#F0FDF4', fontSize: 14 }}>{selectedAttendedPatient.firstAidGiven}</div>
                  </div>
                )}
                {selectedAttendedPatient.situationDescription && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.8px', marginBottom: 4 }}>Situation</div>
                    <div style={{ padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: 10, background: '#F9FAFB', fontSize: 14 }}>{selectedAttendedPatient.situationDescription}</div>
                  </div>
                )}
                {/* Doctor Assignment Status */}
                <div style={{ marginTop: 12, padding: '12px 16px', borderRadius: 12, background: selectedAttendedPatient.status === 'Completed' ? '#D1FAE5' : selectedAttendedPatient.status === 'Accepted' ? '#DBEAFE' : '#FEF3C7', border: `1px solid ${selectedAttendedPatient.status === 'Completed' ? '#A7F3D0' : selectedAttendedPatient.status === 'Accepted' ? '#BFDBFE' : '#FDE68A'}` }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: selectedAttendedPatient.status === 'Completed' ? '#065F46' : selectedAttendedPatient.status === 'Accepted' ? '#1E40AF' : '#92400E', marginBottom: 4 }}>
                    <i className={`bi ${selectedAttendedPatient.status === 'Completed' ? 'bi-check-circle-fill' : selectedAttendedPatient.status === 'Accepted' ? 'bi-person-check-fill' : 'bi-hourglass-split'} me-2`} />
                    Status: {selectedAttendedPatient.status}
                  </div>
                  {selectedAttendedPatient.acceptedBy && (
                    <div style={{ fontSize: 12, color: '#374151' }}>Doctor Assigned: <strong>Dr. {selectedAttendedPatient.acceptedBy?.fullName || 'Unknown'}</strong></div>
                  )}
                  {selectedAttendedPatient.status === 'Completed' && selectedAttendedPatient.completedAt && (
                    <div style={{ fontSize: 12, color: '#374151' }}>Completed: {new Date(selectedAttendedPatient.completedAt).toLocaleString()}</div>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>
                  <i className="bi bi-clock me-1" />
                  Requested: {new Date(selectedAttendedPatient.createdAt).toLocaleString()}
                </div>
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
     ATTEND PATIENT PAGE
  ════════════════════════════════════════ */
  const renderAttendPatient = () => (
    <div className="pd-card">
      <div className="pd-section-head">
        <div className="pd-sect-title">
          <i className="bi bi-qr-code-scan" style={{ color: '#16A34A' }} /> Attend Patient
        </div>
        <div className="pd-sect-sub">Enter Patient ID or scan QR code to identify patient</div>
      </div>

      <div style={{ padding: '0 22px 22px' }}>
        {attendStep === 1 ? (
          <form onSubmit={handleAttendPatient} style={{ maxWidth: 500, margin: '0 auto', padding: '20px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <button type="button" onClick={() => {}}
                style={{ padding: '20px', borderRadius: 14, border: '2px solid #DBEAFE', background: '#EFF6FF', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                <i className="bi bi-keyboard" style={{ fontSize: 28, color: '#1A47DB', display: 'block', marginBottom: 8 }} />
                <div style={{ fontWeight: 700, color: '#1A1F36', fontSize: 14 }}>Enter Patient ID</div>
              </button>
              <button type="button" onClick={() => setShowQRScanner(true)}
                style={{ padding: '20px', borderRadius: 14, border: '2px solid #BBF7D0', background: '#F0FDF4', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                <i className="bi bi-qr-code-scan" style={{ fontSize: 28, color: '#16A34A', display: 'block', marginBottom: 8 }} />
                <div style={{ fontWeight: 700, color: '#1A1F36', fontSize: 14 }}>Scan QR Code</div>
              </button>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1F36', marginBottom: 8 }}>Enter Patient ID</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" value={attendPatientId} onChange={e => setAttendPatientId(e.target.value)} required placeholder="PAT-123456"
                className="pd-form-input" style={{ flex: 1 }} />
              <button type="button" onClick={() => setShowQRScanner(true)}
                style={{ padding: '11px 16px', background: '#F3F4F6', border: '1.5px solid #E5E7EB', borderRadius: 10, cursor: 'pointer', fontSize: 18, color: '#374151', display: 'flex', alignItems: 'center' }}>
                <i className="bi bi-qr-code-scan" />
              </button>
              <button className="pd-save-btn" type="submit" style={{ background: '#16A34A' }}>Identify</button>
            </div>
          </form>
        ) : (
          <div>
            {/* Patient info banner */}
            <div style={{ background: '#FEF2F2', borderRadius: 14, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #FECACA' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#DC2626', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                  <i className="bi bi-person-fill" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1A1F36' }}>{attendPatientData?.patient?.fullName || attendPatientId}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>ID: {attendPatientData?.patient?.roleId || attendPatientId}</div>
                </div>
              </div>
              <button onClick={resetAttend} style={{ padding: '6px 14px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                <i className="bi bi-x-lg" style={{ marginRight: 4 }} /> Close
              </button>
            </div>

            {/* Patient Information Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 16 }}>
              {/* Basic Info */}
              <div style={{ background: '#F9FAFB', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                <div style={{ padding: '12px 18px', background: 'linear-gradient(90deg, #DC2626, #EF4444)', color: '#fff', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="bi bi-person-lines-fill" /> Patient Info
                </div>
                <div style={{ padding: 18 }}>
                  {[
                    { label: 'Full Name', value: attendPatientData?.patient?.fullName },
                    { label: 'Phone', value: attendPatientData?.patient?.phone },
                    { label: 'Emergency Contact', value: typeof attendPatientData?.patient?.emergencyContact === 'object' ? attendPatientData?.patient?.emergencyContact?.phone : attendPatientData?.patient?.emergencyContact },
                    { label: 'Address', value: attendPatientData?.patient?.address },
                    { label: 'Blood Group', value: attendPatientData?.patient?.bloodGroup },
                    { label: 'Date of Birth', value: attendPatientData?.patient?.dateOfBirth },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 5 ? '1px solid #E5E7EB' : 'none' }}>
                      <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#1A1F36' }}>{item.value || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Health Info */}
              <div style={{ background: '#F9FAFB', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden', alignSelf: 'start' }}>
                <div style={{ padding: '12px 18px', background: 'linear-gradient(90deg, #1A47DB, #2563EB)', color: '#fff', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="bi bi-heart-pulse" /> Health Metrics
                </div>
                <div style={{ padding: 18 }}>
                  {attendPatientData?.vitals ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {[
                        { label: 'BP', value: attendPatientData.vitals.bloodPressure, emoji: '💓' },
                        { label: 'Heart Rate', value: attendPatientData.vitals.heartRate ? `${attendPatientData.vitals.heartRate} bpm` : null, emoji: '❤️' },
                        { label: 'SpO₂', value: attendPatientData.vitals.spo2 ? `${attendPatientData.vitals.spo2}%` : null, emoji: '🫁' },
                        { label: 'Temperature', value: attendPatientData.vitals.temperature ? `${attendPatientData.vitals.temperature}°F` : null, emoji: '🌡️' },
                        { label: 'Sugar', value: attendPatientData.vitals.sugarLevel, emoji: '🩸' },
                        { label: 'Weight', value: attendPatientData.vitals.weight ? `${attendPatientData.vitals.weight} kg` : null, emoji: '⚖️' },
                      ].map((v, i) => (
                        <div key={i} style={{ background: '#fff', borderRadius: 10, padding: '10px', textAlign: 'center', border: '1px solid #E5E7EB' }}>
                          <div style={{ fontSize: 20, marginBottom: 4 }}>{v.emoji}</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#1A1F36' }}>{v.value || '—'}</div>
                          <div style={{ fontSize: 11, color: '#6B7280' }}>{v.label}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#6B7280', fontSize: 13 }}>
                      <i className="bi bi-heart-pulse" style={{ fontSize: 24, display: 'block', marginBottom: 8, opacity: 0.3 }} />
                      No vitals recorded yet
                    </div>
                  )}

                  {/* Medical History */}
                  <div style={{ marginTop: 14, borderTop: '1px solid #E5E7EB', paddingTop: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.8px', marginBottom: 6 }}>Medical History</div>
                    <div style={{ fontSize: 13, color: '#1A1F36' }}>
                      {attendPatientData?.patient?.allergies && <div style={{ marginBottom: 4 }}>🚨 <strong>Allergies:</strong> {attendPatientData.patient.allergies}</div>}
                      {attendPatientData?.patient?.chronicDiseases && <div>⚕️ <strong>Conditions:</strong> {attendPatientData.patient.chronicDiseases}</div>}
                      {!attendPatientData?.patient?.allergies && !attendPatientData?.patient?.chronicDiseases && <span style={{ color: '#6B7280' }}>No known conditions</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Prescriptions */}
            {attendPatientData?.prescriptions?.length > 0 && (
              <div style={{ background: '#F9FAFB', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ padding: '12px 18px', background: 'linear-gradient(90deg, #16A34A, #22C55E)', color: '#fff', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="bi bi-capsule" /> Active Prescriptions
                </div>
                <div style={{ padding: 14 }}>
                  {attendPatientData.prescriptions.map((rx, i) => (
                    <div key={i} style={{ border: '1px solid #E5E7EB', borderRadius: 10, padding: '12px 16px', marginBottom: 8, background: '#fff' }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#1A1F36', marginBottom: 4 }}>{rx.diagnosis || 'Prescription'}</div>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>By Dr. {rx.doctorId?.fullName || 'Unknown'} • {new Date(rx.createdAt).toLocaleDateString()}</div>
                      {rx.medicines?.map((m, j) => (
                        <div key={j} style={{ fontSize: 12, color: '#374151', marginTop: 4 }}>💊 {m.name} — {m.dosage} ({m.frequency})</div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Request Treatment Button */}
            <button
              onClick={() => { setReqPatientId(attendPatientId); setReqPatientData(attendPatientData); setReqStep(2); handleNav('request'); }}
              className="pd-save-btn"
              style={{ width: '100%', padding: '14px', justifyContent: 'center', fontSize: 16, borderRadius: 14, background: '#DC2626' }}
            >
              <i className="bi bi-send" /> Request Treatment from Doctor
            </button>
          </div>
        )}
      </div>
    </div>
  );

  /* ════════════════════════════════════════
     REQUEST TREATMENT PAGE
  ════════════════════════════════════════ */
  const renderRequestTreatment = () => (
    <div className="pd-card">
      <div className="pd-section-head">
        <div className="pd-sect-title">
          <i className="bi bi-send-fill" style={{ color: '#1A47DB' }} /> Request Treatment to Doctor
        </div>
        <div className="pd-sect-sub">Send emergency treatment request to available doctors</div>
      </div>

      <div style={{ padding: '0 22px 22px' }}>
        {/* Step indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 0, marginBottom: 24, marginTop: 8 }}>
          {[1, 2, 3, 4].map(step => (
            <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: reqStep >= step ? '#DC2626' : '#F3F4F6', color: reqStep >= step ? '#fff' : '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, transition: 'all 0.2s' }}>
                {step}
              </div>
              {step < 4 && <div style={{ width: 40, height: 3, background: reqStep > step ? '#DC2626' : '#E5E7EB', borderRadius: 2, transition: 'background 0.2s' }} />}
            </div>
          ))}
        </div>

        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          {/* Step 1: Identify Patient */}
          {reqStep === 1 && (
            <form onSubmit={handleReqPatientValidate}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: '#1A1F36' }}>Step 1: Identify Patient</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <button type="button" onClick={() => {}}
                  style={{ padding: '18px', borderRadius: 14, border: '2px solid #FECACA', background: '#FEF2F2', cursor: 'pointer', textAlign: 'center' }}>
                  <i className="bi bi-keyboard" style={{ fontSize: 24, color: '#DC2626', display: 'block', marginBottom: 6 }} />
                  <div style={{ fontWeight: 700, color: '#1A1F36', fontSize: 13 }}>Enter Patient ID</div>
                </button>
                <button type="button" onClick={() => setShowQRScanner(true)}
                  style={{ padding: '18px', borderRadius: 14, border: '2px solid #BBF7D0', background: '#F0FDF4', cursor: 'pointer', textAlign: 'center' }}>
                  <i className="bi bi-qr-code-scan" style={{ fontSize: 24, color: '#16A34A', display: 'block', marginBottom: 6 }} />
                  <div style={{ fontWeight: 700, color: '#1A1F36', fontSize: 13 }}>Scan QR Code</div>
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="pd-form-input" value={reqPatientId} onChange={e => setReqPatientId(e.target.value)} required placeholder="PAT-123456" style={{ flex: 1 }} />
                <button className="pd-save-btn" type="submit" style={{ background: '#DC2626' }}>Verify</button>
              </div>
            </form>
          )}

          {/* Step 2: Choose Request Type */}
          {reqStep === 2 && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: '#1A1F36' }}>Step 2: Select Request Type</div>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>Patient: <strong>{reqPatientData?.patient?.fullName}</strong></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <button onClick={() => { setReqType('Specific Doctor'); setReqStep(3); }}
                  style={{ padding: '22px 16px', borderRadius: 14, border: '2px solid #DBEAFE', background: '#EFF6FF', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                  <i className="bi bi-person-check" style={{ fontSize: 32, color: '#1A47DB', display: 'block', marginBottom: 8 }} />
                  <div style={{ fontWeight: 700, color: '#1A1F36', fontSize: 14 }}>Specific Doctor</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>Search by name or ID</div>
                </button>
                <button onClick={() => { setReqType('Common Request'); setSelectedDoctor(null); setReqStep(3); }}
                  style={{ padding: '22px 16px', borderRadius: 14, border: '2px solid #BBF7D0', background: '#F0FDF4', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                  <i className="bi bi-broadcast" style={{ fontSize: 32, color: '#16A34A', display: 'block', marginBottom: 8 }} />
                  <div style={{ fontWeight: 700, color: '#1A1F36', fontSize: 14 }}>Common Request</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>Send to all available</div>
                </button>
              </div>
              <button onClick={() => setReqStep(1)} style={{ width: '100%', padding: '10px', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#6B7280' }}>
                <i className="bi bi-arrow-left" style={{ marginRight: 6 }} /> Back
              </button>
            </div>
          )}

          {/* Step 3: Select Doctor (if specific) OR Emergency Details */}
          {reqStep === 3 && (
            <div>
              {reqType === 'Specific Doctor' && !selectedDoctor ? (
                <>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: '#1A1F36' }}>Step 3: Search Doctor</div>
                  <div style={{ position: 'relative', marginBottom: 12 }}>
                    <input className="pd-form-input" value={doctorSearch} onChange={e => handleDoctorSearch(e.target.value)}
                      placeholder="Search by doctor name or ID..." style={{ paddingLeft: 36 }} />
                    <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6B7280', fontSize: 15 }} />
                  </div>
                  {doctorResults.length > 0 && (
                    <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', marginBottom: 12, maxHeight: 250, overflowY: 'auto' }}>
                      {doctorResults.map((doc, i) => (
                        <div key={i} className="pd-row" onClick={() => { setSelectedDoctor(doc); setReqStep(3); }}
                          style={{ cursor: 'pointer' }}>
                          <div className="pd-row-icon" style={{ background: '#EFF6FF' }}>
                            <i className="bi bi-person-fill" style={{ color: '#1A47DB' }} />
                          </div>
                          <div className="pd-row-info">
                            <div className="pd-row-main">Dr. {doc.fullName}</div>
                            <div className="pd-row-spec">{doc.roleId} • {doc.specialization || 'General'}</div>
                          </div>
                          <i className="bi bi-chevron-right" style={{ color: '#6B7280' }} />
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={() => { setReqStep(2); setDoctorSearch(''); setDoctorResults([]); }}
                    style={{ width: '100%', padding: '10px', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#6B7280' }}>
                    <i className="bi bi-arrow-left" style={{ marginRight: 6 }} /> Back
                  </button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#1A1F36' }}>
                    Step 3: Emergency Details
                  </div>

                  {selectedDoctor && (
                    <div style={{ background: '#EFF6FF', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #DBEAFE' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1A47DB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                          <i className="bi bi-person-fill" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#1A1F36' }}>Dr. {selectedDoctor.fullName}</div>
                          <div style={{ fontSize: 12, color: '#6B7280' }}>{selectedDoctor.roleId} • {selectedDoctor.specialization || 'General'}</div>
                        </div>
                      </div>
                      <button onClick={() => { setSelectedDoctor(null); setDoctorSearch(''); }} style={{ fontSize: 12, color: '#DC2626', background: '#FEE2E2', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 600 }}>Change</button>
                    </div>
                  )}

                  {reqType === 'Common Request' && (
                    <div style={{ background: '#F0FDF4', borderRadius: 12, padding: '12px 16px', marginBottom: 16, border: '1px solid #BBF7D0', fontSize: 13, color: '#065F46', fontWeight: 500 }}>
                      <i className="bi bi-broadcast me-2" />This request will be sent to all available doctors.
                    </div>
                  )}

                  {/* Urgency Level */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.8px', marginBottom: 8, display: 'block' }}>Urgency Level</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {['Critical', 'High', 'Moderate'].map(level => (
                        <button key={level} type="button" onClick={() => setUrgencyLevel(level)}
                          style={{
                            flex: 1, padding: '10px', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
                            border: urgencyLevel === level ? '2px solid' : '2px solid #E5E7EB',
                            borderColor: urgencyLevel === level ? (level === 'Critical' ? '#DC2626' : level === 'High' ? '#D97706' : '#16A34A') : '#E5E7EB',
                            background: urgencyLevel === level ? (level === 'Critical' ? '#FEE2E2' : level === 'High' ? '#FEF3C7' : '#D1FAE5') : '#F9FAFB',
                            color: urgencyLevel === level ? (level === 'Critical' ? '#991B1B' : level === 'High' ? '#92400E' : '#065F46') : '#6B7280',
                          }}
                        >
                          {level === 'Critical' ? '🔴' : level === 'High' ? '🟡' : '🟢'} {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Emergency Notes */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.8px', marginBottom: 6, display: 'block' }}>Emergency Notes</label>
                    <textarea className="pd-form-input" rows="2" value={emergencyNotes} onChange={e => setEmergencyNotes(e.target.value)}
                      placeholder="Describe the emergency situation..." style={{ resize: 'vertical' }} />
                  </div>

                  {/* First Aid Given */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.8px', marginBottom: 6, display: 'block' }}>First Aid Given</label>
                    <textarea className="pd-form-input" rows="2" value={firstAidGiven} onChange={e => setFirstAidGiven(e.target.value)}
                      placeholder="e.g. CPR performed, wound cleaned..." style={{ resize: 'vertical' }} />
                  </div>

                  {/* Situation Description */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.8px', marginBottom: 6, display: 'block' }}>Situation Description</label>
                    <textarea className="pd-form-input" rows="2" value={situationDesc} onChange={e => setSituationDesc(e.target.value)}
                      placeholder="e.g. Patient found unconscious at scene..." style={{ resize: 'vertical' }} />
                  </div>

                  {/* Summary */}
                  <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: '14px 16px', marginBottom: 16, fontSize: 13 }}>
                    <strong>Request Summary:</strong>
                    <div style={{ marginTop: 6 }}>
                      <div>Patient: <strong style={{ color: '#DC2626' }}>{reqPatientData?.patient?.fullName || reqPatientId}</strong></div>
                      <div>To: <strong>{selectedDoctor ? `Dr. ${selectedDoctor.fullName}` : 'All Available Doctors'}</strong></div>
                      <div>Urgency: <strong style={{ color: urgencyLevel === 'Critical' ? '#DC2626' : urgencyLevel === 'High' ? '#D97706' : '#16A34A' }}>{urgencyLevel}</strong></div>
                      <div>Team: <strong>{user?.teamName || '—'}</strong> (#{user?.teamNumber || '—'}) | EMG ID: <strong>{emgId}</strong></div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" onClick={() => { if (reqType === 'Specific Doctor' && selectedDoctor) { setSelectedDoctor(null); setDoctorSearch(''); } else { setReqStep(2); } }}
                      style={{ padding: '12px 20px', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#6B7280' }}>
                      <i className="bi bi-arrow-left" /> Back
                    </button>
                    <button onClick={submitEmergencyRequest} className="pd-save-btn" style={{ flex: 1, justifyContent: 'center', background: '#DC2626' }}>
                      <i className="bi bi-send" /> Send Emergency Request
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  /* ════════════════════════════════════════
     CONTENT ROUTER
  ════════════════════════════════════════ */
  const renderContent = () => {
    switch (active) {
      case 'overview': return renderOverview();
      case 'attended': return renderAttended();
      case 'attend': return renderAttendPatient();
      case 'request': return renderRequestTreatment();
      case 'settings': return <EmergencySettingsPage user={user} />;
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

export default EmergencyDashboard;
