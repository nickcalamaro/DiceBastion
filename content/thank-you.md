---
title: Thank You
showDate: false
url: "/thank-you"
---

# Thank You

Your payment was received. If this was a membership purchase, your membership should now be active.

If you purchased an event ticket, it is confirmed. You will also receive any follow‑up details from the organisers soon.

If the page was opened before processing finished or something looks wrong:
- Wait a few seconds and refresh.
- Or re-open the Memberships or Event page and it will auto-confirm using the orderRef in the URL.

Need help? Email support@dicebastion.com.

<script>
(function(){
  const API_BASE = (window.__DB_API_BASE || 'https://dicebastion-memberships.ncalamaro.workers.dev').replace(/\/+$/,'');
  const params = new URLSearchParams(location.search);
  const ref = params.get('orderRef');
  if(!ref) return;

  const log = (m)=>{ try{ console.log('[thank-you]', m); }catch(e){} };
  const isEvent = /^EVT-\d+-[0-9a-f\-]{36}$/i.test(ref);
  const path = isEvent ? `/events/confirm?orderRef=${encodeURIComponent(ref)}` : `/membership/confirm?orderRef=${encodeURIComponent(ref)}`;

  (async ()=>{
    try {
      const r = await fetch(API_BASE + path, { method:'GET' });
      const j = await r.json();
      log(j);
      const msg = document.createElement('div');
      msg.style.marginTop = '12px';
      msg.style.fontWeight = '600';
      if (j && j.ok && (j.status === 'active' || j.status === 'already_active')) {
        msg.textContent = 'All set. Your payment is confirmed.';
      } else if (j && j.status && String(j.status).toUpperCase() === 'PENDING') {
        msg.textContent = 'Payment is still processing. This page will update shortly.';
      } else {
        msg.textContent = 'Could not verify payment automatically. If you were charged, it will reconcile shortly.';
      }
      document.currentScript.parentElement.appendChild(msg);
    } catch(e) { log(e); }
  })();
})();
</script>
