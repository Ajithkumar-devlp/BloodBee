import {
  addDoc,
  collection,
  doc,
  getDocs,
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
}

export interface BloodRequestInput {
  patientName: string;
  bloodGroup: string;
  location: string;
  urgency: string;
  phone?: string;
  description?: string;
  requesterUserId?: string;
  requesterName?: string;
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
    }));

  if (donorMatches.length > 0) {
    const batch = writeBatch(db);

    donorMatches.forEach(match => {
      const notificationRef = doc(collection(db, 'notifications'));
      batch.set(notificationRef, {
        type: 'blood_match',
        requestId: requestRef.id,
        recipientUserId: match.donorId,
        requesterUserId: input.requesterUserId ?? null,
        requesterName: input.requesterName ?? input.patientName,
        patientName: input.patientName,
        bloodGroup: input.bloodGroup,
        donorBloodGroup: match.bloodGroup,
        urgency: input.urgency,
        location: input.location,
        phone: input.phone ?? '',
        description: input.description ?? '',
        isSOS: !!input.isSOS,
        status: 'unread',
        createdAt,
        readAt: null,
      });
    });

    batch.update(requestRef, {
      notifiedDonorCount: donorMatches.length,
      notifiedDonorIds: donorMatches.map(match => match.donorId),
    });

    await batch.commit();
  }

  return {
    requestId: requestRef.id,
    matches: donorMatches,
  };
}

export async function acceptBloodRequestMatch(requestId: string, donorUserId: string, donorName: string) {
  const requestRef = doc(db, 'blood_requests', requestId);
  const notificationsQuery = query(collection(db, 'notifications'), where('requestId', '==', requestId));
  const notificationsSnapshot = await getDocs(notificationsQuery);
  const acceptedAt = new Date().toISOString();
  const batch = writeBatch(db);

  batch.update(requestRef, {
    status: 'matched',
    acceptedDonorId: donorUserId,
    acceptedDonorName: donorName,
    acceptedAt,
  });

  notificationsSnapshot.forEach(notificationDoc => {
    const isAcceptedDonor = notificationDoc.data().recipientUserId === donorUserId;
    batch.update(notificationDoc.ref, {
      status: isAcceptedDonor ? 'accepted' : 'closed',
      readAt: acceptedAt,
    });
  });

  await batch.commit();
}

export async function markNotificationRead(notificationId: string) {
  await updateDoc(doc(db, 'notifications', notificationId), {
    status: 'read',
    readAt: new Date().toISOString(),
  });
}
