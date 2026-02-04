import React from 'react';

const RoleSelector = ({ selectedRole, onSelectRole }) => {
    const roles = [
        { value: 'patient', label: 'Patient' },
        { value: 'doctor', label: 'Doctor' },
        { value: 'labTechnician', label: 'Lab Technician' },
        { value: 'pharmacist', label: 'Pharmacist' },
    ];

    return (
        <div className="mb-4">
            <label className="form-label fw-bold">Select Role</label>
            <div className="d-flex gap-2 flex-wrap">
                {roles.map((role) => (
                    <button
                        key={role.value}
                        type="button"
                        className={`btn ${selectedRole === role.value ? 'btn-primary' : 'btn-outline-primary'} flex-grow-1`}
                        onClick={() => onSelectRole(role.value)}
                    >
                        {role.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default RoleSelector;
