import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://uxnzrwkbqzbcfcxxkngc.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4bnpyd2ticXpiY2ZjeHhrbmdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NzM0NjcsImV4cCI6MjEwMDI0OTQ2N30.xfzlAPXNYtj4mV_HVK7tud57bi0rMKM2QMkL_0OzynE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
