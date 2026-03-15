import { Outlet, NavLink } from 'react-router-dom';
import { Home, Dumbbell, BarChart3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import clsx from 'clsx';

const MainLayout = () => {
  const { currentUser, getUserData } = useAuth();
  const [photoURL, setPhotoURL] = useState('');
  const [initials, setInitials] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return;
      try {
        const data = await getUserData(currentUser.uid);
        setPhotoURL(data?.photoURL || currentUser.photoURL || '');
        setInitials((data?.firstName?.[0] || currentUser.email?.[0] || 'U').toUpperCase());
      } catch {
        setInitials((currentUser.email?.[0] || 'U').toUpperCase());
      }
    };
    load();
  }, [currentUser, getUserData]);

  return (
    <div className="flex justify-center bg-slate-100 min-h-screen">
      <div className="w-full max-w-[480px] bg-slate-50 min-h-screen relative shadow-2xl flex flex-col">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-20">
          <Outlet />
        </main>

        {/* Bottom Navigation Bar */}
        <nav className="fixed bottom-0 w-full max-w-[480px] bg-white/80 backdrop-blur-md border-t border-slate-200 flex justify-around items-center h-16 px-2 z-50">
          <NavItem to="/" icon={<Home size={24} />} label="Home" />
          <NavItem to="/workout" icon={<Dumbbell size={24} />} label="Workout" />
          <NavItem to="/stats" icon={<BarChart3 size={24} />} label="Stats" />
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              clsx(
                "flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all duration-200",
                isActive ? "text-liftly-teal font-semibold" : "text-slate-400 hover:text-slate-600"
              )
            }
          >
            {({ isActive }) => (
              <>
                {photoURL ? (
                  <img src={photoURL} alt="Profile" className={clsx("w-7 h-7 rounded-full object-cover transition-all", isActive ? "ring-2 ring-liftly-teal" : "ring-1 ring-slate-200")} referrerPolicy="no-referrer" />
                ) : (
                  <div className={clsx("w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all", isActive ? "bg-liftly-teal text-white" : "bg-slate-200 text-slate-500")}>
                    {initials}
                  </div>
                )}
                <span className="text-[10px] mt-1">Profile</span>
              </>
            )}
          </NavLink>
        </nav>
      </div>
    </div>
  );
};

const NavItem = ({ to, icon, label }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          "flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all duration-200",
          isActive ? "text-liftly-teal font-semibold" : "text-slate-400 hover:text-slate-600"
        )
      }
    >
      {icon}
      <span className="text-[10px] mt-1">{label}</span>
    </NavLink>
  );
};

export default MainLayout;
