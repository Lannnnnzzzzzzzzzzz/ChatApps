import { NextResponse } from "next/server"
import { clearSession } from "@/lib/auth"

export async function POST() {
  try {
    await clearSession()
    return NextResponse.json({ message: "Logout berhasil" })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ message: "Terjadi kesalahan server" }, { status: 500 })
  }
}
