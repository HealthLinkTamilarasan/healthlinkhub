import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    getEmergencyDashboard,
    getPatientDataForEmergency,
    searchDoctors,
    createEmergencyRequest,
    getEmergencyCasesForDoctor,
    getEmergencyCaseDetails,
    acceptEmergencyCase,
    completeEmergencyCase,
    updateEmergencyProfile,
} from '../controllers/emergency.controller.js';
import { updatePassword } from '../controllers/dashboard.controller.js';

const router = express.Router();

// Emergency Team routes
router.get('/dashboard', protect, getEmergencyDashboard);
router.get('/patient-data/:id', protect, getPatientDataForEmergency);
router.get('/search-doctors', protect, searchDoctors);
router.post('/request', protect, createEmergencyRequest);
router.put('/profile', protect, updateEmergencyProfile);
router.put('/password', protect, updatePassword);

// Doctor-side routes
router.get('/doctor-cases', protect, getEmergencyCasesForDoctor);
router.get('/case-details/:id', protect, getEmergencyCaseDetails);
router.put('/accept-case/:id', protect, acceptEmergencyCase);
router.put('/complete-case/:id', protect, completeEmergencyCase);

export default router;
