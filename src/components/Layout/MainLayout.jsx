import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Dumbbell, BarChart3, MessageCircle, User } from 'lucide-react';
import clsx from 'clsx';

const NAV_ITEMS = [
  { to: '/',        icon: Home,          label: 'Home',    end: true },
  { to: '/workout', icon: Dumbbell,      label: 'Workout', end: false },
  { to: '/chat',    icon: MessageCircle, label: 'Chat',    end: false },
  { to: '/stats',   icon: BarChart3,     label: 'Stats',   end: false },
  { to: '/profile', icon: User,          label: 'Profile', end: false },
];

const MainLayout = () => {
  return (
    <div className="flex justify-center bg-slate-200 min-h-screen">
      <div className="w-full max-w-[480px] bg-slate-50 min-h-screen relative shadow-2xl flex flex-col">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-[80px]">
          <Outlet />
        </main>

        {/* Bottom Navigation Bar */}
        <nav className="fixed bottom-0 w-full max-w-[480px] z-50">
          {/* Glass background */}
          <div className="glass border-t border-white/60 shadow-[0_-4px_24px_0_rgba(0,0,0,0.08)]">
            <div className="flex justify-around items-center h-[72px] px-2 safe-area-bottom">
              {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    clsx(
                      'flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 relative group',
                      isActive
                        ? 'text-liftly-teal'
                        : 'text-slate-400 hover:text-slate-600'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Active background pill */}
                      {isActive && (
                        <span className="absolute inset-0 rounded-2xl bg-liftly-teal/10 animate-scale-in" />
                      )}
                      <Icon
                        size={22}
                        strokeWidth={isActive ? 2.5 : 1.8}
                        className={clsx(
                          'transition-all duration-200 relative z-10',
                          isActive ? 'scale-110' : 'group-hover:scale-105'
                        )}
                      />
                      <span
                        className={clsx(
                          'text-[9px] font-bold uppercase tracking-wider mt-0.5 relative z-10 transition-all duration-200',
                          isActive ? 'text-liftly-teal' : 'text-slate-400'
                        )}
                      >
                        {label}
                      </span>
                      {/* Active dot indicator */}
                      {isActive && (
                        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-liftly-teal" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default MainLayout;
