import express from 'express';
import { reverseGeocode } from '../controllers/geocodingController.js';

const router = express.Router();

// Reverse geocoding - get address from coordinates
router.get('/reverse', reverseGeocode);

export default router; 