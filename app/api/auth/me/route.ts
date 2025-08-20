import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ message: "Tidak terautentikasi" }, { status: 401 })
    }

    return NextResponse.json({
      user: {
        id: session.userId,
        username: session.username,
        email: session.email,
      },
    })
  } catch (error) {
    console.error("Session check error:", error)
    return NextResponse.json({ message: "Terjadi kesalahan server" }, { status: 500 })
  }
}
