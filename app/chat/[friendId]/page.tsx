"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  username: string
  email: string
}

interface Message {
  id: string
  fromUserId: string
  toUserId: string
  content: string
  createdAt: string
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const friendId = params.friendId as string

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [friend, setFriend] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkAuth()
    loadFriend()
    loadMessages()

    // Set up polling for real-time messages
    const interval = setInterval(loadMessages, 2000)
    return () => clearInterval(interval)
  }, [friendId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data.user)
      } else {
        router.push("/")
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      router.push("/")
    }
  }

  const loadFriend = async () => {
    try {
      const response = await fetch(`/api/users/${friendId}`)
      if (response.ok) {
        const data = await response.json()
        setFriend(data.user)
      } else {
        toast({ title: "Error", description: "Teman tidak ditemukan", variant: "destructive" })
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Failed to load friend:", error)
      router.push("/dashboard")
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/messages/${friendId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
      }
    } catch (error) {
      console.error("Failed to load messages:", error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId: friendId,
          content: newMessage.trim(),
        }),
      })

      if (response.ok) {
        setNewMessage("")
        loadMessages() // Refresh messages
      } else {
        const data = await response.json()
        toast({ title: "Gagal mengirim pesan", description: data.message, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Terjadi kesalahan saat mengirim pesan", variant: "destructive" })
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Hari ini"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Kemarin"
    } else {
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    }
  }

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {}
    messages.forEach((message) => {
      const date = new Date(message.createdAt).toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
    })
    return groups
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading chat...</div>
      </div>
    )
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Chat Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
          <Avatar>
            <AvatarFallback className="bg-blue-500 text-white">
              {friend?.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-semibold">@{friend?.username}</h1>
            <p className="text-sm text-muted-foreground">Online</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 max-w-4xl mx-auto w-full p-4">
        <Card className="h-[calc(100vh-200px)] flex flex-col">
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full p-4">
              {Object.keys(messageGroups).length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <p className="text-lg mb-2">Belum ada pesan</p>
                    <p className="text-sm">Mulai percakapan dengan mengirim pesan pertama!</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(messageGroups).map(([date, dayMessages]) => (
                    <div key={date}>
                      {/* Date separator */}
                      <div className="flex items-center justify-center my-4">
                        <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                          {formatDate(dayMessages[0].createdAt)}
                        </div>
                      </div>

                      {/* Messages for this date */}
                      <div className="space-y-2">
                        {dayMessages.map((message) => {
                          const isFromCurrentUser = message.fromUserId === currentUser?.id
                          return (
                            <div
                              key={message.id}
                              className={`flex ${isFromCurrentUser ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg px-3 py-2 ${
                                  isFromCurrentUser
                                    ? "bg-blue-500 text-white"
                                    : "bg-white border border-gray-200 text-gray-900"
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                                <p className={`text-xs mt-1 ${isFromCurrentUser ? "text-blue-100" : "text-gray-500"}`}>
                                  {formatTime(message.createdAt)}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
          </CardContent>

          {/* Message Input */}
          <CardHeader className="border-t p-4">
            <form onSubmit={sendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ketik pesan..."
                disabled={sending}
                className="flex-1"
              />
              <Button type="submit" disabled={sending || !newMessage.trim()} size="sm" className="gap-2">
                <Send className="h-4 w-4" />
                {sending ? "..." : "Kirim"}
              </Button>
            </form>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
