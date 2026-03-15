import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPatient } from '../../api/api';

const PatientProfile = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        setLoading(true);
        const res = await getPatient(id);
        setPatient(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [id]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" style={{ width: '2rem', height: '2rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="alert alert-danger d-flex align-items-center gap-2">
        <i className="bi bi-exclamation-triangle-fill" />
        <span>Failed to load patient data or patient not found.</span>
      </div>
    );
  }

  return (
    <div>
      {/* Profile Header */}
      <div className="dashboard-card mb-4" style={{ background: 'linear-gradient(135deg, #1A56DB 0%, #1E40AF 100%)', border: 'none' }}>
        <div className="card-body p-4">
          <div className="d-flex align-items-center gap-4">
            {patient.profilePhoto ? (
              <img src={patient.profilePhoto} className="rounded-circle border border-3 border-white" width="80" height="80" style={{ objectFit: 'cover' }} alt="Avatar" />
            ) : (
              <div className="rounded-circle bg-light text-primary d-flex align-items-center justify-content-center fw-bold border border-3 border-white shadow-sm" style={{ width: 80, height: 80, fontSize: '2rem' }}>
                {patient.fullName?.charAt(0) || 'U'}
              </div>
            )}
            <div className="text-white flex-grow-1">
              <h4 className="fw-bold mb-1">{patient.fullName}</h4>
              <p className="mb-1 text-white-50 small">{patient.chronicDiseases || 'General Health'}</p>
              <span className="badge bg-white text-primary fw-semibold px-2 py-1 shadow-sm">Active</span>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-light btn-sm">
                <i className="bi bi-pencil me-1" />Edit
              </button>
              <button className="btn btn-light btn-sm">
                <i className="bi bi-calendar-plus me-1" />Schedule
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="dashboard-card p-3 text-center">
            <i className="bi bi-person-hearts fs-4 text-primary mb-2" />
            <div className="fw-bold">{patient.age || '—'} yrs</div>
            <div className="text-muted small">Age</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="dashboard-card p-3 text-center">
            <i className="bi bi-droplet-fill fs-4 text-danger mb-2" />
            <div className="fw-bold">{patient.bloodGroup || '—'}</div>
            <div className="text-muted small">Blood Group</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="dashboard-card p-3 text-center">
            <i className="bi bi-telephone-fill fs-4 text-success mb-2" />
            <div className="fw-bold">{patient.phone || '—'}</div>
            <div className="text-muted small">Phone</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="dashboard-card p-3 text-center">
            <i className="bi bi-person-fill-check fs-4 text-primary mb-2" />
            <div className="fw-bold">No Doctor</div>
            <div className="text-muted small">Assigned Doctor</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4 border-0">
        <li className="nav-item">
          <button className="nav-link active fw-semibold text-primary border-0 border-bottom border-primary border-2 px-3 py-2 bg-transparent">Overview</button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="row g-4">
        {/* Personal Info Grid */}
        <div className="col-md-5">
            <div className="dashboard-card p-4">
                <h6 className="fw-bold border-bottom pb-2 mb-3">Personal Information</h6>
                <div className="row g-3">
                    <div className="col-6">
                        <div className="text-muted small">Email Address</div>
                        <div className="fw-medium">{patient.email}</div>
                    </div>
                    <div className="col-6">
                        <div className="text-muted small">Gender</div>
                        <div className="fw-medium">{patient.gender || '—'}</div>
                    </div>
                    <div className="col-12">
                        <div className="text-muted small">Address</div>
                        <div className="fw-medium">{patient.address || '—'}</div>
                    </div>
                    <div className="col-12">
                        <div className="text-muted small">Emergency Contact</div>
                        <div className="fw-medium">{patient.emergencyContact || '—'}</div>
                    </div>
                </div>
            </div>
        </div>

        {/* Medical Info */}
        <div className="col-md-7">
            <div className="dashboard-card p-4 h-100">
                <h6 className="fw-bold border-bottom pb-2 mb-3">Medical History</h6>
                
                <div className="table-responsive">
                    <table className="table dashboard-table mb-0">
                        <thead>
                            <tr>
                                <th>Condition</th>
                                <th>Year</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{patient.chronicDiseases || 'None reported'}</td>
                                <td>—</td>
                                <td>Initial record</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <button className="btn btn-outline-primary btn-sm mt-3 w-100">
                    <i className="bi bi-plus-lg me-1" /> Add Medical History
                </button>
            </div>
        </div>
      </div>

    </div>
  );
};

export default PatientProfile;
