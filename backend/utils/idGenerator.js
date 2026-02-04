import User from '../models/User.js';

const generateId = async (role) => {
    let prefix = '';
    switch (role) {
        case 'patient': prefix = 'PAT'; break;
        case 'doctor': prefix = 'DOC'; break;
        case 'labTechnician': prefix = 'LAB'; break;
        case 'pharmacist': prefix = 'PHAR'; break;
        default: prefix = 'USR';
    }

    let isUnique = false;
    let customId = '';

    while (!isUnique) {
        // Generate random 6 digit number
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        customId = `${prefix}-${randomNum}`;

        // Check if exists
        const existingUser = await User.findOne({ roleId: customId });
        if (!existingUser) {
            isUnique = true;
        }
    }

    return customId;
};

export default generateId;
