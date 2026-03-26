import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "bloodbee-ajith-7",
  appId: "1:36851051747:web:53c19222bf4d46cc94e9d6",
  storageBucket: "bloodbee-ajith-7.firebasestorage.app",
  apiKey: "AIzaSyC_EEVeVwwjOxHCUxTVt5q8GhBGvxhSvtA",
  authDomain: "bloodbee-ajith-7.firebaseapp.com",
  messagingSenderId: "36851051747"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const cities = [
  'Apollo Hospital', 'City Hospital', 'Metro City', 
  'Chennai, TN', 'Mumbai, MH', 'Bangalore, KA', 
  'New York, NY', 'General Hospital'
];
const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'Ravi', 'Priya', 'Arjun', 'Sneha'];
const lastNames = ['Smith', 'Johnson', 'Garfield', 'Brown', 'Jones', 'Kumar', 'Sharma', 'Patel', 'Reddy', 'Singh'];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
  console.log("Creating 20 mock donors...");
  
  let promises = [];
  for (let i = 0; i < 20; i++) {
    const userId = `mock_donor_${Date.now()}_${i}`;
    const userDoc = doc(db, 'users', userId);
    
    // Inject realistic donor profile
    promises.push(setDoc(userDoc, {
      name: `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`,
      email: `mockdonor${i}@example.com`,
      bloodGroup: getRandomItem(bloodGroups),
      location: getRandomItem(cities),
      phone: `+1-555-01${String(i).padStart(2, '0')}`,
      isDonor: true,
      donationCount: Math.floor(Math.random() * 8), // random 0-7 donations
      receivedCount: 0,
      createdAt: new Date().toISOString()
    }));
  }
  
  await Promise.all(promises);
  console.log("Done! Injected 20 mock donors into Firestore.");
  process.exit(0);
}

seed().catch(err => {
  console.error("Failed to seed database:", err);
  process.exit(1);
});
