import { useState } from 'react';
import { db } from '../../firebase';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

const SeedFirestore = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const seedLicense = async () => {
    setLoading(true);
    setSuccess('');
    try {
      // 1. Seed License
      await setDoc(doc(db, 'licenses', '12345678'), {
        code: '12345678',
        planName: 'Liftly PRO — Palestre Italiane',
        gymId: 'gym_palestre_italiane',
        gymName: 'Palestre Italiane',
        expiresAt: new Date('2028-01-01T00:00:00Z'),
        pricePerYear: 550,
        features: [
          'App Liftly PRO — no ads',
          'Real-time gym occupancy',
          'Priority PT contact',
          'Digital membership management',
          'Gym challenges & leaderboard'
        ]
      });

      // 2. Seed Trainers
      const trainersRef = collection(db, 'gyms', 'gym_palestre_italiane', 'trainers');
      await addDoc(trainersRef, {
        name: 'Marco Rossi',
        specialties: ['Powerlifting', 'Strength Training'],
        bio: 'Professional powerlifter with 10 years of experience. Let\'s get strong!',
        photoURL: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=150&q=80',
        rating: 4.9,
        available: true
      });
      await addDoc(trainersRef, {
        name: 'Giulia Bianchi',
        specialties: ['HIIT', 'Weight Loss', 'Mobility'],
        bio: 'Passionate about functional fitness and helping you reach your best shape.',
        photoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
        rating: 4.8,
        available: true
      });

      // 3. Seed Equipment
      const equipmentRef = collection(db, 'gyms', 'gym_palestre_italiane', 'equipment');
      await addDoc(equipmentRef, {
        name: 'Squat Rack 1',
        category: 'Strength',
        status: 'working',
        lastMaintenance: new Date('2026-04-15').toISOString(),
        reports: 0
      });
      await addDoc(equipmentRef, {
        name: 'Leg Extension Machine',
        category: 'Machines',
        status: 'broken',
        lastMaintenance: new Date('2026-01-10').toISOString(),
        reports: 3,
        reportedIssue: 'Cable snapped'
      });
      await addDoc(equipmentRef, {
        name: 'Treadmill 4',
        category: 'Cardio',
        status: 'maintenance',
        lastMaintenance: new Date('2026-05-01').toISOString(),
        reports: 1,
        reportedIssue: 'Belt slipping'
      });

      // 4. Seed Challenges
      const challengesRef = collection(db, 'gym_challenges', 'gym_palestre_italiane', 'challenges');
      await addDoc(challengesRef, {
        title: 'May PR Breaker',
        description: 'Hit a new 1RM on Squat, Bench, or Deadlift this month!',
        type: 'Personal Record',
        endDate: new Date('2026-05-31T23:59:59Z'),
        participantsCount: 42,
        isActive: true,
        reward: 'Free Protein Shake'
      });
      await addDoc(challengesRef, {
        title: '10k Volume Club',
        description: 'Lift a total of 10,000kg in a single week.',
        type: 'Volume',
        endDate: new Date('2026-05-07T23:59:59Z'),
        participantsCount: 15,
        isActive: true,
        reward: 'Gym T-Shirt'
      });

      setSuccess('Test license 12345678 and Palestre Italiane data successfully seeded!');
    } catch (error) {
      console.error(error);
      setSuccess('Error seeding: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-[#040810] min-h-screen text-white font-sans">
      <h1 className="text-2xl font-black mb-4">Dev Utility: Seed Firestore</h1>
      <p className="text-white/60 mb-6 max-w-md">
        This will seed the <code className="bg-white/10 px-1 py-0.5 rounded text-liftly-teal">12345678</code> license for <strong className="text-white">Palestre Italiane</strong>, along with mock trainers, equipment, and challenges.
      </p>
      
      <button 
        onClick={seedLicense} 
        disabled={loading}
        className="px-6 py-3 bg-liftly-teal text-liftly-navy font-black rounded-2xl active:scale-95 transition-all"
      >
        {loading ? 'Seeding...' : 'Seed Data'}
      </button>

      {success && (
        <div className={`mt-6 p-4 rounded-xl text-sm font-bold max-w-md ${
          success.includes('Error') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
        }`}>
          {success}
        </div>
      )}
    </div>
  );
};

export default SeedFirestore;
