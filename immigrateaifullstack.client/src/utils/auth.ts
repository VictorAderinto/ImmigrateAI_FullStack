export interface AuthUser {
    userId: string;
    email: string;
}

export const setToken = (token: string): void => {
    localStorage.setItem('authToken', token);
};

export const getToken = (): string | null => {
    return localStorage.getItem('authToken');
};

export const removeToken = (): void => {
    localStorage.removeItem('authToken');
};

export const isAuthenticated = (): boolean => {
    const token = getToken();
    if (!token) return false;
    
    try {
        // Basic token validation - check if it's expired
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        return Date.now() < expirationTime;
    } catch {
        return false;
    }
};

export const getAuthHeaders = (): HeadersInit => {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};

export const logout = (): void => {
    removeToken();
    window.location.href = '/login';
}; 