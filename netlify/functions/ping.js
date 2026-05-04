const { createClient } = require("@supabase/supabase-js");
const webpush = require("web-push");

webpush.setVapidDetails(
  "mailto:demo@example.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

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

  const { senderName, message } = JSON.parse(event.body);

  const { data: subs, error } = await supabase.from("subscriptions").select("*");
  if (error) return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };

  const payload = JSON.stringify({
    title: `📨 ${senderName}`,
    body: message,
  });

  // Send to everyone except the sender
  const sends = subs
    .filter((s) => s.name !== senderName)
    .map((s) =>
      webpush.sendNotification(s.subscription, payload).catch((err) => {
        // If subscription is expired, remove it
        if (err.statusCode === 410) {
          supabase.from("subscriptions").delete().eq("id", s.id);
        }
      })
    );

  await Promise.all(sends);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, sent: sends.length }),
  };
};
