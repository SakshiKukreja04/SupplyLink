import { auth } from '../config/firebaseAdmin.js';

/**
 * Middleware to verify Firebase authentication token
 * Extracts the token from Authorization header and verifies it with Firebase Admin SDK
 */
export const verifyFirebaseToken = async (req, res, next) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header is required',
        error: 'MISSING_AUTH_HEADER'
      });
    }

    // Check if the header starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header must start with Bearer',
        error: 'INVALID_AUTH_FORMAT'
      });
    }

    // Extract the token (remove 'Bearer ' prefix)
    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token is required',
        error: 'MISSING_TOKEN'
      });
    }

    try {
      // Verify the token with Firebase Admin SDK
      const decodedToken = await auth.verifyIdToken(token);
      
      // Add the decoded user information to the request object
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        name: decodedToken.name,
        picture: decodedToken.picture,
        // Add any other claims you want to extract
        role: decodedToken.role || 'user', // Custom claim if you set it
        provider: decodedToken.firebase?.sign_in_provider || 'unknown'
      };

      // Log successful authentication (optional, for debugging)
      console.log(`✅ Authenticated user: ${req.user.email} (${req.user.uid})`);

      next();
    } catch (firebaseError) {
      console.error('❌ Firebase token verification failed:', firebaseError.message);
      
      // Handle specific Firebase Auth errors
      if (firebaseError.code === 'auth/id-token-expired') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired',
          error: 'TOKEN_EXPIRED'
        });
      }
      
      if (firebaseError.code === 'auth/id-token-revoked') {
        return res.status(401).json({
          success: false,
          message: 'Token has been revoked',
          error: 'TOKEN_REVOKED'
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: 'INVALID_TOKEN'
      });
    }
  } catch (error) {
    console.error('❌ Error in verifyFirebaseToken middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during token verification',
      error: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Optional middleware to check if user has a specific role
 * Usage: verifyRole(['admin', 'moderator'])
 */
export const verifyRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        error: 'NOT_AUTHENTICATED'
      });
    }

    const userRole = req.user.role || 'user';
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: allowedRoles,
        userRole: userRole
      });
    }

    next();
  };
};

/**
 * Optional middleware to check if user email is verified
 */
export const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
      error: 'NOT_AUTHENTICATED'
    });
  }

  if (!req.user.emailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required',
      error: 'EMAIL_NOT_VERIFIED'
    });
  }

  next();
}; 