const { createClient } = require("@supabase/supabase-js");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
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

    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: "معرف السجل مفقود" });
    }

    const { data: row, error: fetchError } = await supabase
      .from("registrations")
      .select("child_photo_file")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    const url = row && row.child_photo_file;
    if (url) {
      const marker = "/object/public/registrations/";
      const index = url.indexOf(marker);
      if (index !== -1) {
        const path = decodeURIComponent(
          url.substring(index + marker.length).split("?")[0]
        );
        const { error: removeError } = await supabase.storage
          .from("registrations")
          .remove([path]);
        if (removeError) throw removeError;
      }
    }

    const { error } = await supabase
      .from("registrations")
      .update({ child_photo_file: null })
      .eq("id", id);

    if (error) throw error;

    return res.status(200).json({ success: true });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
