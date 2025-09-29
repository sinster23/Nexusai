// routes/authRoute.js
const express = require("express");
const router = express.Router();
const db = require("../firebase"); // import the initialized Firestore
const sendOTPEmail = require("../utils/mailer");
const { randomInt } = require("crypto");

router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  const otp = randomInt(100000, 999999);
  const expiresAt = Date.now() + 10 * 60 * 1000;

  try {
    await db.collection("emailOtps").doc(email).set({ otp, expiresAt });
    await sendOTPEmail(email, otp);
    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  try {
    const docRef = db.collection("emailOtps").doc(email);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(400).json({ error: "No OTP request found for this email" });
    }

    const { otp: storedOtp, expiresAt } = doc.data();

    if (Date.now() > expiresAt) {
      return res.status(400).json({ error: "OTP expired" });
    }

    if (storedOtp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // OTP valid → delete it
    await docRef.delete();

    return res.json({ success: true, message: "OTP verified" });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
