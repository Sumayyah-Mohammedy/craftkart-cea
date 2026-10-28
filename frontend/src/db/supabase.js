import { createClient } from "@supabase/supabase-js";

// Supabase Storage holds product images and seller documents (uploaded straight
// from the browser). Its URL/anon key are PUBLIC build-time values.
// If they are not configured the rest of the app keeps working and only file
// uploads report an error (previously the whole site crashed on load).
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const notConfigured = new Error(
  "File uploads are not configured (REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_ANON_KEY missing at build time)"
);

const storageStub = {
  from: () => ({
    upload: async () => ({ data: null, error: notConfigured }),
    getPublicUrl: () => ({ data: { publicUrl: "" } }),
  }),
};

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : { storage: storageStub };

export const uploadsEnabled = Boolean(supabaseUrl && supabaseAnonKey);
