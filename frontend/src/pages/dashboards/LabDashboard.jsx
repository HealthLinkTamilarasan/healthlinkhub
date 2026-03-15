import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import axiosInstance from '../../api/axiosInstance';
import { Sidebar, Header, Toast } from '../../components/DashboardLayoutComponents';
import LabSettingsPage from '../../components/LabSettingsPage';
import QRScannerModal from '../../components/QRScannerModal';
import '../../patient-dashboard.css';

/* ══════════════════════════════════════════
   NAV ITEMS — Lab version
══════════════════════════════════════════ */
const MAIN_NAV = [
  { key: 'overview',      icon: 'bi-grid-1x2-fill',       label: 'Overview' },
  { key: 'attend',        icon: 'bi-file-earmark-medical',label: 'Attend Patient' },
  { key: 'requests',      icon: 'bi-send-fill',           label: 'Doctor Requests' },
  { key: 'attended',      icon: 'bi-people-fill',         label: 'Attended Today' },
];

const BOTTOM_NAV = [
  { key: 'settings', icon: 'bi-gear', label: 'Settings' },
];

const MOBILE_NAV = [
  { key: 'overview',      icon: 'bi-grid-1x2-fill',       label: 'Dashboard' },
  { key: 'attend',        icon: 'bi-file-earmark-medical',label: 'Attend' },
  { key: 'requests',      icon: 'bi-send-fill',           label: 'Requests' },
  { key: 'settings',      icon: 'bi-person-circle',       label: 'Profile' },
];

/* ══════════════════════════════════════════
   LAB TECHNICIAN DASHBOARD COMPONENT
══════════════════════════════════════════ */
const LabDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [active, setActive] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [toast, setToast] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [loading, setLoading] = useState(true);

  // Stats Data
  const [stats, setStats] = useState({ attendedList: [], requests: [], completedToday: 0 });

  // Patient & Form State
  const [patientId, setPatientId] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [patientData, setPatientData] = useState(null);
  const [searchStep, setSearchStep] = useState(1);
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [selectedAttendedReport, setSelectedAttendedReport] = useState(null);

  // Upload Form State
  const [reportTitle, setReportTitle] = useState('');
  const [reportType, setReportType] = useState('General');
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e) => { setIsMobile(e.matches); if (e.matches) setMobileSidebar(false); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const effectiveSidebarOpen = isMobile ? mobileSidebar : sidebarOpen;
  const handleNav = (key) => { setActive(key); setMobileSidebar(false); };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/dashboard/lab-pharmacy');
      setStats({
        requests: res.data.requests || [],
        completedToday: res.data.completedToday || 0,
        attendedList: res.data.attendedList || []
      });
    } catch (err) {
      setToast({ msg: 'Failed to load dashboard data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const techName = user?.fullName || 'Technician';
  const labId = user?.userId || user?.roleId || 'LT-000';
  const labName = user?.labName || 'Central Lab';

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  /* ════════════ ATTEND PATIENT WORKFLOW ════════════ */
  const searchPatient = async (e, scannedId) => {
    if (e) e.preventDefault();
    const pid = scannedId || patientId;
    if (!pid) return;
    try {
      const res = await axiosInstance.get(`/dashboard/patient-data/${pid}`);
      setPatientId(pid);
      setPatientData(res.data);
      setSearchStep(2);
      setToast({ msg: `Patient found!`, type: 'success' });
    } catch (error) {
      setToast({ msg: 'Patient not found. Check the ID.', type: 'error' });
    }
  };

  const handleQRScanSuccess = (scannedId) => {
    setShowQRScanner(false);
    setActive('attend');
    setSearchStep(1);
    setTimeout(() => searchPatient(null, scannedId), 100);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      setToast({ msg: 'Uploading file...', type: 'success' });
      const res = await axiosInstance.post('/dashboard/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadedFileUrl(res.data.fileUrl);
      setToast({ msg: 'File uploaded successfully!', type: 'success' });
    } catch (error) {
      setToast({ msg: 'Error uploading file', type: 'error' });
    }
  };

  const submitReport = async (e) => {
    e.preventDefault();
    if (!uploadedFileUrl) { setToast({ msg: 'Please upload a file first.', type: 'error' }); return; }
    try {
      if (currentRequestId) {
        await axiosInstance.post('/dashboard/report', { patientId: patientData.patient._id, reportTitle, reportType, fileUrl: uploadedFileUrl, requestId: currentRequestId });
      } else {
        await axiosInstance.post('/dashboard/lab/manual-issue', { patientId: patientData.patient._id, reportTitle, fileUrl: uploadedFileUrl, notes: `Manual Report: ${reportTitle} (${reportType})` });
      }
      setToast({ msg: 'Report Uploaded Successfully!', type: 'success' });
      resetForm();
      fetchData();
      setActive('attended');
    } catch (error) {
      setToast({ msg: error.response?.data?.message || 'Error uploading report', type: 'error' });
    }
  };

  const acceptRequest = async (id) => {
    try {
      await axiosInstance.put(`/dashboard/accept-request/${id}`);
      setToast({ msg: 'Request Accepted! You can now process it.', type: 'success' });
      fetchData();
    } catch (error) {
      setToast({ msg: error.response?.data?.message || 'Error accepting request', type: 'error' });
    }
  };

  const processRequest = (req) => {
    setPatientId(req.patientId?.roleId || req.patientId?._id);
    setCurrentRequestId(req._id);
    setActive('attend');
    axiosInstance.get(`/dashboard/patient-data/${req.patientId?._id}`).then(res => {
      setPatientData(res.data);
      setSearchStep(2);
    }).catch(() => setSearchStep(1));
  };

  const resetForm = () => {
    setPatientId(''); setPatientData(null); setSearchStep(1); setReportTitle('');
    setReportType('General'); setUploadedFileUrl(''); setCurrentRequestId(null);
  };

  /* ════════════ OVERVIEW SECTION ════════════ */
  const renderOverview = () => {
    if (loading) return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
      </div>
    );

    return (
      <>
        {/* HERO BANNER */}
        <div className="pd-hero" style={{ background: 'linear-gradient(130deg, #2F80ED 0%, #56CCF2 100%)' }}>
          <div className="pd-hero-sub">{getGreeting()},</div>
          <div className="pd-hero-name">{techName}</div>
          <div className="pd-hero-desc">Here's your lab summary for today.</div>
          <div className="pd-hero-tags">
            <span className="pd-hero-tag">ID: {labId}</span>
            <span className="pd-hero-tag">Lab Technician</span>
            <span className="pd-hero-tag">🏥 {labName}</span>
          </div>
          <div className="pd-hero-icon"><i className="bi bi-file-earmark-medical-fill" /></div>
        </div>

        {/* 3 STAT CARDS */}
        <div className="pd-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          
          <div className="pd-stat" onClick={() => handleNav('attended')}>
            <div className="pd-stat-icon-wrap">
              <span style={{ display: 'inline-flex', width: 44, height: 44, borderRadius: 12, background: '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-people-fill" style={{ fontSize: 20, color: '#1A47DB' }} />
              </span>
            </div>
            <div className="pd-stat-num">{stats.completedToday}</div>
            <div className="pd-stat-lbl">Patients Attended Today</div>
            <div className="pd-stat-sub">Reports Generated</div>
          </div>

          <div className="pd-stat" onClick={() => { handleNav('attend'); resetForm(); }}>
            <div className="pd-stat-icon-wrap">
              <span style={{ display: 'inline-flex', width: 44, height: 44, borderRadius: 12, background: '#F0FDF4', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-file-earmark-medical" style={{ fontSize: 20, color: '#16A34A' }} />
              </span>
            </div>
            <div className="pd-stat-lbl" style={{ marginTop: 16, fontSize: 16 }}>Attend Patient</div>
            <div className="pd-stat-sub" style={{ marginTop: 4 }}>Scan QR or enter ID to begin</div>
          </div>

          <div className="pd-stat" onClick={() => handleNav('requests')}>
            <div className="pd-stat-icon-wrap">
              <span style={{ display: 'inline-flex', width: 44, height: 44, borderRadius: 12, background: '#FEF2F2', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-send-fill" style={{ fontSize: 20, color: '#DC2626' }} />
              </span>
            </div>
            <div className="pd-stat-num">{stats.requests.length}</div>
            <div className="pd-stat-lbl">Pending Doctor Requests</div>
            <div className="pd-stat-sub">Action required</div>
          </div>

        </div>

        {/* BOTTOM ROW: Quick Search + Recent Reports */}
        <div className="pd-bottom-row" style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
          
          <div className="pd-card" style={{ marginBottom: 0 }}>
            <div className="pd-card-head">
               <div className="pd-card-title"><span>Attend Patient</span></div>
               <button className="pd-card-link" onClick={() => handleNav('attend')}>View <i className="bi bi-arrow-right" /></button>
            </div>
            <div style={{ padding: '14px 22px 22px' }}>
               <div style={{ background: '#F0F7FF', borderRadius: 16, padding: '20px', border: '1px solid #DBEAFE' }}>
                 <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>Enter Patient ID or scan QR code to access patient records</div>
                 <div className="doc-consult-input-row">
                   <input type="text" value={patientId} onChange={e => setPatientId(e.target.value)} placeholder="PAT-123456" className="doc-consult-input" onKeyDown={e => { if (e.key === 'Enter') { searchPatient(e); handleNav('attend'); } }} />
                   <div className="doc-consult-btn-group">
                     <button onClick={() => setShowQRScanner(true)} className="doc-consult-qr-btn"><i className="bi bi-qr-code-scan" /></button>
                     <button onClick={(e) => { searchPatient(e); handleNav('attend'); }} className="doc-consult-begin-btn" style={{ background: '#2F80ED' }}>Search</button>
                   </div>
                 </div>
               </div>
            </div>
          </div>

          <div className="pd-card" style={{ marginBottom: 0 }}>
            <div className="pd-card-head">
              <div className="pd-card-title"><span>Recent Reports</span></div>
              <button className="pd-card-link" onClick={() => handleNav('attended')}>View all <i className="bi bi-arrow-right" /></button>
            </div>
            <div>
              {stats.attendedList.length > 0 ? stats.attendedList.slice(0, 3).map((rep, i) => (
                <div className="pd-row" key={i} onClick={() => { setSelectedAttendedReport(rep); handleNav('attended'); }}>
                  <div className="pd-row-icon" style={{ background: '#EFF6FF' }}>
                    <i className="bi bi-file-earmark-medical-fill" style={{ color: '#2F80ED' }} />
                  </div>
                  <div className="pd-row-info">
                    <div className="pd-row-main">{rep.patientName}</div>
                    <div className="pd-row-spec">{rep.details}</div>
                  </div>
                  <span className="pd-badge pd-b-confirmed">Done</span>
                </div>
              )) : (
                <div className="pd-empty">
                  <i className="bi bi-card-checklist" />
                  <p>No reports generated today.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </>
    );
  };

  /* ════════════ ATTEND PATIENT SECTION ════════════ */
  const renderAttendPatient = () => (
    <div className="pd-card">
      <div className="pd-section-head">
        <div className="pd-sect-title"><i className="bi bi-file-earmark-medical" style={{ color: '#2F80ED' }} /> Attend Patient</div>
        <div className="pd-sect-sub">Retrieve patient info and upload lab test reports</div>
      </div>

      <div style={{ padding: '0 22px 22px' }}>
        {searchStep === 1 ? (
          <form onSubmit={searchPatient} style={{ maxWidth: 500, margin: '0 auto', padding: '20px 0' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1F36', marginBottom: 8 }}>Enter Patient ID</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" value={patientId} onChange={e => setPatientId(e.target.value)} required placeholder="PAT-123456" className="pd-form-input" style={{ flex: 1 }} />
              <button type="button" onClick={() => setShowQRScanner(true)} style={{ padding: '11px 16px', background: '#F3F4F6', border: '1.5px solid #E5E7EB', borderRadius: 10, cursor: 'pointer', fontSize: 18, color: '#374151', display: 'flex', alignItems: 'center' }}>
                <i className="bi bi-qr-code-scan" />
              </button>
              <button className="pd-save-btn" type="submit" style={{ background: '#2F80ED' }}>Search</button>
            </div>
          </form>
        ) : (
          <div>
            <div style={{ background: '#EFF6FF', borderRadius: 14, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #DBEAFE' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#2F80ED', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                  <i className="bi bi-person-fill" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1A1F36' }}>{patientData?.patient?.fullName || patientId}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>ID: {patientData?.patient?.roleId} | {patientData?.patient?.age} yrs, {patientData?.patient?.gender}</div>
                </div>
              </div>
              <button onClick={resetForm} style={{ padding: '6px 14px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                <i className="bi bi-x-lg" style={{ marginRight: 4 }} /> Cancel
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 18 }}>
              
              {/* Left: Doctor Prescriptions */}
              <div style={{ background: '#F9FAFB', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                <div style={{ padding: '12px 18px', background: 'linear-gradient(90deg, #16A34A, #22C55E)', color: '#fff', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="bi bi-journal-medical" /> Doctor Prescriptions & Requests
                </div>
                <div style={{ padding: 18, maxHeight: 400, overflowY: 'auto' }}>
                  {patientData?.prescriptions?.length > 0 ? patientData.prescriptions.map(rx => (
                    <div key={rx._id} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                        <span>{rx.diagnosis}</span>
                        <span style={{ fontSize: 11, color: '#6B7280' }}>{new Date(rx.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#4B5563', marginBottom: 8 }}>Dr. {rx.doctorId?.fullName}</div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {rx.medicines?.map((m, i) => <span key={i} style={{ padding: '2px 8px', background: '#F3F4F6', borderRadius: 12, fontSize: 11, fontWeight: 500 }}>{m.name}</span>)}
                      </div>
                    </div>
                  )) : <p style={{ color: '#6B7280', fontSize: 13, textAlign: 'center' }}>No active prescriptions.</p>}
                  
                  {currentRequestId && (
                    <div style={{ marginTop: 15, padding: 12, background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: 10 }}>
                      <div style={{ fontWeight: 700, color: '#D97706', fontSize: 13, marginBottom: 4 }}><i className="bi bi-info-circle" /> Associated Lab Request Active</div>
                      <div style={{ fontSize: 12, color: '#92400E' }}>Uploading report will complete this specific doctor request.</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Upload Form */}
              <div style={{ background: '#F9FAFB', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                <div style={{ padding: '12px 18px', background: 'linear-gradient(90deg, #2F80ED, #56CCF2)', color: '#fff', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="bi bi-cloud-upload" /> Upload Lab Report
                </div>
                <form onSubmit={submitReport} style={{ padding: 18 }}>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.8px', marginBottom: 6, display: 'block' }}>Report Title</label>
                    <input className="pd-form-input" value={reportTitle} onChange={e => setReportTitle(e.target.value)} required placeholder="e.g. Complete Blood Count" />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.8px', marginBottom: 6, display: 'block' }}>Report Type</label>
                    <select className="pd-form-input" value={reportType} onChange={e => setReportType(e.target.value)}>
                      {['General', 'Blood Test', 'Urine Test', 'X-Ray', 'MRI', 'CT Scan', 'Other'].map(op => <option key={op}>{op}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.8px', marginBottom: 6, display: 'block' }}>Upload File (PDF/Image)</label>
                    <input type="file" className="pd-form-input" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx" style={{ padding: 8 }} />
                    {uploadedFileUrl && <div style={{ fontSize: 12, color: '#16A34A', marginTop: 6, fontWeight: 600 }}><i className="bi bi-check-circle" /> File attached automatically</div>}
                  </div>
                  <button className="pd-save-btn" type="submit" style={{ width: '100%', justifyContent: 'center', padding: 12, background: '#2F80ED' }}>
                    <i className="bi bi-cloud-upload" /> Submit Report
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );

  /* ════════════ DOCTOR REQUESTS SECTION ════════════ */
  const renderRequests = () => (
    <div className="pd-card">
      <div className="pd-section-head">
        <div className="pd-sect-title"><i className="bi bi-send-fill" style={{ color: '#DC2626' }} /> Doctor Requests</div>
        <div className="pd-sect-sub">Pending lab tests requested by doctors</div>
      </div>
      <div style={{ padding: '0 22px 22px' }}>
        {stats.requests.length > 0 ? (
          <div className="table-responsive" style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
            <table className="table table-hover align-middle mb-0" style={{ fontSize: 14, margin: 0 }}>
              <thead style={{ background: '#F9FAFB' }}>
                <tr>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>Doctor & Patient</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>Test Details</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#4B5563', borderBottom: '1px solid #E5E7EB', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.requests.map(req => (
                  <tr key={req._id}>
                    <td style={{ padding: '16px', borderBottom: '1px solid #E5E7EB' }}>
                      <div style={{ fontWeight: 600, color: '#1A1F36' }}>Patient: {req.patientId?.fullName}</div>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>By Dr. {req.doctorId?.fullName}</div>
                    </td>
                    <td style={{ padding: '16px', borderBottom: '1px solid #E5E7EB', maxWidth: 200 }}>
                      <div style={{ color: '#4B5563', fontSize: 13, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={req.details}>{req.details}</div>
                    </td>
                    <td style={{ padding: '16px', borderBottom: '1px solid #E5E7EB' }}>
                      {req.status === 'Pending' && <span className="pd-badge" style={{ background: '#FEF3C7', color: '#D97706' }}>Pending</span>}
                      {req.status === 'Accepted' && <span className="pd-badge" style={{ background: '#DCFCE7', color: '#16A34A' }}>Accepted</span>}
                    </td>
                    <td style={{ padding: '16px', borderBottom: '1px solid #E5E7EB', textAlign: 'right' }}>
                      {req.status === 'Pending' ? (
                        <button className="pd-save-btn" onClick={() => acceptRequest(req._id)} style={{ padding: '6px 14px', background: '#16A34A', fontSize: 13 }}>
                          Accept
                        </button>
                      ) : (
                        <button className="pd-save-btn" onClick={() => processRequest(req)} style={{ padding: '6px 14px', background: '#2F80ED', fontSize: 13 }}>
                          Process
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="pd-empty">
            <i className="bi bi-inbox" />
            <p>No active requests right now.</p>
          </div>
        )}
      </div>
    </div>
  );

  /* ════════════ ATTENDED PATIENTS SECTION ════════════ */
  const renderAttended = () => (
    <div className="pd-card">
      <div className="pd-section-head">
        <div className="pd-sect-title"><i className="bi bi-people-fill" style={{ color: '#1A47DB' }} /> Patients Attended Today</div>
        <div className="pd-sect-sub">Lab reports you uploaded today</div>
      </div>
      {stats.attendedList.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.3fr', borderTop: '1px solid #E5E7EB' }}>
          
          {/* Left: Table/List of reports */}
          <div style={{ borderRight: isMobile ? 'none' : '1px solid #E5E7EB', maxHeight: 500, overflowY: 'auto' }}>
            {stats.attendedList.map((rep, i) => (
              <div key={i} className="pd-row" style={{ background: selectedAttendedReport?._id === rep._id ? '#EFF6FF' : 'transparent' }} onClick={() => setSelectedAttendedReport(rep)}>
                <div className="pd-row-icon" style={{ background: selectedAttendedReport?._id === rep._id ? '#1A47DB' : '#EFF6FF' }}>
                  <i className="bi bi-file-earmark-medical-fill" style={{ color: selectedAttendedReport?._id === rep._id ? '#fff' : '#1A47DB' }} />
                </div>
                <div className="pd-row-info">
                  <div className="pd-row-main">{rep.patientName}</div>
                  <div className="pd-row-spec">ID: {rep.patientId}</div>
                </div>
                <span className="pd-badge" style={{ background: '#DCFCE7', color: '#16A34A', fontSize: 11 }}>{new Date(rep.time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
              </div>
            ))}
          </div>
          
          {/* Right: Detailed report info */}
          <div style={{ padding: 22 }}>
            {selectedAttendedReport ? (
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, color: '#1A1F36' }}>Report Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.8px', marginBottom: 4 }}>Patient Name</div>
                    <div style={{ fontWeight: 600, color: '#1A1F36' }}>{selectedAttendedReport.patientName}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.8px', marginBottom: 4 }}>Patient ID</div>
                    <div style={{ fontWeight: 600, color: '#1A1F36' }}>{selectedAttendedReport.patientId}</div>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.8px', marginBottom: 4 }}>Report Information</div>
                    <div style={{ fontWeight: 500, color: '#4B5563', padding: '10px 14px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB' }}>{selectedAttendedReport.details}</div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.8px', marginBottom: 6 }}>Action</div>
                  <button className="pd-save-btn" style={{ background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB' }} onClick={() => setToast({ msg:'Cannot view full report from overview.', type:'error' })}>
                    <i className="bi bi-eye" /> View Attached File (Not Available)
                  </button>
                </div>
              </div>
            ) : (
              <div className="pd-empty"><i className="bi bi-card-checklist" /><p>Select a report to view details</p></div>
            )}
          </div>

        </div>
      ) : (
        <div className="pd-empty"><i className="bi bi-people" /><p>No patients attended yet today.</p></div>
      )}
    </div>
  );

  /* ════════════ CONTENT ROUTER ════════════ */
  const renderContent = () => {
    switch (active) {
      case 'overview': return renderOverview();
      case 'attend': return renderAttendPatient();
      case 'requests': return renderRequests();
      case 'attended': return renderAttended();
      case 'settings': return <LabSettingsPage user={user} />;
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

export default LabDashboard;
