import React from 'react';

const PharmacistFields = ({ formData, handleChange }) => {
    return (
        <>
            <div className="mb-3">
                <label className="form-label">Pharmacy Name</label>
                <input
                    type="text"
                    className="form-control"
                    name="pharmacyName"
                    value={formData.pharmacyName}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className="mb-3">
                <label className="form-label">License Number</label>
                <input
                    type="text"
                    className="form-control"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    required
                />
            </div>
        </>
    );
};

export default PharmacistFields;
