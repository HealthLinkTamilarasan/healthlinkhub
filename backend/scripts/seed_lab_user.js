import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const seedLabUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Check if user exists
        const existing = await User.findOne({ userId: 'LAB-TEST-001' });
        if (existing) {
            await User.deleteOne({ userId: 'LAB-TEST-001' });
            console.log('Removed existing test user');
        }

        const labUser = await User.create({
            fullName: 'Test Lab Tech',
            email: 'lab.test@healthlink.com',
            userId: 'LAB-TEST-001',
            password: 'password123',
            role: 'labTechnician', // Exact string required
            roleId: 'LAB-999',
            labName: 'Central Lab'
        });

        console.log('✅ Created Lab Technician User');
        console.log('User ID: LAB-TEST-001');
        console.log('Password: password123');
        console.log('Role: labTechnician');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

seedLabUser();
