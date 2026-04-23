import React, { useState } from 'react';
import api from '../api/api';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AcademicCapIcon, SparklesIcon } from '@heroicons/react/24/outline';

const Login = () => {
  const [email, setEmail] = useState('aarav@example.com');
  const [password, setPassword] = useState('Candidate123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const setUser = useAuthStore((state) => state.setUser);
  const setTokens = useAuthStore((state) => state.setTokens);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, ...user } = res.data.data;
      
      setTokens(accessToken, refreshToken);
      setUser(user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute top-1/2 -right-48 w-[30rem] h-[30rem] bg-indigo-50 rounded-full blur-[100px] opacity-70"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-indigo-200/50 p-12 border border-slate-200/60 backdrop-blur-sm">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-200 mb-6">
              <AcademicCapIcon className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Global Academy</h1>
            <p className="text-slate-400 font-medium">Your future is just one sign-in away.</p>
          </div>

          {error && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-xs font-bold mb-8 border border-rose-100 flex items-center"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-rose-600 mr-3"></div>
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-slate-700 font-medium"
                placeholder="you@university.com"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-slate-700 font-medium"
                placeholder="••••••••"
                required
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-indigo-600 transform hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-slate-900/20"
            >
              {loading ? 'Authenticating...' : 'Explore Programs'}
            </button>
          </form>

          <div className="mt-12 flex items-center justify-center space-x-2 bg-indigo-50/50 py-4 rounded-2xl border border-indigo-100">
             <SparklesIcon className="h-4 w-4 text-indigo-600" />
             <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-none translate-y-[1px]">
               Demo Access Enabled
             </p>
          </div>
        </div>
        
        <div className="mt-8 text-center px-8">
           <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.25em]">
             Built for Backend Architects & Future Scholars
           </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
