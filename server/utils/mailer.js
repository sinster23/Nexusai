// utils/mailer.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sendOTPEmail = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: email,
    subject: "Email Verification for NexusAI",
    html: `
  <p>Dear User,</p>
  <p>Thank you for signing up! To complete your registration, please use the following One-Time Password (OTP):</p>
  <h2>${otp}</h2>
  <p>This OTP is valid for <strong>10 minutes</strong>. Please do not share it with anyone.</p>
  <p>If you did not request this, you can safely ignore this email.</p>
  <br>
  <p>Best regards,<br>
  NexusAI Team</p>
`,
  });
};

module.exports = sendOTPEmail;
