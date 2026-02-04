import React from 'react';

const PatientFields = ({ formData, handleChange }) => {
    return (
        <>
            <div className="mb-3">
                <label className="form-label">Blood Group</label>
                <select
                    className="form-select"
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    required
                >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                </select>
            </div>
            <div className="mb-3">
                <label className="form-label">Emergency Contact</label>
                <input
                    type="text"
                    className="form-control"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className="mb-3">
                <label className="form-label">Allergies (Optional)</label>
                <input
                    type="text"
                    className="form-control"
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleChange}
                />
            </div>
            <div className="mb-3">
                <label className="form-label">Chronic Diseases (Optional)</label>
                <input
                    type="text"
                    className="form-control"
                    name="chronicDiseases"
                    value={formData.chronicDiseases}
                    onChange={handleChange}
                />
            </div>
        </>
    );
};

export default PatientFields;
