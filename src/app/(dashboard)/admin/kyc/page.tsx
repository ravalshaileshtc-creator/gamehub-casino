
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileCheck, CheckCircle, Eye } from 'lucide-react'
import Image from 'next/image'

interface KYCSubmission {
  id: string
  name: string
  email: string
  kycDocument: string | null
  kycSubmittedAt: string | null
  createdAt: string
}

export default function AdminKYCPage() {
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const fetchSubmissions = async () => {
    try {
      const res = await fetch('/api/admin/kyc/pending')
      const data = await res.json()

      if (data.success) {
        setSubmissions(data.submissions)
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (userId: string) => {
    if (!confirm('Approve this KYC submission?')) return

    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/kyc/${userId}/approve`, { method: 'POST' })
      const data = await res.json()

      if (data.success) {
        alert('KYC approved successfully')
        setSelectedSubmission(null)
        fetchSubmissions()
      } else {
        alert(data.error || 'Failed to approve')
      }
    } catch (error) {
      console.error('Approve error:', error)
      alert('Failed to approve KYC')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (userId: string) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return

    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/kyc/${userId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })

      const data = await res.json()

      if (data.success) {
        alert('KYC rejected')
        setSelectedSubmission(null)
        fetchSubmissions()
      } else {
        alert(data.error || 'Failed to reject')
      }
    } catch (error) {
      console.error('Reject error:', error)
      alert('Failed to reject KYC')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/20 to-gray-900 p-6 flex items-center justify-center">
        <p className="text-white text-xl">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/20 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-orbitron font-bold gradient-text mb-8 flex items-center gap-3">
          <FileCheck className="w-12 h-12" />
          KYC Verification Queue
        </h1>

        {submissions.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <CheckCircle className="w-24 h-24 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Pending Submissions</h2>
            <p className="text-gray-400">All KYC submissions have been reviewed</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Submissions List */}
            <div className="space-y-4">
              {submissions.map((submission) => (
                <motion.div
                  key={submission.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`glass-card p-6 cursor-pointer transition-all ${
                    selectedSubmission?.id === submission.id
                      ? 'ring-2 ring-primary'
                      : 'hover:bg-white/5'
                  }`}
                  onClick={() => setSelectedSubmission(submission)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-white text-lg">{submission.name || 'Unknown'}</h3>
                      <p className="text-sm text-gray-400">{submission.email}</p>
                    </div>
                    <button className="btn-secondary px-4 py-2 text-sm">
                      <Eye className="w-4 h-4 inline mr-1" />
                      Review
                    </button>
                  </div>

                  <div className="flex gap-3 text-xs">
                    <div className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-400">
                       Document Uploaded
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-3">
                    Submitted: {submission.kycSubmittedAt ? new Date(submission.kycSubmittedAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Document Viewer */}
            {selectedSubmission && (
              <div className="glass-card p-6 sticky top-6">
                <h2 className="font-bold text-white text-xl mb-6">Document Review</h2>

                <div className="space-y-6 mb-6">
                  {selectedSubmission.kycDocument ? (
                    <div>
                      <h3 className="text-sm text-gray-400 mb-2">ID Document</h3>
                      <div className="relative h-64 bg-black/40 rounded-xl overflow-hidden group">
                        {/* Check if PDF or Image */}
                        {selectedSubmission.kycDocument.endsWith('.pdf') ? (
                            <iframe src={selectedSubmission.kycDocument} className="w-full h-full" />
                        ) : (
                             <Image
                                src={selectedSubmission.kycDocument}
                                alt="ID Document"
                                fill
                                className="object-contain"
                            />
                        )}
                         <a href={selectedSubmission.kycDocument} target="_blank" className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 text-xs rounded text-white opacity-0 group-hover:opacity-100 transition-opacity">Open Original</a>
                      </div>
                    </div>
                  ) : (
                      <div className="text-red-400">No document found</div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(selectedSubmission.id)}
                    disabled={actionLoading}
                    className="flex-1 px-6 py-3 rounded-xl bg-green-500/20 text-green-400 font-bold hover:bg-green-500/30 transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Approve'}
                  </button>

                  <button
                    onClick={() => handleReject(selectedSubmission.id)}
                    disabled={actionLoading}
                    className="flex-1 px-6 py-3 rounded-xl bg-red-500/20 text-red-400 font-bold hover:bg-red-500/30 transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
