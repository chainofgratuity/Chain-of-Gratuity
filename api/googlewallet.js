const { GoogleAuth } = require("google-auth-library");
const path = require("path");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { code, name, city } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Chain code is required" });
    }

    const credentials = JSON.parse(process.env.GOOGLE_KEY_JSON);
    const issuerId = process.env.GOOGLE_ISSUER_ID;
    const classId = `${issuerId}.chain_of_gratuity_pass`;
    const objectId = `${issuerId}.${code.replace(/-/g, "_")}`;

    const genericObject = {
      id: objectId,
      classId: classId,
      genericType: "GENERIC_TYPE_UNSPECIFIED",
      hexBackgroundColor: "#1A1A2E",
      logo: {
        sourceUri: {
          uri: "https://chainofgratuity.com/logo.png",
        },
      },
      cardTitle: {
        defaultValue: {
          language: "en-US",
          value: "Chain of Gratuity",
        },
      },
      subheader: {
        defaultValue: {
          language: "en-US",
          value: "Good Deed Pass",
        },
      },
      header: {
        defaultValue: {
          language: "en-US",
          value: code,
        },
      },
      textModulesData: [
        {
          id: "status",
          header: "Status",
          bod