import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';

const QRScannerModal = ({ show, onClose, onScanSuccess }) => {
    if (!show) return null;

    const handleScan = (result) => {
        if (result && result.length > 0) {
            let scanned = result[0].rawValue;

            // Security: Staff QR codes should not be used for patient workflow actions
            if (scanned.startsWith('HLH-STAFF-')) {
                alert('Invalid QR Code\nThis QR belongs to a staff member.');
                return;
            }

            // Valid Patient QR Logic
            if (scanned.startsWith('HLH-PAT-')) {
                let patId = scanned.replace('HLH-PAT-', '');
                onScanSuccess(patId);
                return;
            }

            // Valid Old-style patient ID logic with HLH- prefix fallback
            if (scanned.startsWith('HLH-')) {
                let patId = scanned.replace('HLH-', '');
                onScanSuccess(patId);
                return;
            }

            // Fallback for previous JSON scanner or direct standard scans
            try {
                const parsed = JSON.parse(scanned);
                if (parsed.id) {
                    onScanSuccess(parsed.id);
                } else {
                    onScanSuccess(scanned);
                }
            } catch (e) {
                // Return raw value safely if no format matched
                onScanSuccess(scanned);
            }
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1050,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }} onClick={onClose}>
            <div style={{
                background: '#fff', borderRadius: 12, width: '100%', maxWidth: 400,
                padding: 0, position: 'relative', overflow: 'hidden'
            }} onClick={e => e.stopPropagation()}>
                
                <div className="bg-primary text-white p-3 d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold"><i className="bi bi-qr-code-scan me-2"></i>Scan Patient ID</h5>
                    <button onClick={onClose} className="btn-close btn-close-white" aria-label="Close"></button>
                </div>

                <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: '#000' }}>
                    <Scanner
                        onScan={handleScan}
                        components={{ finder: true, audio: false }}
                        styles={{ container: { width: '100%', height: '100%' } }}
                    />
                </div>

                <div className="p-3 text-center text-muted small">
                    Position the patient's ID Card QR code within the frame to scan automatically.
                    Staff ID cards will be rejected securely.
                </div>
            </div>
        </div>
    );
};

export default QRScannerModal;
