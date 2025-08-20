import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json({ users: [] })
    }

    // Search users but exclude current user and existing friends/requests
    const searchResults = db.users.search(query)
    const filteredResults = searchResults.filter((user) => {
      // Exclude current user
      if (user.id === session.userId) return false

      // Check if already friends or has pending request
      const existingRequest = db.friendRequests.findByUsers(session.userId, user.id)
      return !existingRequest || existingRequest.status === "rejected"
    })

    return NextResponse.json({
      users: filteredResults.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
      })),
    })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ message: "Terjadi kesalahan server" }, { status: 500 })
  }
}
