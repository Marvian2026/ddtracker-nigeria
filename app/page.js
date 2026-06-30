'use client';

import { useState, useRef, useCallback } from 'react';

const NAVY = '#1a2744';
const GOLD = '#c8a84b';
const GOLD_LIGHT = '#fdf8ef';
const BORDER = '#dde3ee';

export default function UploadPage() {
  const [files, setFiles] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef(null);

  const addFiles = (newFiles) => {
    const arr = Array.from(newFiles);
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size));
      return [...prev, ...arr.filter(f => !existing.has(f.name + f.size))];
    });
  };

  const removeFile = (index) => setFiles(prev => prev.filter((_, i) => i !== index));

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const totalSize = files.reduce((s, f) => s + f.size, 0);
  const fmtSize = (b) => b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`;

  const fileIcon = (name) => {
    const ext = name.split('.').pop().toLowerCase();
    if (ext === 'pdf') return '📄';
    if (['doc', 'docx'].includes(ext)) return '📝';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return '🖼';
    if (['zip', 'rar'].includes(ext)) return '🗜';
    return '📎';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files.length) { setErrorMsg('Please attach at least one file.'); return; }
    if (!name.trim() || !email.trim()) { setErrorMsg('Please enter your name and email.'); return; }
    if (totalSize > 38 * 1024 * 1024) {
      setErrorMsg('Total file size exceeds 38 MB. Please reduce files or split into two submissions.');
      return;
    }

    setStatus('uploading');
    setErrorMsg('');

    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('email', email.trim());
      fd.append('message', message.trim());
      files.forEach(f => fd.append('files', f));

      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Upload failed');
      setStatus('success');
      setFiles([]);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('idle');
    }
  };

  if (status === 'success') {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.logoRow}>
            <span style={styles.logoText}>MARVIAN</span>
            <span style={styles.logoSub}>INTERNATIONAL</span>
          </div>
          <div style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
            <div style={{ fontSize: '52px', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ color: NAVY, marginBottom: '0.5rem', fontSize: '20px', fontFamily: 'Georgia, serif' }}>
              Documents Submitted
            </h2>
            <p style={{ color: '#6b7896', fontSize: '14px', lineHeight: '1.7', maxWidth: '340px', margin: '0 auto' }}>
              Your files have been securely delivered to the Marvian team. You will be contacted if anything further is required.
            </p>
            <button onClick={() => setStatus('idle')} style={styles.btnSecondary}>
              Submit more documents
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <div style={styles.logoRow}>
          <span style={styles.logoText}>MARVIAN</span>
          <span style={styles.logoSub}>INTERNATIONAL</span>
        </div>

        <div style={styles.headerStrip}>
          <h1 style={styles.title}>Due Diligence — Document Submission</h1>
          <p style={styles.subtitle}>
            Trojan Mining Limited · Sunrise Gold Project, Nigeria<br />
            <span style={{ color: GOLD, fontSize: '11px' }}>
              All submissions are confidential and encrypted in transit.
            </span>
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem 2rem 2rem' }}>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Your Name *</label>
              <input
                style={styles.input}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Full name"
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Your Email *</label>
              <input
                style={styles.input}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={styles.label}>Message / Notes (optional)</label>
            <textarea
              style={{ ...styles.input, height: '80px', resize: 'vertical' }}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="e.g. Section 2 — Mining Licences, JORC report attached"
            />
          </div>

          <label style={styles.label}>Attach Documents *</label>
          <div
            style={{
              ...styles.dropzone,
              borderColor: dragging ? GOLD : BORDER,
              background: dragging ? GOLD_LIGHT : '#fafbfe',
            }}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={e => addFiles(e.target.files)}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
            />
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📁</div>
            <div style={{ fontSize: '13px', color: NAVY, fontWeight: '600', marginBottom: '4px' }}>
              Drag & drop files here
            </div>
            <div style={{ fontSize: '12px', color: '#6b7896' }}>
              or <span style={{ color: GOLD, textDecoration: 'underline', cursor: 'pointer' }}>browse to upload</span>
            </div>
            <div style={{ fontSize: '10px', color: '#aaa', marginTop: '8px' }}>
              PDF, Word, Excel, PowerPoint, images, ZIP · Max 38 MB total
            </div>
          </div>

          {files.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              {files.map((f, i) => (
                <div key={i} style={styles.fileRow}>
                  <span style={{ fontSize: '16px', marginRight: '8px' }}>{fileIcon(f.name)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '12px', color: NAVY, fontWeight: '600',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                      {f.name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#6b7896' }}>{fmtSize(f.size)}</div>
                  </div>
                  <button type="button" onClick={() => removeFile(i)} style={styles.removeBtn}>✕</button>
                </div>
              ))}
              <div style={{ fontSize: '11px', color: '#6b7896', marginTop: '6px', textAlign: 'right' }}>
                {files.length} file{files.length !== 1 ? 's' : ''} · {fmtSize(totalSize)} total
              </div>
            </div>
          )}

          {errorMsg && (
            <div style={styles.errorBox}>{errorMsg}</div>
          )}

          <button
            type="submit"
            disabled={status === 'uploading'}
            style={{ ...styles.btnPrimary, opacity: status === 'uploading' ? 0.7 : 1 }}
          >
            {status === 'uploading' ? '⏳  Sending…' : '📨  Submit Documents to Marvian'}
          </button>

          <p style={{ fontSize: '11px', color: '#aaa', textAlign: 'center', marginTop: '12px', marginBottom: 0 }}>
            Files are delivered directly to the Marvian deal team. Do not share login credentials or passwords via this form.
          </p>
        </form>
      </div>
      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <div style={{ textAlign: 'center', padding: '1.5rem', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
      © {new Date().getFullYear()} Marvian International Consulting · Confidential
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a2744 0%, #2a3f6a 50%, #1a2744 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '620px',
    boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
    overflow: 'hidden',
  },
  logoRow: {
    background: NAVY,
    padding: '1.25rem 2rem',
    borderBottom: `3px solid ${GOLD}`,
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
  },
  logoText: {
    color: 'white',
    fontSize: '20px',
    fontWeight: '700',
    letterSpacing: '4px',
    fontFamily: 'Georgia, serif',
  },
  logoSub: {
    color: GOLD,
    fontSize: '11px',
    letterSpacing: '3px',
    fontFamily: 'Georgia, serif',
  },
  headerStrip: {
    background: GOLD_LIGHT,
    borderBottom: '1px solid #f0dca0',
    padding: '1rem 2rem',
  },
  title: {
    color: NAVY,
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 4px 0',
    fontFamily: 'Georgia, serif',
  },
  subtitle: {
    color: '#6b7896',
    fontSize: '12px',
    margin: 0,
    lineHeight: '1.6',
    fontFamily: 'Georgia, serif',
  },
  row: {
    display: 'flex',
    gap: '12px',
    marginBottom: '1.25rem',
  },
  field: {
    flex: 1,
  },
  label: {
    display: 'block',
    fontSize: '11px',
    color: '#6b7896',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    marginBottom: '6px',
    fontFamily: 'Georgia, serif',
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    fontSize: '13px',
    border: `1.5px solid ${BORDER}`,
    borderRadius: '6px',
    fontFamily: 'Georgia, serif',
    color: NAVY,
    outline: 'none',
    boxSizing: 'border-box',
  },
  dropzone: {
    border: '2px dashed',
    borderRadius: '8px',
    padding: '2rem',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: '4px',
  },
  fileRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 10px',
    background: '#f4f6fc',
    borderRadius: '6px',
    marginBottom: '6px',
    border: `1px solid ${BORDER}`,
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#b02020',
    fontSize: '12px',
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: 'Georgia, serif',
  },
  errorBox: {
    background: '#fdecea',
    border: '1px solid #f0b4b4',
    color: '#b02020',
    padding: '10px 14px',
    borderRadius: '6px',
    fontSize: '12px',
    marginTop: '12px',
    marginBottom: '12px',
  },
  btnPrimary: {
    width: '100%',
    padding: '13px',
    background: NAVY,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'Georgia, serif',
    cursor: 'pointer',
    marginTop: '1.25rem',
    letterSpacing: '0.5px',
  },
  btnSecondary: {
    display: 'block',
    margin: '1.5rem auto 0',
    padding: '10px 24px',
    background: 'transparent',
    color: NAVY,
    border: `1.5px solid ${BORDER}`,
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'Georgia, serif',
    cursor: 'pointer',
  },
};
