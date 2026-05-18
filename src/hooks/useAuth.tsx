import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type LocalUser, onUserChange, getCurrentUser } from "@/lib/localAuth";

interface AuthContextValue {
  user: LocalUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<LocalUser | null>(getCurrentUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onUserChange((u) => {
      setUser(u);
      setLoading(false);
    });
    // Resolve loading immediately if we already have a user
    setLoading(false);
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
