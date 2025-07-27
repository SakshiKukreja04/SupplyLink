import Razorpay from 'razorpay';

// Check if Razorpay keys are configured
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || keyId === 'rzp_test_YOUR_KEY_ID' || !keySecret || keySecret === 'YOUR_KEY_SECRET') {
  console.warn('⚠️  Razorpay keys not configured properly!');
  console.warn('Please add your Razorpay keys to server/.env:');
  console.warn('RAZORPAY_KEY_ID=rzp_test_YOUR_ACTUAL_KEY_ID');
  console.warn('RAZORPAY_KEY_SECRET=YOUR_ACTUAL_KEY_SECRET');
}

// Initialize Razorpay instance
const razorpayInstance = new Razorpay({
  key_id: keyId || 'rzp_test_dummy',
  key_secret: keySecret || 'dummy_secret',
});

export default razorpayInstance; 