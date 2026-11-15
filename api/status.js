const { createClient } = require("@supabase/supabase-js");

module.exports = async (req, res) => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data } = await supabase.from("settings").select("key,value");
  const s = Object.fromEntries((data || []).map(r => [r.key, r.value]));

  const dateReached = s.reopen_date && new Date() >= new Date(s.reopen_date);
  const open = s.registration_open !== "false" || dateReached;

  res.status(200).json({ open, reopen_date: s.reopen_date || null });
};
