const { createClient } = require("@supabase/supabase-js");

module.exports = async (req, res) => {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    const body = req.body || {};

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const subscription =
      Number(body.subscription || 0);

    const memberType =
      body.member_type || "new";

    const amount =
      subscription +
      (memberType === "new" ? 500 : 0);

    const { data, error } =
      await supabase
        .from("registrations")
        .insert({
          child_name: body.child_name,
          birth_date: body.birth_date || null,
          gender: body.gender || null,
          age_group: body.age_group || null,
          swimming_level: body.swimming_level || null,
          member_type: memberType,
          parent_name: body.parent_name,
          phone: body.phone,
          address: body.address || null,
          subscription:
            subscription === 6500
              ? "3 أشهر - 6500 دج"
              : "شهر واحد - 2000 دج",
          amount: amount,
          status: "قيد الدراسة"
        })
        .select("registration_number")
        .single();

    if (error) {
      console.error(error);

      return res.status(500).json({
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      registration_number:
        data.registration_number,
      amount: amount
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "حدث خطأ أثناء حفظ التسجيل"
    });

  }
};
