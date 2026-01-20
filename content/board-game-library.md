---
title: "Board Game Library"
description: "Browse our collection of board games available at Dice Bastion. From strategy games to party games, we have something for everyone."
type: "page"
showHero: false
showDate: false
showReadingTime: false
---

<div id="board-game-library" style="max-width: 1200px; margin: 2rem auto; padding: 0 1rem;">
  <!-- Header -->
  <div style="text-align: center; margin-bottom: 3rem;">
    <h1 style="font-size: 2.5rem; margin-bottom: 1rem;">🎲 Board Game Library</h1>
    <p id="library-description" style="font-size: 1.1rem; color: rgb(var(--color-neutral-600)); max-width: 800px; margin: 0 auto;">
      Explore our collection of board games available at Dice Bastion Gibraltar.
    </p>
    <p id="library-stats" style="margin-top: 1rem; font-size: 0.95rem; color: rgb(var(--color-neutral-500));">
      Loading library...
    </p>
  </div>

  <!-- Search and Filter -->
  <div style="margin-bottom: 2rem;">
    <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: center;">
      <input 
        type="text" 
        id="search-games" 
        placeholder="Search games..."
        style="flex: 1; min-width: 250px; padding: 0.75rem 1rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 8px; font-size: 1rem;"
      />
      <select 
        id="sort-games"
        style="padding: 0.75rem 1rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 8px; font-size: 1rem; cursor: pointer;"
      >
        <option value="name-asc">Name (A-Z)</option>
        <option value="name-desc">Name (Z-A)</option>
        <option value="thumbs-desc">Most Popular</option>
        <option value="recent">Recently Added</option>
      </select>
    </div>
  </div>

  <!-- Loading State -->
  <div id="loading-state" style="text-align: center; padding: 4rem 0;">
    <div style="font-size: 3rem; margin-bottom: 1rem;">⏳</div>
    <p style="color: rgb(var(--color-neutral-600));">Loading board game library...</p>
  </div>

  <!-- Error State -->
  <div id="error-state" style="display: none; text-align: center; padding: 4rem 0;">
    <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
    <p style="color: rgb(var(--color-neutral-600));">Failed to load board game library. Please try again later.</p>
  </div>

  <!-- Games Grid -->
  <div id="games-grid" style="display: none; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">
    <!-- Games will be populated here -->
  </div>

  <!-- No Results -->
  <div id="no-results" style="display: none; text-align: center; padding: 4rem 0;">
    <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
    <p style="color: rgb(var(--color-neutral-600));">No games found matching your search.</p>
  </div>
</div>

<script>
(async function() {
  const gamesGrid = document.getElementById('games-grid');
  const loadingState = document.getElementById('loading-state');
  const errorState = document.getElementById('error-state');
  const noResults = document.getElementById('no-results');
  const searchInput = document.getElementById('search-games');
  const sortSelect = document.getElementById('sort-games');
  const libraryDescription = document.getElementById('library-description');
  const libraryStats = document.getElementById('library-stats');

  let allGames = [];
  let filteredGames = [];

  async function loadBoardGames() {
    try {
      // Fetch from Bunny CDN
      const response = await fetch('https://dicebastion.b-cdn.net/boardgames/data.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update metadata
      if (data.metadata) {
        if (data.metadata.description) {
          libraryDescription.textContent = data.metadata.description;
        }
        libraryStats.textContent = `${data.games.length} games • Last updated: ${new Date(data.metadata.lastUpdate).toLocaleDateString()}`;
      }
      
      allGames = data.games || [];
      filteredGames = [...allGames];
      
      loadingState.style.display = 'none';
      renderGames();
    } catch (error) {
      console.error('Error loading board games:', error);
      loadingState.style.display = 'none';
      errorState.style.display = 'block';
    }
  }

  function createGameCard(game) {
    const card = document.createElement('div');
    card.style.cssText = `
      background: rgb(var(--color-neutral));
      border: 1px solid rgb(var(--color-neutral-200));
      border-radius: 12px;
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
      cursor: pointer;
    `;
    
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-4px)';
      card.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = 'none';
    });

    const imageUrl = game.imageUrl || '/img/default-boardgame.jpg';
    const bggUrl = `https://boardgamegeek.com/boardgame/${game.id}`;
    
    card.innerHTML = `
      <div style="aspect-ratio: 1; background: rgb(var(--color-neutral-100)); position: relative; overflow: hidden;">
        <img 
          src="${imageUrl}" 
          alt="${game.name}"
          loading="lazy"
          style="width: 100%; height: 100%; object-fit: cover;"
          onerror="this.src='/img/default-boardgame.jpg'"
        />
      </div>
      <div style="padding: 1rem;">
        <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; font-weight: 600; color: rgb(var(--color-neutral-800));">
          ${game.name}
        </h3>
        ${game.body ? `
          <p style="margin: 0.5rem 0; font-size: 0.875rem; color: rgb(var(--color-neutral-600)); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
            ${game.body.replace(/<[^>]*>/g, '')}
          </p>
        ` : ''}
        <div style="display: flex; gap: 1rem; margin-top: 0.75rem; font-size: 0.85rem; color: rgb(var(--color-neutral-500));">
          ${game.thumbs > 0 ? `<span>👍 ${game.thumbs}</span>` : ''}
        </div>
        <a 
          href="${bggUrl}" 
          target="_blank" 
          rel="noopener noreferrer"
          style="display: inline-block; margin-top: 1rem; padding: 0.5rem 1rem; background: rgb(var(--color-primary-600)); color: white; border-radius: 6px; text-decoration: none; font-size: 0.875rem; font-weight: 600; transition: background 0.2s;"
          onmouseover="this.style.background='rgb(var(--color-primary-700))'"
          onmouseout="this.style.background='rgb(var(--color-primary-600))'"
        >
          View on BGG →
        </a>
      </div>
    `;

    return card;
  }

  function renderGames() {
    gamesGrid.innerHTML = '';
    
    if (filteredGames.length === 0) {
      gamesGrid.style.display = 'none';
      noResults.style.display = 'block';
      return;
    }
    
    noResults.style.display = 'none';
    gamesGrid.style.display = 'grid';
    
    filteredGames.forEach(game => {
      gamesGrid.appendChild(createGameCard(game));
    });
  }

  function filterAndSort() {
    const searchTerm = searchInput.value.toLowerCase();
    const sortBy = sortSelect.value;
    
    // Filter
    filteredGames = allGames.filter(game => 
      game.name.toLowerCase().includes(searchTerm) ||
      (game.body && game.body.toLowerCase().includes(searchTerm))
    );
    
    // Sort
    filteredGames.sort((a, b) => {
      switch(sortBy) {
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'thumbs-desc':
          return (b.thumbs || 0) - (a.thumbs || 0);
        case 'recent':
          return new Date(b.postdate || 0) - new Date(a.postdate || 0);
        case 'name-asc':
        default:
          return a.name.localeCompare(b.name);
      }
    });
    
    renderGames();
  }

  // Event listeners
  searchInput.addEventListener('input', filterAndSort);
  sortSelect.addEventListener('change', filterAndSort);

  // Load games on page load
  loadBoardGames();
})();
</script>
