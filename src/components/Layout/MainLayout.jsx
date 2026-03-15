import { Outlet, NavLink } from 'react-router-dom';
import { Home, Dumbbell, BarChart3, Menu } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import SideDrawer from './SideDrawer';

const MainLayout = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all duration-200 text-slate-400 hover:text-slate-600 focus:outline-none"
          >
            <Menu size={24} className={clsx("transition-all", isDrawerOpen ? "text-liftly-teal" : "")} />
            <span className={clsx("text-[10px] mt-1", isDrawerOpen ? "text-liftly-teal font-semibold" : "text-slate-400")}>Menu</span>
          </button>
        </nav>
        
        <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
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
