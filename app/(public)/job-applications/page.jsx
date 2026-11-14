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

export default function JobApplicationsPage() {
  const { getToken } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [deliveryUrl, setDeliveryUrl] = useState("")
  const [progressNote, setProgressNote] = useState("")
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)

  const fetchApplications = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get("/api/job-applications", {
        headers: { Authorization: `Bearer ${token}` }
      })
      setApplications(data.applications || [])
    } catch (err) {
      toast.error("Failed to load applications")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchApplications() }, [])

  // Upload file directly to ImageKit from browser
  const uploadToImageKit = async (file) => {
    const authRes = await axios.get("/api/imagekit-auth")
    const { signature, expire, token: ikToken } = authRes.data

    const formData = new FormData()
    formData.append("file", file)
    formData.append("fileName", `delivery_${Date.now()}_${file.name}`)
    formData.append("publicKey", process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY)
    formData.append("signature", signature)
    formData.append("expire", expire)
    formData.append("token", ikToken)
    formData.append("folder", "/deliveries")

    const res = await axios.post("https://upload.imagekit.io/api/v1/files/upload", formData)
    return res.data.url
  }

  const handleDeliver = async (app) => {
    if (!deliveryUrl && files.length === 0) {
      toast.error("Please add a link or upload at least one file")
      return
    }
    try {
      setUploading(true)
      const token = await getToken()

      // Upload files directly to ImageKit from browser
      let fileUrls = []
      if (files.length > 0) {
        toast.loading("Uploading files...")
        for (const file of files) {
          const url = await uploadToImageKit(file)
          fileUrls.push(url)
        }
        toast.dismiss()
      }

      await axios.put("/api/job-applications",
        { applicationId: app.id, deliveryUrl, progressNote, fileUrls },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      toast.success("Delivery submitted!")
      setSelected(null)
      setDeliveryUrl("")
      setProgressNote("")
      setFiles([])
      fetchApplications()
    } catch (err) {
      toast.dismiss()
      toast.error(err?.response?.data?.error || "Failed to submit delivery")
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">My Applications</h1>
      <p className="text-gray-500 mb-8">Track your job applications and submit deliveries.</p>

      {applications.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-xl">No applications yet.</p>
          <a href="/jobs" className="mt-4 inline-block px-6 py-2 bg-black text-white rounded-lg">Browse Jobs</a>
        </div>
      ) : (
        <div className="space-y-6">
          {applications.map((app) => (
            <div key={app.id} className="bg-white border rounded-2xl p-6 shadow-sm">

              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{app.job?.title}</h2>
                  <p className="text-gray-500 text-sm">{app.job?.company?.name}</p>
                  <p className="text-gray-400 text-xs mt-1">Applied {new Date(app.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor[app.status] || "bg-gray-100 text-gray-600"}`}>
                  {app.status?.replace(/_/g, " ")}
                </span>
              </div>

              {/* Progress Tracker */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-600 mb-2">Project Progress</p>
                <div className="flex items-center gap-1 flex-wrap">
                  {STATUS_STEPS.map((step, i) => {
                    const currentIndex = STATUS_STEPS.indexOf(app.status)
                    const isDone = i <= currentIndex
                    return (
                      <div key={step} className="flex items-center">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${isDone ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                          {isDone ? "✓" : "○"} {step.replace(/_/g, " ")}
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div className={`w-3 h-0.5 mx-1 ${i < currentIndex ? "bg-green-400" : "bg-gray-200"}`} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Budget */}
              <p className="text-sm text-gray-600 mb-3">
                Budget: <span className="font-semibold">₹{app.job?.budget?.toLocaleString()}</span>
              </p>

              {/* Revision Note */}
              {app.revisionNote && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                  <p className="text-xs font-semibold text-orange-700 mb-1">📝 Revision Requested:</p>
                  <p className="text-sm text-orange-800">{app.revisionNote}</p>
                </div>
              )}

              {/* Previous Delivery */}
              {(app.deliveryUrl || app.deliveryFiles?.length > 0) && (
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 mb-4">
                  <p className="text-xs font-semibold text-teal-700 mb-2">📦 Your Delivery:</p>
                  {app.deliveryUrl && (
                    <a href={app.deliveryUrl} target="_blank" className="text-blue-600 underline text-sm block mb-1">
                      🔗 {app.deliveryUrl}
                    </a>
                  )}
                  {app.deliveryFiles?.map((url, i) => (
                    <a key={i} href={url} target="_blank" className="text-blue-600 underline text-sm block">
                      📎 File {i + 1}
                    </a>
                  ))}
                  {app.progressNote && <p className="text-sm text-gray-600 mt-2">Note: {app.progressNote}</p>}
                </div>
              )}

              {/* Delivery Form */}
              {["HIRED", "IN_PROGRESS", "REVISION"].includes(app.status) && (
                <div>
                  {selected?.id === app.id ? (
                    <div className="border rounded-xl p-4 bg-gray-50 space-y-3">
                      <p className="font-medium text-gray-700">Submit Delivery</p>
                      <input
                        type="url"
                        placeholder="Delivery link (Google Drive, YouTube, etc.)"
                        value={deliveryUrl}
                        onChange={e => setDeliveryUrl(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      />
                      <div>
                        <label className="text-sm text-gray-600">Upload Files (images, pdf, zip — max 50MB each)</label>
                        <input
                          type="file"
                          multiple
                          onChange={e => setFiles(Array.from(e.target.files))}
                          className="block mt-1 text-sm"
                        />
                        {files.length > 0 && <p className="text-xs text-gray-500 mt-1">{files.length} file(s) selected</p>}
                      </div>
                      <textarea
                        placeholder="Progress note (optional)"
                        value={progressNote}
                        onChange={e => setProgressNote(e.target.value)}
                        rows={3}
                        className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeliver(app)}
                          disabled={uploading}
                          className="bg-black text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                        >
                          {uploading ? "Uploading..." : "Submit Delivery"}
                        </button>
                        <button onClick={() => setSelected(null)} className="border px-4 py-2 rounded-lg text-sm">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelected(app)}
                      className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
                    >
                      📤 Submit Delivery
                    </button>
                  )}
                </div>
              )}

              {app.status === "COMPLETED" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                  <p className="text-green-700 font-medium text-sm">🎉 Project Completed!</p>
                </div>
              )}
              {app.status === "REJECTED" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                  <p className="text-red-700 font-medium text-sm">❌ Application not accepted.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
