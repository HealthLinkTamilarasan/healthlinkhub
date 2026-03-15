import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // STRICT AUTH RESTORATION ON LOAD
        const restoreAuth = () => {
            const token = localStorage.getItem('token');
            const storedUserStr = localStorage.getItem('user_data');
            
            if (token) {
                try {
                    const decoded = jwtDecode(token);

                    // 1. Check Expiry
                    const currentTime = Date.now() / 1000;
                    if (decoded.exp < currentTime) {
                        console.warn("Token expired");
                        logout();
                        setLoading(false);
                        return;
                    }

                    // 2. Validate Role Integrity
                    if (!decoded.role || !['patient', 'doctor', 'labTechnician', 'pharmacist', 'emergencyTeam', 'admin'].includes(decoded.role)) {
                        console.error("Invalid role in token");
                        logout();
                        setLoading(false);
                        return;
                    }

                    // 3. Restore User State
                    const storedUser = storedUserStr ? JSON.parse(storedUserStr) : {};
                    setUser({ ...decoded, ...storedUser, token });

                } catch (error) {
                    console.error("Invalid token format", error);
                    logout();
                }
            }
            setLoading(false);
        };

        restoreAuth();
    }, []);

    const login = (userData) => {
        // CLEAN STATE BEFORE SETTING NEW
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user_data');

        // Set New
        localStorage.setItem('token', userData.token);
        
        const decoded = jwtDecode(userData.token);
        const fullUser = { ...decoded, ...userData };
        
        // Save the full user object to localStorage so we don't lose data (like profilePhoto) on refresh
        localStorage.setItem('user_data', JSON.stringify(fullUser));
        
        setUser(fullUser);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user_data');
        setUser(null);
    };

    const updateUser = (updatedFields) => {
        setUser((prevUser) => {
            const newUser = {
                ...prevUser,
                ...updatedFields
            };
            localStorage.setItem('user_data', JSON.stringify(newUser));
            return newUser;
        });
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
