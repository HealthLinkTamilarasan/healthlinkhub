import React, { useState, useContext } from 'react';
import axiosInstance from '../api/axiosInstance';
import AuthContext from '../context/AuthContext';
import { Toast } from './DashboardLayoutComponents';
import LabIDCardModal from './LabIDCardModal';

/* ══════════════════════════════════════════
   SETTINGS TABS — Lab version
══════════════════════════════════════════ */
const SETTINGS_TABS = [
    { key: 'profile', icon: 'bi-person-circle', label: 'Profile Info' },
    { key: 'security', icon: 'bi-shield-lock', label: 'Security' },
];

/* ══════════════════════════════════════════
   LAB TECHNICIAN SETTINGS PAGE
══════════════════════════════════════════ */
function LabSettingsPage({ user }) {
    const { updateUser } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('profile');
    const [toast, setToast] = useState(null);
    const [showIdCard, setShowIdCard] = useState(false);

    const [form, setForm] = useState({
        fullName: user?.fullName || '',
        labName: user?.labName || '',
        phone: user?.phone || '',
        email: user?.email || '',
        address: user?.address || '',
        profilePhoto: user?.profilePhoto || '',
    });

    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const labId = user?.userId || user?.roleId || '—';

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    const handlePwdChange = e => setPasswords(p => ({ ...p, [e.target.name]: e.target.value }));

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            setToast({ msg: 'Uploading photo...', type: 'success' });
            const res = await axiosInstance.post('/dashboard/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setForm(f => ({ ...f, profilePhoto: res.data.fileUrl }));
            setToast({ msg: 'Photo uploaded! Save to keep changes.', type: 'success' });
        } catch {
            setToast({ msg: 'Failed to upload photo.', type: 'error' });
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();

        // Build partial update payload
        const payload = {};
        for (const key in form) {
            if (form[key] !== (user?.[key] || '')) {
                payload[key] = form[key];
            }
        }

        if (Object.keys(payload).length === 0) {
            setToast({ msg: 'Profile updated successfully.', type: 'success' });
            return;
        }

        // Only validate fields being updated
        if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
            setToast({ msg: 'Invalid email format.', type: 'error' });
            return;
        }

        if (payload.phone && !/^[0-9+\-() ]+$/.test(payload.phone)) {
            setToast({ msg: 'Invalid phone number format.', type: 'error' });
            return;
        }

        try {
            await axiosInstance.put('/dashboard/lab/profile', payload);
            updateUser(payload);
            setToast({ msg: 'Profile updated successfully.', type: 'success' });
        } catch (error) {
            setToast({ msg: error.response?.data?.message || 'Failed to save profile. Please try again.', type: 'error' });
        }
    };

    const handlePasswordSave = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            setToast({ msg: 'Passwords do not match.', type: 'error' });
            return;
        }

        const passwordRegex = /^(?=.*[0-9])(?=.*[A-Z]).{8,}$/;
        if (!passwordRegex.test(passwords.newPassword)) {
            setToast({ msg: 'Password must be at least 8 characters long, contain 1 number, and 1 uppercase letter.', type: 'error' });
            return;
        }

        try {
            await axiosInstance.put('/dashboard/lab/password', {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            });
            setToast({ msg: 'Password Updated Successfully', type: 'success' });
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            setToast({ msg: error.response?.data?.message || 'Incorrect current password.', type: 'error' });
        }
    };

    /* ══════════════════════════════════════════
       TAB CONTENT RENDERER
    ══════════════════════════════════════════ */
    const renderTabContent = () => {
        /* ── PROFILE TAB ── */
        if (activeTab === 'profile') return (
            <form onSubmit={handleSaveProfile}>
                <div className="pd-settings-content-head">
                    <div className="pd-settings-content-title">Personal Information</div>
                </div>
                <div className="pd-settings-body">

                    {/* Profile Photo Uploader */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #E5E7EB' }}>
                        <div style={{ width: 80, height: 80, borderRadius: 16, background: '#EFF6FF', border: '2px solid #DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: 30, color: '#2F80ED', flexShrink: 0 }}>
                            {form.profilePhoto ?
                                <img src={form.profilePhoto.startsWith('http') ? form.profilePhoto : `http://localhost:5000${form.profilePhoto}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Profile" />
                                : <i className="bi bi-camera" />}
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, color: '#1A1F36', marginBottom: 4 }}>Profile Photo</div>
                            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>Upload a professional photo (JPG, PNG).</div>
                            <div className="d-flex flex-wrap gap-2">
                                <label className="btn btn-sm btn-outline-secondary mb-0" style={{ cursor: 'pointer', borderRadius: 8, fontWeight: 500 }}>
                                    <i className="bi bi-upload me-2" /> Upload Photo
                                    <input type="file" onChange={handlePhotoUpload} accept="image/*" style={{ display: 'none' }} />
                                </label>
                                {form.profilePhoto && (
                                    <button type="button" onClick={() => setForm(f => ({ ...f, profilePhoto: '' }))} className="btn btn-sm btn-outline-danger" style={{ borderRadius: 8, fontWeight: 500 }}>
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Row 1: Full Name / Lab Name */}
                    <div className="pd-form-row">
                        <div className="pd-form-group">
                            <label><i className="bi bi-person" style={{ marginRight: 6, color: '#2F80ED' }} />Full Name</label>
                            <input className="pd-form-input" name="fullName" value={form.fullName} onChange={handleChange} placeholder="John Doe" />
                        </div>
                        <div className="pd-form-group">
                            <label><i className="bi bi-building" style={{ marginRight: 6, color: '#2F80ED' }} />Lab Name</label>
                            <input className="pd-form-input" name="labName" value={form.labName} onChange={handleChange} placeholder="Central Lab" />
                        </div>
                    </div>

                    {/* Row 2: Phone / Email */}
                    <div className="pd-form-row">
                        <div className="pd-form-group">
                            <label><i className="bi bi-telephone" style={{ marginRight: 6, color: '#2F80ED' }} />Phone Number</label>
                            <input className="pd-form-input" name="phone" value={form.phone} onChange={handleChange} placeholder="+1 (555) 234-5678" />
                        </div>
                        <div className="pd-form-group">
                            <label><i className="bi bi-envelope" style={{ marginRight: 6, color: '#2F80ED' }} />Email Address</label>
                            <input className="pd-form-input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="lab@healthlinkhub.com" />
                        </div>
                    </div>

                    {/* Row 3: Address (full width) */}
                    <div className="pd-form-full pd-form-group">
                        <label><i className="bi bi-geo-alt" style={{ marginRight: 6, color: '#2F80ED' }} />Address</label>
                        <input className="pd-form-input" name="address" value={form.address} onChange={handleChange} placeholder="123 Medical Center Blvd, Lab Level 2" />
                    </div>

                    {/* Footer */}
                    <div className="pd-form-footer">
                        <span className="pd-form-footer-note">Changes will apply immediately after saving.</span>
                        <button type="submit" className="pd-save-btn" style={{ background: '#2F80ED' }}>
                            <i className="bi bi-floppy" /> Save Changes
                        </button>
                    </div>
                </div>
            </form>
        );

        /* ── SECURITY TAB ── */
        if (activeTab === 'security') return (
            <form onSubmit={handlePasswordSave}>
                <div className="pd-settings-content-head">
                    <div className="pd-settings-content-title">Change Password</div>
                </div>
                <div className="pd-settings-body">
                    <div className="pd-form-full pd-form-group">
                        <label><i className="bi bi-key" style={{ marginRight: 6, color: '#9333EA' }} />Current Password</label>
                        <input className="pd-form-input" type="password" name="currentPassword" value={passwords.currentPassword} onChange={handlePwdChange} placeholder="Enter current password" required />
                    </div>
                    <div className="pd-form-row">
                        <div className="pd-form-group">
                            <label><i className="bi bi-lock" style={{ marginRight: 6, color: '#9333EA' }} />New Password</label>
                            <input className="pd-form-input" type="password" name="newPassword" value={passwords.newPassword} onChange={handlePwdChange} placeholder="New password" minLength={8} required />
                        </div>
                        <div className="pd-form-group">
                            <label><i className="bi bi-lock-fill" style={{ marginRight: 6, color: '#9333EA' }} />Confirm Password</label>
                            <input className="pd-form-input" type="password" name="confirmPassword" value={passwords.confirmPassword} onChange={handlePwdChange} placeholder="Confirm password" minLength={8} required />
                        </div>
                    </div>
                    <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                        <p style={{ margin: 0, fontSize: 12, color: '#92400E' }}>
                            <i className="bi bi-info-circle me-2" />Password must be at least 8 characters.
                        </p>
                    </div>
                    <div className="pd-form-footer">
                        <span className="pd-form-footer-note">Keep your account secure.</span>
                        <button type="submit" className="pd-save-btn" style={{ background: '#2F80ED' }}>
                            <i className="bi bi-shield-lock" /> Update Password
                        </button>
                    </div>
                </div>
            </form>
        );

        /* ── ID CARD TAB ── */
        if (activeTab === 'idcard') return (
            <div>
                <div className="pd-settings-content-head">
                    <div className="pd-settings-content-title">Lab Technician Digital ID Card</div>
                </div>
                <div className="pd-settings-body">
                    {/* Preview Card */}
                    <div
                        style={{ background: 'linear-gradient(130deg, #2F80ED 0%, #56CCF2 100%)', borderRadius: 16, padding: '24px', color: '#fff', display: 'flex', alignItems: 'center', gap: 20, cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', marginBottom: 18 }}
                        onClick={() => setShowIdCard(true)}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(47,128,237,0.25)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                        {/* Avatar */}
                        <div style={{ width: 64, height: 64, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.3)' }}>
                            {user?.profilePhoto ?
                                <img src={user.profilePhoto.startsWith('http') ? user.profilePhoto : `http://localhost:5000${user.profilePhoto}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Profile" />
                                : <i className="bi bi-person-fill" />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 800, fontSize: 17 }}>{user?.fullName || 'Technician'}</div>
                            <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>{labId}</div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.28)', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 500 }}>Lab Technician</span>
                                {user?.labName && <span style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.28)', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 500 }}>🏥 {user.labName}</span>}
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                            <i className="bi bi-qr-code-scan" style={{ fontSize: 28, opacity: 0.8 }} />
                            <span style={{ fontSize: 10, opacity: 0.75 }}>View Card</span>
                        </div>
                    </div>

                    {/* Action */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                            <div style={{ fontWeight: 600, color: '#1A1F36', marginBottom: 2 }}>Digital Staff Identity</div>
                            <div style={{ fontSize: 13, color: '#6B7280' }}>Click the card above or the button to view, download, or print your Lab Technician ID.</div>
                        </div>
                        <button type="button" onClick={() => setShowIdCard(true)} className="pd-save-btn" style={{ background: '#2F80ED' }}>
                            <i className="bi bi-person-vcard" /> View ID Card
                        </button>
                    </div>
                </div>
            </div>
        );

        return null;
    };

    /* ══════════════════════════════════════════
       RENDER
    ══════════════════════════════════════════ */
    return (
        <>
            <div className="pd-settings-wrap">
                {/* Left panel */}
                <div className="pd-settings-panel">
                    <nav className="pd-settings-nav mb-4 mb-md-0">
                        {SETTINGS_TABS.map(tab => (
                            <button
                                key={tab.key}
                                type="button"
                                className={`pd-settings-nav-item ${activeTab === tab.key ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                <i className={`bi ${tab.icon}`} />
                                <span style={{ textAlign: 'left', flex: 1 }}>{tab.label}</span>
                            </button>
                        ))}
                        {/* ID Card tab */}
                        <button
                            type="button"
                            className={`pd-settings-nav-item ${activeTab === 'idcard' ? 'active' : ''}`}
                            onClick={() => setActiveTab('idcard')}
                        >
                            <i className="bi bi-person-vcard" />
                            <span style={{ textAlign: 'left', flex: 1 }}>ID Card</span>
                        </button>
                    </nav>

                    {/* PC ONLY Info Card */}
                    <div
                        className="pd-patient-info-card d-none d-md-block"
                        onClick={() => setShowIdCard(true)}
                        style={{ cursor: 'pointer', transition: 'transform 0.2s', marginTop: 24 }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        title="Click to view ID Card"
                    >
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="pd-pic-avatar" style={{ borderRadius: 14 }}>
                                {user?.profilePhoto ? (
                                    <img src={user.profilePhoto.startsWith('http') ? user.profilePhoto : `http://localhost:5000${user.profilePhoto}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <i className="bi bi-person-fill" />
                                )}
                            </div>
                            <i className="bi bi-qr-code-scan" style={{ fontSize: 18, opacity: 0.8 }} />
                        </div>
                        <div className="pd-pic-name">{user?.fullName || 'Technician'}</div>
                        <div className="pd-pic-id">{labId}</div>
                        <div className="pd-pic-meta">
                            <div className="pd-pic-meta-row">
                                <i className="bi bi-building" />Lab: {user?.labName || 'HealthLink Lab'}
                            </div>
                        </div>
                        <div style={{ fontSize: 11, textAlign: 'center', marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 8, opacity: 0.9 }}>
                            View Digital ID Card
                        </div>
                    </div>
                </div>

                {/* Right content */}
                <div className="pd-settings-content flex-grow-1" style={{ minWidth: 0 }}>
                    {renderTabContent()}
                </div>
            </div>

            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
            {showIdCard && <LabIDCardModal user={user} onClose={() => setShowIdCard(false)} />}
        </>
    );
}

export default LabSettingsPage;
