"use client"
import { useEffect, useState } from "react"
import axios from "axios"
import Link from "next/link"

export default function EditorsPage() {
  const [editors, setEditors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get("/api/editors")
      .then(({ data }) => setEditors(data.editors || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-10 text-center">Loading editors...</div>

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Find Editors</h1>
      <p className="text-gray-500 mb-8">Browse professional editors available for hire.</p>
      {editors.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-xl">No editors found yet.</p>
          <Link href="/jobs" className="mt-6 inline-block px-6 py-3 bg-black text-white rounded-md">
            Browse Jobs Instead
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {editors.map((editor) => (
            <div key={editor.id} className="border rounded-xl p-6 shadow-sm bg-white">
              <div className="flex items-center gap-4 mb-4">
                {editor.user?.image && (
                  <img src={editor.user.image} alt={editor.user.name} className="w-12 h-12 rounded-full object-cover" />
                )}
                <div>
                  <h2 className="font-semibold">{editor.user?.name}</h2>
                  {editor.location && <p className="text-sm text-gray-500">{editor.location}</p>}
                </div>
              </div>
              {editor.skills?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {editor.skills.slice(0, 4).map((skill, i) => (
                    <span key={i} className="bg-gray-100 text-xs px-2 py-1 rounded-full">{skill}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
