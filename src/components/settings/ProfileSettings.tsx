'use client'

import { useState, useEffect, useRef } from 'react'
import { User, Mail, Camera, Save, Loader } from 'lucide-react'
import Image from 'next/image'

export default function ProfileSettings() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      const data = await res.json()
      
      if (data.success) {
        setName(data.user.name || '')
        setEmail(data.user.email || '')
        setBio(data.user.bio || '')
        setAvatar(data.user.avatar || null)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatar(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Upload avatar first if changed
      let avatarUrl = avatar
      if (avatarFile) {
        const formData = new FormData()
        formData.append('avatar', avatarFile)

        const avatarRes = await fetch('/api/user/settings/avatar', {
          method: 'POST',
          body: formData,
        })

        const avatarData = await avatarRes.json()
        if (avatarData.success) {
          avatarUrl = avatarData.avatarUrl
        }
      }

      // Update profile
      const res = await fetch('/api/user/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          bio,
          avatar: avatarUrl,
        }),
      })

      const data = await res.json()

      if (data.success) {
        alert('Profile updated successfully!')
        fetchProfile()
      } else {
        alert(data.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Update error:', error)
      alert('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Profile Settings</h2>
        <p className="text-gray-400">Manage your personal information</p>
      </div>

      {/* Avatar Upload */}
      <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-black/20">
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-primary flex items-center justify-center text-5xl font-bold">
            {avatar ? (
              <Image src={avatar} alt="Avatar" width={128} height={128} className="w-full h-full object-cover" />
            ) : (
              <span>{name?.charAt(0).toUpperCase() || 'U'}</span>
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 p-2 rounded-full bg-primary hover:bg-primary/80 transition-colors"
          >
            <Camera className="w-5 h-5 text-white" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        <p className="text-sm text-gray-400">Click camera icon to upload new avatar (max 5MB)</p>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <User className="w-4 h-4 inline mr-2" />
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Mail className="w-4 h-4 inline mr-2" />
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-primary focus:outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Changing email will require verification
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
            rows={4}
            maxLength={500}
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-primary focus:outline-none resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            {bio.length}/500 characters
          </p>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {saving ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Save Changes
          </>
        )}
      </button>
    </div>
  )
}
