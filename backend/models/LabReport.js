import mongoose from 'mongoose';

const labReportSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    labId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    reportTitle: {
        type: String,
        required: true,
    },
    reportType: String,
    fileUrl: {
        type: String, // In real app, this would be an S3 link
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed'],
        default: 'Completed',
    },
}, { timestamps: true });

const LabReport = mongoose.model('LabReport', labReportSchema);
export default LabReport;
