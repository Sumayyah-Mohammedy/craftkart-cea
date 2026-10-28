import api from './api';

const createStripeSession = async () => {
  try {
    console.log('🔵 Creating Stripe session...');
    console.log('API base URL:', api.defaults.baseURL);
    console.log('Token exists:', !!localStorage.getItem('token'));
    
    // api.js interceptor already returns response.data, so 'data' here is already the data object
    const data = await api.post('/orders/create-stripe-session', {});
    console.log('✅ Stripe session response:', data);
    
    // Validate response - data is already { success: true, url: "..." }
    if (!data || !data.url) {
      console.error('❌ Invalid response structure:', data);
      throw new Error('Invalid response from server');
    }
    
    return data; // Returns { success: true, url: "..." }
  } catch (error) {
    console.error('❌ Stripe session error:', error);
    console.error('Error type:', typeof error);
    console.error('Error details:', error);
    
    // error is already the error message string due to interceptor
    throw new Error(typeof error === 'string' ? error : (error.message || 'Failed to create checkout session'));
  }
};

const verifyStripePayment = async (sessionId) => {
  try {
    console.log('🔵 Verifying payment for session:', sessionId);
    
    // api.js interceptor already returns response.data
    const data = await api.get(`/orders/verify-stripe?session_id=${sessionId}`);
    console.log('✅ Payment verification response:', data);
    return data;
  } catch (error) {
    console.error('❌ Payment verification error:', error);
    throw new Error(typeof error === 'string' ? error : (error.message || 'Payment verification failed'));
  }
};

export default { 
  createStripeSession, 
  verifyStripePayment 
};