'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import JobDetails from "@/components/JobDetails"
import Loading from "@/components/Loading"

export default function JobDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`/api/jobs?id=${params?.id}`)
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data?.error || "Failed to fetch job")
        }

        if (!data?.job) {
          throw new Error("Job not found")
        }

        setJob(data.job)
      } catch (err) {
        setError(err?.message || "Failed to load job")
      } finally {
        setLoading(false)
      }
    }

    if (params?.id) fetchJob()
  }, [params?.id])

  if (loading) return <Loading />

  if (error) {
    return (
      <div className="min-h-[70vh] mx-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/jobs")}
            className="px-4 py-2 rounded-lg bg-slate-800 text-white"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-6 my-8 min-h-[70vh]">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 mb-6"
        >
          <ArrowLeft size={16} />
          Back to jobs
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <JobDetails job={job} />
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 sticky top-24">
              <JobDetails job={job} sidebar />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
