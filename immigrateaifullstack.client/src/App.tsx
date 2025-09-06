import { useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import { validateEmail, validatePassword, validateConfirmPassword } from './utils/validation';
import { setToken } from './utils/auth';
import Home from './components/Home';
import Header from './components/Header';
import ApplicationSelect from './components/ApplicationSelect';
import ChatPage from './components/ChatPage';
import { LanguageProvider } from './contexts/LanguageContext';

// Register Page Component
function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            newErrors.email = emailValidation.message;
        }
        
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            newErrors.password = passwordValidation.message;
        }
        
        const confirmPasswordValidation = validateConfirmPassword(password, confirmPassword);
        if (!confirmPasswordValidation.isValid) {
            newErrors.confirmPassword = confirmPasswordValidation.message;
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        
        setLoading(true);
        setMessage(null);
        try {
            const response = await fetch('api/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (response.ok) {
                const data = await response.json();
                setToken(data.token);
                setMessage('Account created successfully! Redirecting...');
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            } else {
                const error = await response.json();
                setMessage('Error: ' + error.message);
            }
        } catch (err) {
            setMessage('Network error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh] px-4 py-8">
            <div className="w-full max-w-md border-gray-200 bg-white shadow-md rounded-lg">
                <div className="space-y-1 bg-gray-50 border-b border-gray-100 rounded-t-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
                    <p className="text-gray-600">
                        Create an account to start your immigration journey
                    </p>
                </div>
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                                autoComplete="email"
                            />
                            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input 
                                type="password" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                                autoComplete="new-password"
                            />
                            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                        </div>

        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                            <input 
                                type="password" 
                                value={confirmPassword} 
                                onChange={e => setConfirmPassword(e.target.value)} 
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                                autoComplete="new-password"
                            />
                            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                        </div>

                        <button 
                            type="submit" 
                            className="w-full mt-6 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                            disabled={loading}
                        >
                            {loading ? "Creating account..." : "Create Account"}
                        </button>

                        {message && (
                            <p className={`text-sm text-center ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                                {message}
                            </p>
                        )}

                        <div className="text-center text-sm">
                            <span className="text-gray-600">
                                Already have an account?{" "}
                            </span>
                            <Link 
                                to="/login" 
                                className="text-red-600 hover:text-red-700 font-semibold"
                            >
                                Sign In
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

// Login Page Component
function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const navigate = useNavigate();
    const location = useLocation();

    // Get redirect param from query string
    const params = new URLSearchParams(location.search);
    const redirect = params.get('redirect');

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            newErrors.email = emailValidation.message;
        }
        
        if (!password) {
            newErrors.password = 'Password is required';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        
        setLoading(true);
        setMessage(null);
        try {
            const response = await fetch('api/user/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
        if (response.ok) {
            const data = await response.json();
                setToken(data.token);
                setMessage('Login successful! Redirecting...');
                setTimeout(() => {
                    if (redirect) {
                        navigate(redirect, { replace: true });
                    } else {
                        window.location.href = '/';
                    }
                }, 1500);
            } else {
                const error = await response.json();
                setMessage('Error: ' + error.message);
            }
        } catch (err) {
            setMessage('Network error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh] px-4">
            <div className="w-full max-w-md border-gray-200 bg-white shadow-md rounded-lg">
                <div className="space-y-1 bg-gray-50 border-b border-gray-100 rounded-t-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-800">Sign In</h2>
                    <p className="text-gray-600">
                        Enter your credentials to access your account
                    </p>
                </div>
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                                autoComplete="email"
                            />
                            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input 
                                type="password" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                                autoComplete="current-password"
                            />
                            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>

                        {message && (
                            <p className={`text-sm text-center ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                                {message}
                            </p>
                        )}

                        <div className="text-center text-sm">
                            <span className="text-gray-600">
                                Don't have an account?{" "}
                            </span>
                            <Link 
                                to="/register" 
                                className="text-red-600 hover:text-red-700 font-semibold"
                            >
                                Create Account
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

// About Component
function About() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">About</h1>
            <p className="text-gray-600">This is the Immigration AI app. Here you can manage users and conversations related to immigration assistance.</p>
        </div>
    );
}

// Main App Component
function App() {
    return (
        <LanguageProvider>
            <div className="min-h-screen bg-white">
                {/* Header */}
                <Header />

                {/* Main Content */}
                <main>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/application-select" element={<ApplicationSelect />} />
                        <Route path="/chat/:type" element={<ChatPage />} />
                    </Routes>
                </main>
            </div>
        </LanguageProvider>
    );
}

export default App;