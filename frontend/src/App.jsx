import React, { useState, useEffect, useRef, useCallback } from 'react';
import { notesApi } from './api/notes.js';

/* ── tiny helpers ───────────────────────────────────────── */
const fmt = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const clamp = (s, n = 120) => (s && s.length > n ? s.slice(0, n) + '…' : s);

/* ── icons (inline svg, no deps) ───────────────────────── */
const Icon = ({ d, size = 16, stroke = 'currentColor', strokeWidth = 1.7 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const ICONS = {
  plus:   'M12 5v14M5 12h14',
  edit:   'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  trash:  'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  close:  'M18 6 6 18M6 6l12 12',
  check:  'M20 6 9 17l-5-5',
  note:   'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  spin:   'M12 2a10 10 0 1 0 10 10',
};

/* ── Modal ──────────────────────────────────────────────── */
function Modal({ open, onClose, children }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  if (!open) return null;

  return (
    <div style={S.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>{children}</div>
    </div>
  );
}

/* ── NoteCard ───────────────────────────────────────────── */
function NoteCard({ note, onEdit, onDelete, deleting }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ ...S.card, ...(hovered ? S.cardHover : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={S.cardBody}>
        <p style={S.cardTitle}>{note.title}</p>
        {note.content && <p style={S.cardContent}>{clamp(note.content)}</p>}
        <span style={S.cardDate}>{fmt(note.updatedAt)}</span>
      </div>
      <div style={{ ...S.cardActions, opacity: hovered ? 1 : 0 }}>
        <button style={S.iconBtn} onClick={() => onEdit(note)} title="Edit">
          <Icon d={ICONS.edit} size={14} />
        </button>
        <button
          style={{ ...S.iconBtn, ...S.iconBtnDanger }}
          onClick={() => onDelete(note._id)}
          disabled={deleting === note._id}
          title="Delete"
        >
          {deleting === note._id
            ? <Icon d={ICONS.spin} size={14} />
            : <Icon d={ICONS.trash} size={14} />}
        </button>
      </div>
    </div>
  );
}

/* ── NoteForm ───────────────────────────────────────────── */
function NoteForm({ initial, onSave, onCancel, saving }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [content, setContent] = useState(initial?.content || '');
  const titleRef = useRef();

  useEffect(() => { titleRef.current?.focus(); }, []);

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), content: content.trim() });
  };

  return (
    <form onSubmit={submit} style={S.form}>
      <p style={S.formHeading}>{initial ? 'Edit note' : 'New note'}</p>

      <label style={S.label}>Title</label>
      <input
        ref={titleRef}
        style={S.input}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Give your note a title…"
        maxLength={120}
        required
      />

      <label style={S.label}>Content <span style={S.optional}>(optional)</span></label>
      <textarea
        style={S.textarea}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write something…"
        rows={5}
      />

      <div style={S.formFooter}>
        <button type="button" style={S.cancelBtn} onClick={onCancel}>Cancel</button>
        <button type="submit" style={S.saveBtn} disabled={saving || !title.trim()}>
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Create note'}
        </button>
      </div>
    </form>
  );
}

/* ── App ────────────────────────────────────────────────── */
export default function App() {
  const [notes, setNotes]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [modal, setModal]       = useState(false);   // 'create' | 'edit' | false
  const [editing, setEditing]   = useState(null);    // note object
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(null);    // note id

  const loadNotes = useCallback(async () => {
    try {
      setError(null);
      const data = await notesApi.getAll();
      setNotes(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  const openCreate = () => { setEditing(null); setModal('create'); };
  const openEdit   = (note) => { setEditing(note); setModal('edit'); };
  const closeModal = () => { setModal(false); setEditing(null); };

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editing) {
        const updated = await notesApi.update(editing._id, data);
        setNotes((prev) => prev.map((n) => (n._id === updated._id ? updated : n)));
      } else {
        const created = await notesApi.create(data);
        setNotes((prev) => [created, ...prev]);
      }
      closeModal();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this note?')) return;
    setDeleting(id);
    try {
      await notesApi.remove(id);
      setNotes((prev) => prev.filter((n) => n._id !== id));
    } catch (e) {
      alert(e.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div style={S.page}>
      {/* ── Header ── */}
      <header style={S.header}>
        <div style={S.headerInner}>
          <div style={S.logoRow}>
            <Icon d={ICONS.note} size={20} />
            <span style={S.logoText}>Notes</span>
            {!loading && (
              <span style={S.count}>{notes.length}</span>
            )}
          </div>
          <button style={S.newBtn} onClick={openCreate}>
            <Icon d={ICONS.plus} size={15} />
            New note
          </button>
        </div>
      </header>

      {/* ── Content ── */}
      <main style={S.main}>
        {loading && (
          <div style={S.center}>
            <div style={S.spinner} />
          </div>
        )}

        {!loading && error && (
          <div style={S.errorBox}>
            <p style={{ fontWeight: 500 }}>Could not connect to the API</p>
            <p style={{ fontSize: 13, marginTop: 4, color: 'var(--text-secondary)' }}>{error}</p>
            <button style={S.retryBtn} onClick={loadNotes}>Retry</button>
          </div>
        )}

        {!loading && !error && notes.length === 0 && (
          <div style={S.empty}>
            <Icon d={ICONS.note} size={40} stroke="var(--text-muted)" strokeWidth={1.2} />
            <p style={S.emptyHeading}>No notes yet</p>
            <p style={S.emptySub}>Click <strong>New note</strong> to get started.</p>
          </div>
        )}

        {!loading && !error && notes.length > 0 && (
          <div style={S.grid}>
            {notes.map((n) => (
              <NoteCard
                key={n._id}
                note={n}
                onEdit={openEdit}
                onDelete={handleDelete}
                deleting={deleting}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Modal ── */}
      <Modal open={!!modal} onClose={closeModal}>
        <NoteForm
          initial={editing}
          onSave={handleSave}
          onCancel={closeModal}
          saving={saving}
        />
      </Modal>
    </div>
  );
}

/* ── Styles ─────────────────────────────────────────────── */
const S = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
    display: 'flex',
    flexDirection: 'column',
  },

  /* header */
  header: {
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    backdropFilter: 'blur(8px)',
  },
  headerInner: {
    maxWidth: 900,
    margin: '0 auto',
    padding: '0 24px',
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    color: 'var(--text-primary)',
  },
  logoText: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 22,
    letterSpacing: '-0.3px',
  },
  count: {
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--text-muted)',
    background: 'var(--tag)',
    borderRadius: 99,
    padding: '2px 8px',
    lineHeight: 1.6,
  },
  newBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: `background var(--transition)`,
    letterSpacing: '0.01em',
  },

  /* main */
  main: {
    flex: 1,
    maxWidth: 900,
    margin: '0 auto',
    padding: '40px 24px',
    width: '100%',
  },

  center: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: 80,
  },

  spinner: {
    width: 28,
    height: 28,
    border: '2px solid var(--border)',
    borderTopColor: 'var(--accent)',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },

  /* grid */
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 16,
  },

  /* card */
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '20px 20px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    transition: `box-shadow var(--transition), transform var(--transition)`,
    boxShadow: 'var(--shadow)',
    cursor: 'default',
    position: 'relative',
  },
  cardHover: {
    boxShadow: 'var(--shadow-hover)',
    transform: 'translateY(-2px)',
  },
  cardBody: { flex: 1, display: 'flex', flexDirection: 'column', gap: 6 },
  cardTitle: {
    fontSize: 15,
    fontWeight: 500,
    color: 'var(--text-primary)',
    lineHeight: 1.4,
    wordBreak: 'break-word',
  },
  cardContent: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    wordBreak: 'break-word',
    marginTop: 2,
  },
  cardDate: {
    fontSize: 11,
    color: 'var(--text-muted)',
    marginTop: 8,
    display: 'block',
  },
  cardActions: {
    display: 'flex',
    gap: 6,
    transition: `opacity var(--transition)`,
  },
  iconBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: `all var(--transition)`,
    padding: 0,
  },
  iconBtnDanger: {
    color: 'var(--danger)',
    borderColor: 'transparent',
  },

  /* empty */
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    paddingTop: 100,
    color: 'var(--text-muted)',
  },
  emptyHeading: {
    fontSize: 17,
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  emptySub: { fontSize: 14, color: 'var(--text-muted)' },

  /* error */
  errorBox: {
    background: '#fff5f5',
    border: '1px solid #f5c0c0',
    borderRadius: 'var(--radius)',
    padding: 24,
    maxWidth: 440,
    margin: '80px auto 0',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    padding: '8px 20px',
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: 'inherit',
    fontWeight: 500,
  },

  /* modal */
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(26,26,26,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    backdropFilter: 'blur(4px)',
    padding: 24,
  },
  modal: {
    background: 'var(--surface)',
    borderRadius: 16,
    padding: '32px 32px 28px',
    width: '100%',
    maxWidth: 460,
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    animation: 'modalIn 0.18s cubic-bezier(0.34,1.56,0.64,1)',
  },

  /* form */
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  formHeading: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 20,
    color: 'var(--text-primary)',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--text-secondary)',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    marginBottom: -8,
  },
  optional: { fontWeight: 400, textTransform: 'none', letterSpacing: 0 },
  input: {
    width: '100%',
    padding: '11px 14px',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'inherit',
    color: 'var(--text-primary)',
    background: 'var(--bg)',
    outline: 'none',
    transition: `border-color var(--transition)`,
  },
  textarea: {
    width: '100%',
    padding: '11px 14px',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'inherit',
    color: 'var(--text-primary)',
    background: 'var(--bg)',
    outline: 'none',
    resize: 'vertical',
    lineHeight: 1.6,
    transition: `border-color var(--transition)`,
  },
  formFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    padding: '9px 18px',
    border: '1px solid var(--border)',
    borderRadius: 8,
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  saveBtn: {
    padding: '9px 20px',
    border: 'none',
    borderRadius: 8,
    background: 'var(--accent)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: `opacity var(--transition)`,
  },
};

/* ── keyframes (injected once) ──────────────────────────── */
const style = document.createElement('style');
style.textContent = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.95) translateY(8px); }
    to   { opacity: 1; transform: scale(1)    translateY(0);   }
  }
  button:hover:not(:disabled) { opacity: 0.85; }
  input:focus, textarea:focus { border-color: var(--border-focus) !important; }
`;
document.head.appendChild(style);
