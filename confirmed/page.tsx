/**
 * app/unsubscribe/confirmed/page.tsx
 * One-click unsubscribe confirmation page — no auth required
 */

'use client'

import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import Link from 'next/link'

function UnsubscribeContent() {
  const params = useSearchParams()
  const email = params.get('email')
  const already = params.get('already') === 'true'
  const token = params.get('token')
  const [resubscribed, setResubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleResubscribe() {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (res.ok) setResubscribed(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">

        {/* Logo / Brand */}
        <div className="mb-6">
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1">
            AI Posture Platform
          </p>
          <p className="text-xs text-gray-400">Built on CoSAI SRF v0.7</p>
        </div>

        {resubscribed ? (
          <>
            <div className="text-4xl mb-4">✅</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">You're back!</h1>
            <p className="text-gray-500 text-sm mb-6">
              Email notifications have been re-enabled for <strong>{email}</strong>.
            </p>
          </>
        ) : already ? (
          <>
            <div className="text-4xl mb-4">📭</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Already unsubscribed</h1>
            <p className="text-gray-500 text-sm mb-6">
              This email address is already unsubscribed from AI Posture Platform notifications.
            </p>
          </>
        ) : (
          <>
            <div className="text-4xl mb-4">✉️</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">You've been unsubscribed</h1>
            <p className="text-gray-500 text-sm mb-2">
              <strong>{email}</strong> will no longer receive emails from AI Posture Platform.
            </p>
            <p className="text-gray-400 text-xs mb-6">
              Changed your mind? You can re-enable notifications below or in your account settings.
            </p>
          </>
        )}

        <div className="space-y-3">
          {!resubscribed && token && (
            <button
              onClick={handleResubscribe}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Re-subscribing...' : 'Re-enable email notifications'}
            </button>
          )}
          <Link
            href="/dashboard"
            className="block w-full py-2.5 px-4 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Go to dashboard
          </Link>
        </div>

        <p className="mt-6 text-xs text-gray-400">
          You can manage all notification preferences in{' '}
          <Link href="/settings/notifications" className="text-blue-500 hover:underline">
            account settings
          </Link>
          .
        </p>
      </div>
    </div>
  )
}

export default function UnsubscribeConfirmedPage() {
  return (
    <Suspense>
      <UnsubscribeContent />
    </Suspense>
  )
}
