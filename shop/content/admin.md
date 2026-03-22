---
title: "Admin - Product Management"
---

<div id="admin-page">
  <!-- Login Form -->
  <div id="login-container" style="max-width: 400px; margin: 5rem auto;">
    <h1 style="text-align: center; margin-bottom: 2rem;">Admin Login</h1>
    <form id="login-form" style="background: rgb(var(--color-neutral)); border: 1px solid rgb(var(--color-neutral-200)); border-radius: 12px; padding: 2rem;">
      <div style="margin-bottom: 1.5rem;">
        <label for="admin-password" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Admin Password</label>
        <input type="password" id="admin-password" required style="width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px; font-size: 1rem;">
      </div>
      <button type="submit" style="width: 100%; padding: 0.75rem; background: rgb(var(--color-primary-600)); color: white; border: none; border-radius: 6px; font-size: 1rem; font-weight: 600; cursor: pointer;">
        Login
      </button>
      <div id="login-error" style="display: none; margin-top: 1rem; padding: 0.75rem; background: #fee; color: #c00; border-radius: 6px; font-size: 0.875rem;"></div>
    </form>
  </div>

  <!-- Admin Dashboard -->
  <div id="admin-dashboard" style="display: none;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <h1>Product Management</h1>
      <button id="logout-btn" style="padding: 0.5rem 1rem; background: rgb(var(--color-neutral-200)); border: none; border-radius: 6px; cursor: pointer;">Logout</button>
</div>

<!-- Add/Edit Product Form -->
<div id="product-form-container" style="background: rgb(var(--color-neutral)); border: 1px solid rgb(var(--color-neutral-200)); border-radius: 12px; padding: 2rem; margin-bottom: 2rem;">
<h2 id="form-title">Add New Product</h2>
<form id="product-form">
<input type="hidden" id="product-id">

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
  <div>
    <label for="product-name" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Product Name *</label>
    <input type="text" id="product-name" required style="width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px;">
  </div>
  <div>
    <label for="product-slug" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">URL Slug *</label>
    <input type="text" id="product-slug" required style="width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px;">
    <small style="color: rgb(var(--color-neutral-500)); font-size: 0.875rem;">e.g., warhammer-starter-set</small>
  </div>
</div>

<div style="margin-bottom: 1rem;">
  <label for="product-description" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Description</label>
  <textarea id="product-description" rows="3" style="width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px; font-family: inherit;" placeholder="Short description shown on product cards..."></textarea>
  <small style="color: rgb(var(--color-neutral-500)); font-size: 0.813rem;">Brief text shown on product listing cards.</small>
</div>

<div style="margin-bottom: 1rem;">
  <label for="product-summary" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Summary</label>
  <textarea id="product-summary" rows="2" maxlength="160" style="width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px; font-family: inherit;" placeholder="One-line summary for search results and social previews..."></textarea>
  <small style="color: rgb(var(--color-neutral-500)); font-size: 0.813rem;">Used for Google meta description &amp; social previews. Max 160 chars recommended.</small>
</div>

<div style="margin-bottom: 1rem;">
  <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Full Description</label>
  <div class="shop-editor">
    <div class="shop-editor-toolbar">
      <button type="button" onclick="formatProductText('bold')" class="shop-editor-btn" style="font-weight: bold;">B</button>
      <button type="button" onclick="formatProductText('italic')" class="shop-editor-btn" style="font-style: italic;">I</button>
      <button type="button" onclick="formatProductText('underline')" class="shop-editor-btn" style="text-decoration: underline;">U</button>
      <button type="button" onclick="formatProductText('insertUnorderedList')" class="shop-editor-btn">• List</button>
      <button type="button" onclick="insertProductLink()" class="shop-editor-btn">🔗 Link</button>
    </div>
    <div id="product-full-description" contenteditable="true" class="shop-editor-content" placeholder="Detailed product information, features, specifications..."></div>
  </div>
  <small style="color: rgb(var(--color-neutral-500)); font-size: 0.813rem;">Rich text shown on the product detail page. Also used by Google for SEO if Summary is empty.</small>
</div>

<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
  <div>
    <label for="product-price" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Price (pence) *</label>
    <input type="number" id="product-price" required style="width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px;">
    <small style="color: rgb(var(--color-neutral-500)); font-size: 0.875rem;">£10.00 = 1000 pence</small>
  </div>
  <div>
    <label for="product-stock" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Stock Quantity *</label>
    <input type="number" id="product-stock" required value="0" style="width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px;">
  </div>
  <div>
    <label for="product-category" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Category</label>
    <input type="text" id="product-category" style="width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px;">
  </div>
</div>

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
  <div>
    <label for="product-image" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Image URL</label>
    <input type="text" id="product-image" placeholder="https://..." style="width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px;">
  </div>
  <div>
    <label for="product-release-date" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Release Date</label>
    <input type="date" id="product-release-date" style="width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px;">
    <small style="color: rgb(var(--color-neutral-500)); font-size: 0.813rem;">For pre-order products. Google will show "Pre-Order" status.</small>
  </div>
</div>

<div style="margin-bottom: 1rem;">
  <label style="display: flex; align-items: center; cursor: pointer;">
    <input type="checkbox" id="product-active" checked style="margin-right: 0.5rem;">
    <span style="font-weight: 600;">Active (visible in shop)</span>
  </label>
</div>

<!-- Collapsible SEO Section -->
<div style="margin-bottom: 1.5rem;">
  <button type="button" class="seo-toggle-btn" onclick="toggleShopSeoSection()">
    <span class="seo-chevron">▶</span> 🔍 Google Product SEO Settings
  </button>
  <div id="shop-seo-section-body" class="seo-section-body">
    <div class="seo-info-banner">
      <span>ℹ️</span>
      <span>These settings show how your product appears in Google Shopping results, search snippets, and social media link previews (WhatsApp, Discord, Facebook, etc.). All data is derived from the fields above.</span>
    </div>

    <div style="margin-bottom: 1rem;">
      <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem;">📋 How Your Fields Map to Google</h4>
      <div class="seo-field-map">
        <div class="seo-field-map-grid">
          <strong>Title:</strong> <span>Product Name</span>
          <strong>Description:</strong> <span>Full Description → Summary → Description (first non-empty, HTML stripped)</span>
          <strong>Image:</strong> <span>Image URL (720px+ wide recommended)</span>
          <strong>Price:</strong> <span>Price field (auto-converted from pence to £)</span>
          <strong>Availability:</strong> <span id="seo-availability-preview">In Stock</span>
          <strong>Category:</strong> <span>Category field (becomes breadcrumbs in Google)</span>
          <strong>URL:</strong> <span id="seo-url-preview">shop.dicebastion.com/products/...</span>
        </div>
      </div>
    </div>

    <div class="seo-preview-box">
      <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem;">🔎 Google Search Preview</h4>
      <div style="font-family: Arial, sans-serif;">
        <div id="seo-preview-title" style="color: #1a0dab; font-size: 1.1rem; line-height: 1.3; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Product Name | Dice Bastion Shop</div>
        <div id="seo-preview-url" style="color: #006621; font-size: 0.8rem; margin-bottom: 4px;">shop.dicebastion.com › products › slug</div>
        <div id="seo-preview-price" style="color: #70757a; font-size: 0.8rem; margin-bottom: 2px;">£0.00 · <span id="seo-preview-stock" style="color: #188038;">In stock</span></div>
        <div id="seo-preview-desc" style="color: #545454; font-size: 0.85rem; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">Product description will appear here...</div>
      </div>
    </div>

    <div class="seo-info-banner seo-tip-banner">
      <span>💡</span>
      <span><strong>Image Tips:</strong> Google recommends product images be at least 720px wide (1920px preferred). Use .jpg, .png or .webp format. Provide 1:1 or 4:3 aspect ratios for best results in Shopping.</span>
    </div>
  </div>
</div>

<div style="display: flex; gap: 1rem;">
  <button type="submit" id="save-btn" style="flex: 1; padding: 0.75rem; background: rgb(var(--color-primary-600)); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
    Save Product
  </button>
  <button type="button" id="cancel-btn" style="display: none; padding: 0.75rem 1.5rem; background: rgb(var(--color-neutral-200)); border: none; border-radius: 6px; cursor: pointer;">
    Cancel
  </button>
</div>
</form>
</div>

<!-- Products List -->
<div style="background: rgb(var(--color-neutral)); border: 1px solid rgb(var(--color-neutral-200)); border-radius: 12px; padding: 2rem;">
<h2>Products</h2>
<div id="products-list"></div>
</div>

<!-- SEO Documentation -->
<div style="margin-top: 2rem;">
<button type="button" class="docs-toggle-btn" onclick="toggleDocsSection()">
<span class="docs-chevron">▶</span> 📖 How Product SEO Works — Admin Guide
</button>
<div id="docs-body" class="docs-body">
<h3>🌐 What Are SEO Product Pages?</h3>
<p>Each active product automatically gets its own dedicated URL at:</p>
<p><code>shop.dicebastion.com/products/your-product-slug</code></p>
<p>These pages are <strong>invisible to regular visitors</strong> — humans are instantly redirected to the shop with the product modal open. But search engine crawlers (Google, Bing, etc.) and social media bots (WhatsApp, Discord, Facebook) see a fully optimised, content-rich page with structured data.</p>

<h3>🔄 How Dynamic Rendering Works</h3>
<p>The system uses <strong>server-side dynamic rendering</strong>, a Google-endorsed approach:</p>
<div class="docs-flow-diagram">
  <span class="docs-flow-step">Visitor clicks product link</span>
  <span class="docs-flow-arrow">→</span>
  <span class="docs-flow-step">Server checks User-Agent</span>
  <span class="docs-flow-arrow">→</span>
  <span class="docs-flow-step">Bot? → Full SEO page</span>
  <span class="docs-flow-arrow">/</span>
  <span class="docs-flow-step">Human? → 302 redirect to shop modal</span>
</div>
<ul>
  <li><strong>Google/Bing bots</strong> see a complete HTML page with Product JSON-LD schema, Open Graph tags, meta descriptions, and breadcrumbs</li>
  <li><strong>Social bots</strong> (WhatsApp, Discord, Facebook, Twitter) see Open Graph data for rich link previews with product image, name, price</li>
  <li><strong>Real visitors</strong> get an instant 302 redirect to <code>shop.dicebastion.com/?product=slug</code> which opens the product modal — no delay, no flash</li>
</ul>

<h3>📋 Field-to-Schema Mapping</h3>
<p>Here's exactly how your admin fields translate to Google's Product schema:</p>
<ul>
  <li><strong>Product Name</strong> → <code>schema:name</code>, <code>og:title</code>, <code>&lt;title&gt;</code></li>
  <li><strong>Description</strong> → Fallback for meta description if Summary and Full Description are empty</li>
  <li><strong>Summary</strong> → Preferred source for <code>meta description</code>, <code>og:description</code>, <code>twitter:description</code> (max 160 chars)</li>
  <li><strong>Full Description</strong> → <code>schema:description</code> (HTML stripped), also displayed visually on the SEO page. Takes priority over Summary for schema</li>
  <li><strong>Price</strong> → <code>schema:offers.price</code> (auto-converted from pence to pounds, e.g. 1000 → £10.00)</li>
  <li><strong>Stock</strong> → <code>schema:offers.availability</code>: InStock / OutOfStock / PreOrder</li>
  <li><strong>Category</strong> → BreadcrumbList schema (Shop → Category → Product). Creates dedicated category landing pages at <code>shop.dicebastion.com/products/category/CategoryName</code></li>
  <li><strong>Image URL</strong> → <code>schema:image</code>, <code>og:image</code>, <code>twitter:image</code></li>
  <li><strong>URL Slug</strong> → Canonical URL, <code>og:url</code>, and the shareable link</li>
  <li><strong>Release Date</strong> → If set to a future date, availability becomes PreOrder with <code>schema:offers.availabilityStarts</code></li>
</ul>

<h3>🔗 Shareable Links</h3>
<p>Every product gets a shareable URL you can use anywhere:</p>
<ul>
  <li><strong>Product:</strong> <code>shop.dicebastion.com/products/your-slug</code></li>
  <li><strong>Category:</strong> <code>shop.dicebastion.com/products/category/CategoryName</code></li>
</ul>
<p>When shared on WhatsApp, Discord, Facebook, or Twitter, these links will show a rich preview card with the product image, name, price, and description — pulled from the Open Graph and Twitter Card meta tags on the SEO page.</p>

<h3>🗺️ Sitemap</h3>
<p>All active products are automatically included in a dynamic XML sitemap at:</p>
<p><code>shop.dicebastion.com/products/sitemap.xml</code></p>
<p>This sitemap is auto-generated from the database and includes all product URLs plus category pages. Submit this URL to Google Search Console to accelerate indexing.</p>

<h3>🕸️ Crawlable Internal Links</h3>
<p>The shop homepage is automatically injected with hidden <code>&lt;a&gt;</code> links to every active product's SEO page. This gives Google a crawl path from your shop to each product — critical for discovery and indexing. These links are invisible to visitors but fully visible to search crawlers.</p>

<h3>💡 Best Practices</h3>
<ul>
  <li><strong>Always fill in Summary</strong> — it's the primary text Google shows in search snippets. Keep it under 160 characters and make it compelling</li>
  <li><strong>Use Full Description</strong> for detailed product info — it's the richest content Google can index. Use the formatting toolbar for lists and links</li>
  <li><strong>Product images should be 720px+ wide</strong> (1920px recommended). Use .jpg, .png or .webp. Square (1:1) or landscape (4:3) aspect ratios work best for Google Shopping</li>
  <li><strong>Slugs are permanent</strong> — once Google indexes a URL, changing the slug breaks the old link. Choose descriptive, lowercase slugs with hyphens</li>
  <li><strong>Categories create pages</strong> — each unique category gets its own SEO landing page. Use consistent category names across products</li>
  <li><strong>Set Release Date for pre-orders</strong> — Google will display "Pre-Order" availability status instead of "In Stock"</li>
</ul>

<h3>🔍 Testing Your SEO Pages</h3>
<ul>
  <li><strong>Direct test:</strong> Visit <code>shop.dicebastion.com/products/your-slug</code> — you'll be redirected to the shop (that's correct!)</li>
  <li><strong>Bot test:</strong> Use <a href="https://search.google.com/test/rich-results" target="_blank" rel="noopener">Google Rich Results Test</a> to see the Product schema</li>
  <li><strong>Social test:</strong> Use <a href="https://developers.facebook.com/tools/debug/" target="_blank" rel="noopener">Facebook Debugger</a> or share the link in a Discord DM to yourself</li>
  <li><strong>Sitemap:</strong> Check <code>shop.dicebastion.com/products/sitemap.xml</code> to verify all products appear</li>
</ul>
</div>
</div>
</div>
</div>

<style>
#admin-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.product-card {
  border: 1px solid rgb(var(--color-neutral-200));
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1.5rem;
  align-items: start;
}

.product-info h3 {
  margin: 0 0 0.5rem;
  color: rgb(var(--color-neutral-800));
}

.product-meta {
  display: flex;
  gap: 1rem;
  margin: 0.5rem 0;
  font-size: 0.875rem;
  color: rgb(var(--color-neutral-600));
}

.product-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-edit, .btn-delete {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
}

.btn-edit {
  background: rgb(var(--color-primary-600));
  color: white;
}

.btn-delete {
  background: #dc2626;
  color: white;
}

.btn-index {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  background: #059669;
  color: white;
  transition: all 0.2s;
}
.btn-index:hover { background: #047857; }
.btn-index:disabled { opacity: 0.5; cursor: not-allowed; }

.badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-active {
  background: #dcfce7;
  color: #166534;
}

.badge-inactive {
  background: #fee;
  color: #991b1b;
}

.badge-low-stock {
  background: #fef3c7;
  color: #92400e;
}

/* Collapsible SEO section */
.seo-toggle-btn { display: flex; align-items: center; gap: 0.5rem; background: none; border: 1px solid rgb(var(--color-neutral-200)); border-radius: 6px; padding: 0.625rem 1rem; cursor: pointer; font-weight: 600; font-size: 0.875rem; color: rgb(var(--color-neutral-600)); width: 100%; transition: all 0.2s; }
.dark .seo-toggle-btn { border-color: rgb(var(--color-neutral-700)); color: rgb(var(--color-neutral-400)); }
.seo-toggle-btn:hover { background: rgb(var(--color-neutral-50)); color: rgb(var(--color-neutral-800)); }
.dark .seo-toggle-btn:hover { background: rgb(var(--color-neutral-900)); color: rgb(var(--color-neutral-200)); }
.seo-toggle-btn .seo-chevron { transition: transform 0.2s; font-size: 0.75rem; }
.seo-toggle-btn.is-open .seo-chevron { transform: rotate(90deg); }
.seo-section-body { display: none; padding: 1rem; margin-top: 0.5rem; background: rgb(var(--color-neutral-50)); border-radius: 6px; border: 1px solid rgb(var(--color-neutral-200)); }
.dark .seo-section-body { background: rgb(var(--color-neutral-900)); border-color: rgb(var(--color-neutral-700)); }
.seo-section-body.is-open { display: block; }
.seo-info-banner { display: flex; gap: 0.5rem; padding: 0.625rem 0.75rem; background: rgb(var(--color-primary-50)); border: 1px solid rgb(var(--color-primary-200)); border-radius: 6px; margin-bottom: 1rem; font-size: 0.813rem; color: rgb(var(--color-primary-700)); line-height: 1.4; }
.dark .seo-info-banner { background: rgba(var(--color-primary-900), 0.2); border-color: rgba(var(--color-primary-700), 0.4); color: rgb(var(--color-primary-300)); }
.seo-tip-banner { background: rgb(var(--color-neutral-100)); border-color: rgb(var(--color-neutral-300)); color: rgb(var(--color-neutral-600)); margin-bottom: 0; }
.dark .seo-tip-banner { background: rgb(var(--color-neutral-800)); border-color: rgb(var(--color-neutral-600)); color: rgb(var(--color-neutral-400)); }
.seo-field-map { font-size: 0.813rem; line-height: 1.6; color: rgb(var(--color-neutral-600)); }
.dark .seo-field-map { color: rgb(var(--color-neutral-400)); }
.seo-field-map-grid { display: grid; grid-template-columns: auto 1fr; gap: 0.25rem 0.75rem; }
.seo-preview-box { padding: 0.75rem; background: rgb(var(--color-neutral-100)); border-radius: 6px; margin-bottom: 1rem; }
.dark .seo-preview-box { background: rgb(var(--color-neutral-800)); }

/* Rich text editor */
.shop-editor { border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px; overflow: hidden; }
.dark .shop-editor { border-color: rgb(var(--color-neutral-600)); }
.shop-editor-toolbar { display: flex; gap: 0.25rem; padding: 0.5rem; background: rgb(var(--color-neutral-100)); border-bottom: 1px solid rgb(var(--color-neutral-300)); }
.dark .shop-editor-toolbar { background: rgb(var(--color-neutral-800)); border-bottom-color: rgb(var(--color-neutral-600)); }
.shop-editor-btn { padding: 0.375rem 0.625rem; background: rgb(var(--color-neutral)); border: 1px solid rgb(var(--color-neutral-300)); border-radius: 4px; cursor: pointer; font-size: 0.813rem; color: rgb(var(--color-neutral-700)); transition: all 0.15s; }
.dark .shop-editor-btn { background: rgb(var(--color-neutral-700)); border-color: rgb(var(--color-neutral-600)); color: rgb(var(--color-neutral-200)); }
.shop-editor-btn:hover { background: rgb(var(--color-neutral-200)); }
.dark .shop-editor-btn:hover { background: rgb(var(--color-neutral-600)); }
.shop-editor-content { min-height: 120px; padding: 0.75rem; font-size: 0.9rem; line-height: 1.6; outline: none; background: rgb(var(--color-neutral)); color: rgb(var(--color-neutral-900)); }
.dark .shop-editor-content { background: rgb(var(--color-neutral-900)); color: rgb(var(--color-neutral-100)); }
.shop-editor-content:empty::before { content: attr(placeholder); color: rgb(var(--color-neutral-400)); pointer-events: none; }

/* Documentation section */
.docs-toggle-btn { display: flex; align-items: center; gap: 0.5rem; background: none; border: 1px solid rgb(var(--color-primary-200)); border-radius: 8px; padding: 0.75rem 1rem; cursor: pointer; font-weight: 600; font-size: 0.9rem; color: rgb(var(--color-primary-700)); width: 100%; transition: all 0.2s; }
.dark .docs-toggle-btn { border-color: rgba(var(--color-primary-700), 0.4); color: rgb(var(--color-primary-300)); }
.docs-toggle-btn:hover { background: rgb(var(--color-primary-50)); }
.dark .docs-toggle-btn:hover { background: rgba(var(--color-primary-900), 0.2); }
.docs-toggle-btn .docs-chevron { transition: transform 0.2s; font-size: 0.75rem; }
.docs-toggle-btn.is-open .docs-chevron { transform: rotate(90deg); }
.docs-body { display: none; padding: 1.5rem; margin-top: 0.5rem; background: rgb(var(--color-neutral)); border: 1px solid rgb(var(--color-neutral-200)); border-radius: 8px; font-size: 0.875rem; line-height: 1.7; color: rgb(var(--color-neutral-700)); }
.dark .docs-body { background: rgb(var(--color-neutral-800)); border-color: rgb(var(--color-neutral-700)); color: rgb(var(--color-neutral-300)); }
.docs-body.is-open { display: block; }
.docs-body h3 { font-size: 1rem; margin: 1.5rem 0 0.5rem; color: rgb(var(--color-neutral-900)); }
.dark .docs-body h3 { color: rgb(var(--color-neutral-100)); }
.docs-body h3:first-child { margin-top: 0; }
.docs-body ul { margin: 0.5rem 0; padding-left: 1.25rem; }
.docs-body li { margin-bottom: 0.375rem; }
.docs-body code { background: rgb(var(--color-neutral-100)); padding: 0.125rem 0.375rem; border-radius: 3px; font-size: 0.8rem; }
.dark .docs-body code { background: rgb(var(--color-neutral-700)); }
.docs-flow-diagram { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; padding: 0.75rem; background: rgb(var(--color-neutral-50)); border-radius: 6px; margin: 0.75rem 0; font-size: 0.813rem; }
.dark .docs-flow-diagram { background: rgb(var(--color-neutral-900)); }
.docs-flow-step { padding: 0.375rem 0.75rem; background: rgb(var(--color-primary-100)); border-radius: 4px; font-weight: 600; color: rgb(var(--color-primary-800)); }
.dark .docs-flow-step { background: rgba(var(--color-primary-900), 0.3); color: rgb(var(--color-primary-300)); }
.docs-flow-arrow { color: rgb(var(--color-neutral-400)); }
</style>

<script>
const API_BASE = 'https://dicebastion-memberships.ncalamaro.workers.dev';
let adminKey = '';
let editingProductId = null;

// Format price helper
function formatPrice(pence) {
  return '£' + (pence / 100).toFixed(2);
}

// Generate slug from name
document.getElementById('product-name')?.addEventListener('input', (e) => {
  const slug = e.target.value.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  document.getElementById('product-slug').value = slug;
});

// Login
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const password = document.getElementById('admin-password').value;
  adminKey = password;
  
  // Test the key by trying to fetch products
  try {
    const response = await fetch(`${API_BASE}/products`, {
      headers: { 'X-Admin-Key': adminKey }
    });
    
    if (response.ok) {
      // Store in session
      sessionStorage.setItem('admin_key', adminKey);
      document.getElementById('login-container').style.display = 'none';
      document.getElementById('admin-dashboard').style.display = 'block';
      loadProducts();
    } else {
      showLoginError('Invalid admin password');
    }
  } catch (error) {
    showLoginError('Login failed. Please try again.');
  }
});

function showLoginError(message) {
  const errorDiv = document.getElementById('login-error');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  setTimeout(() => {
    errorDiv.style.display = 'none';
  }, 3000);
}

// Logout
document.getElementById('logout-btn')?.addEventListener('click', () => {
  sessionStorage.removeItem('admin_key');
  adminKey = '';
  document.getElementById('login-container').style.display = 'block';
  document.getElementById('admin-dashboard').style.display = 'none';
  document.getElementById('admin-password').value = '';
});

// Load products
async function loadProducts() {
  try {
    const response = await fetch(`${API_BASE}/products`);
    const products = await response.json();
    
    const listHtml = products.map(product => `
      <div class="product-card">
        <div class="product-info">
          <h3>${product.name}</h3>
          <p style="color: rgb(var(--color-neutral-600)); margin: 0.5rem 0;">${product.description || 'No description'}</p>
          <div class="product-meta">
            <span><strong>Price:</strong> ${formatPrice(product.price)}</span>
            <span><strong>Stock:</strong> ${product.stock_quantity}</span>
            <span><strong>Slug:</strong> ${product.slug}</span>
            ${product.category ? `<span><strong>Category:</strong> ${product.category}</span>` : ''}
          </div>
          <div style="margin-top: 0.5rem;">
            <span class="badge ${product.is_active ? 'badge-active' : 'badge-inactive'}">
              ${product.is_active ? 'Active' : 'Inactive'}
            </span>
            ${product.stock_quantity < 5 && product.stock_quantity > 0 ? '<span class="badge badge-low-stock">Low Stock</span>' : ''}
            ${product.stock_quantity === 0 ? '<span class="badge badge-inactive">Out of Stock</span>' : ''}
          </div>
          ${product.is_active ? `<div style="margin-top: 0.5rem; font-size: 0.75rem;"><a href="https://shop.dicebastion.com/products/${product.slug}" target="_blank" style="color: rgb(var(--color-primary-600)); text-decoration: none;" title="SEO product page (redirects to shop for humans)">🔗 shop.dicebastion.com/products/${product.slug}</a></div>` : ''}
        </div>
        <div class="product-actions">
          <button class="btn-edit" onclick="editProduct(${product.id})">Edit</button>
          <button class="btn-delete" onclick="deleteProduct(${product.id}, '${product.name}')">Delete</button>
          ${product.slug ? `<button class="btn-index" onclick="requestIndexing('${product.slug}', this)">📡 Index</button>` : ''}
        </div>
      </div>
    `).join('');
    
    document.getElementById('products-list').innerHTML = listHtml || '<p style="color: rgb(var(--color-neutral-500));">No products yet. Add your first product above!</p>';
  } catch (error) {
    console.error('Failed to load products:', error);
    alert('Failed to load products');
  }
}

// Edit product
async function editProduct(id) {
  try {
    const response = await fetch(`${API_BASE}/products/${id}`);
    const product = await response.json();
    
    editingProductId = id;
    document.getElementById('form-title').textContent = 'Edit Product';
    document.getElementById('product-id').value = id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-slug').value = product.slug;
    document.getElementById('product-description').value = product.description || '';
    document.getElementById('product-summary').value = product.summary || '';
    document.getElementById('product-full-description').innerHTML = product.full_description || '';
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-stock').value = product.stock_quantity;
    document.getElementById('product-category').value = product.category || '';
    document.getElementById('product-image').value = product.image_url || '';
    document.getElementById('product-release-date').value = product.release_date || '';
    document.getElementById('product-active').checked = product.is_active;
    document.getElementById('cancel-btn').style.display = 'block';
    
    // Auto-expand SEO section if product has SEO-relevant data
    if (product.summary || product.full_description) {
      const btn = document.querySelector('.seo-toggle-btn');
      const body = document.getElementById('shop-seo-section-body');
      if (btn && body && !body.classList.contains('is-open')) {
        btn.classList.add('is-open');
        body.classList.add('is-open');
      }
    }
    
    // Update SEO preview
    updateSeoPreview();
    
    // Scroll to form
    document.getElementById('product-form-container').scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    console.error('Failed to load product:', error);
    alert('Failed to load product details');
  }
}

// Cancel edit
document.getElementById('cancel-btn')?.addEventListener('click', () => {
  resetForm();
});

function resetForm() {
  editingProductId = null;
  document.getElementById('form-title').textContent = 'Add New Product';
  document.getElementById('product-form').reset();
  document.getElementById('product-id').value = '';
  document.getElementById('product-active').checked = true;
  document.getElementById('cancel-btn').style.display = 'none';
  document.getElementById('product-summary').value = '';
  document.getElementById('product-full-description').innerHTML = '';
  document.getElementById('product-release-date').value = '';
  
  // Collapse SEO section
  const btn = document.querySelector('.seo-toggle-btn');
  const body = document.getElementById('shop-seo-section-body');
  if (btn) btn.classList.remove('is-open');
  if (body) body.classList.remove('is-open');
  
  // Reset SEO preview
  updateSeoPreview();
}

// Delete product
async function deleteProduct(id, name) {
  if (!confirm(`Are you sure you want to delete "${name}"? This will mark it as inactive.`)) {
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/admin/products/${id}`, {
      method: 'DELETE',
      headers: {
        'X-Admin-Key': adminKey
      }
    });
    
    if (response.ok) {
      alert('Product deleted successfully');
      loadProducts();
    } else {
      const error = await response.json();
      alert('Failed to delete product: ' + (error.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Delete error:', error);
    alert('Failed to delete product');
  }
}

// Save product (create or update)
document.getElementById('product-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const productData = {
    name: document.getElementById('product-name').value,
    slug: document.getElementById('product-slug').value,
    description: document.getElementById('product-description').value || null,
    summary: document.getElementById('product-summary').value || null,
    full_description: document.getElementById('product-full-description').innerHTML.trim() || null,
    price: parseInt(document.getElementById('product-price').value),
    stock_quantity: parseInt(document.getElementById('product-stock').value),
    category: document.getElementById('product-category').value || null,
    image_url: document.getElementById('product-image').value || null,
    is_active: document.getElementById('product-active').checked ? 1 : 0,
    release_date: document.getElementById('product-release-date').value || null
  };
  
  const saveBtn = document.getElementById('save-btn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';
  
  try {
    let response;
    
    if (editingProductId) {
      // Update existing product
      response = await fetch(`${API_BASE}/admin/products/${editingProductId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': adminKey
        },
        body: JSON.stringify(productData)
      });
    } else {
      // Create new product
      response = await fetch(`${API_BASE}/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': adminKey
        },
        body: JSON.stringify(productData)
      });
    }
    
    if (response.ok) {
      alert(editingProductId ? 'Product updated successfully!' : 'Product created successfully!');
      resetForm();
      loadProducts();
    } else {
      const error = await response.json();
      alert('Failed to save product: ' + (error.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Save error:', error);
    alert('Failed to save product');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Product';
  }
});

// Check for existing session on load
document.addEventListener('DOMContentLoaded', () => {
  const savedKey = sessionStorage.getItem('admin_key');
  if (savedKey) {
    adminKey = savedKey;
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    loadProducts();
  }
});

// Toggle SEO section
function toggleShopSeoSection() {
  const btn = document.querySelector('.seo-toggle-btn');
  const body = document.getElementById('shop-seo-section-body');
  if (!btn || !body) return;
  btn.classList.toggle('is-open');
  body.classList.toggle('is-open');
  if (body.classList.contains('is-open')) updateSeoPreview();
}

// Rich text editor helpers
function formatProductText(command) {
  document.execCommand(command, false, null);
  document.getElementById('product-full-description').focus();
}

function insertProductLink() {
  const url = prompt('Enter URL:');
  if (url) {
    document.execCommand('createLink', false, url);
    document.getElementById('product-full-description').focus();
  }
}

// Live SEO preview
function updateSeoPreview() {
  const name = document.getElementById('product-name')?.value || 'Product Name';
  const slug = document.getElementById('product-slug')?.value || 'slug';
  const desc = document.getElementById('product-summary')?.value 
    || document.getElementById('product-full-description')?.textContent 
    || document.getElementById('product-description')?.value 
    || 'Product description will appear here...';
  const price = parseInt(document.getElementById('product-price')?.value || '0');
  const stock = parseInt(document.getElementById('product-stock')?.value || '0');
  const releaseDate = document.getElementById('product-release-date')?.value;
  const isPreorder = releaseDate && new Date(releaseDate) > new Date();
  
  // Preview title
  const previewTitle = document.getElementById('seo-preview-title');
  if (previewTitle) previewTitle.textContent = `${name} | Dice Bastion Shop`;
  
  // Preview URL
  const previewUrl = document.getElementById('seo-preview-url');
  if (previewUrl) previewUrl.textContent = `shop.dicebastion.com › products › ${slug}`;
  
  // SEO URL in field map
  const urlPreview = document.getElementById('seo-url-preview');
  if (urlPreview) urlPreview.textContent = `shop.dicebastion.com/products/${slug}`;
  
  // Preview price + stock
  const previewPrice = document.getElementById('seo-preview-price');
  const previewStock = document.getElementById('seo-preview-stock');
  if (previewPrice && previewStock) {
    const priceStr = '£' + (price / 100).toFixed(2);
    if (isPreorder) {
      previewStock.textContent = 'Pre-order';
      previewStock.style.color = '#1a73e8';
    } else if (stock > 0) {
      previewStock.textContent = 'In stock';
      previewStock.style.color = '#188038';
    } else {
      previewStock.textContent = 'Out of stock';
      previewStock.style.color = '#c5221f';
    }
    previewPrice.innerHTML = `${priceStr} · <span id="seo-preview-stock" style="color: ${previewStock.style.color};">${previewStock.textContent}</span>`;
  }
  
  // Availability in field map
  const availPreview = document.getElementById('seo-availability-preview');
  if (availPreview) {
    availPreview.textContent = isPreorder ? 'Pre-Order' : stock > 0 ? 'In Stock' : 'Out of Stock';
  }
  
  // Preview description (strip HTML, limit to ~160 chars)
  const previewDesc = document.getElementById('seo-preview-desc');
  if (previewDesc) {
    const plain = desc.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    previewDesc.textContent = plain.length > 160 ? plain.substring(0, 157) + '...' : plain;
  }
}

// Attach live preview listeners
document.addEventListener('DOMContentLoaded', () => {
  const previewFields = ['product-name', 'product-slug', 'product-description', 'product-summary', 'product-price', 'product-stock', 'product-release-date'];
  previewFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateSeoPreview);
  });
  // Full description contenteditable
  const fullDesc = document.getElementById('product-full-description');
  if (fullDesc) fullDesc.addEventListener('input', updateSeoPreview);
});

// Toggle documentation section
function toggleDocsSection() {
  const btn = document.querySelector('.docs-toggle-btn');
  const body = document.getElementById('docs-body');
  if (!btn || !body) return;
  btn.classList.toggle('is-open');
  body.classList.toggle('is-open');
}

// ==================== Google Indexing API ====================
async function requestIndexing(slug, btn) {
  const url = `https://shop.dicebastion.com/products/${encodeURIComponent(slug)}`;
  const origText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ Sending…';

  try {
    const res = await fetch(`${API_BASE}/admin/indexing/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Session-Token': sessionToken },
      body: JSON.stringify({ url, type: 'URL_UPDATED' })
    });
    const data = await res.json();
    if (data.ok) {
      btn.textContent = '✅ Indexed';
      btn.style.background = '#059669';
      setTimeout(() => { btn.textContent = origText; btn.disabled = false; btn.style.background = ''; }, 3000);
    } else {
      btn.textContent = '❌ Failed';
      btn.style.background = '#dc2626';
      console.error('Indexing failed:', data);
      setTimeout(() => { btn.textContent = origText; btn.disabled = false; btn.style.background = ''; }, 4000);
    }
  } catch (err) {
    btn.textContent = '❌ Error';
    console.error('Indexing error:', err);
    setTimeout(() => { btn.textContent = origText; btn.disabled = false; btn.style.background = ''; }, 4000);
  }
}

// Make functions global for onclick handlers
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.requestIndexing = requestIndexing;
window.toggleShopSeoSection = toggleShopSeoSection;
window.toggleDocsSection = toggleDocsSection;
window.formatProductText = formatProductText;
window.insertProductLink = insertProductLink;
</script>
