import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    getStats,
    getVisits,
    getConditions,
    getActivityFeed,
    getAppointmentsByDay,
    getPatientsByStatus
} from '../controllers/analytics.controller.js';

const router = express.Router();

router.use(protect); // Require auth for all analytics routes

router.get('/stats', getStats);
router.get('/visits', getVisits);
router.get('/conditions', getConditions);
router.get('/activity', getActivityFeed);
router.get('/appointments-by-day', getAppointmentsByDay);
router.get('/patients-by-status', getPatientsByStatus);

export default router;
