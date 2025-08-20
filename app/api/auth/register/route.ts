import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/database"
import { setSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password, username } = await request.json()

    // Validate input
    if (!email || !password || !username) {
      return NextResponse.json({ message: "Email, password, dan username harus diisi" }, { status: 400 })
    }

    // Check if user already exists
    const existingUserByEmail = await db.users.findByEmail(email)
    if (existingUserByEmail) {
      return NextResponse.json({ message: "Email sudah terdaftar" }, { status: 400 })
    }

    const existingUserByUsername = await db.users.findByUsername(username)
    if (existingUserByUsername) {
      return NextResponse.json({ message: "Username sudah digunakan" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await db.users.create({
      email,
      password: hashedPassword,
      username,
    })

    // Set session
    await setSession(user._id.toString(), user.username, user.email)

    return NextResponse.json(
      { message: "Registrasi berhasil", user: { id: user._id.toString(), username: user.username, email: user.email } },
      { status: 201 },
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ message: "Terjadi kesalahan server" }, { status: 500 })
  }
}
