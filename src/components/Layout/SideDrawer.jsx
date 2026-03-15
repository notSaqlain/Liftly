import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { X, UserCircle, Settings, LogOut, Activity, Scale, Calculator, Utensils } from 'lucide-react';
import clsx from 'clsx';

const SideDrawer = ({ isOpen, onClose }) => {
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName = userData?.firstName || currentUser?.displayName?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'Lifter';
  const photoURL = userData?.photoURL || currentUser?.photoURL || null;

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      onClose();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
      setIsLoggingOut(false);
    }
  };

  // Prevent scrolling on body when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div 
        className={clsx(
          "fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div 
        className={clsx(
          "fixed top-0 right-0 h-full w-[85%] max-w-[320px] bg-slate-50 z-[70] shadow-2xl flex flex-col transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200/60 bg-white">
          <div className="flex items-center gap-3">
             {photoURL ? (
                <img src={photoURL} alt="Profile" className="w-12 h-12 rounded-full object-cover ring-2 ring-liftly-teal/30 shrink-0" referrerPolicy="no-referrer" />
             ) : (
                <div className="w-12 h-12 rounded-full bg-liftly-navy flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {displayName.charAt(0).toUpperCase()}
                </div>
             )}
             <div>
               <h2 className="font-bold text-slate-800 tracking-tight">{displayName}</h2>
               <NavLink to="/profile" onClick={onClose} className="text-xs text-liftly-teal font-semibold">View Profile</NavLink>
             </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 text-slate-500 hover:text-slate-800 rounded-full active:scale-95 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Tools Section */}
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Body & Tools</h3>
            <div className="space-y-2">
               <MenuLink to="/tools/weight" icon={<Scale size={20} className="text-blue-500" />} label="Weight Tracker" onClick={onClose} />
               <MenuLink to="/tools/bmi" icon={<Activity size={20} className="text-emerald-500" />} label="BMI Calculator" onClick={onClose} />
               <MenuLink to="/tools/calories" icon={<Utensils size={20} className="text-orange-500" />} label="Caloric Goals" onClick={onClose} />
            </div>
          </div>

          {/* Account Section */}
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Account</h3>
            <div className="space-y-2">
               <MenuLink to="/personal-info" icon={<UserCircle size={20} className="text-indigo-500" />} label="Personal Information" onClick={onClose} />
               <MenuLink to="/settings" icon={<Settings size={20} className="text-slate-500" />} label="Account Settings" onClick={onClose} />
            </div>
          </div>

        </div>

        <div className="p-6 border-t border-slate-200/60 bg-white">
           <button 
             onClick={handleLogout} 
             disabled={isLoggingOut}
             className="w-full h-12 flex items-center justify-center gap-2 text-red-500 font-bold bg-red-50 hover:bg-red-100 rounded-xl transition-colors active:scale-95"
           >
             <LogOut size={20} />
             <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
           </button>
        </div>
      </div>
    </>
  );
};

const MenuLink = ({ to, icon, label, onClick }) => (
  <NavLink 
    to={to} 
    onClick={onClick}
    className={({ isActive }) => clsx(
      "flex items-center gap-4 p-3 rounded-xl transition-all active:scale-95",
      isActive ? "bg-white shadow-sm border border-slate-100 text-liftly-navy" : "hover:bg-slate-100 text-slate-600 border border-transparent"
    )}
  >
    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-slate-100 shrink-0">
      {icon}
    </div>
    <span className="font-semibold text-sm">{label}</span>
  </NavLink>
);

export default SideDrawer;
