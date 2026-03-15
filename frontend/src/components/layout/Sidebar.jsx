import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

function Sidebar({ isOpen, mobileOpen, onMobileClose }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard/patient',              icon: 'bi-speedometer2',      label: 'Dashboard'     },
    { to: '/dashboard/patient/patients',     icon: 'bi-people-fill',       label: 'Patients'      },
    { to: '/dashboard/patient/appointments', icon: 'bi-calendar3-fill',    label: 'Appointments'  },
    { to: '/dashboard/patient/analytics',    icon: 'bi-bar-chart-line-fill', label: 'Analytics'   },
    { to: '/dashboard/patient/id-card',      icon: 'bi-person-vcard',      label: 'ID Card'       },
  ];

  return (
    <div className={`sidebar d-flex flex-column ${isOpen ? 'sidebar-open' : 'sidebar-collapsed'} ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Logo Area */}
      <div className="p-3 border-bottom border-light border-opacity-10 d-flex align-items-center">
        <i className="bi bi-heart-pulse-fill text-primary fs-4" />
        {isOpen && <span className="ms-3 fw-bold text-white fs-5">HealthLink Hub</span>}
        {mobileOpen && (
          <button className="btn btn-sm btn-outline-light ms-auto d-md-none" onClick={onMobileClose}>
            <i className="bi bi-x-lg" />
          </button>
        )}
      </div>

      {/* Nav Area */}
      <div className="flex-grow-1 p-2 overflow-auto mt-2">
        {navLinks.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/dashboard/patient'}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => { if (mobileOpen) onMobileClose(); }}
          >
            <i className={`bi ${link.icon} fs-5 text-center`} style={{ minWidth: '32px' }} />
            {isOpen && <span className="ms-2 sidebar-label">{link.label}</span>}
          </NavLink>
        ))}
      </div>

      {/* Bottom User Card */}
      {isOpen && (
        <div className="mt-auto p-3 border-top border-light border-opacity-10 text-white">
          <div className="d-flex align-items-center mb-3">
            {user?.profilePhoto ? (
              <img src={user.profilePhoto} alt="Avatar" className="rounded-circle me-2" width="36" height="36" style={{ objectFit: 'cover' }} />
            ) : (
              <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center me-2" style={{ width: 36, height: 36 }}>
                <span className="text-white small fw-bold">
                  {user?.fullName?.charAt(0) || user?.name?.charAt(0) || 'U'}
                </span>
              </div>
            )}
            <div className="overflow-hidden">
              <div className="small fw-semibold text-truncate">{user?.fullName || user?.name}</div>
              <div className="text-white-50 text-truncate" style={{ fontSize: '0.75rem' }}>{user?.role || 'Patient'}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-sm btn-outline-danger w-100">
            <i className="bi bi-box-arrow-right me-2" />Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
