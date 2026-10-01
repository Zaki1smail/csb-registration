const { createClient } = require("@supabase/supabase-js");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const body = req.body;

    const { data: existing, error: checkError } = await supabase
      .from("registrations")
      .select("id")
      .eq("child_name", body.childName)
      .eq("birth_date", body.birthDate)
      .limit(1);

    if (checkError) throw checkError;

    if (existing && existing.length > 0) {
      return res.status(409).json({
        error: "هذا الطفل مسجّل مسبقًا بنفس الاسم وتاريخ الميلاد."
      });
    }

    const registrationNumber =
      "CSB-" +
      new Date().getFullYear() +
      "-" +
      Math.floor(1000 + Math.random() * 9000);

    async function uploadFile(base64Data, fileName) {
      if (!base64Data) return null;

      const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
      if (!matches) return null;

      const mimeType = matches[1];
      const buffer = Buffer.from(matches[2], "base64");
      const path = registrationNumber + "/" + fileName;

      const { error } = await supabase.storage
        .from("registrations")
        .upload(path, buffer, { contentType: mimeType, upsert: true });

      if (error) throw error;

      const { data } = supabase.storage
        .from("registrations")
        .getPublicUrl(path);

      return data.publicUrl;
    }

    const childPhotoUrl = await uploadFile(body.childPhoto, "child-photo.jpg");
    const medicalUrl = await uploadFile(body.medical, "medical.jpg");
    const birthCertUrl = await uploadFile(body.birthCertificate, "birth-certificate.jpg");

    const { data, error } = await supabase
      .from("registrations")
      .insert([
        {
          child_name: body.childName,
          birth_date: body.birthDate,
          gender: body.gender,
          age_group: body.ageGroup,
          level: body.level,
          member_type: body.memberType,
          parent_name: body.parentName,
          phone: body.phone,
          address: body.address,
          subscription: body.subscription,
          registration_number: registrationNumber,
          total_amount: body.totalAmount,
          child_photo_file: childPhotoUrl,
          medical_file: medicalUrl,
          birth_certificate_file: birthCertUrl
        }
      ])
      .select();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      registration_number: registrationNumber,
      data
    });

  } catch (e) {
    return res.status(500).json({
      error: e.message
    });
  }
};
