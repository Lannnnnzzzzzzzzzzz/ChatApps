import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 })
    }

    const { toUserId, content } = await request.json()

    if (!toUserId || !content?.trim()) {
      return NextResponse.json({ message: "Data tidak valid" }, { status: 400 })
    }

    // Check if target user exists
    const targetUser = db.users.findById(toUserId)
    if (!targetUser) {
      return NextResponse.json({ message: "User tidak ditemukan" }, { status: 404 })
    }

    // Check if they are friends
    const friendRequest = db.friendRequests.findByUsers(session.userId, toUserId)
    if (!friendRequest || friendRequest.status !== "accepted") {
      return NextResponse.json({ message: "Anda hanya bisa mengirim pesan ke teman" }, { status: 403 })
    }

    // Create message
    const message = db.messages.create({
      fromUserId: session.userId,
      toUserId,
      content: content.trim(),
    })

    return NextResponse.json({
      message: "Pesan terkirim",
      data: message,
    })
  } catch (error) {
    console.error("Send message error:", error)
    return NextResponse.json({ message: "Terjadi kesalahan server" }, { status: 500 })
  }
}
