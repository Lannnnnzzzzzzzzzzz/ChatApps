import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 })
    }

    const { requestId, action } = await request.json()

    if (!requestId || !action || !["accept", "reject"].includes(action)) {
      return NextResponse.json({ message: "Data tidak valid" }, { status: 400 })
    }

    // Update friend request status
    const updatedRequest = db.friendRequests.updateStatus(requestId, action)

    if (!updatedRequest) {
      return NextResponse.json({ message: "Permintaan tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json({
      message: action === "accept" ? "Permintaan diterima" : "Permintaan ditolak",
      request: updatedRequest,
    })
  } catch (error) {
    console.error("Respond to friend request error:", error)
    return NextResponse.json({ message: "Terjadi kesalahan server" }, { status: 500 })
  }
}
