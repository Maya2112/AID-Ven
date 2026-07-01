import { createClient } from "@supabase/supabase-js";

const SUPA_URL = "https://uxivvdvnkegoexzkjrka.supabase.co";
const SUPA_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4aXZ2ZHZua2Vnb2V4emtqcmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NjU2MTYsImV4cCI6MjA5ODM0MTYxNn0.jUKc8_txVaax6UCuguzPvlryIqHuEpB6Rgo3QNxBTIs";

// Singleton: se instancia una sola vez y se reutiliza en toda la app.
// Esto evita crear múltiples conexiones innecesarias.
export const supabase = createClient(SUPA_URL, SUPA_KEY);
