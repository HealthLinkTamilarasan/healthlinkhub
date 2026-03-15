import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import {
    getPatientDashboard,
    getDoctorDashboard,
    createPrescription,
    createRequest,
    addVitals,
    uploadLabReport,
    getLabPharmacyDashboard,
    validatePatient,
    validateStaff, // New
    getPatientDataForStaff,
    completeRequest,
    acceptRequest, // New
    manualMedicineIssue, // New
    manualLabReportIssue,
    uploadFile,
    updateProfile,
    updatePassword,
    updateDoctorProfile,
    updateLabProfile,
    updatePharmacistProfile
} from '../controllers/dashboard.controller.js';

const router = express.Router();

router.get('/patient', protect, getPatientDashboard);
router.put('/patient/profile', protect, updateProfile);
router.put('/patient/password', protect, updatePassword);
router.get('/doctor', protect, getDoctorDashboard);
router.put('/doctor/profile', protect, updateDoctorProfile);
router.put('/doctor/password', protect, updatePassword);
router.post('/prescription', protect, createPrescription);
router.post('/vitals', protect, addVitals);
router.post('/request', protect, createRequest);

// Validation & Lookup
router.get('/validate-patient/:id', protect, validatePatient);
router.get('/validate-staff/:id', protect, validateStaff); // New route
router.get('/patient-data/:id', protect, getPatientDataForStaff);

// Lab & Pharmacy
router.post('/report', protect, uploadLabReport);
router.get('/lab-pharmacy', protect, getLabPharmacyDashboard);
router.put('/accept-request/:id', protect, acceptRequest); // New route
router.post('/complete-request/:id', protect, completeRequest);

// Generic File Upload Route
router.post('/upload', protect, upload.single('file'), uploadFile);

router.post('/pharmacy/manual-issue', protect, manualMedicineIssue); // New route
router.put('/pharmacy/profile', protect, updatePharmacistProfile);
router.put('/pharmacy/password', protect, updatePassword);

router.post('/lab/manual-issue', protect, manualLabReportIssue);
router.put('/lab/profile', protect, updateLabProfile);
router.put('/lab/password', protect, updatePassword);

export default router;
