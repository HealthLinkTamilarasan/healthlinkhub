import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const EmergencyIDCardModal = ({ user, onClose }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const cardRef = useRef(null);

    if (!user) return null;

    const emgId = user.roleId || '—';
    const cleanId = emgId.replace(/^(EMG-|DOC-|LAB-|PAT-)/i, '');
    const qrData = `HLH-STAFF-EMG-${cleanId}`;

    const type = {
        color: '#DC2626',
        roleLabel: 'Emergency Team',
        namePrefix: '',
        department: user.teamName || 'Emergency Response',
        idFormat: `EMG-${cleanId}`
    };

    const downloadPNG = async () => {
        if (!cardRef.current) return;
        const canvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
        const link = document.createElement('a');
        link.download = `HealthLink_Emergency_ID_${cleanId}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const downloadPDF = async () => {
        if (!cardRef.current) return;
        const canvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = 85.6;
        const ratio = canvas.height / canvas.width;
        const pdfHeight = pdfWidth * ratio;
        pdf.text("HealthLink Hub - Emergency Team ID Card", 10, 15);
        pdf.addImage(imgData, 'PNG', 10, 25, pdfWidth, pdfHeight);
        pdf.save(`HealthLink_Emergency_ID_${cleanId}.pdf`);
    };

    const photoSrc = user.profilePhoto
        ? (user.profilePhoto.startsWith('http') ? user.profilePhoto : `http://localhost:5000${user.profilePhoto}`)
        : null;

    const FrontCard = () => (
        <div style={{ width: '340px', height: '215px', background: '#ffffff', borderRadius: '12px', overflow: 'hidden', border: `2px solid ${type.color}`, position: 'relative', boxSizing: 'border-box', fontFamily: 'sans-serif', margin: '0 auto' }}>
            <div style={{ background: type.color, height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <i className="bi bi-heart-pulse-fill" style={{ fontSize: '18px', marginRight: '8px' }} />
                <span style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '0.5px' }}>HealthLink Hub</span>
            </div>
            <div style={{ padding: '10px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100% - 44px)' }}>
                <div style={{ width: '68px', height: '68px', borderRadius: '50%', border: `3px solid ${type.color}`, marginBottom: '8px', overflow: 'hidden', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: type.color, flexShrink: 0 }}>
                    {photoSrc ? <img src={photoSrc} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" alt="profile" /> : <i className="bi bi-person-fill" />}
                </div>
                <div style={{ fontWeight: 800, fontSize: '16px', color: '#1f2937', marginBottom: '2px', width: '100%', padding: '0 10px', wordBreak: 'break-word', textAlign: 'center', lineHeight: '1.2', flexShrink: 0 }}>
                    {type.namePrefix}{user.fullName || 'Team Member'}
                </div>
                <div style={{ fontSize: '11.5px', color: type.color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                    {type.roleLabel}
                </div>
                {type.department && (
                    <div style={{ fontSize: '11px', color: '#4b5563', marginBottom: '4px', fontStyle: 'italic', fontWeight: 600 }}>
                        {type.department} {user.teamNumber ? `• ${user.teamNumber}` : ''}
                    </div>
                )}
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#111827', marginTop: 'auto', background: '#FEF2F2', padding: '4px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="bi bi-person-badge"></i> {type.idFormat}
                </div>
            </div>
        </div>
    );

    const BackCard = () => (
        <div style={{ width: '340px', height: '215px', background: '#ffffff', borderRadius: '12px', overflow: 'hidden', border: `2px solid ${type.color}`, position: 'relative', boxSizing: 'border-box', fontFamily: 'sans-serif', margin: '0 auto' }}>
            <div style={{ background: type.color, height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12.5px', fontWeight: 700, letterSpacing: '0.5px' }}>
                STAFF VERIFICATION
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', height: 'calc(100% - 32px)', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ border: `2px solid #e5e7eb`, padding: '6px', borderRadius: '8px', background: '#fff', marginBottom: '4px' }}>
                        <QRCodeSVG value={qrData} size={76} fgColor="#000" />
                    </div>
                </div>
                <div style={{ flex: 1, fontSize: '11px', color: '#374151', lineHeight: '1.5', textAlign: 'left' }}>
                    <div style={{ fontWeight: 800, color: type.color, fontSize: '13px', marginBottom: '4px' }}>Staff Contact</div>
                    <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Phone: {user.phone || '—'}</div>
                    <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Email: {user.email || '—'}</div>
                    <div style={{ fontWeight: 500 }}>Team: {user.teamName || '—'}</div>
                    <div style={{ fontWeight: 500 }}>Team#: {user.teamNumber || '—'}</div>
                    <div style={{ marginTop: '6px', fontSize: '9.5px', color: '#6b7280', borderTop: '1px solid #e5e7eb', paddingTop: '6px', lineHeight: '1.3' }}>
                        HealthLink Hub Hospital<br />
                        Emergency Response & First Aid.
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
            <style>{`
                .flip-card { background-color: transparent; width: 340px; height: 215px; perspective: 1000px; margin: 0 auto; outline: none; }
                .flip-card-inner { position: relative; width: 100%; height: 100%; text-align: left; transition: transform 0.6s; transform-style: preserve-3d; }
                .flip-card.flipped .flip-card-inner { transform: rotateY(180deg); }
                .flip-card-front, .flip-card-back { position: absolute; width: 100%; height: 100%; -webkit-backface-visibility: hidden; backface-visibility: hidden; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
                .flip-card-back { transform: rotateY(180deg); }
                @media print {
                    body * { visibility: hidden !important; background: transparent !important; }
                    .modal-override { background: transparent !important; box-shadow: none !important; }
                    #print-section, #print-section * { visibility: visible !important; }
                    #print-section { position: absolute !important; left: 0 !important; top: 0 !important; width: auto !important; display: flex !important; flex-direction: column !important; gap: 20px !important; padding: 20px !important; }
                    .no-print { display: none !important; }
                }
            `}</style>

            <div className="modal-override" style={{ background: '#f8fafc', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '24px', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="no-print" style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', fontSize: 24, color: '#64748b', cursor: 'pointer', zIndex: 10 }}>&times;</button>

                <h4 className="no-print" style={{ textAlign: 'center', color: '#0f172a', fontWeight: '800', marginBottom: '6px' }}>Emergency Team ID Card</h4>
                <p className="no-print" style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', marginBottom: '24px' }}>Click the card to flip between front & back</p>

                <div className={`flip-card ${isFlipped ? 'flipped' : ''} no-print`} onClick={() => setIsFlipped(!isFlipped)} style={{ cursor: 'pointer' }}>
                    <div className="flip-card-inner">
                        <div className="flip-card-front"><FrontCard /></div>
                        <div className="flip-card-back"><BackCard /></div>
                    </div>
                </div>

                <div className="no-print" style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 30, flexWrap: 'wrap' }}>
                    <button onClick={downloadPNG} style={{ padding: '10px 18px', background: type.color, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="bi bi-image" /> Save PNG
                    </button>
                    <button onClick={downloadPDF} style={{ padding: '10px 18px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="bi bi-file-earmark-pdf-fill" /> Save PDF
                    </button>
                    <button onClick={() => window.print()} style={{ padding: '10px 18px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="bi bi-printer" /> Print ID
                    </button>
                </div>

                <div style={{ position: 'absolute', top: '-10000px', left: '-10000px', opacity: 0 }}>
                    <div id="print-section" ref={cardRef} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px', background: '#fff', width: '360px' }}>
                        <FrontCard />
                        <BackCard />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmergencyIDCardModal;
