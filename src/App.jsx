import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<AccountSettings />} />
            <Route path="/personal-info" element={<PersonalInfo />} />
            
            {/* Tools */}
            <Route path="/tools/bmi" element={<BmiCalculator />} />
            <Route path="/tools/calories" element={<CalorieGoals />} />
            <Route path="/tools/weight" element={<WeightTracker />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
