import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import '../styles/Dashboard.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Generate a color palette that can handle many sectors
const generateColors = (count) => {
  const baseColors = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', 
    '#FFC658', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#E74C3C', '#3498DB',
    '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#E67E22', '#34495E',
    '#16A085', '#27AE60', '#2980B9', '#8E44AD', '#C0392B', '#D35400',
    '#7F8C8D', '#95A5A6', '#BDC3C7', '#ECF0F1', '#34495E', '#2C3E50',
    '#E74C3C', '#C0392B', '#A93226', '#922B21', '#7B241C', '#641E16'
  ];
  
  // If we need more colors, generate variations
  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }
  
  // Generate additional colors by varying hue
  const colors = [...baseColors];
  for (let i = baseColors.length; i < count; i++) {
    const hue = (i * 137.508) % 360; // Golden angle approximation
    colors.push(`hsl(${hue}, 70%, 50%)`);
  }
  return colors;
};

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
          let cellContent;
          let isFileLink = false;
          
          if (idx === 0) {
            cellContent = rowNum;
          } else if (idx === 1) {
            cellContent = new Date(response.timestamp).toLocaleString();
          } else if (idx === 2) {
            cellContent = response.sector;
          } else if (header.startsWith('File')) {
            const fileIndex = parseInt(header.match(/\d+/)?.[0]) - 1;
            const file = response.uploadedFiles?.[fileIndex];
            if (file && file.fileUrl) {
              isFileLink = true;
              cellContent = file;
            } else {
              cellContent = file ? (file.fileName || 'N/A') : 'N/A';
            }
          } else {
            cellContent = response.formData?.[header] || 'N/A';
          }

          const cellText = typeof cellContent === 'object' && cellContent?.fileName 
            ? cellContent.fileName 
            : String(cellContent);

          return (
            <td key={idx} title={cellText}>
              {isFileLink && cellContent?.fileUrl ? (
                <a 
                  href={cellContent.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="file-link"
                  title={cellContent.fileName || 'Open file'}
                >
                  {cellContent.fileName || 'View File'}
                </a>
              ) : (
                cellText.length > 50 ? cellText.substring(0, 50) + '...' : cellText
              )}
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
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={500}>
                  <PieChart>
                    <Pie
                      data={sectorDistribution}
                      cx="50%"
                      cy="45%"
                      labelLine={false}
                      label={false}
                      outerRadius={140}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="count"
                      paddingAngle={2}
                    >
                      {sectorDistribution.map((entry, index) => {
                        const colors = generateColors(sectorDistribution.length);
                        return (
                          <Cell key={`cell-${index}`} fill={colors[index]} />
                        );
                      })}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [
                        `${value} (${((props.payload.percent || 0) * 100).toFixed(1)}%)`,
                        props.payload.sector
                      ]}
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        padding: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="legend-container">
                  <div className="legend-title">Sector Distribution</div>
                  <div className="legend-scroll">
                    {sectorDistribution.map((item, index) => {
                      const colors = generateColors(sectorDistribution.length);
                      return (
                        <div key={index} className="legend-item">
                          <span 
                            className="legend-color" 
                            style={{ backgroundColor: colors[index] }}
                          ></span>
                          <span className="legend-label">{item.sector}</span>
                          <span className="legend-value">{item.count}</span>
                          <span className="legend-percent">
                            ({((item.count / sectorDistribution.reduce((sum, s) => sum + s.count, 0)) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
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

