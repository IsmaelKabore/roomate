'use client'

import { Users, Home as HomeIcon } from 'lucide-react'

const features = [
  {
    title: 'Find Roommates',
    desc: 'Get matched with compatible students based on lifestyle, major, habits & more.',
    icon: Users
  },
  {
    title: 'Rent Your Room',
    desc: 'Going home for break? Let someone stay overnight while you\'re away.',
    icon: HomeIcon
  },
]

export default function FeatureGrid() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-24">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, i) => {
          const Icon = feature.icon
          return (
            <div
              key={i}
              className="group bg-white bg-opacity-70 backdrop-blur-lg rounded-2xl p-8 border border-purple-200 
                       hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-3 bg-gradient-to-br from-purple-200 to-pink-200 bg-opacity-30 rounded-xl 
                             group-hover:bg-opacity-40 transition-colors duration-300">
                  <Icon className="w-8 h-8 text-purple-500 group-hover:text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-purple-600 group-hover:text-purple-700">
                  {feature.title}
                </h3>
                <p className="text-gray-600 group-hover:text-gray-700">
                  {feature.desc}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
