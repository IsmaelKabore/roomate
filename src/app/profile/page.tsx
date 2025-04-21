'use client'

import { Box, Typography } from '@mui/material'

const fakeProfile = {
  name: 'Alice Johnson',
  age: 22,
  profilePicture: 'https://randomuser.me/api/portraits/women/68.jpg',
  bio: 'I’m a CS major who codes by day and doodles by night. Always down for a boba walk or spontaneous jam session.',
  funFact: 'I’ve been to 14 countries and once danced with a robot in Japan.',
  phone: '(510) 456-7890',
  likes: 'Cooking, Lo-fi playlists, group projects, clean kitchen, Sunday hikes 🌲',
  roommatePreferences: 'Prefer someone tidy, doesn’t bring the party home, and is down to co-work in silence ✌️',
  personalityTraits: ['Creative', 'Empathetic', 'Ambitious'],
  lifestyleTraits: ['Organized', 'Health-conscious', 'Laid-back'],
  habitTraits: ['Punctual', 'Planner', 'Focused']
}

const traitIcons: Record<string, string> = {
  Creative: '🎨',
  Empathetic: '💗',
  Ambitious: '🏆',
  Organized: '📋',
  'Health-conscious': '🥗',
  'Laid-back': '🌴',
  Punctual: '⏰',
  Planner: '📅',
  Focused: '🎯'
}

export default function ProfilePage() {
  const profile = fakeProfile

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #1a1a2e, #16213e)',
        color: '#e0e0e0',
        px: 4,
        py: 6,
        display: 'flex',
        flexDirection: 'column',
        gap: 4
      }}
    >
      {/* Heading */}
      <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#9be7ff' }}>
        👤 My EazyRoom Profile
      </Typography>

      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center gap-6 bg-white/10 p-6 rounded-2xl shadow-lg">
        <img
          src={profile.profilePicture}
          alt="Profile"
          className="w-32 h-32 rounded-full object-cover border-4 border-indigo-300 shadow-lg"
        />
        <div className="text-center md:text-left space-y-2">
          <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
          <p className="text-indigo-300">{profile.phone}</p>
          <p className="text-indigo-100">{profile.bio}</p>
        </div>
      </div>

      {/* Likes */}
      <div className="bg-white/10 rounded-2xl p-6 shadow-md">
        <h3 className="text-lg font-semibold text-blue-300 mb-2">💙 What I Like</h3>
        <p className="text-indigo-100">{profile.likes}</p>
      </div>

      {/* Fun Fact */}
      <div className="bg-white/10 rounded-2xl p-6 shadow-md">
        <h3 className="text-lg font-semibold text-pink-300 mb-2">🎉 Fun Fact</h3>
        <p className="text-pink-100">{profile.funFact}</p>
      </div>

      {/* Preferences */}
      <div className="bg-white/10 rounded-2xl p-6 shadow-md">
        <h3 className="text-lg font-semibold text-green-300 mb-2">🛋️ Roommate Preferences</h3>
        <p className="text-green-100">{profile.roommatePreferences}</p>
      </div>

      {/* Traits Section */}
      <div className="bg-white/10 rounded-2xl p-6 shadow-md">
        <h3 className="text-lg font-semibold text-yellow-300 mb-4">🧠 My Traits</h3>

        {/* Personality */}
        <div className="mb-3">
          <h4 className="text-md font-medium text-indigo-300 mb-2">Personality</h4>
          <div className="flex flex-wrap gap-2">
            {profile.personalityTraits.map((trait) => (
              <span
                key={trait}
                className="px-3 py-1 bg-indigo-500 text-white rounded-full text-sm flex items-center gap-1"
              >
                {traitIcons[trait]} {trait}
              </span>
            ))}
          </div>
        </div>

        {/* Lifestyle */}
        <div className="mb-3">
          <h4 className="text-md font-medium text-green-300 mb-2">Lifestyle</h4>
          <div className="flex flex-wrap gap-2">
            {profile.lifestyleTraits.map((trait) => (
              <span
                key={trait}
                className="px-3 py-1 bg-green-500 text-white rounded-full text-sm flex items-center gap-1"
              >
                {traitIcons[trait]} {trait}
              </span>
            ))}
          </div>
        </div>

        {/* Habits */}
        <div>
          <h4 className="text-md font-medium text-pink-300 mb-2">Habits</h4>
          <div className="flex flex-wrap gap-2">
            {profile.habitTraits.map((trait) => (
              <span
                key={trait}
                className="px-3 py-1 bg-pink-500 text-white rounded-full text-sm flex items-center gap-1"
              >
                {traitIcons[trait]} {trait}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Box>
  )
}
