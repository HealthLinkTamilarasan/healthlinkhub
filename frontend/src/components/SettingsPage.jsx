import React, { useState, useContext } from 'react';
import axiosInstance from '../api/axiosInstance';
import AuthContext from '../context/AuthContext';
import { Toast } from './DashboardLayoutComponents';
import IDCardModal from './IDCardModal';

const SETTINGS_TABS = [
    { key: 'profile', icon: 'bi-person-circle', label: 'Profile Info' },
    { key: 'security', icon: 'bi-shield-lock', label: 'Security' },
    { key: 'contact', icon: 'bi-telephone', label: 'Contact' },
];

function SettingsPage({ user, onProfileUpdate }) {
    const { updateUser } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('profile');
    const [toast, setToast] = useState(null);
    const [showIdCard, setShowIdCard] = useState(false);

    const [form, setForm] = useState({
        fullName: user?.fullName || '',
        profilePhoto: user?.profilePhoto || '',
        dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        bloodGroup: user?.bloodGroup || '',
        address: user?.address || '',
        email: user?.email || '',
        phone: user?.phone || user?.contactNumber || '',
        emergencyName: user?.emergencyContact?.name || '',
        emergencyRelation: user?.emergencyContact?.relation || '',
        emergencyPhone: user?.emergencyContact?.phone || user?.emergencyContactNumber || '',
        emergencyAddress: user?.emergencyContact?.address || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const patId = user?.userId || user?.roleId || user?.healthId || '—';
    const dob = user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—';

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            setToast({ msg: 'Uploading image...', type: 'success' });
            const res = await axiosInstance.post('/dashboard/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setForm(f => ({ ...f, profilePhoto: res.data.fileUrl }));
            setToast({ msg: 'Profile photo uploaded! Save to keep changes.', type: 'success' });
        } catch (error) {
            console.error('Upload Error:', error);
            setToast({ msg: 'Failed to upload image.', type: 'error' });
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await axiosInstance.put('/dashboard/patient/profile', form);
            updateUser(form);
            if (typeof onProfileUpdate === 'function') {
                onProfileUpdate(form);
            }
            setToast({ msg: 'Changes saved successfully!', type: 'success' });
        } catch (error) {
            setToast({ msg: error.response?.data?.message || 'Unable to update profile. Please try again.', type: 'error' });
        }
    };

    const handlePasswordSave = async (e) => {
        e.preventDefault();
        if (form.newPassword !== form.confirmPassword) {
            setToast({ msg: 'Passwords do not match.', type: 'error' }); return;
        }
        try {
            await axiosInstance.put('/dashboard/patient/password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
            setToast({ msg: 'Password updated!', type: 'success' });
            setForm(f => ({ ...f, currentPassword: '', newPassword: '', confirmPassword: '' }));
        } catch (error) {
            setToast({ msg: error.response?.data?.message || 'Incorrect current password.', type: 'error' });
        }
    };

    const renderTabContent = () => {
        if (activeTab === 'profile') return (
            <form onSubmit={handleSave}>
                <div className="pd-settings-content-head">
                    <div className="pd-settings-content-title">Personal Information</div>
                </div>
                <div className="pd-settings-body">
                    
                    {/* Profile Photo Uploader */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #E5E7EB' }}>
                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#F3F4F6', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: 30, color: '#6B7280' }}>
                            {form.profilePhoto ? <img src={form.profilePhoto.startsWith('http') ? form.profilePhoto : `http://localhost:5000${form.profilePhoto}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Profile" /> : <i className="bi bi-camera" />}
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, color: '#1A1F36', marginBottom: 4 }}>Profile Picture</div>
                            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>Upload a new avatar (JPG, PNG).</div>
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
                    <div className="pd-form-row">
                        <div className="pd-form-group">
                            <label>Full Name</label>
                            <input className="pd-form-input" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Full Name" />
                        </div>
                        <div className="pd-form-group">
                            <label>Date of Birth</label>
                            <input className="pd-form-input" type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="pd-form-row">
                        <div className="pd-form-group">
                            <label>Email Address</label>
                            <input className="pd-form-input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="patientname@email.com" required />
                        </div>
                        <div className="pd-form-group">
                            <label>Phone Number</label>
                            <input className="pd-form-input" type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="Phone number" />
                        </div>
                    </div>
                    <div className="pd-form-full pd-form-group">
                        <label>Blood Type</label>
                        <select className="pd-form-input" name="bloodGroup" value={form.bloodGroup} onChange={handleChange}>
                            <option value="">Select Blood Type</option>
                            {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    <div className="pd-form-full pd-form-group">
                        <label>Address</label>
                        <div className="pd-form-input-addr" style={{ position: 'relative' }}>
                            <i className="bi bi-geo-alt" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--pd-muted)', fontSize: 15 }} />
                            <input className="pd-form-input" style={{ paddingLeft: 34 }} name="address" value={form.address} onChange={handleChange} placeholder="Your address" />
                        </div>
                    </div>
                    <div className="pd-form-footer">
                        <span className="pd-form-footer-note">Changes will apply immediately after saving.</span>
                        <button type="submit" className="pd-save-btn">
                            <i className="bi bi-floppy" /> Save Changes
                        </button>
                    </div>
                </div>
            </form>
        );

        if (activeTab === 'security') return (
            <form onSubmit={handlePasswordSave}>
                <div className="pd-settings-content-head">
                    <div className="pd-settings-content-title">Change Password</div>
                </div>
                <div className="pd-settings-body">
                    <div className="pd-form-full pd-form-group">
                        <label>Current Password</label>
                        <input className="pd-form-input" type="password" name="currentPassword" value={form.currentPassword} onChange={handleChange} placeholder="Enter current password" required />
                    </div>
                    <div className="pd-form-row">
                        <div className="pd-form-group">
                            <label>New Password</label>
                            <input className="pd-form-input" type="password" name="newPassword" value={form.newPassword} onChange={handleChange} placeholder="New password" minLength={8} required />
                        </div>
                        <div className="pd-form-group">
                            <label>Confirm Password</label>
                            <input className="pd-form-input" type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Confirm password" minLength={8} required />
                        </div>
                    </div>
                    <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
                        <p style={{ margin: 0, fontSize: 12, color: '#92400E' }}>
                            <i className="bi bi-info-circle me-2" />Password must be at least 8 characters.
                        </p>
                    </div>
                    <div className="pd-form-footer">
                        <span className="pd-form-footer-note">Keep your account secure.</span>
                        <button type="submit" className="pd-save-btn">
                            <i className="bi bi-shield-lock" /> Update Password
                        </button>
                    </div>
                </div>
            </form>
        );

        if (activeTab === 'contact') return (
            <form onSubmit={handleSave}>
                <div className="pd-settings-content-head">
                    <div className="pd-settings-content-title">Contact Details</div>
                </div>
                <div className="pd-settings-body">
                    <div className="pd-form-row">
                        <div className="pd-form-group">
                            <label>Email Address</label>
                            <input className="pd-form-input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email" />
                        </div>
                        <div className="pd-form-group">
                            <label>Phone Number</label>
                            <input className="pd-form-input" type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="Phone number" />
                        </div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--pd-border)', paddingTop: 16, marginBottom: 16 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--pd-text)', marginBottom: 14 }}>Emergency Contact</div>
                        <div className="pd-form-row">
                            <div className="pd-form-group">
                                <label>Name</label>
                                <input className="pd-form-input" name="emergencyName" value={form.emergencyName} onChange={handleChange} placeholder="Contact name" />
                            </div>
                            <div className="pd-form-group">
                                <label>Relation</label>
                                <input className="pd-form-input" name="emergencyRelation" value={form.emergencyRelation} onChange={handleChange} placeholder="e.g. Spouse, Parent" />
                            </div>
                        </div>
                        <div className="pd-form-full pd-form-group">
                            <label>Emergency Phone</label>
                            <input className="pd-form-input" type="tel" name="emergencyPhone" value={form.emergencyPhone} onChange={handleChange} placeholder="Emergency contact phone" />
                        </div>
                        <div className="pd-form-full pd-form-group">
                            <label>Emergency Address</label>
                            <input className="pd-form-input" name="emergencyAddress" value={form.emergencyAddress} onChange={handleChange} placeholder="Emergency contact address" />
                        </div>
                    </div>
                    <div className="pd-form-footer">
                        <span className="pd-form-footer-note">Changes will apply immediately after saving.</span>
                        <button type="submit" className="pd-save-btn"><i className="bi bi-floppy" /> Save Changes</button>
                    </div>
                </div>
            </form>
        );

        return null;
    };

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
                        {/* ID Card Mobile Icon */}
                        <button
                            type="button"
                            className="pd-settings-nav-item d-md-none"
                            onClick={() => setShowIdCard(true)}
                            style={{ color: '#1A73E8' }}
                        >
                            <i className="bi bi-person-vcard" />
                            <span>ID Card</span>
                        </button>
                    </nav>

                    {/* Patient info card (PC ONLY) */}
                    <div className="pd-patient-info-card d-none d-md-block" onClick={() => setShowIdCard(true)} style={{ cursor: 'pointer', transition: 'transform 0.2s', marginTop: 24 }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'} title="Click to view ID Card">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="pd-pic-avatar">
                                {user?.profilePhoto ? (
                                    <img src={user.profilePhoto.startsWith('http') ? user.profilePhoto : `http://localhost:5000${user.profilePhoto}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <i className="bi bi-person-fill" />
                                )}
                            </div>
                            <i className="bi bi-qr-code-scan" style={{ fontSize: 18, opacity: 0.8 }} />
                        </div>
                        <div className="pd-pic-name">{user?.fullName || 'Patient'}</div>
                        <div className="pd-pic-id">{patId}</div>
                        <div className="pd-pic-meta">
                            {user?.bloodGroup && (
                                <div className="pd-pic-meta-row">
                                    <i className="bi bi-droplet-fill" />Blood Type: {user.bloodGroup}
                                </div>
                            )}
                            {dob !== '—' && (
                                <div className="pd-pic-meta-row">
                                    <i className="bi bi-calendar3" />DOB: {dob}
                                </div>
                            )}
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

            {showIdCard && <IDCardModal user={user} onClose={() => setShowIdCard(false)} />}
        </>
    );
}

export default SettingsPage;
