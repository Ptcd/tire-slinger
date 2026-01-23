// Brevo (Sendinblue) email integration

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  const apiKey = process.env.BREVO_API_KEY

  if (!apiKey) {
    console.warn('BREVO_API_KEY not configured, skipping email')
    return { success: false, error: 'Email not configured' }
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'Tire Slingers',
          email: 'tires@junkcarsmilwaukee.com',
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text || html.replace(/<[^>]*>/g, ''),
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Brevo email error:', error)
      return { success: false, error: error.message || 'Failed to send email' }
    }

    return { success: true }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

export function getInviteEmailHtml(orgName: string, inviteUrl: string, role: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: #facc15; padding: 24px; text-align: center;">
      <h1 style="margin: 0; color: #000; font-size: 24px; font-weight: 800;">
        TIRE<span style="font-weight: 400;">SLINGERS</span>
      </h1>
    </div>
    <div style="padding: 32px 24px;">
      <h2 style="margin: 0 0 16px; color: #333; font-size: 20px;">You're Invited!</h2>
      <p style="color: #666; line-height: 1.6; margin: 0 0 16px;">
        You've been invited to join <strong>${orgName}</strong> as ${role === 'admin' ? 'an admin' : 'staff'} on Tire Slingers.
      </p>
      <p style="color: #666; line-height: 1.6; margin: 0 0 24px;">
        Click the button below to create your account and get started.
      </p>
      <a href="${inviteUrl}" style="display: inline-block; background: #facc15; color: #000; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Accept Invite
      </a>
      <p style="color: #999; font-size: 13px; margin: 24px 0 0; line-height: 1.5;">
        This invite expires in 7 days. If you didn't expect this invite, you can ignore this email.
      </p>
    </div>
    <div style="background: #f9f9f9; padding: 16px 24px; text-align: center; border-top: 1px solid #eee;">
      <p style="color: #999; font-size: 12px; margin: 0;">
        Tire Slingers - Tire Inventory Management
      </p>
    </div>
  </div>
</body>
</html>
`
}

