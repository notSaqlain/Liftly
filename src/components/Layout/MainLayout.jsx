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
                      {/* Top glow on active */}
                      {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-liftly-teal rounded-b-full shadow-[0_0_8px_0_rgba(0,173,181,0.8)]" />}

                      {/* Active background pill */}
                      {isActive && (
                        <span className="absolute inset-x-2 inset-y-1.5 rounded-xl bg-liftly-teal/10 animate-scale-in" />
                      )}
                      
                      <div className="relative">
                        <Icon
                          size={22}
                          strokeWidth={isActive ? 2.5 : 1.8}
                          className={clsx(
                            'transition-all duration-300 relative z-10',
                            isActive ? 'scale-110 text-liftly-teal' : 'group-hover:scale-105'
                          )}
                        />
                        {/* Example: Unread Chat badge (could be hooked to context) */}
                        {label === 'Chat' && !isActive && (
                          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                        )}
                      </div>

                      <span
                        className={clsx(
                          'text-[9px] font-black uppercase tracking-wider mt-1 relative z-10 transition-all duration-300',
                          isActive ? 'text-liftly-teal' : 'text-slate-400'
                        )}
                      >
                        {label}
                      </span>
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
