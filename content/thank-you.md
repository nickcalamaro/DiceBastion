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

  const mount = (text)=>{ const msg=document.createElement('div'); msg.style.marginTop='12px'; msg.style.fontWeight='600'; msg.textContent=text; document.currentScript.parentElement.appendChild(msg); };
  const isEvent = /^EVT-\d+-[0-9a-f\-]{36}$/i.test(ref);
  const path = isEvent ? `/events/confirm?orderRef=${encodeURIComponent(ref)}` : `/membership/confirm?orderRef=${encodeURIComponent(ref)}`;

  (async ()=>{
    // poll a couple of times before deciding
    for(let i=0;i<3;i++){
      try { const r = await fetch(API_BASE + path); const j = await r.json(); if (j && j.ok && (j.status==='active'||j.status==='already_active')) { mount('All set. Your payment is confirmed.'); return; }
        if (j && j.status && String(j.status).toUpperCase()==='PENDING') { await new Promise(r=>setTimeout(r,1200)); continue; }
      } catch(_){}
      await new Promise(r=>setTimeout(r,800));
    }
    mount('Payment is processing. You can refresh this page in a moment to see the confirmation.');
  })();
})();
</script>
