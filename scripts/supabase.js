import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

export const supabase = createClient(
  "https://fkupguxughbxxpkhpipe.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrdXBndXh1Z2hieHhwa2hwaXBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwODc3NDAsImV4cCI6MjA1ODY2Mzc0MH0.tFHk_JB6r8UD4oJIWayXzQ7dNV-ijySXj96_wDmBBNI",
  {
    auth: {
      persistSession: true,        
      autoRefreshToken: true,      
      detectSessionInUrl: true     
    }
  }
);


const MAX_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24h de connection
const now = Date.now();
const sessionInfo = localStorage.getItem("session-start");

if (!sessionInfo) {
  localStorage.setItem("session-start", now);
} else if (now - parseInt(sessionInfo, 10) > MAX_SESSION_DURATION) {
  supabase.auth.signOut().then(() => {
    localStorage.removeItem("session-start");
    window.location.href = "login.html";
  });
}