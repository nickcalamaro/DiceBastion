---
title: "Our Team"
description: "Meet the people behind Dice Bastion"
showHero: false
showDate: false
---

<div id="team-container">
  <div id="team-grid" class="team-grid"></div>
</div>

<style>
/* Team Grid */
.team-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin: 2rem 0;
}

.team-card {
  border: 1px solid rgba(var(--color-neutral-300), 1);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  background: rgba(var(--color-neutral), 1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: row;
  align-items: stretch;
  position: relative;
  min-height: 240px;
}

.dark .team-card {
  background: rgb(var(--color-neutral-800));
  border-color: rgb(var(--color-neutral-700));
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.team-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  border-color: rgba(var(--color-primary-400), 0.5);
}

.dark .team-card:hover {
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
  border-color: rgba(var(--color-primary-500), 0.6);
}

.team-card-image {
  flex: 0 0 300px;
  width: 300px;
  align-self: stretch;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  line-height: 0;
  position: relative;
  background: linear-gradient(135deg, 
    rgba(var(--color-primary-100), 0.3) 0%, 
    rgba(var(--color-primary-200), 0.2) 100%);
}

.dark .team-card-image {
  background: linear-gradient(135deg, 
    rgba(var(--color-neutral-900), 0.6) 0%, 
    rgba(var(--color-neutral-800), 0.4) 100%);
}

.team-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
  display: block;
  margin: 0;
  padding: 0;
}

.team-card:hover .team-card-image img {
  transform: scale(1.05);
}

.team-content {
  flex: 1;
  padding: 2rem 1.5rem 0 1.5rem;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.team-name {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: rgba(var(--color-neutral-900), 1);
  letter-spacing: -0.03em;
  line-height: 1.2;
}

.dark .team-name {
  color: rgb(var(--color-neutral-50));
}

.team-role {
  display: inline-block;
  color: rgba(var(--color-primary-600), 1);
  font-weight: 600;
  font-size: 0.95rem;
  margin-top: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.dark .team-role {
  color: rgb(var(--color-primary-400));
}

.team-bio {
  color: rgba(var(--color-neutral-600), 1);
  margin: 0.75rem 0 1rem 0;
  line-height: 1.7;
  font-size: 1rem;
}

.dark .team-bio {
  color: rgb(var(--color-neutral-400));
}

.team-meta {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 1.25rem 1.5rem;
  margin: auto -1.5rem 0 -1.5rem;
  background: linear-gradient(135deg, 
    rgba(var(--color-primary-50), 0.5) 0%, 
    rgba(var(--color-primary-100), 0.3) 100%);
  border-top: 2px solid rgba(var(--color-primary-200), 0.5);
  backdrop-filter: blur(10px);
}

.dark .team-meta {
  background: linear-gradient(135deg, 
    rgba(var(--color-neutral-900), 0.6) 0%, 
    rgba(var(--color-neutral-800), 0.4) 100%);
  border-top-color: rgba(var(--color-primary-800), 0.4);
}

.team-contact {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.team-contact-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
  color: rgba(var(--color-neutral-600), 0.8);
}

.dark .team-contact-label {
  color: rgba(var(--color-neutral-400), 0.9);
}

.team-contact-value {
  color: rgba(var(--color-primary-700), 1);
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
}

.dark .team-contact-value {
  color: rgb(var(--color-primary-300));
}

.team-contact-value:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .team-card {
    flex-direction: column;
    align-items: stretch;
  }
  
  .team-card-image {
    flex: none;
    width: 100%;
    height: auto;
    max-height: 400px;
  }
  
  .team-card-image img {
    object-fit: contain;
  }
}
</style>

<script>
// Define team members here
const teamMembers = [
  {
    name: "Nick Calamaro",
    role: "Founder",
    bio: "Passionate about bringing the gaming community together. Running events since 2015.",
    image: "/img/team/nick.png",
    emailUser: "nick",
    emailDomain: "dicebastion.com"
  },
  {
    name: "Jen Luttig",
    role: "Founder",
    bio: "Dedicated to creating a welcoming space for all gamers. Always ready to help new members feel at home.",
    image: "/img/team/jen.png",
    emailUser: "jen",
    emailDomain: "dicebastion.com"
  }
];

function renderTeam() {
  const grid = document.getElementById('team-grid');
  
  if (!teamMembers || teamMembers.length === 0) {
    grid.innerHTML = '<div style="text-align: center; padding: 3rem; color: rgba(var(--color-neutral-600), 1);">No team members listed yet.</div>';
    return;
  }
  
  grid.innerHTML = teamMembers.map(member => {
    const email = member.emailUser && member.emailDomain ? `${member.emailUser}@${member.emailDomain}` : null;
    return `
      <div class="team-card">
        ${member.image ? `<div class="team-card-image"><img src="${member.image}" alt="${member.name}"></div>` : ''}
        <div class="team-content">
          <h3 class="team-name">${member.name}</h3>
          <div class="team-role">${member.role}</div>
          ${member.bio ? `<p class="team-bio">${member.bio}</p>` : ''}
          ${email ? `
          <div class="team-meta">
            <div class="team-contact">
              <span class="team-contact-label">Contact</span>
              <a href="mailto:${email}" class="team-contact-value">${email}</a>
            </div>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Load team on page ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderTeam);
} else {
  renderTeam();
}
</script>
