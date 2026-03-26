import {
  addDoc,
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';

export const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] as const;

export type BloodGroup = typeof BLOOD_GROUPS[number];

export interface DonorProfile {
  id: string;
  name: string;
  bloodGroup: string;
  isDonor: boolean;
  location?: string;
  reliabilityScore?: number;
  donationCount?: number;
  phone?: string;
  email?: string;
}

export interface BloodRequestInput {
  patientName: string;
  bloodGroup: string;
  location: string;
  urgency: string;
  phone?: string;
  description?: string;
  requesterUserId?: string | null;
  requesterName?: string | null;
  isSOS?: boolean;
}

export interface MatchResult {
  donorId: string;
  donorName: string;
  bloodGroup: string;
  location: string;
  reliabilityScore: number;
  donationCount: number;
}

const RECIPIENT_COMPATIBILITY: Record<string, string[]> = {
  'O-': ['O-'],
  'O+': ['O+', 'O-'],
  'A-': ['A-', 'O-'],
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
};

function normalize(value?: string) {
  return value?.trim().toLowerCase() ?? '';
}

function locationScore(requestLocation: string, donorLocation?: string) {
  const requestValue = normalize(requestLocation);
  const donorValue = normalize(donorLocation);

  if (!requestValue || !donorValue) return 0;
  if (requestValue === donorValue) return 3;
  if (requestValue.includes(donorValue) || donorValue.includes(requestValue)) return 2;

  const requestWords = requestValue.split(/[\s,.-]+/).filter(Boolean);
  const donorWords = new Set(donorValue.split(/[\s,.-]+/).filter(Boolean));
  const overlap = requestWords.filter(word => donorWords.has(word)).length;
  return overlap > 0 ? 1 : 0;
}

export function getCompatibleDonorGroups(recipientBloodGroup: string) {
  return RECIPIENT_COMPATIBILITY[recipientBloodGroup] ?? [];
}

export async function createBloodRequestWithMatches(input: BloodRequestInput) {
  return Promise.race([
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout: Firebase matchmaking took too long (connection issue).")), 15000)),
    (async () => {
      const createdAt = new Date().toISOString();
      const compatibleGroups = getCompatibleDonorGroups(input.bloodGroup);

      const requestRef = await addDoc(collection(db, 'blood_requests'), {
        ...input,
        compatibleGroups,
        createdAt,
        status: 'pending',
        notifiedDonorCount: 0,
        acceptedDonorId: null,
        acceptedDonorName: null,
        acceptedAt: null,
      });

      const usersSnapshot = await getDocs(collection(db, 'users'));
      const donorMatches: MatchResult[] = usersSnapshot.docs
        .map(userDoc => ({ id: userDoc.id, ...userDoc.data() } as DonorProfile))
        .filter(profile =>
          profile.isDonor &&
          compatibleGroups.includes(profile.bloodGroup) &&
          profile.id !== input.requesterUserId
        )
        .sort((a, b) => {
          const locationDelta = locationScore(input.location, b.location) - locationScore(input.location, a.location);
          if (locationDelta !== 0) return locationDelta;

          const reliabilityDelta = (b.reliabilityScore ?? 0) - (a.reliabilityScore ?? 0);
          if (reliabilityDelta !== 0) return reliabilityDelta;

          return (b.donationCount ?? 0) - (a.donationCount ?? 0);
        })
        .slice(0, 5)
        .map(profile => ({
          donorId: profile.id,
          donorName: profile.name || 'Available Donor',
          bloodGroup: profile.bloodGroup,
          location: profile.location || 'Nearby',
          reliabilityScore: profile.reliabilityScore ?? 0,
          donationCount: profile.donationCount ?? 0,
          donorPhone: profile.phone || '',
          donorEmail: profile.email || '',
        }));

      if (donorMatches.length > 0) {
        // We no longer automatically dispatch notifications here!
        // The user will do it manually in the UI step 3.
        const batch = writeBatch(db);
        batch.update(requestRef, {
          notifiedDonorCount: 0,
          notifiedDonorIds: [], // Initially empty, populated as user sends manual requests
        });
        await batch.commit();
      }

      return {
        requestId: requestRef.id,
        matches: donorMatches,
      };
    })()
  ]);
}

export async function acceptBloodRequestMatch(requestId: string, donorUserId: string, donorName: string) {
  const requestRef = doc(db, 'blood_requests', requestId);
  const notificationsQuery = query(collection(db, 'notifications'), where('requestId', '==', requestId));
  const notificationsSnapshot = await getDocs(notificationsQuery);
  const acceptedAt = new Date().toISOString();
  const batch = writeBatch(db);

  // Fetch donor's full profile for contact details
  const donorDoc = await getDoc(doc(db, 'users', donorUserId));
  const donorProfile = donorDoc.exists() ? donorDoc.data() : {};
  const donorPhone = donorProfile.phone || '';
  const donorEmail = donorProfile.email || '';
  const donorBloodGroup = donorProfile.bloodGroup || '';
  const donorLocation = donorProfile.location || '';

  // Update the blood request with donor details (visible to receiver)
  batch.update(requestRef, {
    status: 'matched',
    acceptedDonorId: donorUserId,
    acceptedDonorName: donorName,
    acceptedDonorPhone: donorPhone,
    acceptedDonorEmail: donorEmail,
    acceptedDonorBloodGroup: donorBloodGroup,
    acceptedDonorLocation: donorLocation,
    acceptedAt,
  });

  // Figure out who the original requester is from existing notifications
  let requesterUserId: string | null = null;
  let patientName = '';
  let bloodGroup = '';
  let location = '';
  let receiverPhone = '';
  let urgency = '';

  notificationsSnapshot.forEach(notificationDoc => {
    const data = notificationDoc.data();
    const isAcceptedDonor = data.recipientUserId === donorUserId;
    batch.update(notificationDoc.ref, {
      status: isAcceptedDonor ? 'accepted' : 'closed',
      readAt: acceptedAt,
      // Store donor details on accepted notification (donor sees their own accepted card)
      ...(isAcceptedDonor ? {
        acceptedDonorName: donorName,
        acceptedDonorPhone: donorPhone,
        acceptedDonorEmail: donorEmail,
        acceptedDonorBloodGroup: donorBloodGroup,
        acceptedDonorLocation: donorLocation,
      } : {}),
    });
    if (isAcceptedDonor) {
      requesterUserId = data.requesterUserId;
      patientName = data.patientName;
      bloodGroup = data.bloodGroup;
      location = data.location;
      receiverPhone = data.receiverPhone || '';
      urgency = data.urgency;
    }
  });

  // Write acceptance notification to the RECEIVER so they get alerted with donor details
  if (requesterUserId) {
    const receiverNotifRef = doc(collection(db, 'notifications'));
    batch.set(receiverNotifRef, {
      type: 'donor_accepted',
      requestId,
      recipientUserId: requesterUserId,
      donorUserId,
      donorName,
      donorPhone,
      donorEmail,
      donorBloodGroup,
      donorLocation,
      patientName,
      bloodGroup,
      location,
      receiverPhone, // echo back so receiver sees request phone
      urgency,
      status: 'unread',
      createdAt: acceptedAt,
      readAt: null,
    });
  }

  await batch.commit();
}

export async function markNotificationRead(notificationId: string) {
  await updateDoc(doc(db, 'notifications', notificationId), {
    status: 'read',
    readAt: new Date().toISOString(),
  });
}

/**
 * Called when a donor physically completes a blood donation.
 * - Marks the blood_request as 'completed'
 * - Increments donationCount on the donor's user profile
 * - Recalculates reliabilityScore (max 100)
 * - Sets lastDonationDate
 * - Writes a 'donation_completed' notification to the receiver
 */
export async function markDonationCompleted(
  requestId: string,
  donorUserId: string,
  requesterUserId: string | null,
) {
  const completedAt = new Date().toISOString();
  const batch = writeBatch(db);

  // 1. Mark the blood request as completed
  const requestRef = doc(db, 'blood_requests', requestId);
  const reqSnap = await getDoc(requestRef);
  const reqData = reqSnap.exists() ? reqSnap.data() : null;
  const actualRequesterId = requesterUserId || reqData?.requesterUserId;

  batch.update(requestRef, {
    status: 'completed',
    completedAt,
  });

  // 2. Update the accepted notification to 'completed'
  const notifQuery = query(
    collection(db, 'notifications'),
    where('requestId', '==', requestId),
    where('recipientUserId', '==', donorUserId),
  );
  const notifSnap = await getDocs(notifQuery);
  notifSnap.forEach(n => {
    batch.update(n.ref, { status: 'completed', completedAt });
  });

  // 3. Update donor profile: increment donationCount, update reliabilityScore & lastDonationDate
  const donorRef = doc(db, 'users', donorUserId);
  const donorSnap = await getDoc(donorRef);
  const donorData = donorSnap.exists() ? donorSnap.data() : {};
  const prevCount = (donorData.donationCount ?? 0) as number;
  const prevScore = (donorData.reliabilityScore ?? 80) as number;
  const newCount = prevCount + 1;
  // Reliability grows by 2 per donation, capped at 100
  const newScore = Math.min(100, prevScore + 2);

  batch.update(donorRef, {
    donationCount: newCount,
    reliabilityScore: newScore,
    lastDonationDate: completedAt,
  });

  // 4. Update the receiver profile: increment receivedCount
  if (actualRequesterId) {
    const receiverRef = doc(db, 'users', actualRequesterId);
    const receiverSnap = await getDoc(receiverRef);
    if (receiverSnap.exists()) {
      const receiverData = receiverSnap.data();
      const prevReceivedCount = (receiverData.receivedCount ?? 0) as number;
      batch.update(receiverRef, {
        receivedCount: prevReceivedCount + 1,
      });
    }

    // 5. Notify the receiver that the donation is done
    const completionNotifRef = doc(collection(db, 'notifications'));
    batch.set(completionNotifRef, {
      type: 'donation_completed',
      requestId,
      recipientUserId: actualRequesterId,
      donorUserId,
      donorName: donorData.name || 'Your Donor',
      donorBloodGroup: donorData.bloodGroup || '',
      message: 'Your blood request has been fulfilled. The donor has completed the donation.',
      status: 'unread',
      createdAt: completedAt,
      readAt: null,
    });
  }

  await batch.commit();
}

