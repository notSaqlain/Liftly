import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/Layout/MainLayout';

// Lazy load Pages
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Workout = lazy(() => import('./pages/Workout'));
const ExerciseDetail = lazy(() => import('./pages/ExerciseDetail'));
const AccountSettings = lazy(() => import('./pages/AccountSettings'));
const PersonalInfo = lazy(() => import('./pages/PersonalInfo'));
const Stats = lazy(() => import('./pages/Stats'));
const Onboarding = lazy(() => import('./pages/auth/Onboarding'));
const BmiCalculator = lazy(() => import('./pages/tools/BmiCalculator'));
const CalorieGoals = lazy(() => import('./pages/tools/CalorieGoals'));
const WeightTracker = lazy(() => import('./pages/tools/WeightTracker'));
const ActiveWorkout = lazy(() => import('./pages/ActiveWorkout'));
const GroupChat = lazy(() => import('./pages/GroupChat'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));

// Lazy load B2B Pages
const GymEquipment = lazy(() => import('./pages/GymEquipment'));
const TrainerHub = lazy(() => import('./pages/TrainerHub'));
const GymChallenges = lazy(() => import('./pages/GymChallenges'));
const GymSupport = lazy(() => import('./pages/GymSupport'));
const MyPlan = lazy(() => import('./pages/MyPlan'));
const ChatHub = lazy(() => import('./pages/ChatHub'));
const UserSearch = lazy(() => import('./pages/UserSearch'));
const DMConversation = lazy(() => import('./pages/DMConversation'));
const PublicProfile = lazy(() => import('./pages/PublicProfile'));
const FriendsList = lazy(() => import('./pages/FriendsList'));
const Notifications = lazy(() => import('./pages/Notifications'));

// Suspense Fallback Loader
const PageLoader = () => (
  <div className="flex justify-center min-h-screen" style={{ background: 'linear-gradient(160deg, #001540 0%, #001c5e 60%, #002280 100%)' }}>
    <div className="w-full max-w-[480px] min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-liftly-teal/15 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none" />
      <div className="relative flex flex-col items-center gap-5 z-10">
        <div className="relative">
          <div className="absolute inset-0 rounded-3xl bg-liftly-teal/20 blur-xl scale-125" />
          <div className="relative w-16 h-16 rounded-3xl bg-liftly-teal/10 border border-liftly-teal/20 flex items-center justify-center">
            <img src="/favicon.png" alt="Liftly" className="w-10 h-10 object-contain opacity-50" />
          </div>
          <div className="absolute inset-0 rounded-3xl border-2 border-transparent border-t-liftly-teal animate-spin" style={{ animationDuration: '1s' }} />
        </div>
      </div>
    </div>
  </div>
);

// 404
const NotFound = () => (
  <div className="flex justify-center bg-slate-100 min-h-screen">
    <div className="w-full max-w-[480px] bg-liftly-navy min-h-screen flex flex-col items-center justify-center text-white p-8">
      <div className="text-8xl font-black text-liftly-teal mb-4">404</div>
      <h1 className="text-2xl font-bold mb-2">Page not found</h1>
      <p className="text-slate-400 text-sm text-center mb-8">The page you're looking for doesn't exist.</p>
      <a href="/" className="px-6 py-3 bg-liftly-teal text-white font-bold rounded-2xl active:scale-95 transition-all">
        Go Home
      </a>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes (Require Authentication) */}
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/active-workout" element={<ProtectedRoute><ActiveWorkout /></ProtectedRoute>} />

            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/workout" element={<Workout />} />
              <Route path="/workout/exercise/:id" element={<ExerciseDetail />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/chat" element={<ChatHub />} />
              <Route path="/chat/group/:mode" element={<GroupChat />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:uid" element={<PublicProfile />} />
              <Route path="/friends" element={<FriendsList />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<AccountSettings />} />
              <Route path="/personal-info" element={<PersonalInfo />} />

              {/* Tools */}
              <Route path="/tools/bmi" element={<BmiCalculator />} />
              <Route path="/tools/calories" element={<CalorieGoals />} />
              <Route path="/tools/weight" element={<WeightTracker />} />

              {/* B2B Pages */}
              <Route path="/gym/equipment" element={<GymEquipment />} />
              <Route path="/gym/trainers" element={<TrainerHub />} />
              <Route path="/gym/challenges" element={<GymChallenges />} />
              <Route path="/gym/support" element={<GymSupport />} />
              <Route path="/my-plan" element={<MyPlan />} />
              <Route path="/messages/search" element={<UserSearch />} />
              <Route path="/messages/:conversationId" element={<DMConversation />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
