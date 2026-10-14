import { useState } from "react";
import { authenticate, users } from "./data";
import { HomeScreen } from "./HomeScreen";
import { LoginScreen } from "./LoginScreen";
import { loadSession, saveSession } from "./storage";

export function App() {
  const [userId, setUserId] = useState<string | null>(() => loadSession());
  const user = users.find((person) => person.id === userId) ?? null;

  if (!user) {
    return (
      <LoginScreen
        onLogin={(email, password) => {
          const match = authenticate(email, password);
          if (!match) return false;
          saveSession(match.id);
          setUserId(match.id);
          return true;
        }}
      />
    );
  }

  return (
    <HomeScreen
      key={user.id}
      user={user}
      onLogout={() => {
        saveSession(null);
        setUserId(null);
      }}
    />
  );
}
