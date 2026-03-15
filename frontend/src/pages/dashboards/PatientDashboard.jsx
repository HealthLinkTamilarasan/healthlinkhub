import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import AuthContext from '../../context/AuthContext';
import { Sidebar, Header, Toast } from '../../components/DashboardLayoutComponents';
import SettingsPage from '../../components/SettingsPage';
import { getPatientDashboard } from '../../api/api';
import '../../patient-dashboard.css';

/* ══════════════════════════════════════════
   NAV ITEMS — exact match to Figma
══════════════════════════════════════════ */
const MAIN_NAV = [
  { key: 'overview',      icon: 'bi-grid-1x2-fill',     label: 'Overview' },
  { key: 'visits',        icon: 'bi-calendar3',         label: 'Upcoming Visits' },
  { key: 'prescriptions', icon: 'bi-capsule',           label: 'Prescriptions' },
  { key: 'labReports',    icon: 'bi-file-earmark-medical', label: 'Lab Reports' },
  { key: 'metrics',       icon: 'bi-activity',          label: 'Health Metrics' },
];

const BOTTOM_NAV = [
  { key: 'settings', icon: 'bi-gear', label: 'Settings' },
];

/* ══════════════════════════════════════════
   BOTTOM NAV (MOBILE) — matches Figma
══════════════════════════════════════════ */
const MOBILE_NAV = [
  { key: 'overview',      icon: 'bi-grid-1x2-fill', label: 'Home' },
  { key: 'visits',        icon: 'bi-calendar3',     label: 'Visits' },
  { key: 'prescriptions', icon: 'bi-capsule',       label: 'Rx' },
  { key: 'labReports',    icon: 'bi-file-earmark-medical', label: 'Labs' },
  { key: 'metrics',       icon: 'bi-activity',      label: 'Metrics' },
];

/* ══════════════════════════════════════════
   MOCK DATA (matches Figma exactly)
══════════════════════════════════════════ */
const MOCK_VITALS = [
  { emoji: '🫁', value: '120/78', label: 'Blood Pressure', bg: '#EFF6FF', color: '#1A47DB' },
  { emoji: '❤️', value: '71 bpm', label: 'Heart Rate', bg: '#FEF2F2', color: '#DC2626' },
  { emoji: '🫀', value: '98%', label: 'SpO₂', bg: '#FFF7ED', color: '#EA580C' },
  { emoji: '⚖️', value: '66.8 kg', label: 'Weight', bg: '#FFFBEB', color: '#CA8A04' },
  { emoji: '📊', value: '23.4', label: 'BMI', bg: '#F0FDF4', color: '#16A34A' },
  { emoji: '🌡️', value: '98.4°F', label: 'Temperature', bg: '#FAF5FF', color: '#9333EA' },
];

const MOCK_APPOINTMENTS = [
  {
    doctor: 'Dr. Emily Carter',
    specialization: 'Cardiologist',
    date: 'March 14, 2026 at 10:30 AM',
    status: 'Confirmed',
  },
];

const MOCK_MEDICATIONS = [
  { name: 'Metoprolol Succinate', dose: '50mg · Once daily', category: 'Heart', catBg: '#EFF6FF', catColor: '#1A47DB', status: 'Active' },
  { name: 'Atorvastatin', dose: '20mg · Once daily at bedtime', category: 'Cholesterol', catBg: '#F0FDF4', catColor: '#16A34A', status: 'Active' },
  { name: 'Cetirizine', dose: '10mg · Once daily as needed', category: 'Allergy', catBg: '#FFF7ED', catColor: '#EA580C', status: 'Active' },
];

/* ══════════════════════════════════════════
   PATIENT DASHBOARD COMPONENT
══════════════════════════════════════════ */
const PatientDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [active, setActive] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [toast, setToast] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [dashboardData, setDashboardData] = useState({
    patient: null,
    appointments: [],
    prescriptions: [],
    labReports: [],
    vitals: null,
    manualRequests: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getPatientDashboard();
        setDashboardData(res.data);
      } catch (err) {
        setToast({ msg: 'Failed to load dashboard data', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  /* Detect mobile/desktop */
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e) => {
      setIsMobile(e.matches);
      if (e.matches) setMobileSidebar(false); // close mobile sidebar on resize
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  /* Sidebar open state: on mobile, controlled by mobileSidebar; on desktop, by sidebarOpen */
  const effectiveSidebarOpen = isMobile ? mobileSidebar : sidebarOpen;

  /* Close mobile sidebar on nav change */
  const handleNav = (key) => {
    setActive(key);
    setMobileSidebar(false);
  };

  /* Patient details from fetched data (fallback to context) */
  const patient = dashboardData.patient || user;
  const patientName = patient?.fullName || 'Sarah Johnson';
  const patientId = patient?.roleId || patient?.userId || patient?.healthId || 'PAT-2026-4872';
  const bloodType = patient?.bloodGroup || 'O+';
  const dob = patient?.dateOfBirth
    ? new Date(patient.dateOfBirth).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'March 15, 1990';

  /* Greeting based on time of day */
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  /* ════════════════════════════════════════
     DATA FORMATTERS
  ════════════════════════════════════════ */

  const downloadReportAsPDF = async (report) => {
    try {
      setToast({ msg: 'Generating PDF...', type: 'success' });
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      pdf.setFontSize(22);
      pdf.setTextColor(26, 71, 219);
      pdf.text('HealthLink Hub - Lab Report', 20, 20);
      
      pdf.setFontSize(12);
      pdf.setTextColor(50, 50, 50);
      pdf.text(`Patient Name: ${patientName}`, 20, 40);
      pdf.text(`Patient ID: ${patientId}`, 20, 48);
      
      pdf.setFontSize(14);
      pdf.setTextColor(20, 20, 20);
      pdf.text(`Test Details`, 20, 65);
      
      pdf.setFontSize(11);
      pdf.text(`Test Name: ${report.reportTitle}`, 20, 75);
      pdf.text(`Lab: ${report.labId?.labName || report.labId?.fullName || '--'}`, 20, 83);
      pdf.text(`Date: ${new Date(report.createdAt).toLocaleDateString()}`, 20, 91);
      
      let yOffset = 105;
      if (report.resultSummary) {
        pdf.text('Summary:', 20, yOffset);
        yOffset += 8;
        const splitSummary = pdf.splitTextToSize(report.resultSummary, 170);
        pdf.text(splitSummary, 20, yOffset);
        yOffset += (splitSummary.length * 6) + 10;
      }

      if (report.fileUrl) {
        const url = report.fileUrl.startsWith('http') ? report.fileUrl : `http://localhost:5000${report.fileUrl}`;
        if (url.match(/\.(jpeg|jpg|png|gif)$/i)) {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.src = url;
          await new Promise((resolve) => {
              img.onload = () => {
                  const props = pdf.getImageProperties(img);
                  // Allow up to roughly full page width minus margins
                  const maxWidth = 170;
                  const maxHeight = 150; // Constrain vertical space aggressively
                  let width = props.width;
                  let height = props.height;
                  
                  // Scale width
                  if (width > maxWidth) {
                     height = (height * maxWidth) / width;
                     width = maxWidth;
                  }
                  // Scale height
                  if (height > maxHeight) {
                     width = (width * maxHeight) / height;
                     height = maxHeight;
                  }

                  if (yOffset + height > 280) {
                      pdf.addPage();
                      yOffset = 20;
                  }
                  // Center image horizontally
                  const xOffset = 20 + (maxWidth - width) / 2;
                  pdf.addImage(img, 'PNG', xOffset, yOffset, width, height);
                  resolve();
              };
              img.onerror = () => {
                  console.warn('Failed to load image for PDF');
                  resolve(); // ignore error mapping
              };
          });
        } else {
             pdf.text(`[ A document preview is not attached, but requested viewable at: ${url} ]`, 20, yOffset);
        }
      }

      pdf.save(`HealthLink_Report_${patientName}_${report.reportTitle}.pdf`);
      setToast({ msg: 'Report downloaded successfully!', type: 'success' });
    } catch (e) {
      console.error(e);
      setToast({ msg: 'Failed to generate PDF', type: 'error' });
    }
  };
  const formatAppointments = (apts) => apts.map(apt => {
    const d = new Date(apt.appointmentDate);
    return {
      id: apt._id,
      doctor: apt.doctorId?.fullName || 'Unknown Doctor',
      specialization: apt.doctorId?.specialization || 'General',
      date: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      status: apt.status
    };
  });
  
  const upcomingVisits = formatAppointments(dashboardData.appointments.filter(a => a.status !== 'Cancelled'));

  const getCatColors = (category) => {
    const colors = [
      { bg: '#EFF6FF', color: '#1A47DB' },
      { bg: '#F0FDF4', color: '#16A34A' },
      { bg: '#FFF7ED', color: '#EA580C' },
      { bg: '#FAF5FF', color: '#9333EA' },
    ];
    let hash = 0;
    for (let i = 0; i < category.length; i++) hash = category.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const activeMedications = dashboardData.prescriptions.flatMap(p => 
    p.medicines.map(m => {
      const colors = getCatColors(p.diagnosis || 'Medicine');
      return {
        name: m.name,
        dose: `${m.dosage} · ${m.frequency}`,
        category: p.diagnosis || 'Medicine',
        catBg: colors.bg,
        catColor: colors.color,
        status: p.status,
        rawPrescription: p // Keep original object for modal
      };
    })
  );

  const vitalsData = dashboardData.vitals ? [
    { emoji: '🫀', value: dashboardData.vitals.bloodPressure || '--', label: 'Blood Pressure', bg: '#FEF2F2', color: '#DC2626' },
    { emoji: '❤️', value: dashboardData.vitals.heartRate ? dashboardData.vitals.heartRate + ' bpm' : '--', label: 'Heart Rate', bg: '#FFF7ED', color: '#EA580C' },
    { emoji: '🫁', value: dashboardData.vitals.spo2 ? dashboardData.vitals.spo2 + '%' : '--', label: 'SpO₂', bg: '#EFF6FF', color: '#2563EB' },
    { emoji: '⚖️', value: dashboardData.vitals.weight ? dashboardData.vitals.weight + ' kg' : '--', label: 'Weight', bg: '#FAF5FF', color: '#9333EA' },
    { emoji: '📊', value: dashboardData.vitals.bmi || '--', label: 'BMI', bg: '#F0FDF4', color: '#16A34A' },
    { emoji: '🌡️', value: dashboardData.vitals.temperature ? dashboardData.vitals.temperature + '°F' : '--', label: 'Temperature', bg: '#FFFBEB', color: '#D97706' },
  ] : [
    { emoji: '🫀', value: '--', label: 'Blood Pressure', bg: '#FEF2F2', color: '#DC2626' },
    { emoji: '❤️', value: '--', label: 'Heart Rate', bg: '#FFF7ED', color: '#EA580C' },
    { emoji: '🫁', value: '--', label: 'SpO₂', bg: '#EFF6FF', color: '#2563EB' },
    { emoji: '⚖️', value: '--', label: 'Weight', bg: '#FAF5FF', color: '#9333EA' },
    { emoji: '📊', value: '--', label: 'BMI', bg: '#F0FDF4', color: '#16A34A' },
    { emoji: '🌡️', value: '--', label: 'Temperature', bg: '#FFFBEB', color: '#D97706' },
  ];

  const recentLabReports = dashboardData.labReports.map(r => {
    const d = new Date(r.createdAt);
    return {
      name: r.reportTitle,
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: r.status || 'Available',
      icon: 'bi-file-earmark-medical-fill',
      rawReport: r
    };
  });

  /* ════════════════════════════════════════
     OVERVIEW PAGE — exact Figma match
  ════════════════════════════════════════ */
  const renderOverview = () => {
    if (loading) {
      return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      );
    }
    return (
    <>
      {/* HERO BANNER */}
      <div className="pd-hero">
        <div className="pd-hero-sub">{getGreeting()},</div>
        <div className="pd-hero-name">{patientName}</div>
        <div className="pd-hero-desc">Here's your health summary for today.</div>
        <div className="pd-hero-tags">
          <span className="pd-hero-tag">ID: {patientId}</span>
          <span className="pd-hero-tag">Blood: {bloodType}</span>
          <span className="pd-hero-tag">DOB: {dob}</span>
        </div>
        <div className="pd-hero-icon">
          <i className="bi bi-heart-fill" />
        </div>
      </div>

      {/* 4 STAT CARDS — 4 columns on desktop, 2x2 on mobile */}
      <div className="pd-stats-grid">
        <div className="pd-stat" onClick={() => handleNav('visits')}>
          <div className="pd-stat-icon-wrap">
            <span style={{ display: 'inline-flex', width: 44, height: 44, borderRadius: 12, background: '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-calendar3" style={{ fontSize: 20, color: '#1A47DB' }} />
            </span>
          </div>
          <div className="pd-stat-num">{upcomingVisits.length}</div>
          <div className="pd-stat-lbl">Upcoming Visits</div>
          <div className="pd-stat-sub">
            {upcomingVisits.length > 0 ? `Next: ${upcomingVisits[0].date.split(' at ')[0]}` : 'None scheduled'}
          </div>
        </div>
        <div className="pd-stat" onClick={() => handleNav('prescriptions')}>
          <div className="pd-stat-icon-wrap">
            <span style={{ display: 'inline-flex', width: 44, height: 44, borderRadius: 12, background: '#F0FDF4', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-capsule" style={{ fontSize: 20, color: '#16A34A' }} />
            </span>
          </div>
          <div className="pd-stat-num">{activeMedications.length}</div>
          <div className="pd-stat-lbl">Active Prescriptions</div>
          <div className="pd-stat-sub">All up to date</div>
        </div>
        <div className="pd-stat" onClick={() => handleNav('labReports')}>
          <div className="pd-stat-icon-wrap">
            <span style={{ display: 'inline-flex', width: 44, height: 44, borderRadius: 12, background: '#FAF5FF', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-file-earmark-medical" style={{ fontSize: 20, color: '#9333EA' }} />
            </span>
          </div>
          <div className="pd-stat-num">{recentLabReports.length}</div>
          <div className="pd-stat-lbl">Lab Reports</div>
          <div className="pd-stat-sub">
            {recentLabReports.length > 0 ? `Last: ${recentLabReports[0].date}` : 'No recent reports'}
          </div>
        </div>
        <div className="pd-stat" onClick={() => handleNav('metrics')}>
          <div className="pd-stat-icon-wrap">
            <span style={{ display: 'inline-flex', width: 44, height: 44, borderRadius: 12, background: '#FEF2F2', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-activity" style={{ fontSize: 20, color: '#DC2626' }} />
            </span>
          </div>
          <div className="pd-stat-lbl" style={{ marginTop: 16, fontSize: 15 }}>Health Card</div>
          <div className="pd-stat-sub" style={{ marginTop: 4 }}>View Details</div>
        </div>
      </div>

      {/* CURRENT VITALS SECTION */}
      <div className="pd-card">
        <div className="pd-card-head">
          <div className="pd-card-title">
            <span>Current Vitals</span>
          </div>
          <button className="pd-card-link" onClick={() => handleNav('metrics')}>
            Details <i className="bi bi-arrow-right" />
          </button>
        </div>
        <div className="pd-card-sub">Your latest health readings</div>
        <div className="pd-vitals">
          {vitalsData.map((v, i) => (
            <div className="pd-vital" key={i} style={{ background: v.bg }}>
              <span className="pd-vital-emoji">{v.emoji}</span>
              <div className="pd-vital-val" style={{ color: v.color }}>{v.value}</div>
              <div className="pd-vital-lbl">{v.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM ROW: Next Appointment + Active Medications */}
      <div className="pd-bottom-row">
        {/* NEXT APPOINTMENT */}
        <div className="pd-card" style={{ marginBottom: 0 }}>
          <div className="pd-card-head">
            <div className="pd-card-title">
              <span>Next Appointment</span>
            </div>
            <button className="pd-card-link" onClick={() => handleNav('visits')}>
              All visits <i className="bi bi-arrow-right" />
            </button>
          </div>
          <div style={{ padding: '14px 22px 22px' }}>
            {upcomingVisits.length > 0 ? (
              <div style={{

                background: '#F0F7FF',
                borderRadius: 16,
                padding: '18px 20px',
                border: '1px solid #DBEAFE',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 12,
                    background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid #DBEAFE', flexShrink: 0,
                  }}>
                    <i className="bi bi-calendar3" style={{ fontSize: 20, color: '#1A47DB' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1A1F36' }}>{upcomingVisits[0].doctor}</div>
                    <div style={{ fontSize: 13, color: '#6B7280' }}>{upcomingVisits[0].specialization}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                      <i className="bi bi-clock" style={{ fontSize: 12, color: '#1A47DB' }} />
                      <span style={{ fontSize: 12, color: '#1A47DB', fontWeight: 500 }}>{upcomingVisits[0].date}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                      <i className="bi bi-check-circle-fill" style={{ fontSize: 12, color: '#16A34A' }} />
                      <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 600 }}>{upcomingVisits[0].status}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-muted text-center py-4">No upcoming visits scheduled</div>
            )}
          </div>
        </div>

        {/* ACTIVE MEDICATIONS */}
        <div className="pd-card" style={{ marginBottom: 0 }}>
          <div className="pd-card-head">
            <div className="pd-card-title">
              <span>Active Medications</span>
            </div>
            <button className="pd-card-link" onClick={() => handleNav('prescriptions')}>
              All Rx <i className="bi bi-arrow-right" />
            </button>
          </div>
          <div>
            {activeMedications.length > 0 ? activeMedications.map((med, i) => (
              <div className="pd-row" key={i} style={{ cursor: 'pointer' }} onClick={() => setSelectedPrescription(med.rawPrescription)}>
                <div className="pd-med-icon">
                  <i className="bi bi-capsule" />
                </div>
                <div className="pd-row-info">
                  <div className="pd-med-name">{med.name}</div>
                  <div className="pd-med-dose">{med.dose}</div>
                </div>
                <span className="pd-badge pd-b-active">{med.status}</span>
              </div>
            )) : (
              <div className="text-muted text-center py-4">No active medications</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
  };

  /* ════════════════════════════════════════
     UPCOMING VISITS PAGE
  ════════════════════════════════════════ */
  const renderVisits = () => {
    if (loading) return null;
    return (
    <div className="pd-card">
      <div className="pd-section-head">
        <div className="pd-sect-title">
          <i className="bi bi-calendar3" style={{ color: '#1A47DB' }} /> Upcoming Visits
        </div>
        <div className="pd-sect-sub">Your scheduled appointments</div>
      </div>
      {upcomingVisits.map((apt, i) => (
        <div className="pd-row" key={i}>
          <div className="pd-row-icon" style={{ background: '#EFF6FF' }}>
            <i className="bi bi-calendar3" style={{ color: '#1A47DB' }} />
          </div>
          <div className="pd-row-info">
            <div className="pd-row-main">{apt.doctor}</div>
            <div className="pd-row-spec">{apt.specialization}</div>
            <div className="pd-row-time">
              <i className="bi bi-clock" /> {apt.date}
            </div>
          </div>
          <span className="pd-badge pd-b-confirmed">{apt.status}</span>
        </div>
      ))}
      {upcomingVisits.length === 0 && (
        <div className="pd-empty">
          <i className="bi bi-calendar-x" />
          <p>No upcoming visits scheduled.</p>
        </div>
      )}
    </div>
  )};

  /* ════════════════════════════════════════
     PRESCRIPTIONS PAGE
  ════════════════════════════════════════ */
  const renderPrescriptions = () => {
    if (loading) return null;
    return (
    <div className="pd-card">
      <div className="pd-section-head">
        <div className="pd-sect-title">
          <i className="bi bi-capsule" style={{ color: '#16A34A' }} /> Active Prescriptions
        </div>
        <div className="pd-sect-sub">Your current medications</div>
      </div>
      {activeMedications.map((med, i) => (
        <div className="pd-row" key={i} style={{ cursor: 'pointer' }} onClick={() => setSelectedPrescription(med.rawPrescription)}>
          <div className="pd-med-icon">
            <i className="bi bi-capsule" />
          </div>
          <div className="pd-row-info">
            <div className="pd-med-name">{med.name}</div>
            <div className="pd-med-dose">{med.dose}</div>
            <span className="pd-med-cat" style={{ background: med.catBg, color: med.catColor }}>{med.category}</span>
          </div>
          <span className="pd-badge pd-b-active">{med.status}</span>
        </div>
      ))}
      {activeMedications.length === 0 && (
        <div className="pd-empty">
          <i className="bi bi-capsule" />
          <p>No active prescriptions.</p>
        </div>
      )}
    </div>
  )};

  /* ════════════════════════════════════════
     LAB REPORTS PAGE
  ════════════════════════════════════════ */
  const renderLabReports = () => {
    if (loading) return null;
    return (
      <div className="pd-card">
        <div className="pd-section-head">
          <div className="pd-sect-title">
            <i className="bi bi-file-earmark-medical" style={{ color: '#9333EA' }} /> Lab Reports
          </div>
          <div className="pd-sect-sub">Your recent test results</div>
        </div>
        {recentLabReports.length > 0 ? recentLabReports.map((r, i) => (
          <div className="pd-row" key={i} style={{ cursor: 'pointer' }} onClick={() => setSelectedReport(r.rawReport)}>
            <div className="pd-lab-icon">
              <i className={`bi ${r.icon}`} />
            </div>
            <div className="pd-row-info">
              <div className="pd-row-main">{r.name}</div>
              <div className="pd-row-spec">{r.date}</div>
            </div>
            {r.rawReport?.fileUrl && (() => {
              const url = r.rawReport.fileUrl.startsWith('http') ? r.rawReport.fileUrl : `http://localhost:5000${r.rawReport.fileUrl}`;
              return (
                <button
                  onClick={(e) => { e.stopPropagation(); downloadReportAsPDF(r.rawReport); }}
                  style={{
                    padding: '6px 12px',
                    background: '#F3F4F6',
                    border: 'none',
                    color: '#374151',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    marginRight: 10,
                    cursor: 'pointer'
                  }}
                  title="Download PDF"
                >
                  <i className="bi bi-file-earmark-pdf" />
                </button>
              );
            })()}
            <span className={`pd-badge ${r.status === 'Normal' ? 'pd-b-confirmed' : 'pd-b-pending'}`}>{r.status}</span>
          </div>
        )) : (
          <div className="pd-empty">
            <i className="bi bi-file-earmark-medical" />
            <p>No lab reports available.</p>
          </div>
        )}
      </div>
    );
  };

  /* ════════════════════════════════════════
     HEALTH METRICS PAGE
  ════════════════════════════════════════ */
  const renderMetrics = () => {
    if (loading) return null;
    return (
    <div className="pd-card">
      <div className="pd-section-head">
        <div className="pd-sect-title">
          <i className="bi bi-activity" style={{ color: '#DC2626' }} /> Health Metrics
        </div>
        <div className="pd-sect-sub">Your latest vital readings</div>
      </div>
      <div className="pd-vitals">
        {vitalsData.map((v, i) => (
          <div className="pd-vital" key={i} style={{ background: v.bg }}>
            <span className="pd-vital-emoji">{v.emoji}</span>
            <div className="pd-vital-val" style={{ color: v.color }}>{v.value}</div>
            <div className="pd-vital-lbl">{v.label}</div>
          </div>
        ))}
      </div>
    </div>
  )};

  /* ════════════════════════════════════════
     CONTENT ROUTER
  ════════════════════════════════════════ */
  const renderContent = () => {
    switch (active) {
      case 'overview':      return renderOverview();
      case 'visits':        return renderVisits();
      case 'prescriptions': return renderPrescriptions();
      case 'labReports':    return renderLabReports();
      case 'metrics':       return renderMetrics();
      case 'settings':      return <SettingsPage user={patient} onProfileUpdate={(f) => setDashboardData(prev => ({...prev, patient: {...prev.patient, ...f}}))} />;
      default:              return renderOverview();
    }
  };

  return (
    <div className="pd-shell">
      {/* SIDEBAR — Desktop */}
      <Sidebar
        active={active}
        setActive={handleNav}
        open={effectiveSidebarOpen}
        setOpen={isMobile ? setMobileSidebar : setSidebarOpen}
        mainNav={MAIN_NAV}
        bottomNav={BOTTOM_NAV}
      />

      {/* MOBILE OVERLAY */}
      <div
        className={`pd-overlay ${mobileSidebar ? 'visible' : ''}`}
        onClick={() => setMobileSidebar(false)}
      />

      {/* MAIN AREA */}
      <div className={`pd-main ${effectiveSidebarOpen && !isMobile ? 'open' : ''}`}>
        {/* HEADER */}
        <Header
          user={patient}
          logout={logout}
          setActive={handleNav}
          onHamburger={() => setMobileSidebar(o => !o)}
        />

        {/* CONTENT */}
        <div className="pd-content">
          {renderContent()}
        </div>
      </div>

      {/* BOTTOM NAV — Mobile only */}
      <div className="pd-bottom-nav">
        <div className="pd-bottom-nav-inner">
          {MOBILE_NAV.map(n => (
            <button
              key={n.key}
              className={`pd-bnav-item ${active === n.key ? 'active' : ''}`}
              onClick={() => handleNav(n.key)}
            >
              <i className={`bi ${n.icon}`} />
              <span>{n.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TOAST */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* PRESCRIPTION MODAL */}
      {selectedPrescription && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setSelectedPrescription(null)}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500, padding: 24, position: 'relative', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedPrescription(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#6B7280' }}>&times;</button>
            <h5 style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, background: '#EFF6FF', color: '#1A47DB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="bi bi-capsule" /></div>
              Prescription Details
            </h5>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Doctor</div>
              <div style={{ fontWeight: 600 }}>{selectedPrescription.doctorId?.fullName || 'Doctor'}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Diagnosis</div>
              <div style={{ fontWeight: 600 }}>{selectedPrescription.diagnosis}</div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Medicines</div>
              {selectedPrescription.medicines?.map((m, i) => (
                <div key={i} style={{ padding: 12, border: '1px solid #E5E7EB', borderRadius: 8, marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, color: '#1A1F36' }}>{m.name || m.medicineName}</div>
                  <div style={{ fontSize: 14, color: '#4B5563' }}>{m.dosage} - {m.frequency}</div>
                  {m.duration && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Duration: {m.duration}</div>}
                </div>
              ))}
            </div>
            {selectedPrescription.notes && (
              <div style={{ marginTop: 16, padding: 12, background: '#F9FAFB', borderRadius: 8, fontSize: 14 }}>
                <strong>Notes:</strong> {selectedPrescription.notes}
              </div>
            )}
          </div>
        </div>
      )}

      {/* REPORT MODAL */}
      {selectedReport && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setSelectedReport(null)}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500, padding: 24, position: 'relative', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedReport(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#6B7280' }}>&times;</button>
            <h5 style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, background: '#FDF4FF', color: '#C026D3', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="bi bi-file-earmark-medical-fill" /></div>
              Lab Report Details
            </h5>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Test Name</div>
              <div style={{ fontWeight: 600 }}>{selectedReport.reportTitle}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Lab</div>
              <div style={{ fontWeight: 500 }}>{selectedReport.labId?.labName || selectedReport.labId?.fullName || '--'}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Date</div>
              <div style={{ fontWeight: 500 }}>{new Date(selectedReport.createdAt).toLocaleDateString()}</div>
            </div>
            {selectedReport.resultSummary && (
              <div style={{ marginBottom: 16, padding: 12, background: '#F0FDF4', color: '#166534', borderRadius: 8, border: '1px solid #BBF7D0' }}>
                <strong style={{ display: 'block', marginBottom: 4 }}>Summary</strong>
                {selectedReport.resultSummary}
              </div>
            )}
            {selectedReport.fileUrl && (() => {
              const url = selectedReport.fileUrl.startsWith('http') ? selectedReport.fileUrl : `http://localhost:5000${selectedReport.fileUrl}`;
              return (
                <>
                  {selectedReport.fileUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                    <div style={{ marginBottom: 16, borderRadius: 8, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                      <img src={url} alt="Report Preview" style={{ width: '100%', display: 'block' }} />
                    </div>
                  ) : (
                    <div style={{ marginBottom: 16, borderRadius: 8, overflow: 'hidden', border: '1px solid #E5E7EB', height: 300 }}>
                      <iframe src={url} title="Report Preview" width="100%" height="100%" style={{ border: 'none' }} />
                    </div>
                  )}
                  <button onClick={() => downloadReportAsPDF(selectedReport)} className="btn btn-primary w-100" style={{ fontWeight: 600, padding: 12, borderRadius: 8 }}>
                    <i className="bi bi-file-earmark-pdf-fill me-2" /> Download Full PDF Report
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
