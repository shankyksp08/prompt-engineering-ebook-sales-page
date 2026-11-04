/**
 * Digital Govind — Prompt Engineering Handbook
 * Transactional Customer Thank-You Email Template
 * 
 * Features:
 * - Clean white background (#ffffff) with subtle light-blue accent (#0284c7, #f0f9ff, #e0f2fe)
 * - Digital Govind branding
 * - Fully responsive HTML & CSS optimized for mobile & desktop email clients (Gmail, Apple Mail, Outlook)
 * - Plain text fallback version
 */

export interface ThankYouEmailData {
  customerName: string;
  customerEmail: string;
  orderId: string;
  readerUrl: string;
  supportEmail?: string;
}

export function generateThankYouEmailHtml(data: ThankYouEmailData): string {
  const {
    customerName,
    customerEmail,
    orderId,
    readerUrl,
    supportEmail = 'supportdigitalgovind@gmail.com',
  } = data;

  const displayName = customerName && customerName.trim() ? customerName.trim() : 'Learner';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You for Choosing Digital Govind! Your eBook Journey Begins 🎉</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, a { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
      line-height: 1.6;
    }
    table {
      border-collapse: collapse;
    }
    img {
      border: 0;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      overflow: hidden;
      margin-top: 32px;
      margin-bottom: 32px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
    }
    .header-bar {
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      padding: 32px 36px;
      text-align: left;
    }
    .header-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 4px 10px;
      border-radius: 9999px;
      margin-bottom: 12px;
    }
    .brand-title {
      color: #ffffff;
      font-size: 24px;
      font-weight: 800;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .brand-sub {
      color: #bae6fd;
      font-size: 13px;
      margin: 4px 0 0 0;
      font-weight: 500;
    }
    .content-body {
      padding: 36px;
      background-color: #ffffff;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .paragraph {
      font-size: 15px;
      color: #334155;
      margin: 0 0 16px 0;
      line-height: 1.65;
    }
    .purchase-card {
      background-color: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 12px;
      padding: 24px;
      margin: 28px 0;
    }
    .card-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #0369a1;
      margin-top: 0;
      margin-bottom: 14px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px dashed #cbd5e1;
      font-size: 14px;
    }
    .detail-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .detail-label {
      color: #64748b;
      font-weight: 500;
    }
    .detail-value {
      color: #0f172a;
      font-weight: 600;
      text-align: right;
    }
    .status-badge {
      display: inline-block;
      background-color: #dcfce7;
      color: #15803d;
      font-size: 12px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
    }
    .cta-container {
      text-align: center;
      margin: 32px 0 28px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      color: #ffffff !important;
      font-size: 16px;
      font-weight: 700;
      text-decoration: none;
      padding: 16px 36px;
      border-radius: 12px;
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);
    }
    .signature-block {
      border-top: 1px solid #e2e8f0;
      padding-top: 24px;
      margin-top: 32px;
      font-size: 14px;
      color: #475569;
    }
    .motto {
      color: #0284c7;
      font-weight: 700;
      font-size: 14px;
      margin: 8px 0 16px 0;
    }
    .footer {
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 24px 36px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }
    .footer a {
      color: #0284c7;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div style="padding: 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <div class="container">
            <!-- Header Banner with Digital Govind Branding -->
            <div class="header-bar">
              <span class="header-badge">Order Confirmed</span>
              <h1 class="brand-title">Digital Govind</h1>
              <p class="brand-sub">Prompt Engineering Handbook</p>
            </div>

            <!-- Email Body Content -->
            <div class="content-body">
              <h2 class="greeting">Hello ${displayName},</h2>

              <p class="paragraph">
                Thank you for purchasing the <strong>Prompt Engineering Handbook</strong> from <strong>Digital Govind</strong>!
              </p>

              <p class="paragraph">
                We're excited to be a part of your AI learning journey.
              </p>

              <p class="paragraph">
                Your payment has been successfully received, and your eBook access is now ready.
              </p>

              <p class="paragraph">
                You can log in to your account and start reading your eBook anytime.
              </p>

              <!-- Purchase Details Card -->
              <div class="purchase-card">
                <div class="card-title">Your Purchase Details:</div>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Product:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 600; font-size: 14px; text-align: right;">Prompt Engineering Handbook</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Customer Email:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 600; font-size: 14px; text-align: right;">${customerEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Order ID:</td>
                    <td style="padding: 6px 0; color: #0284c7; font-weight: 700; font-size: 14px; text-align: right; font-family: monospace;">${orderId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-size: 14px;">Payment Status:</td>
                    <td style="padding: 6px 0; text-align: right;">
                      <span class="status-badge">&#10003; Successful</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <div class="cta-container">
                <!--[if mso]>
                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${readerUrl}" style="height:50px;v-text-anchor:middle;width:280px;" arcsize="20%" stroke="f" fillcolor="#0284c7">
                  <w:anchorlock/>
                  <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">Start Reading Your eBook</center>
                </v:roundrect>
                <![endif]-->
                <a href="${readerUrl}" class="cta-button" target="_blank">
                  Start Reading Your eBook &rarr;
                </a>
              </div>

              <!-- Closing Signature -->
              <div class="signature-block">
                <p style="margin: 0 0 8px 0;">Thank you for supporting Digital Govind.</p>
                <div class="motto">Keep Learning. Keep Creating. Keep Growing.</div>
                <p style="margin: 0;">
                  Warm regards,<br>
                  <strong>Team Digital Govind</strong><br>
                  <a href="mailto:${supportEmail}" style="color: #0284c7; text-decoration: none;">${supportEmail}</a>
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p style="margin: 0 0 8px 0;">
                Prompt Engineering Handbook &copy; ${new Date().getFullYear()} Digital Govind. All rights reserved.
              </p>
              <p style="margin: 0;">
                Need help or have questions? Contact support at <a href="mailto:${supportEmail}">${supportEmail}</a>
              </p>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

export function generateThankYouEmailText(data: ThankYouEmailData): string {
  const displayName = data.customerName && data.customerName.trim() ? data.customerName.trim() : 'Learner';
  const supportEmail = data.supportEmail || 'supportdigitalgovind@gmail.com';

  return `Hello ${displayName},

Thank you for purchasing the Prompt Engineering Handbook from Digital Govind!

We're excited to be a part of your AI learning journey.

Your payment has been successfully received, and your eBook access is now ready.

You can log in to your account and start reading your eBook anytime.

Your Purchase Details:
- Product: Prompt Engineering Handbook
- Customer Email: ${data.customerEmail}
- Order ID: ${data.orderId}
- Payment Status: Successful

Start Reading Your eBook:
${data.readerUrl}

Thank you for supporting Digital Govind.

Keep Learning. Keep Creating. Keep Growing.

Warm regards,
Team Digital Govind
${supportEmail}
`;
}
