import React from 'react';

const DoctorFields = ({ formData, handleChange }) => {
    return (
        <>
            <div className="mb-3">
                <label className="form-label">Hospital Name</label>
                <input
                    type="text"
                    className="form-control"
                    name="hospitalName"
                    value={formData.hospitalName}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className="mb-3">
                <label className="form-label">Specialization</label>
                <input
                    type="text"
                    className="form-control"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className="mb-3">
                <label className="form-label">Experience (Years)</label>
                <input
                    type="number"
                    className="form-control"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    required
                />
            </div>
        </>
    );
};

export default DoctorFields;
