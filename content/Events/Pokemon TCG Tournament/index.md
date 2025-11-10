---
Title: Pokémon TCG - Standard Tournament
Date: 2025-11-02
Summary: 'Gibraltar&apos;s biggest Pokémon TCG Tournament ever! With over £300 in prizes waiting to be won!'
draft: true

---

<meta name="description" content="Enter the Pokémon TCG Standard Tournament at the Gibraltar Card Show 2025. Battle through Swiss rounds and Top 8 for a chance to win exclusive prizes.">
<meta property="og:image" content="featured-image.png" />

<style>
  .event-card {
    max-width: 800px;
    margin: 24px auto;
    padding: 20px 22px;
    background: #ffffffcc;
    backdrop-filter: blur(6px);
    border-radius: 14px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    color: #222;
  }
  .event-card .section { padding: 14px 0; border-top: 1px solid #ddd; }
  .event-card .row { display: flex; justify-content: space-between; gap: 12px; padding: 6px 0; }
  .event-card .label { font-weight: 700; font-size: 1.15em; }
  .event-card .value { font-weight: 600; font-size: 1.15em; text-align: right; }
  .event-card p { margin: 8px 0 0; line-height: 1.55; }
  .event-card a { color: #0b65c2; text-decoration: none; border-bottom: 1px solid rgba(11,101,194,0.35); }
  .event-card a:hover { border-bottom-color: rgba(11,101,194,0.7); }

  /* Dark mode */
  html.dark .event-card, :root.dark .event-card, [data-theme="dark"] .event-card {
    background: rgba(10, 25, 47, 0.85); color: #fff; box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  }
  html.dark .event-card .section, :root.dark .event-card .section, [data-theme="dark"] .event-card .section {
    border-top-color: rgba(255,255,255,0.18);
  }
  html.dark .event-card a, :root.dark .event-card a, [data-theme="dark"] .event-card a {
    color: #7cb7ff; border-bottom-color: rgba(124,183,255,0.45);
  }
  @media (prefers-color-scheme: dark) {
    .event-card { background: rgba(10, 25, 47, 0.85); color: #fff; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
    .event-card .section { border-top-color: rgba(255,255,255,0.18); }
    .event-card a { color: #7cb7ff; border-bottom-color: rgba(124,183,255,0.45); }
  }

  /* Dark mode adjustments for tiebreaker rules backgrounds */
  html.dark .rules-section.swiss, :root.dark .rules-section.swiss, [data-theme='dark'] .rules-section.swiss {
    background: rgba(48, 96, 160, 0.6) !important;
  }
  html.dark .rules-section.topcut, :root.dark .rules-section.topcut, [data-theme='dark'] .rules-section.topcut {
    background: rgba(160, 48, 48, 0.6) !important;
  }
  /* Make the image block-level and remove any margins */
.section .row .value img {
  display: block;            /* no baseline gap */
  margin: 0;                 /* no extra margins */
  max-height: 48px;          /* adjust as needed */
  width: auto;
  height: auto;
  vertical-align: top;       /* extra safety */
}
</style>

<section class="event-card">
  <div class="section" style="border-top: none;">
    <div class="row"><div class="label">Registration</div><div class="value">10:45 AM</div></div>
    <div class="row"><div class="label">Start time</div><div class="value">11:00 AM</div></div>
  </div>

  <div class="section">
    <div class="row"><div class="label">Format</div><div class="value">Standard</div></div>
    <p>The Pokémon TCG Standard format is the primary competitive format for official Play! Pokémon events.
      For the 2025 season, cards with the <strong>“F” regulation mark</strong> have rotated out, and only cards with
      <strong>“G”</strong> and <strong>“H”</strong> regulation marks (plus any future marks) are legal.
      Older prints of a card can still be used if a current legal version exists.
      Full details are available on the official Pokémon site:
      <a href="https://www.pokemon.com/us/pokemon-news/2025-pokemon-tcg-standard-format-rotation-announcement" target="_blank" rel="noopener">
        pokemon.com – 2025 Standard Format Rotation
      </a>.
    </p>
  </div>

  <div class="section">
    <div class="row"><div class="label">Rounds</div><div class="value">4 + Top 8</div></div>
    <p>Players will compete in 4 Swiss rounds to determine standings.
      The top 8 players will then advance to single‑elimination knockout rounds until a champion is crowned.</p>
    <p>All rounds will be played as best of three matches and last 50 minutes.</p>
  </div>

  <div class="section">
    <div class="row"><div class="label">Prizes</div><div class="value"><img src="top-prize.png" style="max-height:180px; width:auto;"/></div></div>
    <p>Prizes are being provided courtesy of <a href="https://toycorner.gi/">Toy Corner</a>, our event sponsor.
      First place will take home a <strong>Prismatic Evolutions Super Premium Bundle</strong> More prizes to be announced soon!</p>
  </div>

  <div class="section">
    <div class="row"><div class="label">Tickets</div><div class="value"><a href="https://gibcardshow.com/tickets">Available Now</a></div></div>
    <p>Tickets include entry into the Gibraltar Card Show and participation in the tournament.</p>
  </div>



  <div class="section">
    <div class="label" style="margin-bottom: 8px;">Helpful Resources</div>
    <ul style="margin: 0; padding-left: 18px; line-height: 1.55;">
      <li><a href="https://www.pokemon.com/us/play-pokemon/about/tournaments-rules-and-resources/">Play! Pokémon Tournament Rules Handbook</a></li>
      <li><a href="https://bulbapedia.bulbagarden.net/wiki/2025-26_Standard_format_(TCG)" target="_blank" rel="noopener">Bulbapedia – 2025–26 Standard Format Overview</a></li>
      <li><a href="#" id="tiebreakerLink">Tiebreaker Rules</a></li>
    </ul>
  </div>
</section>

<!-- Modal lives OUTSIDE the wrapper -->
<div id="tiebreakerModal" style="
  display:none; /* hidden by default */
  position:fixed;
  inset:0;
  z-index:9999;
  background:rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  align-items:center;
  justify-content:center;
">
  <div style="
    background:#ffffffcc;
    backdrop-filter: blur(8px);
    padding: 20px 24px;
    border-radius: 14px;
    width: 90%;
    max-width: 520px;
    font-family: 'Segoe UI','Helvetica Neue',sans-serif;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    position: relative;
    color: #222;
  ">
    <span id="closeTiebreakerModal" style="
      position:absolute;
      top:10px; right:14px;
      font-size: 1.5em;
      cursor:pointer;
      color:#333;
    ">&times;</span>

<h2 style="margin-top:0;">Tiebreaker Rules</h2>
<div style="line-height:1.5; font-size:0.95rem;">
  <div class="rules-section swiss" style="background:#d0e6ff; padding:10px; border-radius:8px; margin-bottom:12px;">
    <strong>🟦 Swiss Rounds (can end in a draw)</strong>
    <ul style="margin:8px 0 0 20px; padding:0;">
      <li>When time is called, players have ten minutes to finish the current turn and then play one more full turn.</li>
      <li>If there is no winner after those turns, the game is a draw.</li>
    </ul>
  </div>

  <hr style="border:none; border-top:1px solid #ccc; margin:16px 0;">

  <div class="rules-section topcut" style="background:#ffd6d6; padding:10px; border-radius:8px;">
    <strong>🟥 Top Cut / Elimination (must have a winner)</strong>
    <ul style="margin:8px 0 0 20px; padding:0;">
      <li>Same procedure as above.</li>
      <li>If 10 minutes expire and there is no winner:</li>
      <ul>
        <li>The player with a Prize card lead is declared the winner.</li>
        <li>If Prizes are tied a tie-breaker game (normal 6‑Prize setup) will be played to determine the winner. The first player to establish a Prize card lead, or to win the game outright by any other method, is the winner.</li>    
      <ul>
    </ul>
  </div>
</div>
</div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('tiebreakerModal');
  const openLink = document.getElementById('tiebreakerLink');
  const closeBtn = document.getElementById('closeTiebreakerModal');

  function openModal() {
    modal.style.display = 'flex'; // show and centre
    document.body.style.overflow = 'hidden'; // lock background scroll
  }

  function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = ''; // restore scroll
  }

  openLink.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  });

  closeBtn.addEventListener('click', closeModal);

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
});
</script>