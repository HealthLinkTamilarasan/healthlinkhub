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
                    if (!decoded.role || !['patient', 'doctor', 'labTechnician', 'pharmacist', 'admin'].includes(decoded.role)) {
                        console.error("Invalid role in token");
                        logout();
                        setLoading(false);
                        return;
                    }

                    // 3. Restore User State
                    setUser({ ...decoded, token });

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

        // Set New
        localStorage.setItem('token', userData.token);
        const decoded = jwtDecode(userData.token);
        setUser({ ...decoded, ...userData });
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        // Optional: clear entire local storage if no persistent settings needed
        // localStorage.clear();
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
