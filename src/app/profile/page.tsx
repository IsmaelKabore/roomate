'use client'

import { useEffect, useRef, useState } from 'react'
import FloatingMessageButton from '@/components/FloatingMessageButton' // ✅ Floating Inbox button

const traitIcons: Record<string, string> = {
  Creative: '🎨', Optimistic: '😊', 'Detail-oriented': '🔍', Adventurous: '🚀',
  Analytical: '🧠', Empathetic: '💗', Ambitious: '🏆', Introverted: '🤔',
  Charismatic: '✨', Confident: '💪', Active: '🏃‍♂️', Minimalist: '⚪',
  Social: '👥', 'Health-conscious': '🥗', Organized: '📋', Spontaneous: '🎭',
  Workaholic: '💼', 'Laid-back': '🌴', Punctual: '⏰', Disciplined: '📝',
  Focused: '🎯', Procrastinator: '⏳', Planner: '📅', Reliable: '🤝'
}

const allTraits = Object.keys(traitIcons)

export default function Profile() {
  const [profile, setProfile] = useState({
    name: '',
    bio: '',
    phone: '',
    likes: '',
    profilePicture: '',
    traits: [] as string[]
  })
  const [editing, setEditing] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('homigo_profile')
    if (saved) setProfile(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem('homigo_profile', JSON.stringify(profile))
  }, [profile])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setProfile((prev) => ({ ...prev, profilePicture: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  const toggleTrait = (trait: string) => {
    setProfile((prev) => ({
      ...prev,
      traits: prev.traits.includes(trait)
        ? prev.traits.filter((t) => t !== trait)
        : prev.traits.length < 6
        ? [...prev.traits, trait]
        : prev.traits
    }))
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-6 bg-white text-gray-900 relative">
      <h1 className="text-4xl font-bold text-center text-blue-700 mb-8">My Profile</h1>

      {!editing ? (
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-center gap-6">
            <div className="w-28 h-28 rounded-full bg-gray-200 overflow-hidden border-4 border-blue-300">
              {profile.profilePicture ? (
                <img src={profile.profilePicture} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl text-gray-600">
                  {profile.name?.charAt(0) || '?'}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-semibold">{profile.name || 'Your Name'}</h2>
              <p className="text-gray-500">{profile.phone || 'No phone set'}</p>
              <p className="text-gray-500 mt-1">{profile.bio || 'No bio yet.'}</p>
            </div>
          </div>

          {/* Likes Section */}
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-600 mb-2">What I Like</h3>
            <p className="text-gray-700">{profile.likes || 'No likes listed yet.'}</p>
          </div>

          {/* Traits Section */}
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-600 mb-2">Traits</h3>
            <div className="flex flex-wrap gap-2">
              {profile.traits.length ? (
                profile.traits.map((t) => (
                  <span
                    key={t}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {traitIcons[t]} {t}
                  </span>
                ))
              ) : (
                <p className="text-gray-400 italic">No traits selected.</p>
              )}
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => setEditing(true)}
              className="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-lg text-white font-medium"
            >
              Edit Profile
            </button>
          </div>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            setEditing(false)
          }}
        >
          {/* Upload */}
          <div className="text-center">
            <input
              type="file"
              ref={fileRef}
              onChange={handleImageUpload}
              accept="image/*"
              hidden
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg shadow"
            >
              Upload Profile Picture
            </button>
          </div>

          {/* Form Fields */}
          <input
            type="text"
            placeholder="Full Name"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="w-full p-3 rounded bg-gray-100 border border-gray-300 focus:outline-none"
            required
          />
          <input
            type="text"
            placeholder="Phone"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            className="w-full p-3 rounded bg-gray-100 border border-gray-300 focus:outline-none"
          />
          <textarea
            placeholder="Bio"
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            rows={3}
            className="w-full p-3 rounded bg-gray-100 border border-gray-300 focus:outline-none"
          />
          <input
            type="text"
            placeholder="What I Like"
            value={profile.likes}
            onChange={(e) => setProfile({ ...profile, likes: e.target.value })}
            className="w-full p-3 rounded bg-gray-100 border border-gray-300 focus:outline-none"
          />

          {/* Traits */}
          <div>
            <h4 className="text-md font-semibold text-blue-600 mb-2">Select Traits (Max 6)</h4>
            <div className="flex flex-wrap gap-2">
              {allTraits.map((trait) => (
                <button
                  key={trait}
                  type="button"
                  className={`px-3 py-1 rounded-full text-sm ${
                    profile.traits.includes(trait)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  onClick={() => toggleTrait(trait)}
                >
                  {traitIcons[trait]} {trait}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
            >
              Save Profile
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex-1 py-2 bg-gray-500 hover:bg-gray-400 text-white rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Floating Messages Button */}
      <FloatingMessageButton />
    </div>
  )
}
