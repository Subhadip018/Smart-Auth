const nodemailer = require("nodemailer");

// Creates a transporter using Gmail OAuth2 — works in production for ALL recipients
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.GMAIL_USER,               // your Gmail address
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN, // from OAuth2 Playground (see README)
    },
  });
};

const sendOTPEmail = async (toEmail, otp, purpose) => {
  const transporter = createTransporter();

  const subjects = {
    login: "Your Login Verification Code",
    register: "Verify Your Email Address",
    reset: "Reset Your Password — Verification Code",
  };

  const intros = {
    login: "Use the code below to complete your login.",
    register: "Welcome! Use the code below to verify your email and create your account.",
    reset: "You requested a password reset. Use the code below to proceed.",
  };

  const mailOptions = {
    from: `"MyApp Auth" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: subjects[purpose] || "Your Verification Code",
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #f9f9f9; border-radius: 12px; padding: 40px 32px; border: 1px solid #e4e4e7;">
        <h2 style="color: #18181b; margin: 0 0 8px 0; font-size: 22px;">Verification Code</h2>
        <p style="color: #71717a; font-size: 15px; margin: 0 0 32px 0;">${intros[purpose]}</p>
        <div style="background: #18181b; border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 32px;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #ffffff; font-family: monospace;">${otp}</span>
        </div>
        <p style="color: #a1a1aa; font-size: 13px; margin: 0;">This code expires in <strong>10 minutes</strong>. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email] Verification email sent successfully to ${toEmail}`);
  } catch (err) {
    console.warn("\n========================================================");
    console.warn(`[WARNING] Failed to send email to ${toEmail} via Gmail.`);
    console.warn(`If you haven't set up your .env variables, this is expected.`);
    console.warn(`>>> YOUR OTP VERIFICATION CODE IS: ${otp} <<<`);
    console.warn("========================================================\n");
    // Do not throw the error in development, so the user can copy the OTP from the terminal
    if (process.env.NODE_ENV === "production") {
      throw err;
    }
  }
};

module.exports = { sendOTPEmail };
