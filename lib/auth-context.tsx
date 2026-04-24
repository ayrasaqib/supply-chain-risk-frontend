"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { signUp, signIn } from "aws-amplify/auth";

import { initAmplify } from "@/lib/amplify-client";
import { fetchUserProfile } from "@/lib/auth-api";
import { signOut } from "aws-amplify/auth";
import { deleteUser } from "aws-amplify/auth";

interface User {
  id: string;
  name: string;
  email: string;
  companyName?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    companyName?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "supply-chain-auth";

async function safeFetchUserProfile() {
  try {
    return await fetchUserProfile();
  } catch (err) {
    console.warn(
      "Profile fetch failed, falling back to Cognito-only user:",
      err,
    );
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initAmplify();
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed.user);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);
  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await signOut({ global: true }).catch(() => {});
      const result = await signIn({
        username: email,
        password,
      });

      if (!result.isSignedIn) {
        return {
          success: false,
          error: "Login not completed",
        };
      }
      let profileName = email;

      const profile = await safeFetchUserProfile();

      const loggedInUser: User = {
        id: email.toLowerCase(),
        name: profile?.username || email,
        email,
        companyName: profile?.company_name,
      };

      setUser(loggedInUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: loggedInUser }));

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error:
          err.name === "UserNotConfirmedException"
            ? "User not confirmed"
            : err.message || "Login failed",
      };
    }
  };

  const refreshUser = async () => {
    try {
      const profile = await fetchUserProfile();

      const updatedUser: User = {
        id: profile.email.toLowerCase(),
        name: profile.username || profile.email,
        email: profile.email,
        companyName: profile.company_name,
      };

      setUser(updatedUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: updatedUser }));

      return updatedUser;
    } catch (err) {
      console.warn("Failed to refresh user:", err);
      return null;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    companyName?: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            preferred_username: name,
            "custom:company_name": companyName?.trim() || undefined,
          },
        },
      });

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Signup failed",
      };
    }
  };

  const logout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.warn("Cognito signOut failed:", err);
    }

    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const deleteAccount = async () => {
    try {
      await deleteUser(); // deletes Cognito user
    } catch (err) {
      console.warn("Failed to delete Cognito user:", err);
    }

    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
