import { Outlet, NavLink } from 'react-router-dom';
import { Home, Dumbbell, BarChart3, User } from 'lucide-react';
import clsx from 'clsx';

const MainLayout = () => {
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
          <NavItem to="/profile" icon={<User size={24} />} label="Profile" />
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
