const { PKPass } = require("passkit-generator");
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

    // Read certificates as buffers
    const signerCertPath = path.join(process.cwd(), "api", "pass.pem");
    const signerKeyPath  = path.join(process.cwd(), "api", "pass.key");
    const wwdrPath       = path.join(process.cwd(), "api", "wwdr.pem");

    // Log what we find for debugging
    console.log("Cert path:", signerCertPath, "exists:", fs.existsSync(signerCertPath));
    console.log("Key path:", signerKeyPath, "exists:", fs.existsSync(signerKeyPath));
    console.log("WWDR path:", wwdrPath, "exists:", fs.existsSync(wwdrPath));

    const signerCert = fs.readFileSync(signerCertPath, "utf8");
    const signerKey  = fs.readFileSync(signerKeyPath, "utf8");
    const wwdr       = fs.readFileSync(wwdrPath, "utf8");

    console.log("signerCert starts with:", signerCert.substring(0, 30));
    console.log("wwdr starts with:", wwdr.substring(0, 30));
    console.log("signerKey starts with:", signerKey.substring(0, 30));

    const pass = await PKPass.from({
      model: path.join(process.cwd(), "api", "pass.model"),
      certificates: {
        wwdr,
        signerCert,
        signerKey,
        signerKeyPassphrase: process.env.PASS_PHRASE || "cogpass123",
      },
    }, {
      serialNumber: code,
      description: "Chain of Gratuity Pass",
    });

    pass.headerFields.push({ key:"code", label:"Chain Code", value:code });
    pass.primaryFields.push({ key:"status", label:"Status", value:"Active ✦" });
    if (name) pass.secondaryFields.push({ key:"name", label:"Holder", value:name });
    if (city) pass.secondaryFields.push({ key:"city", label:"Origin", value:city });
    pass.auxiliaryFields.push({ key:"website", label:"Website", value:"chainofgratuity.com" });

    const buffer = await pass.getAsBuffer();

    res.setHeader("Content-Type", "application/vnd.apple.pkpass");
    res.setHeader("Content-Disposition", `attachment; filename="${code}.pkpass"`);
    res.send(buffer);

  } catch (error) {
    console.error("Pass generation error:", error.message);
    console.error("Full error:", error);
    res.status(500).json({ error: "Failed to generate pass", details: error.message });
  }
};
