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

    const registrationNumber =
      "CSB-" +
      new Date().getFullYear() +
      "-" +
      Math.floor(1000 + Math.random() * 9000);

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
          total_amount: body.totalAmount
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
