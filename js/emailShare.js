const EmailShare = (() => {

  let _report = null, _notes = null, _project = null;

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  async function open(report, notes, project) {
    _report  = report;
    _notes   = notes;
    _project = project;

    const contacts = project.contacts || [];

    // הסר overlay קודם
    document.getElementById('email-share-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id        = 'email-share-overlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box" onclick="event.stopPropagation()" style="max-width:420px;">
        <div class="modal-handle"></div>
        <div class="modal-title">📧 שיתוף דוח במייל</div>
        ${contacts.length === 0
          ? `<p style="color:var(--text-muted);font-size:.9rem;text-align:center;padding:16px 0;">
               לא הוגדרו אנשי קשר לפרויקט זה.<br>
               <span style="font-size:.8rem;">ניתן להוסיף אנשי קשר בעריכת הפרויקט.</span>
             </p>`
          : `<div style="margin-bottom:12px;font-size:.85rem;color:var(--text-muted);">בחר נמענים:</div>
             <div id="esh-contacts" style="display:flex;flex-direction:column;gap:8px;max-height:280px;overflow-y:auto;margin-bottom:16px;">
               ${contacts.map((c, i) => `
                 <label style="display:flex;align-items:center;gap:10px;padding:10px 12px;
                   border:1px solid var(--border);border-radius:8px;cursor:pointer;">
                   <input type="checkbox" data-idx="${i}" style="width:16px;height:16px;accent-color:var(--green);">
                   <div>
                     <div style="font-weight:700;font-size:.9rem;">${esc(c.name)}</div>
                     <div style="font-size:.8rem;color:var(--text-muted);">${esc(c.email)}${c.role ? ' · ' + esc(c.role) : ''}</div>
                   </div>
                 </label>`).join('')}
             </div>`
        }
        <div class="form-actions">
          <button class="btn btn-outline" onclick="document.getElementById('email-share-overlay').remove()">ביטול</button>
          ${contacts.length > 0 ? `<button class="btn btn-primary" onclick="EmailShare._send()">📤 שלח</button>` : ''}
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.classList.remove('hidden');
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  }

  async function _send() {
    const contacts = _project.contacts || [];
    const checked  = Array.from(document.querySelectorAll('#esh-contacts input[type=checkbox]:checked'));
    if (!checked.length) { App.toast('נא לבחור לפחות נמען אחד'); return; }

    const recipients = checked.map(cb => contacts[+cb.dataset.idx]);
    const emails     = recipients.map(c => c.email).join(',');
    const subject    = encodeURIComponent(`דוח סיור #${_report.reportNumber} — ${_project.name}`);
    const body       = encodeURIComponent(
      `שלום,\n\nמצורף דוח סיור מס' ${_report.reportNumber} מתאריך ${_report.date || ''}.\n\nבברכה,\nצוות DIT`
    );

    document.getElementById('email-share-overlay')?.remove();
    App.showLoading('מפיק PDF...');

    try {
      await PdfExport.generate(_report, _notes, _project);
      App.hideLoading();
      setTimeout(() => {
        window.location.href = `mailto:${emails}?subject=${subject}&body=${body}`;
      }, 1000);
    } catch (err) {
      App.hideLoading();
      App.toast('שגיאה בהפקת PDF');
    }
  }

  return { open, _send };
})();
window.EmailShare = EmailShare;
