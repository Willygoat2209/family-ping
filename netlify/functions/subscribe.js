const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  const { name, subscription } = JSON.parse(event.body);

  // Remove old subscription for this name, then insert new one
  await supabase.from("subscriptions").delete().eq("name", name);
  const { error } = await supabase.from("subscriptions").insert({ name, subscription });

  if (error) return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };

  return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
};
