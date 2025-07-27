import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin SDK
const initializeFirebaseAdmin = () => {
  try {
    // Check if Firebase Admin is already initialized
    if (admin.apps.length > 0) {
      return admin.apps[0];
    }

    let serviceAccount;

    // Method 1: Use service account JSON from environment variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    }
    // Method 2: Use service account file path
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const serviceAccountPath = join(__dirname, '..', process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      serviceAccount = serviceAccountPath;
    }
    // Method 3: Use default credentials (for production with Google Cloud)
    else {
      // This will use Google Cloud default credentials
      // Useful when deployed to Google Cloud Platform
      return admin.initializeApp({
        projectId: 'supplylink-671f6'
      });
    }

    // Initialize the app with service account
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'supplylink-671f6'
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    return app;
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error);
    throw error;
  }
};

// Initialize Firebase Admin
const app = initializeFirebaseAdmin();

// Export Firebase Admin services
export const auth = admin.auth(app);
export const firestore = admin.firestore(app);

export default admin; 