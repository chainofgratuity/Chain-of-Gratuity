const SUPABASE_URL = "https://ewowbwhfdpbnuvaqmxkk.supabase.co";
const SUPABASE_KEY = "sb_publishable_t5pln0r4nj3tiVdZ8_qUrg_pLKnAQ1i";

module.exports = async (req, res) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/chain_posts?limit=1`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });
    const data = await response.json();
    res.status(200).json({ status: "alive", timestamp: new Date().toISOString() });
  } catch(e) {
    res.status(500).json({ status: "error", message: e.message });
  }
};