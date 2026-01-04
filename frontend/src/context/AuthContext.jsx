import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored token
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    
    if (token && username) {
      // Verify token is still valid
      axios.get(`${API_BASE_URL}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(() => {
        setUser({ username, token });
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      })
      .catch(() => {
        // Token invalid, clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('rememberMe');
      })
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password, rememberMe) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password,
        rememberMe
      });

      const { token, username: userUsername } = response.data;
      
      if (rememberMe) {
        localStorage.setItem('token', token);
        localStorage.setItem('username', userUsername);
        localStorage.setItem('rememberMe', 'true');
      } else {
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('username', userUsername);
      }

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser({ username: userUsername, token });
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('rememberMe');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('username');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

