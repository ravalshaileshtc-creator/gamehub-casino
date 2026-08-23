'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react'

export default function KYCPage() {
  const [documents, setDocuments] = useState<{
    idProof?: string
    addressProof?: string
    selfie?: string
  }>({})
  const [uploading, setUploading] = useState<string | null>(null)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  const handleFileUpload = async (type: 'idProof' | 'addressProof' | 'selfie', file: File) => {
    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    if (!['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'].includes(file.type)) {
      alert('Only JPEG, PNG, and PDF files are allowed')
      return
    }

    setUploading(type)

    try {
      // Convert to base64
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = async () => {
        const fileData = reader.result as string

        // Upload to server
        const res = await fetch('/api/kyc/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentType: type, fileData }),
        })

        const data = await res.json()

        if (data.success) {
          setDocuments((prev) => ({ ...prev, [type]: data.url }))
        } else {
          alert(data.error || 'Upload failed')
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload document')
    } finally {
      setUploading(null)
    }
  }

  const handleSubmit = async () => {
    if (!documents.idProof || !documents.addressProof || !documents.selfie) {
      alert('Please upload all required documents')
      return
    }

    setSubmitStatus('submitting')

    try {
      const res = await fetch('/api/kyc/submit', { method: 'POST' })
      const data = await res.json()

      if (data.success) {
        setSubmitStatus('success')
      } else {
        alert(data.error || 'Submission failed')
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Submit error:', error)
      alert('Failed to submit KYC')
      setSubmitStatus('error')
    }
  }

  const DocumentUploadCard = ({
    type,
    title,
    description,
    icon: Icon,
  }: {
    type: 'idProof' | 'addressProof' | 'selfie'
    title: string
    description: string
    icon: React.ComponentType<{ className?: string }>
  }) => {
    const uploaded = !!documents[type]
    const isUploading = uploading === type

    return (
      <div className="glass-card p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className={`p-3 rounded-xl ${uploaded ? 'bg-green-500/20' : 'bg-primary/20'}`}>
            {uploaded ? (
              <CheckCircle className="w-6 h-6 text-green-400" />
            ) : (
              <Icon className="w-6 h-6 text-primary" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white mb-1">{title}</h3>
            <p className="text-sm text-gray-400">{description}</p>
          </div>
        </div>

        {uploaded ? (
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-center">
            <p className="text-green-400 font-bold">✓ Uploaded Successfully</p>
          </div>
        ) : (
          <label className="block">
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(type, file)
              }}
              className="hidden"
              disabled={isUploading}
            />
            <div className="btn-secondary p-4 text-center cursor-pointer">
              {isUploading ? (
                <span>Uploading...</span>
              ) : (
                <>
                  <Upload className="w-5 h-5 inline mr-2" />
                  Upload Document
                </>
              )}
            </div>
          </label>
        )}
      </div>
    )
  }

  if (submitStatus === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900/20 to-gray-900 p-6 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card p-12 text-center max-w-2xl"
        >
          <CheckCircle className="w-24 h-24 text-green-400 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-white mb-4">KYC Submitted!</h1>
          <p className="text-gray-400 mb-6">
            Your documents have been submitted for verification. Our team will review them within 24-48 hours.
          </p>
          <button
            onClick={() => (window.location.href = '/wallet')}
            className="btn-primary px-8 py-3"
          >
            Back to Wallet
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900/20 to-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-orbitron font-bold gradient-text text-center mb-4">
          📋 KYC Verification
        </h1>
        <p className="text-gray-400 text-center mb-8">
          Upload your documents to verify your identity and unlock full platform access
        </p>

        {/* Info Alert */}
        <div className="glass-card p-6 mb-8 border-l-4 border-blue-400">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-white mb-2">Why KYC is Required</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>✓ Required for withdrawals above ₹10,000</li>
                <li>✓ Ensures account security and prevents fraud</li>
                <li>✓ Complies with gambling regulations</li>
                <li>✓ All documents are encrypted and secure</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Upload Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <DocumentUploadCard
            type="idProof"
            title="ID Proof"
            description="Aadhaar, PAN, Passport, or Driver's License"
            icon={FileText}
          />

          <DocumentUploadCard
            type="addressProof"
            title="Address Proof"
            description="Utility bill, bank statement, or rental agreement"
            icon={FileText}
          />

          <DocumentUploadCard
            type="selfie"
            title="Selfie"
            description="Clear photo of your face holding ID"
            icon={ImageIcon}
          />
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <button
            onClick={handleSubmit}
            disabled={
              !documents.idProof ||
              !documents.addressProof ||
              !documents.selfie ||
              submitStatus === 'submitting'
            }
            className="btn-primary px-12 py-4 text-xl font-bold disabled:opacity-50"
          >
            {submitStatus === 'submitting' ? 'Submitting...' : 'Submit for Verification'}
          </button>
        </div>

        {/* Guidelines */}
        <div className="glass-card p-6 mt-8">
          <h3 className="font-bold text-white mb-4">Document Guidelines</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
            <div>
              <p className="font-bold text-white mb-2">✓ DO:</p>
              <ul className="space-y-1">
                <li>• Upload clear, well-lit photos</li>
                <li>• Ensure all text is readable</li>
                <li>• Use JPEG, PNG, or PDF format</li>
                <li>• Keep file size under 5MB</li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-white mb-2">✗ DON&apos;T:</p>
              <ul className="space-y-1">
                <li>• Upload blurry or dark images</li>
                <li>• Crop important information</li>
                <li>• Edit or modify documents</li>
                <li>• Upload expired documents</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
