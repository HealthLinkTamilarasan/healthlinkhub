import React, { useContext } from 'react';
import { useLocation } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import { Dropdown } from 'react-bootstrap';

function DashboardNavbar({ onToggleSidebar, onMobileToggle }) {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const getPageName = () => {
    if (location.pathname === '/dashboard/patient') return 'Dashboard Home';
    if (location.pathname === '/dashboard/patient/patients') return 'Patients';
    if (location.pathname === '/dashboard/patient/appointments') return 'Appointments';
    if (location.pathname === '/dashboard/patient/analytics') return 'Analytics';
    if (location.pathname === '/dashboard/patient/id-card') return 'My ID Card';
    return 'Dashboard';
  };

  return (
    <div className="dashboard-navbar shadow-sm">
      <div className="d-flex align-items-center me-auto">
        <button className="btn btn-light me-3 d-none d-md-block" onClick={onToggleSidebar}>
          <i className="bi bi-list fs-5" />
        </button>
        <button className="btn btn-light me-3 d-md-none" onClick={onMobileToggle}>
          <i className="bi bi-list fs-5" />
        </button>
        <h5 className="mb-0 fw-semibold text-dark d-none d-sm-block">{getPageName()}</h5>
      </div>

      <div className="d-flex gap-3 align-items-center">
        <div className="d-none d-md-flex">
          <input type="text" className="form-control form-control-sm rounded-pill" placeholder="Search..." style={{ width: '220px' }} />
        </div>

        <button className="btn btn-light rounded-circle position-relative p-0 d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
          <i className="bi bi-bell fs-5" />
          <span className="badge bg-danger rounded-pill position-absolute" style={{ top: '2px', right: '2px', fontSize: '9px' }}>3</span>
        </button>

        <Dropdown align="end">
          <Dropdown.Toggle as="div" style={{ cursor: 'pointer' }}>
            {user?.profilePhoto ? (
              <img src={user.profilePhoto} alt="User" className="rounded-circle shadow-sm" width="36" height="36" style={{ objectFit: 'cover' }} />
            ) : (
              <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: 36, height: 36 }}>
                {user?.fullName?.charAt(0) || user?.name?.charAt(0) || 'U'}
              </div>
            )}
          </Dropdown.Toggle>

          <Dropdown.Menu className="shadow border-0 rounded-3 mt-2">
            <Dropdown.Item href="#profile"><i className="bi bi-person me-2" />Profile</Dropdown.Item>
            <Dropdown.Item href="#settings"><i className="bi bi-gear me-2" />Settings</Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={() => logout()} className="text-danger">
              <i className="bi bi-box-arrow-right me-2" />Logout
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </div>
  );
}

export default DashboardNavbar;
