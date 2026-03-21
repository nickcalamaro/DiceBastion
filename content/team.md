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
    howStarted: `As a mostly only child (my brother is 10 years older than me and had enough hobbies of his own!) I was always fascinated by board games but didn't have many chances to play. I ended up spending hours and hours poring over the rulebooks or coming up with my own rules. Whenever I did have family or friends over, they were always the first thing I'd try to get people to play. I sort of forgot about board games until I was living with my partner in Spain and found ourselves without internet for a month (we were just in Santa Margarita, but getting fibre installed is a bit of a nightmare). The good news about that was we had plenty of time to catch up on hobbies and one day on a whim we popped into e-minis in La Linea and on a recommendation picked up Terraforming Mars which absolutely blew us away compared to the games we'd both played growing up. It's cute now looking back that we probably played that at least 10 times before even considering getting a second board game (which I think was Azul or Alhambra) but after that it was off to the races! I was fascinated by the range. I also have to give credit to Shut Up &amp; Sit Down who kept us entertained for hours with their reviews that were just as much comedy-skit as they were informative about this new hobby we'd found ourselves in.`,
    top3Games: [
      {
        name: "Root",
        description: `<p>The marmite of the board game world! Root's core concept (besides the adorable woodland creatures) is that every faction plays completely differently! That means that while the imperialist cats are trying to raise armies and build an empire, there's an alliance of woodland critters waging guerilla war to reclaim their homes. Some factions are merchants trying to exploit the conflict, others are cultists trying to spread their religion. One faction, the vagabond, is just a solitary RPG character in the wrong genre of game who's trying to complete quests and build a hoard of items along the way.</p><p>For some players, that diversity can be a huge headache since it means that you can't really learn the whole game in one sitting, because you have to spend a full game's worth of teaching just to learn your own faction, let alone trying to figure out what everyone else around the table is doing. For me though, and I think for most people who are willing to put in the effort to explore it fully, it's an absolute masterpiece. There are now 11 different factions which all do COMPLETELY different things, while still working on the same clearly defined set of rules. That doesn't just mean that every game will be completely different, but that there's a whole breadth of options for each faction to explore depending on what others are doing around the board.</p>`
      },
      {
        name: "Wonderland's War",
        description: `<p>I absolutely love weird and quirky fantasy settings, so even before I knew how this game played, the art and style completely won me over. But the mechanics, how they all work together, and especially how they stick with the theme of exploring a bizarre world, are honestly just as if not even more impressive than the artwork.</p><p>Wonderland's War might initially seem like an over-the-top and pretty simple war game where you're just trying to amass more troops in an area than your opponents. But unlike other games that would simulate a battle by rolling dice or playing cards, Wonderland's War has you pull tokens from a bag to rally your troops. But mixed in with your regular soldiers are upgrades unique to each character and shards of the madness that's infecting you as you descend further into Wonderland. This makes every battle a tense push-your-luck affair that really makes you scratch your brain and grit your teeth at the same time. The ways that all of the different denizens of Wonderland are so different and that each character can get unique upgrades to get the edge on your opponents is also super well incorporated and slick for such a meaty game.</p>`
      },
      {
        name: "Jekyll &amp; Hyde vs Scotland Yard",
        description: `<p>For something lighter, and a sign of just how diverse board games can be. Jekyll and Hyde is an incredibly simple, cooperative trick-taking game at its core (just play a card, following suit, whoever plays the highest card of the lead suit wins). But just a few simple changes to the formula and the fact that you're not allowed to share information makes this such an intense experience. You'll have to find the right time to play potions which change the rules of the game, without accidentally messing up what your partner is trying to do.</p><p>There's been tonnes of games in the trick-taking genre lately that all add so much with comparatively minor changes. 
        Sail in particular has been an absolute joy to play. In that one you're actually navigating across a treacherous ocean and will need to adjust your strategy as you go to dodge the various obstacles, while again not being able to communicate fully with your opponent and hoping not to accidentally sabotage their plans.</p>`
      }
    ],
    favouriteTCG: `<p>I absolutely adore TCGs and especially trying out new ones so this is a tough one. CardFight Vanguard for the fast and tense matches, Altered (which was sadly just cancelled as I'm writing this) for the stunning art and the intuitive gameplay. Obviously Magic the Gathering has been a big part of my life for the last...I can't believe it but fourteen years.</p><p>But my absolute favourite for the last few years has to be Final Fantasy TCG. I never got to play them myself but I caught glimpses of Final Fantasy X while staying round my cousin's house and it seemed like the coolest thing in the world to me. Eventually I was able to emulate the older titles on a jailbroken iPod Touch and was hooked. The TCG is a bit like Final Fantasay itself, built on the back of giants (borrowing a lot of the rules from Magic) but innovating and pushing the genre even further. The resource system is particularly unique, gone is the slow ramping up to play your cards. In FFTCG you can set the pace of the game however is best for the match. </p><p>The other thing I love about Final Fantasy is the deck variety. Although there are very clear archetypes to build around like in other card games, they're normally incredibly flexible and can be mixed-and-matched to your heart's content. For example my favourite deck is Vikings, so you'll always be playing a core of those. But unlike in other games where you'd be encouraged to just double and triple down on the Viking theme, in FFTCG you can supplement this with other themes or lean into different aspects of them, the fact that they come in numbers, the fact that they're all water element, etc. so no two decks ever need to be the same.</p>`,
    favouritePublishers: [],
    funFact: `<p>I feel like I've lived quite a wacky life for a comparatively introverted guy who just wants to play games and read books. I've been involved in local politics since about 2018, I lived in Chile for a year, I worked as an IT technician on a megayacht for a few months...</p><p>But the fact that I'm definitely proudest of is that I had a tiny role getting to help create a Pokemon fangame called Pokemon Reborn. Much like board games, Pokemon wasn't something I really thought much about after playing them as a child. But while at university I discovered this wonderful little community online, all based around a Pokemon fangame, 14 years in the making. Seeing the developer grow from an independent fan just messing around and going on to lead a whole team was super inspiring and despite being a fangame, it's legitimately one of the best videogames I've ever played. The game and the community spirit around it single-handedly reinvigorated my love for Pokemon but more importantly, taught me the power of community and inspired me to try and create that same kind of feeling here at Dice Bastion.</p>`
  },
  {
    name: "Jen Luttig",
    role: "Founder",
    image: "/img/team/jen.png",
    emailUser: "jen",
    emailDomain: "dicebastion.com",
    about: "Dedicated to creating a welcoming space for all gamers. Always ready to help new members feel at home.",
    howStarted: `So while we had Monopoly, Mouse Trap and some other small games, my family used to play Risk religiously every Christmas/New Year, and I remember always watching them and being invested. The first time I was allowed to play I was repeatedly warned nobody would go easy on me, and was destroyed in game for many years, but I still always loved being involved. Fast forward to when I was at university with a small collection of maybe 5 games, and following an invite to a games night with my sister where I experienced D&amp;D and Exploding Kittens for the first time, I discovered Kickstarter and backed all of Unstable Unicorns through the years. Since then I branched out to more and more different games until I met some members of the GWC - and the rest is history!`,
    top3Games: [
      {
        name: "Blood on the Clocktower",
        description: `<p>While it's not quite a 'board' game, this is easily my absolute favourite game. There's nothing like the thrill of being an evil demon trying to murder your friends one by one and having to come up with elaborate lies to mislead the town into murdering their innocent friends... And I have had some pretty spectacular evil wins, and an evil track record that led to me getting a custom shirt made!</p><p>On that note - there's also nothing quite like being a good townsfolk, not knowing if the person you have just confessed all your helpful, good information to is actually plotting to kill you in the night. It's such a thrill figuring out the puzzle and murdering the evil Demon at the last possible moment after having watched so many of your innocent friends die. The Traitors meets Werewolf/Mafia meets Among Us - just somehow, so much better!</p>`
      },
      {
        name: "Nemesis (franchise)",
        description: `<p>This game is a thematic masterpiece to me. As someone who comes from a family which loves the Alien franchise, this is right up my alley. While I don't know how much replayability the game has mechanically, as it can follow the same pattern, I'm someone who loves re-watching movies - and this game feels like a movie.</p><p>I love a game where I can leave and tell people the stories. How my character just about managed to board the escape pod after being covered in slime and hunted down by an alien, only to have a larva burst out of me when I thought I was safe. How my crew managed to destroy the nest by kicking one egg at a time, but succumbed to their injuries after the queen came for them. I could not care less if I win or lose this game. It's all about the experience.</p>`
      },
      {
        name: "The Search for Planet X",
        description: `<p>I won't lie, I struggled so much with my #3. I have a lot of games I love. This one is one I am particularly into at the moment, and as someone who's big into themes — it's space-themed! There's a lot of (very simplified) real-life science, based on the theory that there is an ice giant in our solar system, because of the way some icy bodies in the Kuiper Belt move - suggesting something very, very big must be nearby. I love this concept.</p><p>It's a deduction game (think: Sudoku) where you're studying where different astronomical bodies are in relation to each other. This is one of the few games I love to play solo, but there's a nice competitive balance when playing with others - finding Planet X doesn't guarantee you the win, you win by points! But to get points, you need to give all your competitors valuable info... I love this game, and while I can't gush over it as much as my #1 and #2, this game does everything right to me.</p>`
      }
    ],
    favouriteTCG: `<p>Cardfight! Vanguard, hands down. I'm not exactly big on TCGs and actively dislike many of them. However I absolutely love CF Vanguard - it was the first TCG I ever really learnt back in 2018. My friend Callie introduced me to the game by telling me about a murderous circus troupe I could play as (Pale Moon/Dark States), so I imprinted on them immediately and now compare every card game I play to this one.</p><p>To me, CF Vanguard hits the sweet spot - lots of strategy, with just a little bit of luck making every game feel like you have a chance of winning. If you can just pull the right trigger you need!</p>`,
    funFact: `<p>I love playing a lot of board games, but I get just as much out of sitting out occasionally to help run or teach the game. With video games however, it's the opposite. I play the odd game, but I love nothing more than watching somebody else play, maybe googling a walkthrough or a map here and there to assist - while still giving the player a spoiler-free experience! Though I'll still count those games as my having 'played' them.</p>`
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

    const firstName = member.name.split(' ')[0];
    const hasGameDescs = (member.top3Games || []).some(g => typeof g === 'object');
    const gamesValue = (() => {
      const games = member.top3Games || [];
      if (!games.length) return '—';
      if (!hasGameDescs) {
        return `<span class="team-tag-list">${games.map(g => `<span class="team-tag team-tag-primary">${g}</span>`).join('')}</span>`;
      }
      return `<div class="team-games-list">${games.map(g => `
        <details class="team-game-details">
          <summary class="team-game-summary">
            <span class="team-tag team-tag-primary">${g.name}</span>
            <span class="team-details-cue">See More</span>
            <span class="team-details-chevron"></span>
          </summary>
          <div class="team-details-body">${g.description || ''}</div>
        </details>`).join('')}</div>`;
    })();

    function qaItem(label, value, collapsible) {
      if (!collapsible || !value || value === '—') {
        return `
          <div class="team-qa-item">
            <dt class="card-label">${label}</dt>
            <dd class="team-qa-value">${value || '—'}</dd>
          </div>`;
      }
      return `
        <div class="team-qa-item team-qa-item--collapsible">
          <details class="team-qa-details">
            <summary class="team-qa-summary">
              <span class="card-label">${label}</span>
              <span class="team-details-chevron"></span>
            </summary>
            <dd class="team-qa-value team-details-body">${value}</dd>
          </details>
        </div>`;
    }

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
          ${qaItem('How did you get into tabletop games?', member.howStarted || '', true)}
          ${qaItem('Top 3 favourite board games', gamesValue, hasGameDescs)}
          ${qaItem('Favourite TCG', member.favouriteTCG || '', true)}
          ${qaItem('A fun fact about you', member.funFact || '', true)}
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
