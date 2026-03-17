---
title: "Our Team"
description: "Meet the people behind Dice Bastion"
showHero: false
showDate: false
---

<div id="team-container">
  <div id="team-grid" class="team-grid"></div>
</div>

<script>
const teamMembers = [ // prettier-ignore
  {
    name: "Nick Calamaro",
    role: "Founder",
    image: "/img/team/nick.png",
    emailUser: "nick",
    emailDomain: "dicebastion.com",
    about: "With a passion for board games, card games, and community organising, Nick founded Dice Bastion to give Gibraltar's tabletop gamers a welcoming space to play their favourite games.",
    howStarted: "",
    top3Games: [],
    favouriteTCG: "",
    favouritePublishers: [],
    funFact: ""
  },
  {
    name: "Jen Luttig",
    role: "Founder",
    image: "/img/team/jen.png",
    emailUser: "jen",
    emailDomain: "dicebastion.com",
    about: "Dedicated to creating a welcoming space for all gamers. Always ready to help new members feel at home.",
    howStarted: "",
    top3Games: [],
    favouriteTCG: "",
    favouritePublishers: [],
    funFact: ""
  }
];

function renderTeam() {
  const grid = document.getElementById('team-grid');

  if (!teamMembers || teamMembers.length === 0) {
    grid.innerHTML = '<div class="card-empty">No team members listed yet.</div>';
    return;
  }

  grid.innerHTML = teamMembers.map(member => {
    const email = member.emailUser && member.emailDomain
      ? `${member.emailUser}@${member.emailDomain}`
      : null;

    const gamesTags = (member.top3Games || [])
      .map(g => `<span class="team-tag team-tag-primary">${g}</span>`).join('');

    const pubTags = (member.favouritePublishers || [])
      .map(p => `<span class="team-tag team-tag-neutral">${p}</span>`).join('');

    const qa = [
      { label: 'How did you get into tabletop games?', value: member.howStarted || '—' },
      { label: 'Top 3 favourite board games',          value: gamesTags ? `<span class="team-tag-list">${gamesTags}</span>` : '—' },
      { label: 'Favourite TCG',                        value: member.favouriteTCG || '—' },
      { label: 'Favourite publishers',                 value: pubTags ? `<span class="team-tag-list">${pubTags}</span>` : '—' },
      { label: 'A fun fact about you',                 value: member.funFact || '—' },
    ];

    return `
      <div class="team-member">
        <div class="team-card">
          ${member.image ? `<div class="team-card-image"><img src="${member.image}" alt="${member.name}" loading="lazy"></div>` : ''}
          <div class="team-card-body">
            <div class="team-card-intro">
              <h3 class="card-header">${member.name}</h3>
              <span class="team-role-tag">${member.role}</span>
            </div>
            ${member.about ? `<p class="team-bio">${member.about}</p>` : ''}
            ${email ? `
            <div class="team-contact-bar">
              <span class="card-label">Contact</span>
              <a href="mailto:${email}" class="link">${email}</a>
            </div>
            ` : ''}
          </div>
        </div>
        <dl class="team-qa">
          ${qa.map(q => `
            <div class="team-qa-item">
              <dt class="card-label">${q.label}</dt>
              <dd class="team-qa-value">${q.value}</dd>
            </div>`).join('')}
        </dl>
      </div>
    `;
  }).join('');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderTeam);
} else {
  renderTeam();
}
</script>
