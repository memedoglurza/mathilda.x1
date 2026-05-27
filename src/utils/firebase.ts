import { initializeApp } from 'firebase/app';
import { getAuth, signInWithRedirect, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  setDoc, 
  getDocFromServer,
  Timestamp 
} from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// @ts-ignore
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);

const provider = new GoogleAuthProvider();

// Firestore error handling schema
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection on startup
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or network status.");
    }
  }
}
testConnection();

// Sign in with Google (Google ile Giriş Yap)
export const googleSignIn = async (): Promise<User | null> => {
  try {
    await signInWithRedirect(auth, provider);
    return null;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

export const logoutGoogle = async () => {
  await auth.signOut();
};

/**
 * Uploads a base64 image to Firebase Storage and returns the public download URL.
 * If base64Data is already a remote URL or a gradient ID, returns it as is.
 */
export async function uploadImageToStorage(userId: string, itemId: string, base64Data: string): Promise<string> {
  if (!base64Data || !base64Data.startsWith('data:image')) {
    return base64Data;
  }
  try {
    const storageRef = ref(storage, `users/${userId}/images/${itemId}`);
    await uploadString(storageRef, base64Data, 'data_url');
    return await getDownloadURL(storageRef);
  } catch (err) {
    console.error('Error uploading image to Firebase Storage:', err);
    throw err;
  }
}

/**
 * Scans the user workspace data tree, uploads any local Base64 images to Storage,
 * and replaces public values to prepare for saving into Firestore.
 */
export async function uploadAllTreeImages(userId: string, data: any): Promise<any> {
  const result = JSON.parse(JSON.stringify(data)); // Deep copy

  if (result.profileImage && result.profileImage.startsWith('data:image')) {
    result.profileImage = await uploadImageToStorage(userId, 'profile', result.profileImage);
  }

  async function walk(itemsArray: any[]) {
    if (!itemsArray) return;
    for (const item of itemsArray) {
      if (item.image && item.image.startsWith('data:image')) {
        item.image = await uploadImageToStorage(userId, item.id, item.image);
      }
      if (item.items) {
        await walk(item.items);
      }
    }
  }

  if (result.items) {
    await walk(result.items);
  }

  return result;
}

/**
 * Persists the workspace document to Firestore.
 */
export async function saveWorkspaceToFirestore(userId: string, username: string, items: any[], rawProfileImage: string | null) {
  const path = `workspaces/${userId}`;
  try {
    // Process images recursively
    const processed = await uploadAllTreeImages(userId, {
      profileImage: rawProfileImage,
      items
    });

    await setDoc(doc(db, 'workspaces', userId), {
      userId,
      username,
      profileImage: processed.profileImage,
      items: processed.items,
      updatedAt: Timestamp.now()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}
