import API from './axiosInstance';

// Dashboard Analytics
export const getDashboardStats = () => API.get('/analytics/stats');
export const getVisitData = (range = '1m') => API.get(`/analytics/visits?range=${range}`);
export const getConditionData = () => API.get('/analytics/conditions');
export const getActivityFeed = () => API.get('/analytics/activity');
export const getAppointmentsByDay = () => API.get('/analytics/appointments-by-day');
export const getPatientsByStatus = () => API.get('/analytics/patients-by-status');
export const getTodayAppointments = () => API.get('/appointments/today');

// Patients 
export const getPatients = (params) => API.get('/patients', { params });
export const getPatient = (id) => API.get(`/patients/${id}`);
export const createPatient = (data) => API.post('/patients', data);
export const updatePatient = (id, data) => API.put(`/patients/${id}`, data);
export const deletePatient = (id) => API.delete(`/patients/${id}`);
export const addVitals = (id, data) => API.post(`/patients/${id}/vitals`, data);

// All Appointments
export const getAppointments = (params) => API.get('/appointments', { params });

// Dashboard
export const getPatientDashboard = () => API.get('/dashboard/patient');
