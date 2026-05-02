import { Outlet, NavLink } from 'react-router-dom';
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
    <div className="flex justify-center min-h-screen" style={{ background: '#040810' }}>
      <div className="w-full max-w-[480px] min-h-screen relative shadow-2xl flex flex-col" style={{ background: '#070B14' }}>
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-[80px] no-scrollbar">
          <Outlet />
        </main>

        {/* Bottom Navigation Bar */}
        <nav className="fixed bottom-0 w-full max-w-[480px] z-50">
          <div
            className="border-t"
            style={{
              background: 'rgba(7, 11, 20, 0.95)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex justify-around items-center h-[72px] px-2 safe-area-bottom">
              {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    clsx(
                      'flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 relative group',
                      isActive ? 'text-brand' : 'text-white/30 hover:text-white/60'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Active pill */}
                      {isActive && (
                        <span
                          className="absolute inset-x-1 inset-y-1.5 rounded-xl animate-scale-in"
                          style={{ background: 'rgba(0,229,209,0.1)' }}
                        />
                      )}

                      {/* Active top accent line */}
                      {isActive && (
                        <div
                          className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-b-full"
                          style={{ background: '#00E5D1', boxShadow: '0 0 8px rgba(0,229,209,0.8)' }}
                        />
                      )}

                      <div className="relative">
                        <Icon
                          size={22}
                          strokeWidth={isActive ? 2.5 : 1.8}
                          className={clsx(
                            'transition-all duration-300 relative z-10',
                            isActive ? 'scale-110' : 'group-hover:scale-105'
                          )}
                        />
                      </div>

                      <span
                        className={clsx(
                          'text-[9px] font-black uppercase tracking-wider mt-1 relative z-10 transition-all duration-300',
                          isActive ? 'text-brand' : 'text-white/30'
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
