import prisma from "@/lib/prisma"
import { getAuth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function POST(req) {
  try {
    const { userId } = getAuth(req)
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { jobId, proposal } = await req.json()
    if (!jobId) return NextResponse.json({ error: "Missing jobId" }, { status: 400 })
    const editor = await prisma.editorProfile.findUnique({ where: { userId }, select: { id: true } })
    if (!editor) return NextResponse.json({ error: "Please complete your profile before applying" }, { status: 400 })
    const job = await prisma.job.findUnique({ where: { id: jobId }, select: { id: true } })
    if (!job) return NextResponse.json({ error: "Job does not exist" }, { status: 400 })
    const existing = await prisma.jobApplication.findUnique({
      where: { jobId_editorId: { jobId, editorId: editor.id } }, select: { id: true }
    })
    if (existing) return NextResponse.json({ error: "Already applied" }, { status: 400 })
    const application = await prisma.jobApplication.create({
      data: { jobId, editorId: editor.id, proposal: proposal || "", status: "APPLIED" },
    })
    return NextResponse.json({ message: "Application submitted successfully", application })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function GET(req) {
  try {
    const { userId } = getAuth(req)
    if (!userId) return NextResponse.json({ applications: [] })
    const editor = await prisma.editorProfile.findUnique({ where: { userId }, select: { id: true } })
    if (!editor) return NextResponse.json({ applications: [] })
    const applications = await prisma.jobApplication.findMany({
      where: { editorId: editor.id },
      select: {
        id: true,
        status: true,
        deliveryUrl: true,
        deliveryFiles: true,
        progressNote: true,
        revisionNote: true,
        createdAt: true,
        job: {
          select: {
            id: true,
            title: true,
            budget: true,
            company: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    })
    return NextResponse.json({ applications })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

// PUT - receives already-uploaded file URLs (client uploads to ImageKit directly)
export async function PUT(req) {
  try {
    const { userId } = getAuth(req)
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const editor = await prisma.editorProfile.findUnique({ where: { userId }, select: { id: true } })
    if (!editor) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

    // Now receives JSON with already-uploaded file URLs
    const { applicationId, deliveryUrl, progressNote, fileUrls } = await req.json()

    const application = await prisma.jobApplication.findFirst({
      where: { id: applicationId, editorId: editor.id },
      select: { id: true, deliveryFiles: true, status: true }
    })
    if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 })

    const allFileUrls = [...(application.deliveryFiles || []), ...(fileUrls || [])]
    const newStatus = (allFileUrls.length > 0 || deliveryUrl) ? "DELIVERED" : application.status

    const updated = await prisma.jobApplication.update({
      where: { id: applicationId },
      data: {
        deliveryUrl: deliveryUrl || null,
        deliveryFiles: allFileUrls,
        progressNote: progressNote || null,
        status: newStatus
      },
      select: { id: true, status: true, deliveryUrl: true, deliveryFiles: true, progressNote: true }
    })
    return NextResponse.json({ application: updated, success: true })
  } catch (err) {
    console.error("DELIVERY ERROR:", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
