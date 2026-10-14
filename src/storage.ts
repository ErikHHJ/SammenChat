import { seedMessages, seedOpenedDmIds, seedPosts } from "./data";
import type { AppState, Post } from "./types";

const STATE_KEY = "sammen-v3";
const SESSION_KEY = "sammen-session";

function isPost(value: unknown): value is Post {
  if (!value || typeof value !== "object") return false;
  const post = value as Post;
  return typeof post.id === "string" && typeof post.spaceId === "string" && typeof post.body === "string";
}

function normalize(state: AppState): AppState {
  return {
    posts: state.posts.filter(isPost).map((post) => ({
      ...post,
      likedBy: Array.isArray(post.likedBy) ? post.likedBy : [],
      comments: Array.isArray(post.comments) ? post.comments : [],
    })),
    messages: state.messages,
    openedDmIds: Array.isArray(state.openedDmIds) ? state.openedDmIds : [],
  };
}

function freshState(): AppState {
  return { posts: seedPosts, messages: seedMessages, openedDmIds: seedOpenedDmIds };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return freshState();
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return freshState();
    const candidate = parsed as AppState;
    if (!Array.isArray(candidate.posts) || !Array.isArray(candidate.messages)) return freshState();
    return normalize(candidate);
  } catch {
    return freshState();
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

export function resetState(): AppState {
  const fresh = freshState();
  saveState(fresh);
  return fresh;
}

export function loadSession(): string | null {
  return sessionStorage.getItem(SESSION_KEY);
}

export function saveSession(userId: string | null): void {
  if (userId) sessionStorage.setItem(SESSION_KEY, userId);
  else sessionStorage.removeItem(SESSION_KEY);
}
