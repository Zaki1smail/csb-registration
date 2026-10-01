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

    const { id, registrationNumber, fileType, fileData } = req.body;

    const allowedFields = {
      childPhoto: "child_photo_file",
      medical: "medical_file",
      birthCertificate: "birth_certificate_file"
    };

    const columnName = allowedFields[fileType];

    if (!id || !columnName || !fileData) {
      return res.status(400).json({ error: "بيانات ناقصة" });
    }

    const matches = fileData.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: "صيغة الملف غير صحيحة" });
    }

    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], "base64");
    const path = registrationNumber + "/" + fileType + "-" + Date.now() + ".jpg";

    const { error: uploadError } = await supabase.storage
      .from("registrations")
      .upload(path, buffer, { contentType: mimeType, upsert: true });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("registrations")
      .getPublicUrl(path);

    const { error: updateError } = await supabase
      .from("registrations")
      .update({ [columnName]: urlData.publicUrl })
      .eq("id", id);

    if (updateError) throw updateError;

    return res.status(200).json({
      success: true,
      url: urlData.publicUrl
    });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
