import { NextResponse } from "next/server"
import { db } from "@/lib/database"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 })
    }

    // Get pending friend requests for current user
    const requests = db.friendRequests.findByUserId(session.userId)

    // Add user details for each request
    const requestsWithUsers = requests.map((request) => {
      const fromUser = db.users.findById(request.fromUserId)
      return {
        ...request,
        fromUser: {
          id: fromUser?.id,
          username: fromUser?.username,
          email: fromUser?.email,
        },
      }
    })

    return NextResponse.json({ requests: requestsWithUsers })
  } catch (error) {
    console.error("Get friend requests error:", error)
    return NextResponse.json({ message: "Terjadi kesalahan server" }, { status: 500 })
  }
}
