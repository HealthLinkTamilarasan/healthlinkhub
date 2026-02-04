import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';
import LabReport from '../models/LabReport.js';
import Vitals from '../models/Vitals.js';
import User from '../models/User.js';
import Request from '../models/Request.js';

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

// @desc    Upload Generic File
// @route   POST /api/dashboard/upload
// @access  Private
export const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        // Construct full URL
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        res.status(200).json({ fileUrl });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Validate if Patient exists
// @route   GET /api/dashboard/validate-patient/:id
// @access  Private
export const validatePatient = async (req, res) => {
    try {
        const patient = await findPatientById(req.params.id);
        if (!patient || patient.role !== 'patient') {
            return res.status(404).json({ message: 'Patient not found' });
        }
        res.json({
            _id: patient._id,
            fullName: patient.fullName,
            roleId: patient.roleId,
            userId: patient.userId,
            age: patient.age,
            gender: patient.gender
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Validate Staff (Lab/Pharmacist)
// @route   GET /api/dashboard/validate-staff/:id
// @access  Private (Doctor)
export const validateStaff = async (req, res) => {
    try {
        // Build query dynamically to avoid CastError on _id if input is not an ObjectId
        const query = { $or: [{ roleId: req.params.id }, { userId: req.params.id }] };

        // Check if it looks like a Mongo ID (24 hex chars)
        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            query.$or.push({ _id: req.params.id });
        }

        const staff = await User.findOne(query);

        if (!staff || !['labTechnician', 'pharmacist'].includes(staff.role)) {
            return res.status(404).json({ message: 'Staff not found or invalid role' });
        }

        res.json({
            _id: staff._id,
            fullName: staff.fullName,
            role: staff.role,
            hospitalName: staff.hospitalName,
            roleId: staff.roleId
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Patient Data for Staff (Lab/Pharmacist)
// @route   GET /api/dashboard/patient-data/:id
// @access  Private (Lab/Pharmacist)
export const getPatientDataForStaff = async (req, res) => {
    try {
        const patient = await findPatientById(req.params.id);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        const prescriptions = await Prescription.find({ patientId: patient._id })
            .populate('doctorId', 'fullName')
            .sort({ createdAt: -1 })
            .limit(5);
        const labReports = await LabReport.find({ patientId: patient._id })
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            patient: {
                _id: patient._id,
                fullName: patient.fullName,
                roleId: patient.roleId,
                age: patient.age,
                gender: patient.gender
            },
            prescriptions,
            labReports
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Patient Dashboard Data
// @route   GET /api/dashboard/patient
// @access  Private (Patient)
export const getPatientDashboard = async (req, res) => {
    try {
        const patientId = req.user._id;

        const appointments = await Appointment.find({ patientId }).populate('doctorId', 'fullName specialization hospitalName').sort({ appointmentDate: 1 });
        // Only show valid prescriptions
        const prescriptions = await Prescription.find({
            patientId,
            validUntil: { $gt: new Date() } // Not expired
        }).populate('doctorId', 'fullName').sort({ createdAt: -1 });
        const labReports = await LabReport.find({ patientId }).populate('labId', 'labName fullName').sort({ createdAt: -1 });
        const vitals = await Vitals.findOne({ patientId }).sort({ createdAt: -1 });

        // Fetch completed requests (Manual Medicine/Lab Reports)
        const manualRequests = await Request.find({
            patientId,
            status: 'Completed'
        }).populate('doctorId', 'fullName').populate('targetUserId', 'fullName').sort({ completedAt: -1 });

        res.json({
            appointments,
            prescriptions,
            labReports,
            vitals,
            manualRequests
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Doctor Dashboard Data
// @route   GET /api/dashboard/doctor
// @access  Private (Doctor)
export const getDoctorDashboard = async (req, res) => {
    try {
        const doctorId = req.user._id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const prescriptionsToday = await Prescription.find({
            doctorId,
            createdAt: { $gte: today }
        }).populate('patientId', 'fullName userId roleId');

        const appointments = await Appointment.find({ doctorId, status: 'Scheduled' }).populate('patientId', 'fullName roleId age gender').sort({ appointmentDate: 1 });

        // Fetch Requests (Medicine & Lab) initiated by this doctor
        const requestedItems = await Request.find({ doctorId }).populate('patientId', 'fullName roleId').sort({ createdAt: -1 });

        // Fetch Manual Lab Reports & Medicine Issues for patients treated by this doctor (Approximation: Patients in prescriptions/appointments)
        // For simplicity: Find all Completed "Manual" Requests. A cleaner way is if we have a list of MyPatients.
        const myPatientIds = [
            ...new Set([
                ...prescriptionsToday.map(p => p.patientId._id.toString()),
                ...appointments.map(a => a.patientId._id.toString())
            ])
        ];

        // Find Completed requests where targetRole is Pharmacist or Lab, AND patient is in MyPatients list
        const manualItems = await Request.find({
            patientId: { $in: myPatientIds },
            status: 'Completed',
            // Manual items usually refer to requests where doctorId might be self-assigned by staff OR doctorId is the doctor but completed by staff.
            // We want to see items completed by OTHERS.
        }).populate('patientId', 'fullName roleId')
            .populate('completedBy', 'fullName role')
            .sort({ completedAt: -1 });

        res.json({
            patientsAttendedToday: prescriptionsToday,
            appointments,
            requestedItems,
            manualItems,
            totalPatientsAttended: prescriptionsToday.length,
            doctorName: req.user.fullName,
            hospitalName: req.user.hospitalName,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create Request (Doctor -> Lab/Pharm)
// @route   POST /api/dashboard/request
// @access  Private (Doctor)
export const createRequest = async (req, res) => {
    try {
        // Ensure requestType matches targetRole logic
        // Frontend sends: { patientId, requestType, targetUserId (optional), details }
        // We infer targetRole from requestType or receive it.

        const { patientId, targetRole, targetUserId, requestType, details } = req.body;

        const targetPatient = await findPatientById(patientId);
        if (!targetPatient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        let targetUser = null;
        if (targetUserId) {
            const userQuery = { $or: [{ roleId: targetUserId }, { userId: targetUserId }] };
            if (targetUserId.match(/^[0-9a-fA-F]{24}$/)) {
                userQuery.$or.push({ _id: targetUserId });
            }
            targetUser = await User.findOne(userQuery);
            // Validation: Ensure found user matches the target role
            if (targetUser && targetUser.role !== targetRole) {
                return res.status(400).json({ message: `Target User is not a ${targetRole}` });
            }
        }

        const request = await Request.create({
            doctorId: req.user._id,
            patientId: targetPatient._id,
            targetRole,
            targetUserId: targetUser?._id || null, // Ensure null if not found/provided
            requestType,
            details,
        });

        res.status(201).json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Accept a Request
// @route   PUT /api/dashboard/accept-request/:id
// @access  Private (Lab/Pharmacist)
export const acceptRequest = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Ensure user can accept it
        if (request.targetRole !== req.user.role) {
            return res.status(403).json({ message: 'Not authorized for this request type' });
        }

        // If specific target, ensure match
        if (request.targetUserId && request.targetUserId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'This request was assigned to another staff member' });
        }

        request.status = 'Accepted';
        request.acceptedAt = new Date();
        await request.save();

        res.json({ message: 'Request accepted', request });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Complete a Request
// @route   POST /api/dashboard/complete-request/:id
// @access  Private (Lab/Pharmacist)
export const completeRequest = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        request.status = 'Completed';
        request.completedAt = new Date();
        request.completedBy = req.user._id;
        await request.save();

        res.json({ message: 'Request completed successfully', request });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create Prescription (Attend Patient)
// @route   POST /api/dashboard/prescription
// @access  Private (Doctor)
export const createPrescription = async (req, res) => {
    try {
        const { patientId, medicines, diagnosis, notes, fileUrls, durationDays } = req.body;

        const targetPatient = await findPatientById(patientId);
        if (!targetPatient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        const validDays = durationDays ? parseInt(durationDays) : 5;
        const validUntil = new Date(+new Date() + validDays * 24 * 60 * 60 * 1000);

        const prescription = await Prescription.create({
            patientId: targetPatient._id,
            doctorId: req.user._id,
            medicines,
            diagnosis,
            notes,
            fileUrls: fileUrls || [],
            validUntil
        });

        // 2. Schedule Next Visit (if provided)
        const { nextVisitDate, nextVisitTime } = req.body;
        if (nextVisitDate && nextVisitTime) {
            // Combine Date and Time
            const [hours, minutes] = nextVisitTime.split(':');
            const appointmentDate = new Date(nextVisitDate);
            appointmentDate.setHours(hours, minutes, 0, 0);

            await Appointment.create({
                patientId: targetPatient._id,
                doctorId: req.user._id,
                appointmentDate,
                status: 'Scheduled',
                notes: 'Scheduled during prescription'
            });
        }

        res.status(201).json(prescription);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add Vitals
// @route   POST /api/dashboard/vitals
// @access  Private (Doctor)
export const addVitals = async (req, res) => {
    try {
        const { patientId, bloodPressure, sugarLevel, heartRate, weight, temperature, notes } = req.body;

        const targetPatient = await findPatientById(patientId);
        if (!targetPatient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        const vitals = await Vitals.create({
            patientId: targetPatient._id,
            doctorId: req.user._id,
            bloodPressure,
            sugarLevel,
            heartRate,
            weight,
            temperature,
            notes
        });

        res.status(201).json(vitals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upload Lab Report
// @route   POST /api/dashboard/report
// @access  Private (Lab)
export const uploadLabReport = async (req, res) => {
    try {
        const { patientId, reportTitle, reportType, fileUrl, requestId } = req.body;

        const targetPatient = await findPatientById(patientId);
        if (!targetPatient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        const report = await LabReport.create({
            patientId: targetPatient._id,
            labId: req.user._id,
            reportTitle,
            reportType,
            fileUrl,
        });

        // If linked to a request, mark it complete
        if (requestId) {
            await Request.findByIdAndUpdate(requestId, { status: 'Completed', completedAt: new Date(), completedBy: req.user._id });
        }

        res.status(201).json(report);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Lab/Pharmacy Dashboard Data
// @route   GET /api/dashboard/lab-pharmacy
// @access  Private (Lab/Pharmacist)
export const getLabPharmacyDashboard = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const role = req.user.role;
        const userId = req.user._id;

        // Active Requests
        const requests = await Request.find({
            targetRole: role,
            status: { $in: ['Pending', 'Accepted'] },
            $or: [{ targetUserId: userId }, { targetUserId: null }]
        }).populate('patientId', 'fullName roleId').populate('doctorId', 'fullName');

        // Completed Today Calculation
        let completedToday = 0;
        let attendedList = [];

        if (role === 'labTechnician') {
            // Lab: Count Reports created today by this user
            const reports = await LabReport.find({
                labId: userId,
                createdAt: { $gte: today }
            }).populate('patientId', 'fullName roleId');
            completedToday = reports.length;
            attendedList = reports.map(r => ({
                _id: r._id,
                patientName: r.patientId.fullName,
                patientId: r.patientId.roleId,
                details: r.reportTitle,
                time: r.createdAt
            }));
        } else if (role === 'pharmacist') {
            // Pharm: Count Completed Requests by this user today
            const completedReqs = await Request.find({
                targetRole: 'pharmacist',
                status: 'Completed',
                completedBy: userId,
                completedAt: { $gte: today }
            }).populate('patientId', 'fullName roleId');
            completedToday = completedReqs.length;
            attendedList = completedReqs.map(r => ({
                _id: r._id,
                patientName: r.patientId.fullName,
                patientId: r.patientId.roleId,
                details: 'Medicine Issued',
                time: r.completedAt
            }));
        }

        res.json({
            requests,
            totalRequests: requests.length,
            completedToday,
            attendedList
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Manual Medicine Issue (Pharmacist)
// @route   POST /api/dashboard/pharmacy/manual-issue
// @access  Private (Pharmacist)
export const manualMedicineIssue = async (req, res) => {
    try {
        const { patientId, prescriptionId, notes } = req.body;

        // If prescriptionId is valid, mark it as completed/delivered
        if (prescriptionId) {
            await Prescription.findByIdAndUpdate(prescriptionId, { status: 'Completed' });
        }

        // Create a self-completed request to track stat and visibility
        const request = await Request.create({
            doctorId: req.user._id, // Self-assigned as origin for tracking manual
            patientId,
            targetRole: 'pharmacist',
            targetUserId: req.user._id,
            requestType: 'Medicine',
            details: notes || 'Manual Issue by Pharmacist',
            status: 'Completed',
            completedBy: req.user._id,
            completedAt: new Date(),
            prescriptionId: prescriptionId || null,
        });
        res.status(200).json({ message: 'Medicine Issued Recorded', request });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Manual Lab Report Issue (Lab Tech)
// @route   POST /api/dashboard/lab/manual-issue
// @access  Private (Lab)
export const manualLabReportIssue = async (req, res) => {
    try {
        const { patientId, reportTitle, fileUrl, notes } = req.body;

        const targetPatient = await findPatientById(patientId);
        if (!targetPatient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // 1. Create the Lab Report
        const report = await LabReport.create({
            patientId: targetPatient._id,
            labId: req.user._id,
            reportTitle,
            reportType: 'Manual',
            fileUrl,
            status: 'Completed'
        });

        // 2. Create a "Request" record for visibility in Doctor/Patient Dashboards (as they look for Requests)
        await Request.create({
            doctorId: req.user._id, // Self-assigned
            patientId: targetPatient._id,
            targetRole: 'labTechnician',
            targetUserId: req.user._id,
            requestType: 'Lab Report',
            details: notes || `Manual Report: ${reportTitle}`,
            status: 'Completed',
            completedBy: req.user._id,
            completedAt: new Date(),
            labReportId: report._id
        });

        res.status(201).json(report);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
