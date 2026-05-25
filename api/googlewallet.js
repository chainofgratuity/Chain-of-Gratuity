const { GoogleAuth } = require("google-auth-library");
const jwt = require("crypto");
const path = require("path");
const fs = require("fs");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { code, name, city } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Chain code is required" });
    }

    const keyFile = path.join(process.cwd(), "api", "google-key.json");
    const credentials = JSON.parse(fs.readFileSync(keyFile, "utf8"));

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
          body: "Active ✦",
        },
        ...(name ? [{
          id: "holder",
          header: "Holder",
          body: name,
        }] : []),
        ...(city ? [{
          id: "origin",
          header: "Origin",
          body: city,
        }] : []),
        {
          id: "website",
          header: "Scan to view chain",
          body: `chainofgratuity.com/chain/${code}`,
        },
      ],
      barcode: {
        type: "QR_CODE",
        value: `https://chainofgratuity.com/chain/${code}`,
        alternateText: code,
      },
    };

    const claims = {
      iss: credentials.client_email,
      aud: "google",
      origins: ["chainofgratuity.com"],
      typ: "savetowallet",
      payload: {
        genericObjects: [genericObject],
      },
    };

    const auth = new GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/wallet_object.issuer"],
    });

    const client = await auth.getClient();
    const token = await client.sign(JSON.stringify(claims));

    const saveUrl = `https://pay.google.com/gp/v/save/${token}`;

    res.status(200).json({ saveUrl });

  } catch (error) {
    console.error("Google Wallet error:", error.message);
    res.status(500).json({ error: "Failed to generate Google Wallet pass", details: error.message });
  }
};