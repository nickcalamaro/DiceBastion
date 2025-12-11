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
          <textarea id="product-description" rows="3" style="width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px; font-family: inherit;"></textarea>
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

        <div style="margin-bottom: 1rem;">
          <label for="product-image" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Image URL</label>
          <input type="text" id="product-image" placeholder="https://..." style="width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px;">
        </div>

        <div style="margin-bottom: 1.5rem;">
          <label style="display: flex; align-items: center; cursor: pointer;">
            <input type="checkbox" id="product-active" checked style="margin-right: 0.5rem;">
            <span style="font-weight: 600;">Active (visible in shop)</span>
          </label>
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
        </div>
        <div class="product-actions">
          <button class="btn-edit" onclick="editProduct(${product.id})">Edit</button>
          <button class="btn-delete" onclick="deleteProduct(${product.id}, '${product.name}')">Delete</button>
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
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-stock').value = product.stock_quantity;
    document.getElementById('product-category').value = product.category || '';
    document.getElementById('product-image').value = product.image_url || '';
    document.getElementById('product-active').checked = product.is_active;
    document.getElementById('cancel-btn').style.display = 'block';
    
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
    price: parseInt(document.getElementById('product-price').value),
    stock_quantity: parseInt(document.getElementById('product-stock').value),
    category: document.getElementById('product-category').value || null,
    image_url: document.getElementById('product-image').value || null,
    is_active: document.getElementById('product-active').checked ? 1 : 0
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

// Make functions global for onclick handlers
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
</script>
