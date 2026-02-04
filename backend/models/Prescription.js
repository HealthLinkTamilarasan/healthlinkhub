import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    medicines: [{
        name: String,
        dosage: String,
        frequency: String,
        duration: String,
    }],
    diagnosis: String,
    notes: String,
    fileUrls: [String], // Array of file links (PDF/Excel/Doc)
    status: {
        type: String,
        enum: ['Active', 'Completed'],
        default: 'Active',
    },
    validUntil: {
        type: Date,
        required: true,
        default: () => new Date(+new Date() + 5 * 24 * 60 * 60 * 1000) // Default 5 days
    },
}, { timestamps: true });

const Prescription = mongoose.model('Prescription', prescriptionSchema);
export default Prescription;
