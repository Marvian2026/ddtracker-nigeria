import { Resend } from 'resend';
import formidable from 'formidable';
import fs from 'fs';

const resend = new Resend(process.env.RESEND_API_KEY);
const RECIPIENTS = ['abishek@themarvian.com', 'marion.orosa@gmail.com'];

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable({ multiples: true, maxFileSize: 40 * 1024 * 1024 });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: err.message });

    const name = Array.isArray(fields.name) ? fields.name[0] : fields.name || 'Unknown';
    const email = Array.isArray(fields.email) ? fields.email[0] : fields.email || 'Unknown';
    const message = Array.isArray(fields.message) ? fields.message[0] : fields.message || '';
    const manifestRaw = Array.isArray(fields.manifest) ? fields.manifest[0] : fields.manifest || '[]';

    let manifest = [];
    try { manifest = JSON.parse(manifestRaw); } catch(e) {}

    if (!manifest.length) {
      return res.status(400).json({ error: 'No items submitted.' });
    }

    // Build attachments: files keyed as file_{itemId} in formData
    const attachments = [];
    for (const entry of manifest) {
      const key = 'file_' + entry.id;
      const itemFileList = files[key]
        ? Array.isArray(files[key]) ? files[key] : [files[key]]
        : [];
      for (const f of itemFileList) {
        attachments.push({
          filename: `[${entry.id}] ${f.originalFilename || 'document'}`,
          content: fs.readFileSync(f.filepath),
        });
      }
    }

    // Group manifest by section for email
    const bySection = {};
    manifest.forEach(entry => {
      if (!bySection[entry.section]) bySection[entry.section] = [];
      bySection[entry.section].push(entry);
    });

    const sectionHtml = Object.entries(bySection).map(([section, items]) => `
      <div style="margin-bottom:18px;">
        <div style="font-size:11px;font-weight:700;color:#1a2744;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #c8a84b;padding-bottom:4px;margin-bottom:8px;">${section}</div>
        ${items.map(it => `
          <div style="margin-bottom:8px;padding:8px 10px;background:#f9f9f9;border-radius:5px;border-left:3px solid #c8a84b;">
            <div style="font-size:12px;color:#1a2744;font-weight:600;">${it.id} — ${it.item}</div>
            ${it.files.length
              ? `<div style="font-size:11px;color:#6b7896;margin-top:4px;">${it.files.map(f => `📎 ${f}`).join(' &nbsp;·&nbsp; ')}</div>`
              : `<div style="font-size:11px;color:#aaa;margin-top:4px;">No files attached</div>`
            }
          </div>
        `).join('')}
      </div>
    `).join('');

    const totalFiles = manifest.reduce((s, it) => s + it.files.length, 0);

    try {
      await resend.emails.send({
        from: 'Marvian DD Tracker <noreply@themarvian.com>',
        to: RECIPIENTS,
        replyTo: email,
        subject: `[DD Submission] ${name} — ${manifest.length} item${manifest.length !== 1 ? 's' : ''}, ${totalFiles} file${totalFiles !== 1 ? 's' : ''}`,
        html: `
          <div style="font-family:Georgia,serif;max-width:640px;color:#1a2744;">
            <div style="background:#1a2744;padding:20px 24px;border-bottom:3px solid #c8a84b;">
              <span style="color:white;font-size:18px;letter-spacing:4px;font-weight:700;">MARVIAN</span>
              <span style="color:#c8a84b;font-size:11px;letter-spacing:3px;margin-left:8px;">INTERNATIONAL</span>
            </div>
            <div style="padding:24px;">
              <h2 style="margin:0 0 16px;font-size:16px;">New DD Document Submission</h2>
              <table style="font-size:13px;border-collapse:collapse;width:100%;margin-bottom:20px;">
                <tr><td style="padding:6px 0;color:#6b7896;width:130px;">From</td><td style="font-weight:600;">${name}</td></tr>
                <tr><td style="padding:6px 0;color:#6b7896;">Email</td><td><a href="mailto:${email}" style="color:#2a4fa0;">${email}</a></td></tr>
                <tr><td style="padding:6px 0;color:#6b7896;">Submitted</td><td>${new Date().toLocaleString('en-AU', { timeZone: 'Asia/Dubai', dateStyle: 'full', timeStyle: 'short' })} (Dubai)</td></tr>
                <tr><td style="padding:6px 0;color:#6b7896;">Items addressed</td><td>${manifest.length} DD items</td></tr>
                <tr><td style="padding:6px 0;color:#6b7896;">Files attached</td><td>${totalFiles} file${totalFiles !== 1 ? 's' : ''}</td></tr>
              </table>
              ${message ? `<div style="background:#f9f7f2;border-left:3px solid #c8a84b;padding:12px 16px;font-size:13px;margin-bottom:20px;line-height:1.6;">${message}</div>` : ''}
              <h3 style="font-size:13px;color:#1a2744;margin-bottom:12px;">Documents Submitted by Item</h3>
              ${sectionHtml}
            </div>
            <div style="padding:12px 24px;border-top:1px solid #eee;font-size:10px;color:#aaa;text-align:center;">
              Marvian International Consulting · Confidential DD Submission · Trojan Mining / Sunrise Gold Project
            </div>
          </div>
        `,
        attachments,
      });

      res.status(200).json({ success: true });
    } catch (e) {
      console.error('Email error:', e);
      res.status(500).json({ error: e.message || 'Failed to send email.' });
    }
  });
}
