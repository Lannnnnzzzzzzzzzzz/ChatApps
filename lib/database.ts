import mongoose from "mongoose"

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/chat-messenger"

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable")
}

// Global mongoose connection
let cached = (global as any).mongoose

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null }
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

// Schemas
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
})

const FriendRequestSchema = new mongoose.Schema({
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  toUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
})

const MessageSchema = new mongoose.Schema({
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  toUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
})

// Models
const User = mongoose.models.User || mongoose.model("User", UserSchema)
const FriendRequest = mongoose.models.FriendRequest || mongoose.model("FriendRequest", FriendRequestSchema)
const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema)

// Database operations
export const db = {
  users: {
    create: async (user: { username: string; email: string; password: string }) => {
      await connectDB()
      const newUser = new User(user)
      return await newUser.save()
    },
    findByEmail: async (email: string) => {
      await connectDB()
      return await User.findOne({ email })
    },
    findByUsername: async (username: string) => {
      await connectDB()
      return await User.findOne({ username })
    },
    findById: async (id: string) => {
      await connectDB()
      return await User.findById(id)
    },
    search: async (query: string) => {
      await connectDB()
      return await User.find({
        username: { $regex: query, $options: "i" },
      }).select("-password")
    },
  },
  friendRequests: {
    create: async (request: { fromUserId: string; toUserId: string; status?: string }) => {
      await connectDB()
      const newRequest = new FriendRequest(request)
      return await newRequest.save()
    },
    findByUsers: async (fromUserId: string, toUserId: string) => {
      await connectDB()
      return await FriendRequest.findOne({
        $or: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      })
    },
    findByUserId: async (userId: string) => {
      await connectDB()
      return await FriendRequest.find({
        toUserId: userId,
        status: "pending",
      }).populate("fromUserId", "username email")
    },
    updateStatus: async (id: string, status: string) => {
      await connectDB()
      return await FriendRequest.findByIdAndUpdate(id, { status }, { new: true })
    },
    findAllByUserId: async (userId: string) => {
      await connectDB()
      return await FriendRequest.find({
        $or: [{ fromUserId: userId }, { toUserId: userId }],
      })
    },
  },
  messages: {
    create: async (message: { fromUserId: string; toUserId: string; content: string }) => {
      await connectDB()
      const newMessage = new Message(message)
      return await newMessage.save()
    },
    findBetweenUsers: async (userId1: string, userId2: string) => {
      await connectDB()
      return await Message.find({
        $or: [
          { fromUserId: userId1, toUserId: userId2 },
          { fromUserId: userId2, toUserId: userId1 },
        ],
      }).sort({ createdAt: 1 })
    },
  },
}

export { connectDB, User, FriendRequest, Message }
