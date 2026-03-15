import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPatients } from '../../api/api';
import { format } from 'date-fns';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await getPatients({ search });
      setPatients(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [search]);

  return (
    <div>
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Patients</h4>
          <p className="text-muted small mb-0">{patients.length} total patients</p>
        </div>
        <button className="btn btn-primary px-4">
          <i className="bi bi-plus-lg me-2" />Add Patient
        </button>
      </div>

      {/* Filter Bar */}
      <div className="dashboard-card p-3 mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-md-4">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted" />
              </span>
              <input 
                className="form-control border-start-0" 
                placeholder="Search by name or email..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-2">
            <select className="form-select">
              <option>Status</option>
              <option>Active</option>
              <option>Pending</option>
            </select>
          </div>
          <div className="col-md-2">
            <select className="form-select">
              <option>Gender</option>
              <option>Male</option>
              <option>Female</option>
            </select>
          </div>
          <div className="col-md-2">
            <select className="form-select">
              <option>Sort By</option>
              <option>Newest</option>
              <option>Oldest</option>
            </select>
          </div>
          <div className="col-md-2">
            <button className="btn btn-outline-secondary w-100" onClick={() => setSearch('')}>
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div className="dashboard-card overflow-hidden">
        <div className="table-responsive">
          <table className="table dashboard-table mb-0">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Age</th>
                <th>Gender</th>
                <th>Condition</th>
                <th>Status</th>
                <th>Last Visit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7">
                    <div className="d-flex justify-content-center align-items-center py-5">
                      <div className="spinner-border text-primary" style={{ width: '2rem', height: '2rem' }}>
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : patients.length > 0 ? (
                patients.map((patient, i) => (
                  <tr key={patient._id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        {patient.profilePhoto ? (
                          <img src={patient.profilePhoto} className="rounded-circle" width="36" height="36" style={{ objectFit: 'cover' }} alt="Avatar" />
                        ) : (
                          <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
                            {patient.fullName?.charAt(0) || 'U'}
                          </div>
                        )}
                        <div>
                          <div className="fw-semibold small">{patient.fullName}</div>
                          <div className="text-muted" style={{ fontSize: '12px' }}>{patient.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{patient.age || '—'}</td>
                    <td>{patient.gender || '—'}</td>
                    <td>{patient.chronicDiseases || '—'}</td>
                    <td><span className="badge badge-active px-2 py-1">Active</span></td>
                    <td>{format(new Date(patient.createdAt), 'MMM dd, yyyy')}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <Link to={`/dashboard/patient/patients/${patient._id}`} className="btn btn-sm btn-light" title="View">
                          <i className="bi bi-eye text-primary" />
                        </Link>
                        <button className="btn btn-sm btn-light" title="Edit">
                          <i className="bi bi-pencil text-warning" />
                        </button>
                        <button className="btn btn-sm btn-light" title="Delete">
                          <i className="bi bi-trash text-danger" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">
                    <div className="text-center py-5">
                      <i className="bi bi-inbox fs-1 text-muted" />
                      <p className="text-muted mt-3">No records found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-4 d-flex justify-content-between align-items-center">
        <div className="small text-muted">Showing 1–{patients.length} of {patients.length} patients</div>
        <nav aria-label="pagination">
          <ul className="pagination pagination-sm mb-0">
            <li className="page-item disabled"><a className="page-link" href="#">Previous</a></li>
            <li className="page-item active"><a className="page-link" href="#">1</a></li>
            <li className="page-item disabled"><a className="page-link" href="#">Next</a></li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Patients;
