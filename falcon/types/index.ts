/**
 * Shared TypeScript interfaces and types for the
 * Falcon Accessories Job Card Management System.
 */

// ---------------------------------------------------------------------------
// Primitive union types
// ---------------------------------------------------------------------------

/** The two supported user roles in the system. */
export type Role = 'admin' | 'employee';

/** The three possible states a job card can be in. */
export type JobCardStatus = 'Pending' | 'In Progress' | 'Completed';

/** The four accessory categories. */
export type AccessoryCategory =
  | 'Safety & Security'
  | 'Essential'
  | 'Entertainment'
  | 'Ambience';

// ---------------------------------------------------------------------------
// Firestore Timestamp shim
// Avoids a hard dependency on the Firebase SDK in pure type files.
// Replace with `import { Timestamp } from 'firebase/firestore'` where needed.
// ---------------------------------------------------------------------------
export interface Timestamp {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
}

// ---------------------------------------------------------------------------
// Firebase User shim
// Avoids a hard dependency on the Firebase Auth SDK in pure type files.
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FirebaseUser = any;

// ---------------------------------------------------------------------------
// Domain interfaces
// ---------------------------------------------------------------------------

/**
 * Firestore document: `users/{uid}`
 * Stores the authenticated user's profile and role.
 */
export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Timestamp;
}

/**
 * A single accessory item that has been selected on a job card.
 * Stored as an array inside the `jobCards/{id}` document.
 */
export interface SelectedAccessory {
  /** Stable identifier, e.g. "dash-camera" */
  id: string;
  name: string;
  category: AccessoryCategory;
  /** Null when the accessory has no variants. */
  variant: string | null;
  notes: string;
  quantity: number;
  price: number;
}

/**
 * Firestore document: `jobCards/{jobCardId}`
 */
export interface JobCard {
  id: string;
  customerName: string;
  phoneNumber: string;
  vehicleName: string;
  vehicleNumber: string;
  date: Timestamp;
  deliveryDate: Timestamp | null;
  employeeName: string;
  notes: string;
  status: JobCardStatus;
  accessories: SelectedAccessory[];
  totalAmount: number;
  /** UID of the user who created this job card. */
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Static definition of an accessory item used to build the catalog UI.
 * An empty `variants` array means the accessory has no variant options.
 */
export interface AccessoryDefinition {
  /** Stable kebab-case identifier, e.g. "seat-cover" */
  id: string;
  name: string;
  /** Predefined variant labels; empty when not applicable. */
  variants: string[];
}

// ---------------------------------------------------------------------------
// Context / provider interfaces
// ---------------------------------------------------------------------------

/**
 * Value exposed by `AuthContext` to the rest of the application.
 */
export interface AuthContextValue {
  /** The currently authenticated Firebase user, or null when logged out. */
  user: FirebaseUser | null;
  /** The role fetched from Firestore, or null while loading / logged out. */
  role: Role | null;
  /** True while the auth state or role is being resolved. */
  loading: boolean;
  /** Signs the user out of Firebase Auth and clears local state. */
  logout: () => Promise<void>;
}
