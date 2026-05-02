import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/Layout/MainLayout';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Workout from './pages/Workout';
import AccountSettings from './pages/AccountSettings';
import PersonalInfo from './pages/PersonalInfo';
import Stats from './pages/Stats';
import Onboarding from './pages/auth/Onboarding';
import BmiCalculator from './pages/tools/BmiCalculator';
import CalorieGoals from './pages/tools/CalorieGoals';
import WeightTracker from './pages/tools/WeightTracker';
import ActiveWorkout from './pages/ActiveWorkout';
import GroupChat from './pages/GroupChat';
import Leaderboard from './pages/Leaderboard';

// B2B Pages
import GymEquipment from './pages/GymEquipment';
import TrainerHub from './pages/TrainerHub';
import GymChallenges from './pages/GymChallenges';
import GymSupport from './pages/GymSupport';
import MyPlan from './pages/MyPlan';
import ChatHub from './pages/ChatHub';
import UserSearch from './pages/UserSearch';
import DMConversation from './pages/DMConversation';
import SeedFirestore from './pages/tools/SeedFirestore';

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
            <Route path="/stats" element={<Stats />} />
            <Route path="/chat" element={<ChatHub />} />
            <Route path="/chat/group/:mode" element={<GroupChat />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/profile" element={<Profile />} />
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
            <Route path="/dev/seed" element={<SeedFirestore />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
