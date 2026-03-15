import mongoose from 'mongoose';

const emergencyRequestSchema = new mongoose.Schema({
    // Who is making the request
    emergencyTeamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // Patient being treated
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // Target doctor (optional — null means common/broadcast request)
    targetDoctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    // Request type
    requestType: {
        type: String,
        enum: ['Specific Doctor', 'Common Request'],
        required: true,
    },
    // Emergency details
    emergencyNotes: { type: String, default: '' },
    firstAidGiven: { type: String, default: '' },
    situationDescription: { type: String, default: '' },
    urgencyLevel: {
        type: String,
        enum: ['Critical', 'High', 'Moderate'],
        default: 'High',
    },
    // Emergency team info snapshot
    teamName: String,
    teamNumber: String,
    emergencyRoleId: String, // EMG-XXXXXX

    // Status tracking
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Completed'],
        default: 'Pending',
    },
    acceptedAt: Date,
    acceptedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    completedAt: Date,
    completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, { timestamps: true });

const EmergencyRequest = mongoose.model('EmergencyRequest', emergencyRequestSchema);
export default EmergencyRequest;
