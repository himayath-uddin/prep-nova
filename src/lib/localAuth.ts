// ─────────────────────────────────────────────────────────────────────────────
// src/lib/localAuth.ts
// Lightweight local auth — no Firebase required.
// Stores users in localStorage. Works offline and in any environment.
// ─────────────────────────────────────────────────────────────────────────────

export type LocalUser = {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: number;
};

const USERS_KEY = "promptal_users";
const SESSION_KEY = "promptal_current_user";

function getUsers(): Record<string, LocalUser & { passwordHash: string }> {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) ?? "{}"); } catch { return {}; }
}
function saveUsers(users: ReturnType<typeof getUsers>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Simple hash (not cryptographic — good enough for local demo auth)
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = ((hash << 5) - hash) + password.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getCurrentUser(): LocalUser | null {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "null"); } catch { return null; }
}

function setCurrentUser(user: LocalUser | null) {
  if (user) sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else sessionStorage.removeItem(SESSION_KEY);
  // Dispatch custom event so useAuth hook can react
  window.dispatchEvent(new CustomEvent("localauth", { detail: user }));
}

export function registerWithEmail(email: string, password: string, displayName: string): LocalUser {
  const users = getUsers();
  const existing = Object.values(users).find(u => u.email === email);
  if (existing) throw new Error("An account with this email already exists.");
  if (password.length < 6) throw new Error("Password must be at least 6 characters.");
  const user: LocalUser & { passwordHash: string } = {
    uid: uid(), email, displayName, createdAt: Date.now(), passwordHash: hashPassword(password),
  };
  users[user.uid] = user;
  saveUsers(users);
  const { passwordHash: _ph, ...publicUser } = user;
  setCurrentUser(publicUser);
  return publicUser;
}

export function loginWithEmail(email: string, password: string): LocalUser {
  const users = getUsers();
  const user = Object.values(users).find(u => u.email === email);
  if (!user) throw new Error("No account found with this email. Please sign up.");
  if (user.passwordHash !== hashPassword(password)) throw new Error("Incorrect password.");
  const { passwordHash: _ph, ...publicUser } = user;
  setCurrentUser(publicUser);
  return publicUser;
}

// Simulated Google sign-in — asks for a display name if first time
export function loginWithGoogle(displayName?: string): LocalUser {
  const email = `google_user@promptal.local`;
  const users = getUsers();
  const existing = Object.values(users).find(u => u.email === email);
  if (existing) {
    const { passwordHash: _ph, ...publicUser } = existing;
    setCurrentUser(publicUser);
    return publicUser;
  }
  const name = displayName || "Google User";
  const user: LocalUser & { passwordHash: string } = {
    uid: uid(), email, displayName: name, createdAt: Date.now(), passwordHash: "",
    photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4285F4&color=fff`,
  };
  users[user.uid] = user;
  saveUsers(users);
  const { passwordHash: _ph, ...publicUser } = user;
  setCurrentUser(publicUser);
  return publicUser;
}

export function logout() {
  setCurrentUser(null);
}

export function onUserChange(cb: (user: LocalUser | null) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent<LocalUser | null>).detail);
  window.addEventListener("localauth", handler);
  // Call immediately with current state
  setTimeout(() => cb(getCurrentUser()), 0);
  return () => window.removeEventListener("localauth", handler);
}
