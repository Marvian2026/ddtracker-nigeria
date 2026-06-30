import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const RECIPIENTS = ['abishek@themarvian.com', 'marion.orosa@gmail.com'];

export async function POST(request) {
  try {
    const formData = await request.formData();

    const name = formData.get('name') || 'Unknown';
    const email = formData.get('email') || 'Unknown';
    const message = formData.get('message') || '';
    const files = formData.getAll('files');

    if (!files.length) {
      return Response.json({ error: 'No files received.' }, { status: 400 });
    }

    const attachments = await Promise.all(
      files.map(async (file) => {
        const buffer = await file.arrayBuffer();
        return {
          filename: file.name,
          content: Buffer.from(buffer),
        };
      })
    );

    await resend.emails.send({
      from: 'Marvian DD Tracker <onboarding@resend.dev>',
      to: RECIPIENTS,
      replyTo: email,
      subject: `[DD Submission] ${name} — ${files.length} document${files.length !== 1 ? 's' : ''}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; color: #1a2744;">
          <div style="background: #1a2744; padding: 20px 24px; border-bottom: 3px solid #c8a84b;">
            <span style="color: white; font-size: 18px; letter-spacing: 4px; font-weight: 700;">MARVIAN</span>
            <span style="color: #c8a84b; font-size: 11px; letter-spacing: 3px; margin-left: 8px;">INTERNATIONAL</span>
          </div>
          <div style="padding: 24px;">
            <h2 style="margin: 0 0 16px; font-size: 16px;">New DD Document Submission</h2>
            <table style="font-size: 13px; border-collapse: collapse; width: 100%; margin-bottom: 20px;">
              <tr><td style="padding: 6px 0; color: #6b7896; width: 120px;">From</td><td style="font-weight: 600;">${name}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7896;">Email</td><td><a href="mailto:${email}" style="color: #2a4fa0;">${email}</a></td></tr>
              <tr><td style="padding: 6px 0; color: #6b7896;">Submitted</td><td>${new Date().toLocaleString('en-AU', { timeZone: 'Asia/Dubai', dateStyle: 'full', timeStyle: 'short' })} (Dubai)</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7896;">Files</td><td>${files.length} attachment${files.length !== 1 ? 's' : ''}</td></tr>
            </table>
            ${message ? `<div style="background: #f9f7f2; border-left: 3px solid #c8a84b; padding: 12px 16px; font-size: 13px; margin-bottom: 20px; line-height: 1.6;">${message}</div>` : ''}
            <div style="background: #f4f6fc; border-radius: 6px; padding: 14px 16px; font-size: 12px; color: #3a4a6a;">
              <strong>Attached files:</strong><br/><br/>
              ${files.map(f => `📎 ${f.name} (${(f.size / 1024).toFixed(0)} KB)`).join('<br/>')}
            </div>
          </div>
          <div style="padding: 12px 24px; border-top: 1px solid #eee; font-size: 10px; color: #aaa; text-align: center;">
            Marvian International Consulting · Confidential DD Submission · Trojan Mining / Sunrise Gold Project
          </div>
        </div>
      `,
      attachments,
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error('Upload error:', err);
    return Response.json({ error: err.message || 'Server error.' }, { status: 500 });
  }
}
