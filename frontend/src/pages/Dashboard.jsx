import React, { useEffect, useState } from 'react';
import api from '../api/api';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserCircleIcon, 
  AcademicCapIcon, 
  MapPinIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  ArrowRightOnRectangleIcon,
  ChevronRightIcon,
  AdjustmentsHorizontalIcon,
  BellIcon
} from '@heroicons/react/24/outline';

import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const Dashboard = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [studyPlan, setStudyPlan] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recRes, appRes] = await Promise.all([
          api.get('/recommendations/mine'),
          api.get('/applications')
        ]);
        setRecommendations(recRes.data.data.recommendations);
        setStudyPlan(recRes.data.data.aiStudyPlan);
        setApplications(appRes.data.data);
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        // Adding a slight delay for better transition effect
        setTimeout(() => setLoading(false), 800);
      }
    };
    fetchData();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const PageLoader = () => (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 space-y-8">
           <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200/50">
             <Skeleton width={120} height={24} className="mb-6 rounded-full" />
             <Skeleton count={2} height={40} className="mb-4" />
             <Skeleton count={2} height={20} className="w-1/2 mb-8" />
             <div className="flex gap-4">
               <Skeleton width={160} height={48} className="rounded-2xl" />
               <Skeleton width={160} height={48} className="rounded-2xl" />
             </div>
           </div>
           <div className="grid grid-cols-2 gap-6">
             <Skeleton height={200} className="rounded-[2rem]" />
             <Skeleton height={200} className="rounded-[2rem]" />
           </div>
         </div>
         <div className="lg:col-span-4 space-y-8">
           <Skeleton height={400} className="rounded-[2.5rem]" />
           <Skeleton height={300} className="rounded-[2.5rem]" />
         </div>
      </div>
    </div>
  );

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Navigation Sidebar-style Header */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-8 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
              <AcademicCapIcon className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-indigo-600">Waygood Global</span>
          </div>
          
          <div className="flex items-center space-x-6">
            <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors">
              <BellIcon className="h-6 w-6" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="h-8 w-px bg-slate-200"></div>

            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">{user?.fullName}</p>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{user?.role}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="group flex items-center space-x-2 bg-slate-50 hover:bg-rose-50 p-1 pr-3 rounded-full border border-slate-200 transition-all"
              >
                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:bg-rose-100 transition-colors">
                  <ArrowRightOnRectangleIcon className="h-4 w-4 text-slate-400 group-hover:text-rose-600" />
                </div>
                <span className="text-xs font-bold text-slate-500 group-hover:text-rose-600">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto p-8">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          {/* LEFT: Main Content (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Hero Section */}
            <motion.section variants={itemVariants} className="bg-white rounded-[2.5rem] p-10 border border-slate-200/50 shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                <div className="inline-flex items-center space-x-2 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-bold mb-6">
                  <SparklesIcon className="h-4 w-4" />
                  <span>AI Engine Active</span>
                </div>
                <h1 className="text-4xl font-extrabold text-slate-900 mb-4 leading-tight">
                  Design your future with <br/>
                  <span className="text-indigo-600">data-driven precision.</span>
                </h1>
                <p className="text-slate-500 max-w-lg text-lg mb-8">
                  Based on your academic profile and {studyPlan?.timeline?.length || 0} strategic milestones, here are your top-match programs.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
                    Update My Profile
                  </button>
                  <button className="bg-slate-50 text-slate-600 border border-slate-200 px-8 py-3.5 rounded-2xl font-bold hover:bg-white transition-all">
                    Talk to Counselor
                  </button>
                </div>
              </div>
              {/* Decorative backgrounds */}
              <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-indigo-50/50 to-transparent pointer-events-none"></div>
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-100/50 rounded-full blur-3xl"></div>
            </motion.section>

            {/* Recommendations Grid */}
            <motion.section variants={itemVariants}>
              <div className="flex items-center justify-between mb-6 px-2">
                <h2 className="text-2xl font-bold text-slate-900">Recommended Programs</h2>
                <button className="text-indigo-600 text-sm font-bold flex items-center hover:underline">
                  View All <ChevronRightIcon className="h-4 w-4 ml-1" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendations.map((prog, idx) => (
                  <motion.div 
                    key={prog._id} 
                    whileHover={{ y: -8 }}
                    className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                        <AcademicCapIcon className="h-6 w-6 text-slate-400 group-hover:text-indigo-600" />
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Match Likelihood</p>
                        <span className="text-indigo-600 font-extrabold text-xl">{prog.matchScore}%</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg mb-2 group-hover:text-indigo-600 transition-colors leading-snug">{prog.title}</h3>
                    <p className="text-slate-500 text-sm mb-6 flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1.5 opacity-50" /> {prog.universityName}
                    </p>
                    
                    <div className="space-y-2 mb-6">
                      {prog.reasons.map((reason, ridx) => (ridx < 2 &&
                        <div key={ridx} className="flex items-center text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                          <SparklesIcon className="h-3 w-3 mr-2 text-indigo-400" />
                          {reason}
                        </div>
                      ))}
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">${prog.tuitionFeeUsd.toLocaleString()} <span className="font-normal text-slate-400 text-xs">/ year</span></span>
                      <button className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors">
                        Apply Now
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          </div>

          {/* RIGHT: Side Modules (4 cols) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* AI Study Plan Module */}
            {studyPlan && (
              <motion.section variants={itemVariants} className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-8 flex items-center">
                    <AdjustmentsHorizontalIcon className="h-6 w-6 mr-2 text-indigo-400" />
                    Study Strategy
                  </h3>
                  
                  <div className="space-y-8 relative">
                    <div className="absolute left-3 top-2 bottom-2 w-px bg-slate-800"></div>
                    {studyPlan.timeline.map((item, idx) => (
                      <div key={idx} className="relative pl-10">
                        <div className="absolute left-0 top-1 h-6 w-6 rounded-full bg-slate-800 border-4 border-slate-900 flex items-center justify-center transition-all group-hover:scale-125">
                          <div className={`h-1.5 w-1.5 rounded-full ${idx === 0 ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'}`}></div>
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{item.duration}</p>
                        <p className="font-bold text-slate-100 text-sm mb-1">{item.phase}</p>
                        <p className="text-slate-400 text-xs leading-relaxed">{item.goal}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                    <p className="text-xs font-bold text-indigo-400 uppercase mb-3">Expert Suggestion</p>
                    <p className="text-xs text-slate-300 italic">"{studyPlan.suggestions[0]}"</p>
                  </div>
                </div>
              </motion.section>
            )}

            {/* Application Tracker */}
            <motion.section variants={itemVariants} className="bg-white rounded-[2.5rem] p-8 border border-slate-200/60 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Track Progress</h3>
              <div className="space-y-6">
                {applications.length > 0 ? applications.map((app) => (
                  <div key={app._id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${
                        app.status === 'submitted' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                      }`}>
                        {app.status}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">{new Date(app.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 mb-1 line-clamp-1">{app.program.title}</h4>
                    <p className="text-xs text-slate-400 mb-4">{app.university.name}</p>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${app.status === 'submitted' ? 'w-1/2 bg-emerald-500' : 'w-1/4 bg-indigo-500'}`}
                      ></div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-10 px-6 border-2 border-dashed border-slate-200 rounded-3xl">
                    <p className="text-sm text-slate-400">No active applications yet.</p>
                  </div>
                )}
                
                <button className="w-full py-4 text-indigo-600 font-bold border-2 border-indigo-100 rounded-2xl hover:bg-indigo-50 transition-all text-sm">
                  Find More Programs
                </button>
              </div>
            </motion.section>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
