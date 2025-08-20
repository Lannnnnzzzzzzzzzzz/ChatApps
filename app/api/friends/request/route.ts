import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 })
    }

    const { toUserId } = await request.json()

    if (!toUserId) {
      return NextResponse.json({ message: "User ID harus diisi" }, { status: 400 })
    }

    // Check if target user exists
    const targetUser = db.users.findById(toUserId)
    if (!targetUser) {
      return NextResponse.json({ message: "User tidak ditemukan" }, { status: 404 })
    }

    // Check if request already exists
    const existingRequest = db.friendRequests.findByUsers(session.userId, toUserId)
    if (existingRequest) {
      return NextResponse.json({ message: "Permintaan sudah ada" }, { status: 400 })
    }

    // Create friend request
    const friendRequest = db.friendRequests.create({
      fromUserId: session.userId,
      toUserId,
      status: "pending",
    })

    return NextResponse.json({
      message: "Permintaan pertemanan terkirim",
      request: friendRequest,
    })
  } catch (error) {
    console.error("Friend request error:", error)
    return NextResponse.json({ message: "Terjadi kesalahan server" }, { status: 500 })
  }
}
