import mongoose from 'mongoose';

const vitalsSchema = new mongoose.Schema({
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
    bloodPressure: String,
    sugarLevel: String,
    heartRate: String,
    weight: String,
    temperature: String,
    notes: String,
    recordedDate: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

const Vitals = mongoose.model('Vitals', vitalsSchema);
export default Vitals;
