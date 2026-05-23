import nodemailer from "nodemailer";

let fallbackTransporterPromise = null;

function createPrimaryTransporter() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function getFallbackTransporter() {
  if (!fallbackTransporterPromise) {
    console.log("[EMAIL] Falling back to Ethereal test inbox...");
    fallbackTransporterPromise = nodemailer
      .createTestAccount()
      .then((testAccount) => {
        console.log(`[EMAIL] Test Account Created: ${testAccount.user} / ${testAccount.pass}`);
        return nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
      })
      .catch((error) => {
        console.error("[EMAIL] Failed to create fallback test account:", error);
        return null;
      });
  }

  return fallbackTransporterPromise;
}

function getSenderAddress() {
  const senderEmail = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@rihla-ai.com";
  return `"Rihla AI" <${senderEmail}>`;
}

function buildOtpMessage(email, otp) {
  return {
    from: getSenderAddress(),
    to: email,
    subject: `Your Recovery Code: ${otp}`,
    text: `Welcome back to Rihla AI. Your recovery code is: ${otp}. This code will expire in 15 minutes.`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { margin: 0; padding: 0; background-color: #000; font-family: Arial, sans-serif; }
          .wrap { max-width: 500px; margin: 0 auto; background: #080808; border: 1px solid #D4AF37; border-radius: 24px; padding: 40px 32px; color: #fff; }
          .brand { color: #D4AF37; font-size: 20px; font-weight: 800; letter-spacing: 6px; text-transform: uppercase; text-align: center; margin-bottom: 28px; }
          .code { margin: 24px 0; padding: 24px; border-radius: 16px; border: 1px solid rgba(212,175,55,0.4); background: rgba(212,175,55,0.08); text-align: center; }
          .code span { font-size: 42px; font-weight: 800; letter-spacing: 10px; color: #D4AF37; font-family: monospace; }
          .muted { color: #999; font-size: 14px; line-height: 1.6; text-align: center; }
        </style>
      </head>
      <body>
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 40px 16px; background-color: #000;">
          <tr>
            <td align="center">
              <div class="wrap">
                <div class="brand">RIHLA AI</div>
                <h2 style="text-align:center; margin:0 0 12px;">Security Verification</h2>
                <p class="muted">Use this code to reset your account access. It expires in 15 minutes.</p>
                <div class="code"><span>${otp}</span></div>
                <p class="muted">If you didn't request this, you can safely ignore this email.</p>
              </div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
}

async function sendWithTransport(transporter, email, otp) {
  if (!transporter) {
    return { success: false };
  }

  const info = await transporter.sendMail(buildOtpMessage(email, otp));
  const previewUrl = nodemailer.getTestMessageUrl(info);

  if (previewUrl) {
    console.log(`[EMAIL] OTP preview for ${email}: ${previewUrl}`);
  } else {
    console.log(`[EMAIL] OTP sent to ${email}`);
  }

  return { success: true, previewUrl: previewUrl || undefined };
}

export async function sendOTPEmail(email, otp) {
  const primaryTransporter = createPrimaryTransporter();

  if (primaryTransporter) {
    try {
      return await sendWithTransport(primaryTransporter, email, otp);
    } catch (error) {
      console.error(`[EMAIL] Primary SMTP send failed for ${email}:`, error);
    }
  } else {
    console.log("[EMAIL] No SMTP credentials detected. Using Ethereal test inbox.");
  }

  try {
    const fallbackTransporter = await getFallbackTransporter();
    return await sendWithTransport(fallbackTransporter, email, otp);
  } catch (error) {
    console.error(`[EMAIL] Fallback SMTP send failed for ${email}:`, error);
    return { success: false };
  }
}
