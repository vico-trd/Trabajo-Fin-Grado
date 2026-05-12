import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ndclcroeswtazqzygbdg.supabase.co";
const SUPABASE_KEY = "sb_publishable_ZLip2Lj3Um6BNao4qVFC3g__QQCg__Z";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
