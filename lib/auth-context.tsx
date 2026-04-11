"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  id: string
  name: string
  email: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = "supply-chain-auth"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setUser(parsed.user)
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800))
    
    // Get stored users
    const usersStr = localStorage.getItem("supply-chain-users")
    const users: Record<string, { name: string; email: string; password: string }> = usersStr ? JSON.parse(usersStr) : {}
    
    const userRecord = users[email.toLowerCase()]
    
    if (!userRecord) {
      return { success: false, error: "No account found with this email" }
    }
    
    if (userRecord.password !== password) {
      return { success: false, error: "Incorrect password" }
    }
    
    const loggedInUser: User = {
      id: email.toLowerCase(),
      name: userRecord.name,
      email: userRecord.email,
    }
    
    setUser(loggedInUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: loggedInUser }))
    
    return { success: true }
  }

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800))
    
    // Get stored users
    const usersStr = localStorage.getItem("supply-chain-users")
    const users: Record<string, { name: string; email: string; password: string }> = usersStr ? JSON.parse(usersStr) : {}
    
    if (users[email.toLowerCase()]) {
      return { success: false, error: "An account with this email already exists" }
    }
    
    // Store new user
    users[email.toLowerCase()] = { name, email: email.toLowerCase(), password }
    localStorage.setItem("supply-chain-users", JSON.stringify(users))
    
    const newUser: User = {
      id: email.toLowerCase(),
      name,
      email: email.toLowerCase(),
    }
    
    setUser(newUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: newUser }))
    
    return { success: true }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}