import React, { useState, useEffect } from 'react';
import { getAppointments } from '../../api/api';
import { format } from 'date-fns';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const res = await getAppointments();
        setAppointments(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Appointments</h4>
          <p className="text-muted small mb-0">{appointments.length} total appointments</p>
        </div>
        <button className="btn btn-primary px-4">
          <i className="bi bi-plus-lg me-2" />New Appointment
        </button>
      </div>

      {/* Filter Nav Pills */}
      <ul className="nav nav-pills mb-4 gap-2">
        <li>
          <button className={`btn btn-sm ${filter === 'today' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setFilter('today')}>
            Today
          </button>
        </li>
        <li>
          <button className={`btn btn-sm ${filter === 'week' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setFilter('week')}>
            This Week
          </button>
        </li>
        <li>
          <button className={`btn btn-sm ${filter === 'month' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setFilter('month')}>
            This Month
          </button>
        </li>
        <li>
          <button className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setFilter('all')}>
            All
          </button>
        </li>
      </ul>

      {/* Loading & Empty States */}
      {loading ? (
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="spinner-border text-primary" style={{ width: '2rem', height: '2rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-5 dashboard-card p-5">
          <i className="bi bi-calendar-x fs-1 text-muted" />
          <p className="text-muted mt-3 mb-0">No appointments found</p>
        </div>
      ) : (
        /* Appointment Cards */
        <div className="row g-4">
          {appointments.map(apt => (
            <div className="col-md-6 col-xl-4" key={apt._id}>
              <div className="dashboard-card p-4 h-100 border-0 shadow-sm border-start border-primary border-4 rounded-3 d-flex flex-column">
                <div className="d-flex align-items-center gap-3 mb-4">
                  {apt.patientId?.profilePhoto ? (
                    <img src={apt.patientId.profilePhoto} className="rounded-circle shadow-sm" width="56" height="56" style={{ objectFit: 'cover' }} alt="Avatar" />
                  ) : (
                    <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center shadow-sm" style={{ width: 56, height: 56, fontSize: '1.25rem' }}>
                      {apt.patientId?.fullName?.charAt(0) || 'P'}
                    </div>
                  )}
                  <div className="flex-grow-1 overflow-hidden">
                    <div className="fw-bold fs-5 text-truncate">{apt.patientId?.fullName || 'Unknown'}</div>
                    <div className="text-muted small text-truncate d-flex align-items-center">
                        <i className="bi bi-envelope me-1"></i> {apt.patientId?.email}
                    </div>
                  </div>
                  <span className={`badge bg-${apt.status === 'Completed' ? 'success' : apt.status === 'Cancelled' ? 'danger' : 'warning'} ms-auto`}>
                    {apt.status || 'Scheduled'}
                  </span>
                </div>
                
                <div className="mb-auto p-3 bg-light rounded-3 d-flex flex-column gap-2 mb-3">
                    <div className="d-flex align-items-center text-secondary small fw-medium">
                        <i className="bi bi-calendar3 me-2 text-primary bg-primary bg-opacity-10 p-2 rounded-circle"></i>
                        {format(new Date(apt.appointmentDate), 'EEEE, MMMM dd, yyyy')}
                    </div>
                    <div className="d-flex align-items-center text-secondary small fw-medium">
                        <i className="bi bi-clock me-2 text-primary bg-primary bg-opacity-10 p-2 rounded-circle"></i>
                        {format(new Date(apt.appointmentDate), 'HH:mm')}
                    </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                  <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 fw-semibold">Consultation</span>
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-success" title="Mark Completed"><i className="bi bi-check-lg fw-bold" /></button>
                    <button className="btn btn-sm btn-outline-warning" title="Reschedule"><i className="bi bi-pencil-fill" /></button>
                    <button className="btn btn-sm btn-outline-danger" title="Cancel"><i className="bi bi-x-lg fw-bold" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Appointments;
