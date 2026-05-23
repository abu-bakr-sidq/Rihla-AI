import nodemailer from "nodemailer";

/**
 * Rihla AI Email Service (BackendPort)
 * Handles OTP delivery and transactional notifications.
 */

const transporterPromise = (async () => {
  // Production / Provided Credentials
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
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
  try {
    const testAccount = await nodemailer.createTestAccount();
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
  } catch (err) {
    console.error("[EMAIL] Failed to create test account:", err);
    return null;
  }
})();

function getSenderAddress() {
  const senderEmail = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@rihla-ai.com";
  return `"Rihla AI" <${senderEmail}>`;
}

export async function sendOTPEmail(email, otp) {
  try {
    const transporter = await transporterPromise;
    if (!transporter) return { success: false };

    const info = await transporter.sendMail({
      from: getSenderAddress(),
      to: email,
      // - [x] Phase 19: Email Branding & Final Polish 📧✨
      // - [x] Update sender name to 'Rihla AI' (Backend)
      // - [x] Refine email template header (Backend)
      // - [x] Verify final email appearance
      // - [ ] Phase 20: Luxury Email UI Transformation 📧💎
      // - [ ] Implement premium card design with glassmorphism (Backend)
      // - [ ] Add CSS entry animations to email template (Backend)
      // - [ ] Integrate high-fidelity logo in card header (Backend)
      // - [ ] Verify final "expensive" email look
      subject: `Your Recovery Code: ${otp}`,
      text: `Welcome back to Rihla AI. Your recovery code is: ${otp}. This code will expire in 15 minutes.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap');
            @keyframes slideIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes glow { 0% { box-shadow: 0 0 5px rgba(212, 175, 55, 0.2); } 50% { box-shadow: 0 0 20px rgba(212, 175, 55, 0.4); } 100% { box-shadow: 0 0 5px rgba(212, 175, 55, 0.2); } }
            .container { animation: slideIn 1s ease-out forwards; }
          </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #000; font-family: 'Sora', 'Inter', sans-serif;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #000; padding: 60px 20px;">
            <tr>
              <td align="center">
                <div class="container" style="max-width: 500px; background: #080808; border: 1px solid #D4AF37; border-radius: 32px; padding: 50px 40px; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
                  
                  <!-- HIGH-FIDELITY CENTERED LOGO -->
                  <div style="margin-bottom: 35px; text-align: center;">
                    <svg width="90" height="90" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 0 auto;">
                      <defs>
                        <linearGradient id="gold-lux" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stop-color="#FFF"/>
                          <stop offset="40%" stop-color="#D4AF37"/>
                          <stop offset="100%" stop-color="#F9E2AF"/>
                        </linearGradient>
                        <linearGradient id="arrow-ptr" x1="0%" y1="100%" x2="100%" y2="0%">
                          <stop offset="0%" stop-color="#c0e8f8"/>
                          <stop offset="100%" stop-color="#ffffff"/>
                        </linearGradient>
                      </defs>
                      <circle cx="36" cy="44" r="30" stroke="url(#gold-lux)" stroke-width="2.5" fill="none" opacity="0.8"/>
                      <ellipse cx="36" cy="44" rx="30" ry="11" stroke="url(#gold-lux)" stroke-width="1" fill="none" opacity="0.4"/>
                      <path d="M18 22 L18 66 M18 22 Q40 22 40 33 Q40 44 18 44 M28 44 Q38 52 48 66" stroke="url(#gold-lux)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                      <g>
                        <line x1="46" y1="34" x2="66" y2="14" stroke="url(#arrow-ptr)" stroke-width="2.5" stroke-linecap="round"/>
                        <polyline points="55,14 66,14 66,25" stroke="url(#arrow-ptr)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                      </g>
                    </svg>
                  </div>

                  <!-- BRANDING TEXT -->
                  <div style="text-align: center; margin-bottom: 45px;">
                    <div style="color: #D4AF37; font-size: 20px; font-weight: 800; letter-spacing: 8px; text-transform: uppercase; margin-bottom: 8px;">RIHLA AI</div>
                    <div style="color: #666; font-size: 11px; letter-spacing: 4px; text-transform: uppercase;">Smart Halal Travel Planning</div>
                  </div>

                  <!-- VERIFICATION CONTENT -->
                  <div style="text-align: center;">
                    <h2 style="color: #fff; font-size: 24px; font-weight: 700; margin: 0 0 15px 0;">Security Verification</h2>
                    <p style="color: #999; font-size: 15px; line-height: 1.6; margin-bottom: 40px; padding: 0 20px;">
                      Welcome back. Please use the following exclusive code to securely reset your account access.
                    </p>
                    
                    <!-- THE OTP CARD -->
                    <div style="background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(0,0,0,0) 100%); border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 20px; padding: 30px; margin-bottom: 40px;">
                      <span style="font-size: 48px; font-weight: 800; letter-spacing: 15px; color: #D4AF37; text-shadow: 0 0 20px rgba(212, 175, 55, 0.5); font-family: 'Courier New', monospace;">${otp}</span>
                    </div>

                    <p style="color: #555; font-size: 12px; font-style: italic;">
                      This secure session expires in 15 minutes.
                    </p>
                  </div>

                  <!-- FOOTER -->
                  <div style="margin-top: 60px; padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.05); text-align: center;">
                    <p style="color: #333; font-size: 10px; letter-spacing: 2px; text-transform: uppercase;">
                      &copy; 2026 RIHLA AI &bull; LUXURY TRAVEL CONCIERGE
                    </p>
                  </div>

                </div>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

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
