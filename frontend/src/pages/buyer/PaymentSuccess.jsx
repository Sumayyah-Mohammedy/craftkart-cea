import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import stripeService from '../../services/stripeService'

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [orderId, setOrderId] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const verifyPayment = async () => {
      const sessionId = searchParams.get('session_id')
      if (!sessionId) return navigate('/')

      try {
        const { success, orderId } = await stripeService.verifyStripePayment(sessionId)
        if (success) setOrderId(orderId)
        else setError('Payment verification failed.')
      } catch (err) {
        console.error(err)
        setError('Payment verification failed.')
      } finally {
        setLoading(false)
      }
    }

    verifyPayment()
  }, [searchParams, navigate])

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto max-w-7xl px-4 py-20">
        <LoadingSpinner size="lg" />
      </div>
      <Footer />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto max-w-7xl px-4 py-20 text-center">
        {orderId ? (
          <>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Payment Successful 🎉</h1>
            <p className="text-lg text-gray-700 mb-6">Your order has been placed successfully.</p>
            <p className="text-gray-700">Order ID: <strong>{orderId}</strong></p>
            <button
              onClick={() => navigate(`/order-confirmation?orderId=${orderId}`)}
              className="mt-6 px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition"
            >
              View Order
            </button>
          </>
        ) : (
          <>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Payment Failed ❌</h1>
            <p className="text-lg text-gray-700 mb-6">{error || 'Please try again.'}</p>
            <button
              onClick={() => navigate('/checkout')}
              className="mt-6 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
            >
              Back to Checkout
            </button>
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}

export default PaymentSuccess
