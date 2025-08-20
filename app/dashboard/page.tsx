"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Search, UserPlus, Check, X, MessageCircle, LogOut } from "lucide-react"

interface User {
  id: string
  username: string
  email: string
}

interface FriendRequest {
  id: string
  fromUserId: string
  toUserId: string
  fromUser: User
  status: "pending" | "accepted" | "rejected"
}

interface Friend {
  id: string
  username: string
  email: string
}

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    checkAuth()
    loadFriendRequests()
    loadFriends()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data.user)
      } else {
        window.location.href = "/"
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      window.location.href = "/"
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.users)
      }
    } catch (error) {
      console.error("Search failed:", error)
    }
  }

  const sendFriendRequest = async (toUserId: string) => {
    try {
      const response = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({ title: "Friend request terkirim!", description: "Menunggu konfirmasi dari user." })
        // Remove from search results
        setSearchResults((prev) => prev.filter((user) => user.id !== toUserId))
      } else {
        toast({ title: "Gagal mengirim request", description: data.message, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Terjadi kesalahan", variant: "destructive" })
    }
  }

  const loadFriendRequests = async () => {
    try {
      const response = await fetch("/api/friends/requests")
      if (response.ok) {
        const data = await response.json()
        setFriendRequests(data.requests)
      }
    } catch (error) {
      console.error("Failed to load friend requests:", error)
    }
  }

  const loadFriends = async () => {
    try {
      const response = await fetch("/api/friends")
      if (response.ok) {
        const data = await response.json()
        setFriends(data.friends)
      }
    } catch (error) {
      console.error("Failed to load friends:", error)
    }
  }

  const respondToFriendRequest = async (requestId: string, action: "accept" | "reject") => {
    try {
      const response = await fetch("/api/friends/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      })

      if (response.ok) {
        toast({
          title: action === "accept" ? "Friend request diterima!" : "Friend request ditolak",
          description: action === "accept" ? "Sekarang kalian berteman!" : "Request telah ditolak.",
        })
        loadFriendRequests()
        if (action === "accept") {
          loadFriends()
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "Terjadi kesalahan", variant: "destructive" })
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      window.location.href = "/"
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const startChat = (friendId: string) => {
    window.location.href = `/chat/${friendId}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-blue-500 text-white">
                {currentUser?.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-semibold text-lg">Halo, {currentUser?.username}!</h1>
              <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={logout} className="gap-2 bg-transparent">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search">Cari Teman</TabsTrigger>
            <TabsTrigger value="requests" className="relative">
              Permintaan
              {friendRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                  {friendRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="friends">Teman ({friends.length})</TabsTrigger>
          </TabsList>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Cari Teman Baru
                </CardTitle>
                <CardDescription>Cari user berdasarkan username untuk menambahkan sebagai teman</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Masukkan username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && searchUsers()}
                  />
                  <Button onClick={searchUsers}>Cari</Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium">Hasil Pencarian:</h3>
                    {searchResults.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">@{user.username}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <Button onClick={() => sendFriendRequest(user.id)} size="sm" className="gap-2">
                          <UserPlus className="h-4 w-4" />
                          Add Friend
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Friend Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Permintaan Pertemanan</CardTitle>
                <CardDescription>Kelola permintaan pertemanan yang masuk</CardDescription>
              </CardHeader>
              <CardContent>
                {friendRequests.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Tidak ada permintaan pertemanan</p>
                ) : (
                  <div className="space-y-3">
                    {friendRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{request.fromUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">@{request.fromUser.username}</p>
                            <p className="text-sm text-muted-foreground">ingin berteman dengan Anda</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => respondToFriendRequest(request.id, "accept")}
                            size="sm"
                            className="gap-2"
                          >
                            <Check className="h-4 w-4" />
                            Terima
                          </Button>
                          <Button
                            onClick={() => respondToFriendRequest(request.id, "reject")}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <X className="h-4 w-4" />
                            Tolak
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Friends Tab */}
          <TabsContent value="friends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Daftar Teman</CardTitle>
                <CardDescription>Teman-teman Anda yang sudah terkonfirmasi</CardDescription>
              </CardHeader>
              <CardContent>
                {friends.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Belum ada teman. Mulai cari dan tambahkan teman!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {friends.map((friend) => (
                      <div key={friend.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{friend.username.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">@{friend.username}</p>
                            <p className="text-sm text-muted-foreground">{friend.email}</p>
                          </div>
                        </div>
                        <Button onClick={() => startChat(friend.id)} size="sm" className="gap-2">
                          <MessageCircle className="h-4 w-4" />
                          Chat
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
