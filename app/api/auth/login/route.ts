import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/database"
import { setSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ message: "Email dan password harus diisi" }, { status: 400 })
    }

    // Find user
    const user = await db.users.findByEmail(email)
    if (!user) {
      return NextResponse.json({ message: "Email atau password salah" }, { status: 401 })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json({ message: "Email atau password salah" }, { status: 401 })
    }

    // Set session
    await setSession(user._id.toString(), user.username, user.email)

    return NextResponse.json(
      { message: "Login berhasil", user: { id: user._id.toString(), username: user.username, email: user.email } },
      { status: 200 },
    )
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "Terjadi kesalahan server" }, { status: 500 })
  }
}
