import { verifyFirebaseToken } from './verifyFirebaseToken.js';

// Export verifyFirebaseToken as authenticateToken for backward compatibility
export const authenticateToken = verifyFirebaseToken; 