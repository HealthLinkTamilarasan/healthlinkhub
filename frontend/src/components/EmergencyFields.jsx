const EmergencyFields = ({ formData, handleChange }) => (
    <div className="row g-3">
        <div className="col-12">
            <label className="form-label">Team Name</label>
            <input
                className="form-control form-control-lg"
                name="teamName"
                value={formData.teamName || ''}
                onChange={handleChange}
                required
                placeholder="e.g. Alpha Response Unit"
            />
        </div>

        <div className="col-md-6">
            <label className="form-label">Team Number</label>
            <input
                className="form-control form-control-lg"
                name="teamNumber"
                value={formData.teamNumber || ''}
                onChange={handleChange}
                required
                placeholder="e.g. T-001"
            />
        </div>

        <div className="col-md-6">
            <label className="form-label">Emergency Role</label>
            <select
                className="form-select form-select-lg"
                name="emergencyRole"
                value={formData.emergencyRole || ''}
                onChange={handleChange}
                required
            >
                <option value="">Select Role</option>
                <option value="Nurse">Nurse</option>
                <option value="Doctor">Doctor</option>
                <option value="Driver">Driver</option>
                <option value="Assistant">Assistant</option>
            </select>
            <small className="text-muted mt-1 d-block">
                <i className="bi bi-info-circle me-1"></i>
                This role is for internal team identification only and does not affect your system login role.
            </small>
        </div>
    </div>
);

export default EmergencyFields;
