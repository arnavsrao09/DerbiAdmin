import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import '../styles/Dashboard.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B'];

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sectorDistribution, setSectorDistribution] = useState([]);
  const [responses, setResponses] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalResponses: 0,
    limit: 50
  });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalApplications: 0,
    pitchDecksUploaded: 0,
    cinDocumentsUploaded: 0
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user, navigate, pagination.currentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [distributionRes, responsesRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/stats/sector-distribution`),
        axios.get(`${API_BASE_URL}/responses?page=${pagination.currentPage}&limit=50`),
        axios.get(`${API_BASE_URL}/stats/overview`)
      ]);

      setSectorDistribution(distributionRes.data.distribution);
      setResponses(responsesRes.data.responses);
      setPagination(responsesRes.data.pagination);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportXLS = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/export/xls`, {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'form-responses.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting to XLS:', error);
      alert('Error exporting to XLS');
    }
  };

  const handleDownloadDocs = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/export/download-docs`, {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'uploaded-documents.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading docs:', error);
      alert('Error downloading documents list');
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const renderTableHeaders = () => {
    if (responses.length === 0) return null;

    const firstResponse = responses[0];
    const headers = ['S.No', 'Timestamp', 'Sector'];
    
    // Add form data keys as headers
    if (firstResponse.formData && typeof firstResponse.formData === 'object') {
      Object.keys(firstResponse.formData).forEach(key => {
        if (!headers.includes(key)) {
          headers.push(key);
        }
      });
    }

    // Add file upload headers
    if (firstResponse.uploadedFiles && firstResponse.uploadedFiles.length > 0) {
      firstResponse.uploadedFiles.forEach((file, idx) => {
        headers.push(`File ${idx + 1}: ${file.fieldName}`);
      });
    }

    return headers;
  };

  const renderTableRow = (response, index) => {
    const rowNum = (pagination.currentPage - 1) * pagination.limit + index + 1;
    const headers = renderTableHeaders();
    
    return (
      <tr key={response._id}>
        {headers.map((header, idx) => {
          let cellContent = '';
          
          if (idx === 0) {
            cellContent = rowNum;
          } else if (idx === 1) {
            cellContent = new Date(response.timestamp).toLocaleString();
          } else if (idx === 2) {
            cellContent = response.sector;
          } else if (header.startsWith('File')) {
            const fileIndex = parseInt(header.match(/\d+/)?.[0]) - 1;
            const file = response.uploadedFiles?.[fileIndex];
            cellContent = file ? (file.fileName || file.fileUrl || 'N/A') : 'N/A';
          } else {
            cellContent = response.formData?.[header] || 'N/A';
          }

          return (
            <td key={idx} title={String(cellContent)}>
              {String(cellContent).length > 50 
                ? String(cellContent).substring(0, 50) + '...' 
                : cellContent}
            </td>
          );
        })}
      </tr>
    );
  };

  if (loading && responses.length === 0) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Admin Portal - Applications Dashboard</h1>
        <div className="header-actions">
          <button onClick={fetchData} className="refresh-button" title="Refresh">
            ↻
          </button>
          <button onClick={logout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-actions">
        <button onClick={handleExportXLS} className="export-button">
          Export to XLS
        </button>
        <button onClick={handleDownloadDocs} className="export-button">
          Download Uploaded Docs
        </button>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-left">
          <h2>Applications Status Overview</h2>
          <div className="chart-container">
            {sectorDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={sectorDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ sector, count, percent }) => 
                      `${sector}: ${count} (${(percent * 100).toFixed(1)}%)`
                    }
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {sectorDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">No data available</div>
            )}
          </div>
        </div>

        <div className="dashboard-right">
          <h2>Application Data Snapshot</h2>
          <div className="stats-table">
            <table>
              <tbody>
                <tr>
                  <td>Total Applications</td>
                  <td>{stats.totalApplications}</td>
                </tr>
                <tr>
                  <td>Pitch Decks Uploaded</td>
                  <td>{stats.pitchDecksUploaded}</td>
                </tr>
                <tr>
                  <td>CIN Documents Uploaded</td>
                  <td>{stats.cinDocumentsUploaded}</td>
                </tr>
                {sectorDistribution.slice(0, 5).map((item, idx) => (
                  <tr key={idx}>
                    <td>Sector - {item.sector}</td>
                    <td>{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="responses-table-container">
        <h2>Form Responses</h2>
        {responses.length > 0 ? (
          <>
            <div className="table-wrapper">
              <table className="responses-table">
                <thead>
                  <tr>
                    {renderTableHeaders()?.map((header, idx) => (
                      <th key={idx}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {responses.map((response, index) => renderTableRow(response, index))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                Previous
              </button>
              <span>
                Page {pagination.currentPage} of {pagination.totalPages} 
                ({pagination.totalResponses} total responses)
              </span>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <div className="no-data">No responses found</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

