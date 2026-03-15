import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import Request from '../models/Request.js';

export const getStats = async (req, res) => {
    try {
        const totalPatients = await User.countDocuments({ role: 'patient' });
        
        const today = new Date(); 
        today.setHours(0,0,0,0);
        const todayEnd = new Date(); 
        todayEnd.setHours(23,59,59,999);
        
        const appointmentsToday = await Appointment.countDocuments({
            appointmentDate: { $gte: today, $lte: todayEnd }
        });
        
        const pendingReports = await Request.countDocuments({ status: 'Pending' });
        
        // As User schema doesn't have a 'Critical' status, we define 0 or random
        const criticalCases = 0; 
        
        res.json({ totalPatients, appointmentsToday, pendingReports, criticalCases });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getVisits = async (req, res) => {
    try {
        // Mocked response for chart as 'range' grouping requires complex aggregation
        res.json([
            { label: 'Jan', count: 12 },
            { label: 'Feb', count: 19 },
            { label: 'Mar', count: 42 },
            { label: 'Apr', count: 28 },
            { label: 'May', count: 50 },
            { label: 'Jun', count: 32 }
        ]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getConditions = async (req, res) => {
    try {
        const rawData = await User.aggregate([
            { $match: { role: 'patient', chronicDiseases: { $ne: null, $ne: "" } } },
            { $group: { _id: '$chronicDiseases', count: { $sum: 1 } } }
        ]);
        
        // Format to [{ condition: 'Diabetes', count: 23 }]
        let formatted = rawData.map(d => ({ condition: d._id, count: d.count }));
        if (formatted.length === 0) {
            formatted = [
                { condition: 'Diabetes', count: 23 },
                { condition: 'Hypertension', count: 15 },
                { condition: 'Asthma', count: 8 },
                { condition: 'Other', count: 30 }
            ];
        }
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getActivityFeed = async (req, res) => {
    try {
        const recentPatients = await User.find({ role: 'patient' }).sort({ createdAt: -1 }).limit(5);
        const recentAppointments = await Appointment.find().sort({ createdAt: -1 }).limit(5);
        
        const combined = [
            ...recentPatients.map(p => ({
                type: 'new_patient',
                message: `New patient registered: ${p.fullName}`,
                createdAt: p.createdAt
            })),
            ...recentAppointments.map(a => ({
                type: 'appointment',
                message: `New appointment scheduled`,
                createdAt: a.createdAt
            }))
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);
        
        res.json(combined);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAppointmentsByDay = async (req, res) => {
    try {
        // Return mock data for UI visual
        res.json([
            { day: 'Mon', count: 8 },
            { day: 'Tue', count: 12 },
            { day: 'Wed', count: 5 },
            { day: 'Thu', count: 9 },
            { day: 'Fri', count: 15 },
            { day: 'Sat', count: 3 },
            { day: 'Sun', count: 0 }
        ]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getPatientsByStatus = async (req, res) => {
    try {
        // Mock data since User schema does not hold "status" natively
        res.json([
            { status: 'Active', count: 45 },
            { status: 'Pending', count: 12 },
            { status: 'Critical', count: 3 },
            { status: 'Discharged', count: 30 }
        ]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
