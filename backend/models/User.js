import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    userId: {
        type: String,
        required: true, // User entered ID for login
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: false, // Optional for some roles? Making it optional to be safe, or required if needed. Prompt said "phoneNumber" for patient.
    },
    role: {
        type: String,
        enum: ['patient', 'doctor', 'labTechnician', 'pharmacist', 'admin'],
        required: true,
    },
    roleId: {
        type: String, // System generated: PT842723, DOC..., etc.
        unique: true,
    },
    // Role-specific fields
    specialization: String, // Doctor
    hospitalName: String, // Doctor
    experience: Number, // Doctor

    bloodGroup: String, // Patient
    allergies: String, // Patient
    chronicDiseases: String, // Patient
    emergencyContact: String, // Patient

    labName: String, // Lab
    labRegistrationNumber: String, // Lab

    pharmacyName: String, // Pharmacist
    licenseNumber: String, // Pharmacist
}, { timestamps: true });

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

export default User;
