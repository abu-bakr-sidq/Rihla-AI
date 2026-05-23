import nodemailer from "nodemailer";

/**
 * Rihla AI Email Service
 * Handles OTP delivery and transactional notifications.
 */

const transporterPromise = (async () => {
  // Production / Provided Credentials
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    console.log("[EMAIL] Using provided SMTP credentials.");
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback: Ethereal (Test Account)
  console.log("[EMAIL] No SMTP credentials found. Creating a test account...");
  const testAccount = await nodemailer.createTestAccount();
  console.log(`[EMAIL] Test Account Created: ${testAccount.user}`);
  
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
})();

export async function sendOTPEmail(email: string, otp: string) {
  try {
    const transporter = await transporterPromise;
    
    const info = await transporter.sendMail({
      from: '"Rihla AI Concierge" <noreply@rihla-ai.com>',
      to: email,
      subject: `Your Recovery Code: ${otp}`,
      text: `Welcome back to Rihla AI. Your recovery code is: ${otp}. This code will expire in 15 minutes.`,
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 20px; background: #000; color: #fff; border: 1px solid #333;">
          <div style="border-bottom: 1px solid #333; padding-bottom: 20px; margin-bottom: 30px;">
             <h1 style="color: #D4AF37; margin: 0; font-size: 24px; letter-spacing: 4px;">RIHLA AI</h1>
          </div>
          <h2 style="font-size: 20px; margin-bottom: 10px;">Security Verification</h2>
          <p style="color: #888; font-size: 14px; line-height: 1.6;">
            We received a request to access your Rihla AI account. Please use the following code to continue with your password reset.
          </p>
          <div style="background: rgba(212, 175, 55, 0.1); border: 1px dashed #D4AF37; padding: 20px; border-radius: 12px; text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 12px; color: #D4AF37;">${otp}</span>
          </div>
          <p style="color: #888; font-size: 12px; margin-top: 30px; border-top: 1px solid #333; padding-top: 20px;">
            If you didn't request this code, you can safely ignore this email. Someone else might have typed your email address by mistake.
          </p>
          <p style="text-align: center; color: #444; font-size: 10px; margin-top: 40px;">
            &copy; 2026 RIHLA AI Travel Based Experience. All rights reserved.
          </p>
        </div>
      `,
    });

    // Log the Ethereal URL if using test account
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`\n[EMAIL] OTP sent to ${email}. View it here: ${previewUrl}\n`);
    } else {
      console.log(`[EMAIL] OTP sent to ${email}`);
    }
    
    return { success: true, previewUrl: previewUrl || undefined };
  } catch (error) {
    console.error(`[EMAIL] Failed to send email to ${email}:`, error);
    return { success: false };
  }
}
