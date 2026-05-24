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

    const signerCert = fs.readFileSync(path.join(process.cwd(), "api", "pass.pem"), "utf8");
    const signerKey  = fs.readFileSync(path.join(process.cwd(), "api", "pass.key"), "utf8");
    const wwdr       = fs.readFileSync(path.join(process.cwd(), "api", "wwdr.pem"), "utf8");

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
      // QR code linking directly to the chain page
      barcodes: [{
        message: `https://chainofgratuity.com/chain/${code}`,
        format: "PKBarcodeFormatQR",
        messageEncoding: "iso-8859-1",
        altText: code,
      }],
    });

    // Header - chain code prominent at top
    pass.headerFields.push({
      key: "code",
      label: "Chain Code",
      value: code,
    });

    // Primary - status
    pass.primaryFields.push({
      key: "status",
      label: "Status",
      value: "Active ✦",
    });

    // Secondary - holder and origin
    if (name) {
      pass.secondaryFields.push({
        key: "name",
        label: "Holder",
        value: name,
      });
    }

    if (city) {
      pass.secondaryFields.push({
        key: "city",
        label: "Origin",
        value: city,
      });
    }

    // Auxiliary - website
    pass.auxiliaryFields.push({
      key: "website",
      label: "Scan to view chain",
      value: `chainofgratuity.com/chain/${code}`,
    });

    const buffer = await pass.getAsBuffer();

    res.setHeader("Content-Type", "application/vnd.apple.pkpass");
    res.setHeader("Content-Disposition", `attachment; filename="${code}.pkpass"`);
    res.send(buffer);

  } catch (error) {
    console.error("Pass generation error:", error.message);
    res.status(500).json({ error: "Failed to generate pass", details: error.message });
  }
};
