import React, { useState, useEffect } from 'react';
import StatsCard from '../../components/dashboard/StatsCard';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title as ChartTitle, Tooltip, Legend, Filler, ArcElement, BarElement } from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { getDashboardStats, getVisitData, getConditionData, getAppointmentsByDay, getPatientsByStatus } from '../../api/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTitle, Tooltip, Legend, Filler, ArcElement, BarElement);

const Analytics = () => {
  const [stats, setStats] = useState({ totalPatients: 0, appointmentsToday: 0, pendingReports: 0, criticalCases: 0 });
  const [visitsData, setVisitsData] = useState([]);
  const [conditionsData, setConditionsData] = useState([]);
  const [appointmentsByDay, setAppointmentsByDay] = useState([]);
  const [patientsByStatus, setPatientsByStatus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, visitRes, conditionRes, aptsDayRes, statusRes] = await Promise.all([
            getDashboardStats(),
            getVisitData('1y'),
            getConditionData(),
            getAppointmentsByDay(),
            getPatientsByStatus()
        ]);
        setStats(statsRes.data);
        setVisitsData(visitRes.data);
        setConditionsData(conditionRes.data);
        setAppointmentsByDay(aptsDayRes.data);
        setPatientsByStatus(statusRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5 min-vh-100">
        <div className="spinner-border text-primary" style={{ width: '2rem', height: '2rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Monthly Patient Visits Line Chart
  const lineChartData = {
    labels: visitsData.map(d => d.label),
    datasets: [{
      label: 'Visits',
      data: visitsData.map(d => d.count),
      borderColor: '#1A56DB',
      backgroundColor: 'rgba(26, 86, 219, 0.08)',
      fill: true,
      tension: 0.4,
    }]
  };
  const lineChartOptions = { responsive: true, plugins: { legend: { display: false } }, maintainAspectRatio: false };

  // Top Diagnoses Doughnut
  const colors = ['#1A56DB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  const doughnutData = {
    labels: conditionsData.map(d => d.condition),
    datasets: [{
      data: conditionsData.map(d => d.count),
      backgroundColor: colors,
      borderWidth: 0,
    }]
  };
  const doughnutOptions = { responsive: true, cutout: '70%', plugins: { legend: { position: 'bottom' } }, maintainAspectRatio: false };

  // Appointments by Day Bar Chart
  const barChartData1 = {
    labels: appointmentsByDay.map(d => d.day),
    datasets: [{
      label: 'Appointments',
      data: appointmentsByDay.map(d => d.count),
      backgroundColor: '#1A56DB',
    }]
  };
  const barOptions1 = { responsive: true, plugins: { legend: { display: false } }, maintainAspectRatio: false };

  // Patients by Status Horizontal Bar
  const statusColors = ['#10B981', '#F59E0B', '#EF4444', '#94A3B8'];
  const barChartData2 = {
    labels: patientsByStatus.map(d => d.status),
    datasets: [{
      label: 'Patients',
      data: patientsByStatus.map(d => d.count),
      backgroundColor: statusColors,
    }]
  };
  const barOptions2 = { responsive: true, indexAxis: 'y', plugins: { legend: { display: false } }, maintainAspectRatio: false };

  return (
    <div>
      <h4 className="fw-bold mb-4" style={{ color: '#1E293B' }}>Analytics Overview</h4>

      {/* Row 1: Stats */}
      <div className="row g-4 mb-4">
        <StatsCard title="Total Patients" value={stats.totalPatients} icon="bi-people-fill" colorClass="primary" change={12} />
        <StatsCard title="Appointments Today" value={stats.appointmentsToday} icon="bi-calendar-check-fill" colorClass="success" change={5} />
        <StatsCard title="Pending Reports" value={stats.pendingReports} icon="bi-file-earmark-text-fill" colorClass="warning" change={-2} />
        <StatsCard title="Critical Cases" value={stats.criticalCases} icon="bi-exclamation-diamond-fill" colorClass="danger" change={-1} />
      </div>

      {/* Row 2: Charts */}
      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="dashboard-card p-4 h-100 d-flex flex-column">
            <h6 className="fw-semibold mb-4">Monthly Patient Visits</h6>
            <div className="flex-grow-1" style={{ minHeight: '300px' }}>
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="dashboard-card p-4 h-100 d-flex flex-column">
            <h6 className="fw-semibold mb-4">Top Diagnoses</h6>
            <div className="flex-grow-1" style={{ minHeight: '300px' }}>
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Bar Charts */}
      <div className="row g-4">
        <div className="col-lg-6">
          <div className="dashboard-card p-4 h-100 d-flex flex-column">
            <h6 className="fw-semibold mb-4">Appointments by Day</h6>
            <div className="flex-grow-1" style={{ minHeight: '250px' }}>
              <Bar data={barChartData1} options={barOptions1} />
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="dashboard-card p-4 h-100 d-flex flex-column">
            <h6 className="fw-semibold mb-4">Patients by Status</h6>
            <div className="flex-grow-1" style={{ minHeight: '250px' }}>
              <Bar data={barChartData2} options={barOptions2} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
