import React from 'react';

const LabFields = ({ formData, handleChange }) => {
    return (
        <>
            <div className="mb-3">
                <label className="form-label">Lab Name</label>
                <input
                    type="text"
                    className="form-control"
                    name="labName"
                    value={formData.labName}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className="mb-3">
                <label className="form-label">Lab Registration Number</label>
                <input
                    type="text"
                    className="form-control"
                    name="labRegistrationNumber"
                    value={formData.labRegistrationNumber}
                    onChange={handleChange}
                    required
                />
            </div>
        </>
    );
};

export default LabFields;
