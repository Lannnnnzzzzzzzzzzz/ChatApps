import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 })
    }

    const userId = params.id

    // Find the user
    const user = db.users.findById(userId)
    if (!user) {
      return NextResponse.json({ message: "User tidak ditemukan" }, { status: 404 })
    }

    // Check if they are friends
    const friendRequest = db.friendRequests.findByUsers(session.userId, userId)
    if (!friendRequest || friendRequest.status !== "accepted") {
      return NextResponse.json({ message: "Anda tidak berteman dengan user ini" }, { status: 403 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json({ message: "Terjadi kesalahan server" }, { status: 500 })
  }
}
