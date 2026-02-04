import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    targetRole: {
        type: String,
        enum: ['labTechnician', 'pharmacist'],
        required: true,
    },
    targetUserId: { // Specific Lab Technician or Pharmacist
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    // Context References
    prescriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prescription'
    },
    labReportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LabReport'
    },
    requestType: {
        type: String,
        enum: ['Lab Report', 'Medicine'],
        required: true,
    },
    details: String,
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Completed'], // Added Accepted
        default: 'Pending',
    },
    acceptedAt: Date, // Track when accepted
    completedAt: Date,
    completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, { timestamps: true });

const Request = mongoose.model('Request', requestSchema);
export default Request;
