import User from '../models/User.js';
import EmergencyRequest from '../models/EmergencyRequest.js';
import Prescription from '../models/Prescription.js';
import LabReport from '../models/LabReport.js';
import Vitals from '../models/Vitals.js';

// Helper: Find patient by various ID types
const findPatientById = async (id) => {
    let patient = await User.findById(id).catch(() => null);
    if (!patient) {
        patient = await User.findOne({
            $or: [{ roleId: id }, { userId: id }]
        });
    }
    return patient;
};

// Helper: Find doctor by various ID types
const findDoctorById = async (id) => {
    const query = { $or: [{ roleId: id }, { userId: id }] };
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
        query.$or.push({ _id: id });
    }
    const doc = await User.findOne(query);
    if (doc && doc.role === 'doctor') return doc;
    return null;
};

// @desc    Get Emergency Team Dashboard Data
// @route   GET /api/emergency/dashboard
// @access  Private (Emergency Team)
export const getEmergencyDashboard = async (req, res) => {
    try {
        const teamId = req.user._id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Emergency requests made today by this team member
        const requestsToday = await EmergencyRequest.find({
            emergencyTeamId: teamId,
            createdAt: { $gte: today }
        })
            .populate('patientId', 'fullName roleId userId phone')
            .populate('targetDoctorId', 'fullName roleId')
            .populate('acceptedBy', 'fullName roleId')
            .populate('completedBy', 'fullName roleId')
            .sort({ createdAt: -1 });

        // Get unique patients attended today (from emergency requests)
        const patientIdsToday = [...new Set(requestsToday.map(r => r.patientId?._id?.toString()))];

        res.json({
            patientsAttendedToday: requestsToday,
            totalPatientsAttended: patientIdsToday.length,
            totalRequestsToday: requestsToday.length,
            teamName: req.user.teamName,
            teamNumber: req.user.teamNumber,
            emergencyRoleId: req.user.roleId,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get full patient data for emergency team
// @route   GET /api/emergency/patient-data/:id
// @access  Private (Emergency Team / Doctor)
export const getPatientDataForEmergency = async (req, res) => {
    try {
        const patient = await findPatientById(req.params.id);
        if (!patient || patient.role !== 'patient') {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // Get active prescriptions
        const prescriptions = await Prescription.find({
            patientId: patient._id,
        })
            .populate('doctorId', 'fullName')
            .sort({ createdAt: -1 })
            .limit(10);

        // Get lab reports
        const labReports = await LabReport.find({ patientId: patient._id })
            .populate('labId', 'fullName labName')
            .sort({ createdAt: -1 })
            .limit(10);

        // Get latest vitals
        const vitals = await Vitals.findOne({ patientId: patient._id }).sort({ createdAt: -1 });

        res.json({
            patient: {
                _id: patient._id,
                fullName: patient.fullName,
                roleId: patient.roleId,
                userId: patient.userId,
                phone: patient.phone,
                email: patient.email,
                address: patient.address,
                bloodGroup: patient.bloodGroup,
                allergies: patient.allergies,
                chronicDiseases: patient.chronicDiseases,
                emergencyContact: patient.emergencyContact,
                dateOfBirth: patient.dateOfBirth,
                profilePhoto: patient.profilePhoto,
            },
            prescriptions,
            labReports,
            vitals,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Search doctors
// @route   GET /api/emergency/search-doctors?q=term
// @access  Private (Emergency Team)
export const searchDoctors = async (req, res) => {
    try {
        const q = req.query.q || '';
        if (!q || q.length < 2) {
            return res.json([]);
        }

        const doctors = await User.find({
            role: 'doctor',
            $or: [
                { fullName: { $regex: q, $options: 'i' } },
                { roleId: { $regex: q, $options: 'i' } },
                { userId: { $regex: q, $options: 'i' } },
            ]
        }).select('fullName roleId userId specialization department hospitalName').limit(10);

        res.json(doctors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create Emergency Treatment Request
// @route   POST /api/emergency/request
// @access  Private (Emergency Team)
export const createEmergencyRequest = async (req, res) => {
    try {
        const {
            patientId,
            requestType,
            targetDoctorId,
            emergencyNotes,
            firstAidGiven,
            situationDescription,
            urgencyLevel,
        } = req.body;

        // Validate patient
        const patient = await findPatientById(patientId);
        if (!patient || patient.role !== 'patient') {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // Validate target doctor if specific
        let targetDoc = null;
        if (requestType === 'Specific Doctor' && targetDoctorId) {
            targetDoc = await findDoctorById(targetDoctorId);
            if (!targetDoc) {
                return res.status(404).json({ message: 'Doctor not found' });
            }
        }

        const emergencyRequest = await EmergencyRequest.create({
            emergencyTeamId: req.user._id,
            patientId: patient._id,
            targetDoctorId: targetDoc?._id || null,
            requestType,
            emergencyNotes,
            firstAidGiven,
            situationDescription,
            urgencyLevel: urgencyLevel || 'High',
            teamName: req.user.teamName,
            teamNumber: req.user.teamNumber,
            emergencyRoleId: req.user.roleId,
        });

        const populated = await EmergencyRequest.findById(emergencyRequest._id)
            .populate('patientId', 'fullName roleId')
            .populate('targetDoctorId', 'fullName roleId')
            .populate('emergencyTeamId', 'fullName roleId teamName teamNumber');

        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Emergency Cases for Doctor Dashboard
// @route   GET /api/emergency/doctor-cases
// @access  Private (Doctor)
export const getEmergencyCasesForDoctor = async (req, res) => {
    try {
        const doctorId = req.user._id;

        // Get cases targeted to this specific doctor OR common requests (visible to all doctors)
        // Show Pending + Accepted (not Completed)
        const cases = await EmergencyRequest.find({
            $or: [
                { targetDoctorId: doctorId },
                { requestType: 'Common Request', targetDoctorId: null }
            ],
            status: { $in: ['Pending', 'Accepted'] }
        })
            .populate('patientId', 'fullName roleId userId phone bloodGroup address allergies chronicDiseases emergencyContact dateOfBirth')
            .populate('emergencyTeamId', 'fullName roleId teamName teamNumber emergencyRole phone')
            .populate('acceptedBy', 'fullName roleId')
            .sort({ createdAt: -1 });

        res.json(cases);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get full details of a single emergency case (with patient data, vitals, prescriptions, reports)
// @route   GET /api/emergency/case-details/:id
// @access  Private (Doctor)
export const getEmergencyCaseDetails = async (req, res) => {
    try {
        const emergencyCase = await EmergencyRequest.findById(req.params.id)
            .populate('patientId', 'fullName roleId userId phone email address bloodGroup allergies chronicDiseases emergencyContact dateOfBirth profilePhoto')
            .populate('emergencyTeamId', 'fullName roleId teamName teamNumber emergencyRole phone email')
            .populate('targetDoctorId', 'fullName roleId')
            .populate('acceptedBy', 'fullName roleId')
            .populate('completedBy', 'fullName roleId');

        if (!emergencyCase) {
            return res.status(404).json({ message: 'Emergency case not found' });
        }

        // Get patient health data
        const patientId = emergencyCase.patientId._id;

        const vitals = await Vitals.findOne({ patientId }).sort({ createdAt: -1 });

        const prescriptions = await Prescription.find({ patientId })
            .populate('doctorId', 'fullName')
            .sort({ createdAt: -1 })
            .limit(10);

        const labReports = await LabReport.find({ patientId })
            .populate('labId', 'fullName labName')
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            emergencyCase,
            vitals,
            prescriptions,
            labReports,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Accept Emergency Case (Doctor)
// @route   PUT /api/emergency/accept-case/:id
// @access  Private (Doctor)
export const acceptEmergencyCase = async (req, res) => {
    try {
        const emergencyCase = await EmergencyRequest.findById(req.params.id);
        if (!emergencyCase) {
            return res.status(404).json({ message: 'Emergency case not found' });
        }

        if (emergencyCase.status === 'Accepted') {
            return res.status(400).json({ message: 'This case has already been accepted.' });
        }

        if (emergencyCase.status === 'Completed') {
            return res.status(400).json({ message: 'This case has already been completed.' });
        }

        emergencyCase.status = 'Accepted';
        emergencyCase.acceptedAt = new Date();
        emergencyCase.acceptedBy = req.user._id;
        await emergencyCase.save();

        const populated = await EmergencyRequest.findById(emergencyCase._id)
            .populate('patientId', 'fullName roleId')
            .populate('emergencyTeamId', 'fullName roleId teamName teamNumber')
            .populate('acceptedBy', 'fullName roleId');

        res.json({ message: 'Emergency case accepted.', emergencyCase: populated });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Complete Emergency Case (Doctor)
// @route   PUT /api/emergency/complete-case/:id
// @access  Private (Doctor)
export const completeEmergencyCase = async (req, res) => {
    try {
        const emergencyCase = await EmergencyRequest.findById(req.params.id);
        if (!emergencyCase) {
            return res.status(404).json({ message: 'Emergency case not found' });
        }

        if (emergencyCase.status === 'Completed') {
            return res.status(400).json({ message: 'This case has already been completed.' });
        }

        emergencyCase.status = 'Completed';
        emergencyCase.completedAt = new Date();
        emergencyCase.completedBy = req.user._id;
        // If not yet accepted, also mark as accepted now
        if (!emergencyCase.acceptedBy) {
            emergencyCase.acceptedBy = req.user._id;
            emergencyCase.acceptedAt = new Date();
        }
        await emergencyCase.save();

        const populated = await EmergencyRequest.findById(emergencyCase._id)
            .populate('patientId', 'fullName roleId')
            .populate('emergencyTeamId', 'fullName roleId teamName teamNumber')
            .populate('acceptedBy', 'fullName roleId')
            .populate('completedBy', 'fullName roleId');

        res.json({ message: 'Emergency case completed.', emergencyCase: populated });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update Emergency Team Profile
// @route   PUT /api/emergency/profile
// @access  Private (Emergency Team)
export const updateEmergencyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.fullName = req.body.fullName || user.fullName;
        user.teamName = req.body.teamName || user.teamName;
        user.teamNumber = req.body.teamNumber || user.teamNumber;
        user.phone = req.body.phone || user.phone;
        user.email = req.body.email || user.email;
        user.address = req.body.address || user.address;

        if (req.body.profilePhoto !== undefined) {
            user.profilePhoto = req.body.profilePhoto;
        }

        await user.save();
        res.json({ message: 'Emergency team profile updated successfully', user });
    } catch (error) {
        if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
            return res.status(400).json({ message: 'Email address already exists.' });
        }
        res.status(500).json({ message: error.message });
    }
};
