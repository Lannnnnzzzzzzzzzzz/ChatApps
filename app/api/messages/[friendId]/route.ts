import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { friendId: string } }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 })
    }

    const friendId = params.friendId

    // Check if they are friends
    const friendRequest = db.friendRequests.findByUsers(session.userId, friendId)
    if (!friendRequest || friendRequest.status !== "accepted") {
      return NextResponse.json({ message: "Anda hanya bisa melihat pesan dengan teman" }, { status: 403 })
    }

    // Get messages between users
    const messages = db.messages.findBetweenUsers(session.userId, friendId)

    return NextResponse.json({
      messages: messages.map((msg) => ({
        id: msg.id,
        fromUserId: msg.fromUserId,
        toUserId: msg.toUserId,
        content: msg.content,
        createdAt: msg.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("Get messages error:", error)
    return NextResponse.json({ message: "Terjadi kesalahan server" }, { status: 500 })
  }
}
