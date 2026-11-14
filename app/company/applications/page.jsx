'use client'

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import toast from "react-hot-toast"
import Loading from "@/components/Loading"

const STATUS_STEPS = ["APPLIED", "IN_REVIEW", "HIRED", "IN_PROGRESS", "DELIVERED", "REVISION", "COMPLETED"]

const statusColor = {
  APPLIED:     "bg-blue-100 text-blue-700",
  IN_REVIEW:   "bg-yellow-100 text-yellow-700",
  HIRED:       "bg-purple-100 text-purple-700",
  IN_PROGRESS: "bg-indigo-100 text-indigo-700",
  DELIVERED:   "bg-teal-100 text-teal-700",
  REVISION:    "bg-orange-100 text-orange-700",
  COMPLETED:   "bg-green-100 text-green-700",
  REJECTED:    "bg-red-100 text-red-700",
}

export default function CompanyApplications() {
  const { getToken } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [revisionNote, setRevisionNote] = useState("")
  const [showRevision, setShowRevision] = useState(null)

  const fetchApplications = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get("/api/company/applications", {
        headers: { Authorization: `Bearer ${token}` }
      })
      setApplications(data.applications || [])
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id, status, note = "") => {
    try {
      const token = await getToken()
      await axios.post("/api/company/applications",
        { applicationId: id, status, revisionNote: note },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success("Status updated")
      setShowRevision(null)
      setRevisionNote("")
      fetchApplications()
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message)
    }
  }

  useEffect(() => { fetchApplications() }, [])

  if (loading) return <Loading />

  return (
    <div className="text-slate-500 mb-28">
      <h1 className="text-2xl mb-6">
        Job <span className="text-slate-800 font-medium">Applications</span>
      </h1>

      {applications.length === 0 ? (
        <div className="flex items-center justify-center h-80">
          <h1 className="text-3xl text-slate-400 font-medium">No applications received yet</h1>
        </div>
      ) : (
        <div className="space-y-6">
          {applications.map((app) => {
            const editor = app.editor
            const user = editor?.user

            return (
              <div key={app.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">{app.job?.title}</h2>
                    <p className="text-sm text-slate-500">{user?.name} • {editor?.phone || "No phone"}</p>
                    <p className="text-xs text-slate-400 mt-1">Applied {new Date(app.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor[app.status] || "bg-gray-100"}`}>
                    {app.status?.replace("_", " ")}
                  </span>
                </div>

                {/* Progress Tracker */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-slate-500 mb-2">Project Stage</p>
                  <div className="flex items-center gap-1 flex-wrap">
                    {STATUS_STEPS.map((step, i) => {
                      const currentIndex = STATUS_STEPS.indexOf(app.status)
                      const isDone = i <= currentIndex
                      return (
                        <div key={step} className="flex items-center">
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${isDone ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                            {isDone ? "✓" : "○"} {step.replace("_", " ")}
                          </div>
                          {i < STATUS_STEPS.length - 1 && (
                            <div className={`w-3 h-0.5 mx-1 ${i < currentIndex ? "bg-green-400" : "bg-gray-200"}`} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Editor Skills */}
                {editor?.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {editor.skills.slice(0, 4).map(skill => (
                      <span key={skill} className="bg-slate-100 text-xs px-2 py-1 rounded-full">{skill}</span>
                    ))}
                  </div>
                )}

                {/* Resume */}
                {editor?.resumeUrl && (
                  <a href={editor.resumeUrl} target="_blank" className="text-indigo-600 text-sm underline block mb-3">
                    📄 View Resume
                  </a>
                )}

                {/* Delivery Section */}
                {(app.deliveryUrl || app.deliveryFiles?.length > 0) && (
                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-4">
                    <p className="text-sm font-semibold text-teal-700 mb-2">📦 Editor Delivery</p>
                    {app.deliveryUrl && (
                      <a href={app.deliveryUrl} target="_blank"
                        className="flex items-center gap-2 text-blue-600 underline text-sm mb-2 hover:text-blue-800">
                        🔗 {app.deliveryUrl}
                      </a>
                    )}
                    {app.deliveryFiles?.map((url, i) => (
                      <a key={i} href={url} target="_blank"
                        className="flex items-center gap-2 text-blue-600 underline text-sm mb-1 hover:text-blue-800">
                        📎 Download File {i + 1}
                      </a>
                    ))}
                    {app.progressNote && (
                      <p className="text-sm text-slate-600 mt-2 italic">"{app.progressNote}"</p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 mt-3">

                  {/* Status Dropdown */}
                  <select
                    value={app.status}
                    onChange={(e) => {
                      if (e.target.value === "REVISION") {
                        setShowRevision(app.id)
                      } else {
                        updateStatus(app.id, e.target.value)
                      }
                    }}
                    className="border rounded-lg px-3 py-2 text-sm text-slate-700"
                  >
                    <option value="APPLIED">APPLIED</option>
                    <option value="IN_REVIEW">IN REVIEW</option>
                    <option value="HIRED">HIRED</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="REVISION">REQUEST REVISION</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>

                </div>

                {/* Revision Note Input */}
                {showRevision === app.id && (
                  <div className="mt-3 bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-2">
                    <p className="text-sm font-medium text-orange-700">What needs to be revised?</p>
                    <textarea
                      value={revisionNote}
                      onChange={e => setRevisionNote(e.target.value)}
                      placeholder="Describe what changes you need..."
                      rows={3}
                      className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(app.id, "REVISION", revisionNote)}
                        disabled={!revisionNote}
                        className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                      >
                        Send Revision Request
                      </button>
                      <button
                        onClick={() => { setShowRevision(null); setRevisionNote("") }}
                        className="border px-4 py-2 rounded-lg text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
