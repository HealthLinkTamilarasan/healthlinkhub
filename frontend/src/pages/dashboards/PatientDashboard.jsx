import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';

const PatientDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('');
    const [fullPageView, setFullPageView] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axiosInstance.get('/dashboard/patient');
                setData(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    /* ================= LOADING ================= */
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100 overflow-hidden">
                <div className="spinner-border text-primary"></div>
            </div>
        );
    }

    const upcomingVisit = data?.appointments?.find(a => a.status === 'Scheduled');
    const prescriptions = data?.prescriptions || [];
    const latestVitals = data?.vitals;
    const labReports = data?.labReports || [];
    const manualRequests = data?.manualRequests || [];

    const allReports = [
        ...labReports.map(r => ({ ...r, type: 'File', date: r.createdAt })),
        ...manualRequests
            .filter(r => r.requestType === 'Lab Report')
            .map(r => ({
                ...r,
                type: 'Manual',
                date: r.completedAt,
                reportTitle: r.details,
                fileUrl: null
            }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    const medicineIssues = manualRequests.filter(r => r.requestType === 'Medicine');

    const handleBack = () => {
        setFullPageView(null);
        setSelectedItem(null);
    };

    /* ================= FULL PAGE: PRESCRIPTION ================= */
    if (fullPageView === 'prescription') {
        return (
            <div className="container-fluid overflow-x-hidden">
                <div className="card border-0 shadow-sm rounded-4 h-100">
                    <div className="card-header bg-light d-flex align-items-center gap-3 rounded-top-4">
                        <button className="btn btn-outline-secondary btn-sm" onClick={handleBack}>
                            <i className="bi bi-arrow-left me-2"></i>Back
                        </button>
                        <h5 className="mb-0 fw-bold">Prescription & Medicine Details</h5>
                    </div>

                    <div className="card-body p-4">
                        <h5 className="text-primary">
                            {selectedItem?.diagnosis || 'Medicine Issue'}
                        </h5>
                        <p className="text-muted mb-3">
                            Doctor: {selectedItem?.doctorId?.fullName || '—'} <br />
                            Date:{' '}
                            {new Date(
                                selectedItem?.createdAt || selectedItem?.completedAt
                            ).toLocaleString()}
                        </p>

                        <hr />

                        {selectedItem?.medicines ? (
                            <>
                                <h6 className="fw-bold mb-3">Prescribed Medicines</h6>
                                <div className="table-responsive">
                                    <table className="table table-bordered align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Name</th>
                                                <th>Dosage</th>
                                                <th>Frequency</th>
                                                <th>Duration</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedItem.medicines.map((m, i) => (
                                                <tr key={i}>
                                                    <td>{m.name}</td>
                                                    <td>{m.dosage}</td>
                                                    <td>{m.frequency}</td>
                                                    <td>{m.duration}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {selectedItem.notes && (
                                    <div className="alert alert-info mt-3">
                                        <strong>Notes:</strong> {selectedItem.notes}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="alert alert-success">
                                <h6 className="fw-bold mb-1">
                                    <i className="bi bi-check-circle me-2"></i>Medicine Issued
                                </h6>
                                <p className="mb-1">{selectedItem?.details}</p>
                                <small className="text-muted">
                                    Processed by:{' '}
                                    {selectedItem?.targetUserId?.fullName || 'Pharmacist'}
                                </small>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    /* ================= FULL PAGE: REPORT ================= */
    if (fullPageView === 'report') {
        return (
            <div className="container-fluid overflow-x-hidden">
                <div className="card border-0 shadow-sm rounded-4 h-100">
                    <div className="card-header bg-light d-flex align-items-center gap-3 rounded-top-4">
                        <button className="btn btn-outline-secondary btn-sm" onClick={handleBack}>
                            <i className="bi bi-arrow-left me-2"></i>Back
                        </button>
                        <h5 className="mb-0 fw-bold">Lab Report Details</h5>
                    </div>

                    <div className="card-body p-4">
                        <h5 className="fw-bold mb-2">{selectedItem?.reportTitle}</h5>
                        <p className="text-muted">
                            Type: {selectedItem?.reportType || 'Manual'} <br />
                            Date:{' '}
                            {new Date(
                                selectedItem?.createdAt || selectedItem?.completedAt
                            ).toLocaleString()}
                        </p>

                        {selectedItem?.fileUrl ? (
                            <div className="w-100 overflow-hidden">
                                <iframe
                                    src={selectedItem.fileUrl}
                                    title="Report"
                                    className="w-100 border rounded"
                                    style={{ height: 600 }}
                                ></iframe>
                            </div>
                        ) : (
                            <div className="alert alert-secondary text-center py-5">
                                <i className="bi bi-file-text display-4 d-block mb-3"></i>
                                <p className="mb-0">{selectedItem?.details}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    /* ================= MAIN DASHBOARD ================= */
    return (
        <div className="container-fluid overflow-x-hidden">
            <div className="row g-4">

                {/* TOP SUMMARY CARDS */}
                <div className="col-12">
                    <div className="row g-4">

                        {/* Upcoming Visit */}
                        <div className="col-md-3">
                            <div
                                className={`card border-0 shadow-sm text-center h-100 ${activeSection === 'visit' ? 'border border-primary' : ''
                                    }`}
                                role="button"
                                onClick={() => setActiveSection('visit')}
                            >
                                <div className="card-body py-4">
                                    <i className="bi bi-calendar-check fs-2 text-primary mb-2"></i>
                                    <h6 className="fw-bold mb-1">Upcoming Visit</h6>
                                    <small className="text-muted">
                                        {upcomingVisit
                                            ? new Date(upcomingVisit.appointmentDate).toLocaleDateString()
                                            : 'No Visits'}
                                    </small>
                                </div>
                            </div>
                        </div>

                        {/* Prescription */}
                        <div className="col-md-3">
                            <div
                                className={`card border-0 shadow-sm text-center h-100 ${activeSection === 'prescription'
                                    ? 'border border-success'
                                    : ''
                                    }`}
                                role="button"
                                onClick={() => setActiveSection('prescription')}
                            >
                                <div className="card-body py-4">
                                    <i className="bi bi-capsule fs-2 text-success mb-2"></i>
                                    <h6 className="fw-bold mb-1">Prescription</h6>
                                    <small className="text-muted">
                                        {prescriptions.length > 0 ? 'View Details' : 'None Active'}
                                    </small>
                                </div>
                            </div>
                        </div>

                        {/* Health Metrics */}
                        <div className="col-md-3">
                            <div
                                className={`card h-100 shadow-sm border ${activeSection === 'metrics' ? 'border-danger' : ''
                                    }`}
                                role="button"
                                onClick={() => setActiveSection('metrics')}
                            >
                                <div className="card-body text-center py-4">
                                    <i className="bi bi-heart-fill text-danger fs-4 mb-2"></i>
                                    <h6 className="fw-bold mb-1">Health Metrics</h6>
                                    <small className="text-muted">
                                        {latestVitals ? 'View Latest Records' : 'No Records'}
                                    </small>
                                </div>
                            </div>
                        </div>

                        {/* Lab Reports */}
                        <div className="col-md-3">
                            <div
                                className={`card border-0 shadow-sm text-center h-100 ${activeSection === 'reports' ? 'border border-info' : ''
                                    }`}
                                role="button"
                                onClick={() => setActiveSection('reports')}
                            >
                                <div className="card-body py-4">
                                    <i className="bi bi-file-earmark-medical fs-2 text-info mb-2"></i>
                                    <h6 className="fw-bold mb-1">Lab Reports</h6>
                                    <small className="text-muted">
                                        {allReports.length > 0 ? 'View Reports' : 'No Reports'}
                                    </small>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* CONTENT SECTION */}
                <div className="col-12">
                    <div className="card border-0 shadow-sm rounded-4">
                        <div className="card-body p-4">
                            {!activeSection && (
                                <div className="text-center text-muted py-5">
                                    <i className="bi bi-grid display-4 mb-3"></i>
                                    <p>Select a card to view details</p>
                                </div>
                            )}

                            {activeSection === 'visit' && (
                                <>
                                    <h5 className="fw-bold text-primary mb-3">
                                        Upcoming Appointment
                                    </h5>
                                    {upcomingVisit ? (
                                        <div className="alert alert-primary">
                                            <strong>Doctor:</strong> Dr.{' '}
                                            {upcomingVisit.doctorId?.fullName} <br />
                                            <strong>Date:</strong>{' '}
                                            {new Date(
                                                upcomingVisit.appointmentDate
                                            ).toLocaleString()}
                                        </div>
                                    ) : (
                                        <p className="text-muted">
                                            No upcoming appointments.
                                        </p>
                                    )}
                                </>
                            )}

                            {activeSection === 'prescription' && (
                                <>
                                    <h5 className="fw-bold text-success mb-3">
                                        Prescriptions
                                    </h5>
                                    <div className="list-group">
                                        {prescriptions.map(p => (
                                            <button
                                                key={p._id}
                                                className="list-group-item list-group-item-action"
                                                onClick={() => {
                                                    setSelectedItem(p);
                                                    setFullPageView('prescription');
                                                }}
                                            >
                                                <strong>{p.diagnosis}</strong>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}

                            {activeSection === 'metrics' && (
                                <>
                                    <h5 className="fw-bold text-danger mb-3">
                                        Health Metrics
                                    </h5>
                                    {latestVitals ? (
                                        <div className="row g-3">
                                            <div className="col-md-3">
                                                <div className="border p-3 text-center">
                                                    <small className="text-muted">
                                                        Blood Pressure
                                                    </small>
                                                    <h6 className="fw-bold">
                                                        {latestVitals.bloodPressure || '-'}
                                                    </h6>
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="border p-3 text-center">
                                                    <small className="text-muted">
                                                        Heart Rate
                                                    </small>
                                                    <h6 className="fw-bold">
                                                        {latestVitals.heartRate || '-'} bpm
                                                    </h6>
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="border p-3 text-center">
                                                    <small className="text-muted">
                                                        Sugar Level
                                                    </small>
                                                    <h6 className="fw-bold">
                                                        {latestVitals.sugarLevel || '-'}
                                                    </h6>
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="border p-3 text-center">
                                                    <small className="text-muted">
                                                        Weight
                                                    </small>
                                                    <h6 className="fw-bold">
                                                        {latestVitals.weight || '-'} kg
                                                    </h6>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-muted">
                                            No health metrics recorded.
                                        </p>
                                    )}
                                </>
                            )}

                            {activeSection === 'reports' && (
                                <>
                                    <h5 className="fw-bold text-info mb-3">Lab Reports</h5>
                                    <div className="list-group">
                                        {allReports.map((r, i) => (
                                            <button
                                                key={i}
                                                className="list-group-item list-group-item-action"
                                                onClick={() => {
                                                    setSelectedItem(r);
                                                    setFullPageView('report');
                                                }}
                                            >
                                                {r.reportTitle}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PatientDashboard;
