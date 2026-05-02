import { useState } from 'react';
import { db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';

const SeedFirestore = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const seedLicense = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'licenses', '123456789'), {
        code: '123456789',
        planName: 'Liftly PRO — Annual',
        gymName: 'Fitness Plus',
        expiresAt: new Date('2027-01-01T00:00:00Z'),
        pricePerYear: 550,
        features: [
          'App Liftly PRO — no ads',
          'Real-time gym occupancy',
          'Priority PT contact',
          'Digital membership management',
          'Gym challenges & leaderboard'
        ]
      });
      setSuccess('Test license 123456789 successfully seeded!');
    } catch (error) {
      console.error(error);
      setSuccess('Error seeding: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dev Utility: Seed Firestore</h1>
      <button 
        onClick={seedLicense} 
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        {loading ? 'Seeding...' : 'Seed Test License'}
      </button>
      {success && <p className="mt-4">{success}</p>}
    </div>
  );
};

export default SeedFirestore;
