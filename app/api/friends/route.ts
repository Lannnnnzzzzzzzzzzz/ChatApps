import { NextResponse } from "next/server"
import { db } from "@/lib/database"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 })
    }

    const allUserRequests = db.friendRequests.findAllByUserId(session.userId)
    const acceptedRequests = allUserRequests.filter((req) => req.status === "accepted")

    // Get friends from accepted requests
    const friends: any[] = []

    acceptedRequests.forEach((request: any) => {
      const friendId = request.fromUserId === session.userId ? request.toUserId : request.fromUserId
      const friend = db.users.findById(friendId)
      if (friend) {
        friends.push({
          id: friend.id,
          username: friend.username,
          email: friend.email,
        })
      }
    })

    return NextResponse.json({ friends })
  } catch (error) {
    console.error("Get friends error:", error)
    return NextResponse.json({ message: "Terjadi kesalahan server" }, { status: 500 })
  }
}
