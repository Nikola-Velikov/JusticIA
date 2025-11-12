import React from "react";
import { Navigate, useLocation } from "react-router-dom";

type GuardProps = { children: React.ReactElement };

// Requires an auth token; otherwise redirect to login
export function ProtectedRoute({ children }: GuardProps) {
  const location = useLocation();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

// Only for guests; if token exists, redirect to /chat and request a new chat
export function GuestRoute({ children }: GuardProps) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    try { sessionStorage.setItem('newChatOnNextVisit', '1'); } catch {}
    return <Navigate to="/chat" replace />;
  }
  return children;
}
