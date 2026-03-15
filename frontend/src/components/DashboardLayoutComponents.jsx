import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export function LiveClock() {
    const [now, setNow] = useState(new Date());
    useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
    const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
    const date = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return (
        <div className="pd-hdr-clock">
            <div className="c-date">{weekday}, {date}</div>
            <div className="c-time">{time}</div>
        </div>
    );
}

export function Sidebar({ active, setActive, open, setOpen, mainNav, bottomNav }) {
    return (
        <>
            <div className={`pd-sidebar ${open ? 'open' : ''}`}>
                <div className="pd-sb-logo">
                    <i className="bi bi-heart-fill text-white" style={{ fontSize: 20 }} />
                </div>
                <div className="pd-sb-nav-label">Navigation</div>
                <nav className="pd-sb-nav">
                    {mainNav.map(n => (
                        <button
                            key={n.key}
                            className={`pd-sb-item ${active === n.key ? 'active' : ''}`}
                            onClick={() => setActive(n.key)}
                            title={!open ? n.label : undefined}
                        >
                            <i className={`bi ${n.icon}`} />
                            <span className="pd-sb-text">{n.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="pd-sb-nav-bottom">
                    {bottomNav.map(n => (
                        <button
                            key={n.key}
                            className={`pd-sb-item ${active === n.key ? 'active' : ''}`}
                            onClick={() => setActive(n.key)}
                            title={!open ? n.label : undefined}
                        >
                            <i className={`bi ${n.icon}`} />
                            <span className="pd-sb-text">{n.label}</span>
                        </button>
                    ))}
                </div>
            </div>
            <button
                className={`pd-sb-toggle ${open ? 'open' : ''}`}
                onClick={() => setOpen(o => !o)}
                title={open ? 'Collapse' : 'Expand'}
            >
                <i className={`bi bi-chevron-${open ? 'left' : 'right'}`} />
            </button>
        </>
    );
}

export function Header({ user, logout, setActive, onHamburger }) {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const ref = useRef(null);
    const patId = user?.userId || user?.roleId || user?.healthId || '—';

    useEffect(() => {
        const h = e => { if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    return (
        <header className="pd-header">
            <div className="pd-hdr-left">
                <button className="pd-hamburger" onClick={onHamburger} aria-label="Menu">
                    <i className="bi bi-list" />
                </button>
            </div>
            {/* Header center - exactly as user requested */}
            <div className="pd-hdr-center">
                <div className="pd-hdr-role">{
                    { patient: 'PATIENT', doctor: 'DOCTOR', labTechnician: 'LAB TECHNICIAN', pharmacist: 'PHARMACIST', emergencyTeam: 'EMERGENCY TEAM' }[user?.role] || user?.role?.toUpperCase() || 'USER'
                }</div>
                <div className="pd-hdr-name">{user?.fullName || 'User'}</div>
                <div className="pd-hdr-id">{patId}</div>
            </div>
            <div className="pd-hdr-right">
                <LiveClock />
                <div className="pd-avatar-wrap" ref={ref} onClick={() => setMenuOpen(o => !o)}>
                    <div className="pd-avatar" style={{ overflow: 'hidden' }}>
                        {user?.profilePhoto ? (
                            <img src={user.profilePhoto.startsWith('http') ? user.profilePhoto : `http://localhost:5000${user.profilePhoto}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <i className="bi bi-person-fill" />
                        )}
                    </div>
                    <i className="bi bi-chevron-down pd-avatar-caret" />

                    {menuOpen && (
                        <div className="pd-avatar-menu">
                            <div className="pd-avatar-menu-top">
                                <div className="m-name">{user?.fullName || 'User'}</div>
                                <div className="m-email">{user?.email || patId}</div>
                            </div>
                            <button className="pd-avatar-menu-btn" onClick={e => { e.stopPropagation(); setMenuOpen(false); setActive('settings'); }}>
                                <i className="bi bi-gear" /> Settings
                            </button>
                            <button className="pd-avatar-menu-btn danger" onClick={e => { e.stopPropagation(); logout(); navigate('/login'); }}>
                                <i className="bi bi-box-arrow-right" /> Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export function Toast({ msg, type, onClose }) {
    useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
    return (
        <div className={`pd-toast ${type}`}>
            <i className={`bi ${type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`} />
            {msg}
        </div>
    );
}
