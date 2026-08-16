const { createClient } = require("@supabase/supabase-js");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (req.headers["x-admin-password"] !== process.env.CSB_ADMIN_PASSWORD) {
    return res.status(401).json({ error: "كلمة المرور غير صحيحة" });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from("registrations")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      rows: data || []
    });

  } catch (e) {
    return res.status(500).json({
      error: e.message
    });
  }
};
