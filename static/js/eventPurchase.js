// Event Purchase Flow
// Depends on: utils.js (loaded globally via footer)
const API_BASE = utils.getApiBase();
const TURNSTILE_SITE_KEY = '0x4AAAAAACAB4xlOnW3S8K0k';

// Detect if we're running on localhost
const IS_LOCALHOST = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname === '0.0.0.0';

// Make functions globally accessible
window.renderEventPurchase = function renderEventPurchase(event) {
  const eventId = event.id || event.event_id;
  
  // Determine if event is free
  // Free if: requires_purchase is 0/false OR both prices are 0
  const requiresPurchase = event.requires_purchase === 1 || event.requires_purchase === true;
  const memberPrice = parseFloat(event.membership_price || 0);
  const nonMemberPrice = parseFloat(event.non_membership_price || 0);
  const isFree = !requiresPurchase || (memberPrice === 0 && nonMemberPrice === 0);  if (isFree) {
    // Free event registration - simplified UI
    return `
      <div class="event-purchase my-6" data-event-id="${eventId}" style="margin-top: 2rem;">
        <div class="event-ticket-box border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 bg-neutral dark:bg-neutral-800 shadow-lg max-w-xl">
          <h3 class="mt-0 mb-2 text-xl font-bold text-primary-700 dark:text-primary-400">Register Now</h3>
          <div class="mb-3">
            <div class="text-3xl font-extrabold text-primary-600 dark:text-primary-400">FREE</div>
            <p class="mt-2 mb-0 text-sm text-neutral-700 dark:text-neutral-300">This is a free event. You can get access to free drinks, local discounts, and help us keep these events going by becoming a <a href="/memberships/" class="text-primary-600 dark:text-primary-400 underline font-semibold hover:text-primary-700 dark:hover:text-primary-500">member</a>.</p>
          </div>
          <button type="button" class="evt-register-btn w-full py-3 px-6 border-0 rounded-lg bg-primary-600 dark:bg-primary-500 text-neutral-50 text-base font-bold cursor-pointer shadow-md hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors">Sign Up</button>
        </div>
      </div>
      ${generateModal(eventId, true)}
    `;
  }
  
  // Paid event
  const formatPrice = (price) => {
    const numPrice = parseFloat(price || 0);
    return numPrice === 0 ? 'FREE' : `£${numPrice.toFixed(2)}`;
  };
  
  return `
    <div class="event-purchase my-6" data-event-id="${eventId}" style="margin-top: 2rem;">
      <div class="event-ticket-box border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 bg-neutral dark:bg-neutral-800 shadow-lg max-w-xl">
        <h3 class="mt-0 mb-2 text-xl font-bold text-primary-700 dark:text-primary-400">Get a Ticket</h3>
        <div class="event-prices flex gap-5 flex-wrap items-end mb-3">
          <div class="flex-1 min-w-[140px]">
            <div class="text-xs font-semibold uppercase text-neutral-600 dark:text-neutral-400 tracking-wide">Member Price</div>
            <div class="text-2xl font-extrabold text-neutral-800 dark:text-neutral-200">${formatPrice(event.membership_price)}</div>
          </div>
          <div class="flex-1 min-w-[160px]">
            <div class="text-xs font-semibold uppercase text-neutral-600 dark:text-neutral-400 tracking-wide">Non‑Member Price</div>
            <div class="text-2xl font-extrabold text-neutral-800 dark:text-neutral-200">${formatPrice(event.non_membership_price)}</div>
          </div>
        </div>
        <p class="mt-0 mb-4 text-sm text-neutral-700 dark:text-neutral-300">Member discount is applied automatically if an active membership is found for your email.</p>
        <button type="button" class="evt-buy-btn w-full py-3 px-6 border-0 rounded-lg bg-primary-600 dark:bg-primary-500 text-neutral-50 text-base font-bold cursor-pointer shadow-md hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors" data-member-price="${event.membership_price}" data-nonmember-price="${event.non_membership_price}">Get Your Ticket</button>
      </div>
      <div class="event-membership-promo mt-3 max-w-xl text-sm text-neutral-800 dark:text-neutral-200 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 py-3 px-4 rounded-lg" data-visibility="${utils.USER_LEVELS.NON_MEMBER}" data-hide-style="display">
        <strong>Not a member yet?</strong> <span>Check out the list of benefits and sign up today!</span>
        <br>
        <a href="/memberships/" class="inline-block mt-2 py-1.5 px-4 font-semibold text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-800/50 border border-primary-300 dark:border-primary-600 rounded-md hover:bg-primary-100 dark:hover:bg-primary-700/60 transition-colors">Become a member!</a>
      </div>
    </div>    
    ${generateModal(eventId, false)}
  `;
}

// Generate modal HTML (shared between free and paid events)
function generateModal(eventId, isFree) {
  return `
    <div class="evt-modal" id="evt-modal-${eventId}" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:99999; align-items:center; justify-content:center;">
      <div class="evt-modal-inner bg-neutral dark:bg-neutral-800 rounded-xl p-5 relative shadow-2xl" style="width:min(520px,95vw);">
        <button type="button" class="evt-close bg-transparent border-none text-2xl cursor-pointer text-neutral-700 dark:text-neutral-300" aria-label="Close" style="position:absolute; top:10px; right:10px;">×</button>
        <h3 class="mt-0 mb-3 text-lg font-bold text-neutral-800 dark:text-neutral-200 evt-modal-title">${isFree ? 'Event Registration' : 'Ticket Checkout'}</h3>
        
        <!-- Logged-in user confirmation screen -->
        <div class="evt-step evt-confirm-logged-in" style="display:none;">
          <p class="mt-0 mb-4 text-sm text-neutral-700 dark:text-neutral-300">
            <span class="evt-logged-message">${isFree ? 'Registering as' : 'Purchasing a ticket for'}</span> <strong class="text-neutral-800 dark:text-neutral-200 evt-user-email"></strong>
          </p>
          <div class="mt-3">
            <div class="text-sm text-neutral-700 dark:text-neutral-300 mb-2">Security check</div>
            <div id="evt-ts-logged-${eventId}"></div>
          </div>
          <button type="button" class="evt-continue-logged mt-4 w-full py-3 border-none rounded-lg bg-primary-600 dark:bg-primary-500 text-neutral-50 font-bold cursor-pointer hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors">${isFree ? 'Complete Registration' : 'Continue to Payment'}</button>
          <p class="mt-3 mb-0 text-center text-sm text-neutral-600 dark:text-neutral-400">
            Not you? <button type="button" class="evt-switch-account bg-transparent border-none text-primary-600 dark:text-primary-400 underline cursor-pointer hover:text-primary-700 dark:hover:text-primary-500">Use a different email</button>
          </p>
        </div>
        
        <!-- Guest/non-logged-in user form -->
        <div class="evt-step evt-details" style="display:block;">
          <label class="block mt-2 mb-1 font-semibold text-neutral-700 dark:text-neutral-300">Full name *</label>
          <input type="text" class="evt-name w-full p-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-neutral dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200" placeholder="Jane Doe" required>
          <label class="block mt-3 mb-1 font-semibold text-neutral-700 dark:text-neutral-300">Email *</label>
          <input type="email" class="evt-email w-full p-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-neutral dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200" placeholder="you@example.com" required>
          ${!isFree ? `
          <div class="mt-3 flex gap-2 items-start text-sm leading-tight">
            <input type="checkbox" class="evt-privacy mt-1" required>
            <label class="text-neutral-700 dark:text-neutral-300">I agree to the <a href="/privacy-policy/" target="_blank" rel="noopener" class="text-primary-600 dark:text-primary-400 underline">Privacy Policy</a>.</label>
          </div>
          ` : ''}
          <div class="mt-3">
            <div class="text-sm text-neutral-700 dark:text-neutral-300 mb-2">Security check</div>
            <div id="evt-ts-${eventId}"></div>
          </div>
          <button type="button" class="evt-continue mt-4 w-full py-3 border-none rounded-lg bg-primary-600 dark:bg-primary-500 text-neutral-50 font-bold cursor-pointer hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors">${isFree ? 'Complete Registration' : 'Continue to Payment'}</button>
          <p class="mt-3 mb-0 text-center text-sm text-neutral-600 dark:text-neutral-400">
            Already have an account? <a href="/login" class="text-primary-600 dark:text-primary-400 underline">Sign in</a>
          </p>
        </div>
        
        ${!isFree ? `<div id="evt-card-${eventId}" class="evt-card mt-2" style="display:none;"></div>` : ''}
        <div class="evt-error mt-2.5 text-sm font-semibold" style="display:none; color:#b00020;"></div>
        <div class="evt-success mt-4 py-3 px-4 rounded-lg font-semibold" style="display:none; background:#e9fbe9; border:1px solid #b9e8b9; color:#1a5d1a;">${isFree ? 'Registration confirmed! See you there.' : 'Ticket confirmed! See you there.'}</div>
      </div>
    </div>
    
    <!-- Bundle Upsell Modal (shown before payment for non-members) -->
    ${!isFree ? `
    <div class="evt-bundle-modal" id="evt-bundle-modal-${eventId}" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.75); backdrop-filter:blur(4px); z-index:999999; align-items:center; justify-content:center; padding:1rem;">
      <div class="evt-bundle-modal-inner bg-neutral dark:bg-neutral-800 rounded-2xl relative shadow-2xl" style="width:min(700px,95vw); max-height:90vh; display:flex; flex-direction:column;">
        <button type="button" class="evt-bundle-close bg-transparent border-none text-3xl cursor-pointer text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors" aria-label="Close" style="position:absolute; top:1rem; right:1rem; width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; z-index:10;">×</button>
        
        <!-- Scrollable content area -->
        <div style="overflow-y:auto; padding:1.5rem; flex:1;">
          <div class="text-center mb-5">
            <h3 class="mt-0 mb-2 text-lg font-bold text-neutral-900 dark:text-neutral-100">
              Become a Dice Bastion Member to save and <button type="button" class="evt-show-benefits-header" style="background:none; border:none; color:rgb(var(--color-primary-600)); text-decoration:underline; cursor:pointer; padding:0; font-size:inherit; font-weight:inherit;">unlock benefits</button>?
            </h3>
            <p class="mt-0 mb-0 text-sm text-neutral-600 dark:text-neutral-400" style="font-style:italic;">Optional - you're under no obligation to purchase a membership.</p>
          </div>
          
          <!-- Bundle deals -->
          <div id="evt-bundle-plans-${eventId}" class="evt-bundle-plans-grid" style="display:grid; gap:0.75rem; margin-bottom:1.5rem;"></div>
        </div>
        
        <!-- Fixed footer with button -->
        <div style="padding:1rem 1.5rem; border-top:1px solid rgb(var(--color-neutral-200)); background:rgb(var(--color-neutral-50));" class="dark:border-neutral-700 dark:bg-neutral-900">
          <div style="text-align:center; margin-bottom:0.75rem; color:rgb(var(--color-neutral-500)); font-size:0.875rem; font-weight:600;">OR</div>
          
          <!-- Primary action: Just get the ticket - prominent blue button -->
          <button type="button" class="evt-bundle-no-thanks" style="width:100%; padding:1rem 1.5rem; border:none; border-radius:0.75rem; background:rgb(var(--color-primary-600)); color:white; font-weight:700; font-size:1.05rem; cursor:pointer; transition:all 0.2s; box-shadow:0 2px 8px rgba(79, 70, 229, 0.3);" 
            onmouseover="this.style.background='rgb(var(--color-primary-700))'; this.style.boxShadow='0 4px 12px rgba(79, 70, 229, 0.4)'; this.style.transform='translateY(-1px)';" 
            onmouseout="this.style.background='rgb(var(--color-primary-600))'; this.style.boxShadow='0 2px 8px rgba(79, 70, 229, 0.3)'; this.style.transform='translateY(0)';">
            No Thanks, Just The Event
          </button>
        </div>
      </div>
    </div>
    
    <!-- Benefits Popup Modal -->
    <div class="evt-benefits-modal" id="evt-benefits-modal-${eventId}" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.75); backdrop-filter:blur(4px); z-index:9999999; align-items:center; justify-content:center; padding:1rem;">
      <div class="bg-neutral dark:bg-neutral-800 rounded-2xl p-6 relative shadow-2xl" style="width:min(500px,95vw); max-height:90vh; overflow-y:auto;">
        <button type="button" class="evt-benefits-close bg-transparent border-none text-3xl cursor-pointer text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors" aria-label="Close" style="position:absolute; top:1rem; right:1rem; width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center;">×</button>
        
        <h3 class="mt-0 mb-4 text-xl font-bold text-neutral-900 dark:text-neutral-100">Member Benefits</h3>
        
        <ul style="list-style:none; padding:0; margin:0; color:rgb(var(--color-neutral-700)); line-height:2;" class="dark:text-neutral-200">
          <li style="padding:0.5rem 0; border-bottom:1px solid rgb(var(--color-neutral-200));" class="dark:border-neutral-700">
            <span style="color:rgb(var(--color-primary-600)); font-weight:bold; margin-right:0.75rem; font-size:1.1rem;">✓</span>
            <strong>Free table bookings</strong>
          </li>
          <li style="padding:0.5rem 0; border-bottom:1px solid rgb(var(--color-neutral-200));" class="dark:border-neutral-700">
            <span style="color:rgb(var(--color-primary-600)); font-weight:bold; margin-right:0.75rem; font-size:1.1rem;">✓</span>
            <strong>Member pricing on all events</strong>
          </li>
          <li style="padding:0.5rem 0; border-bottom:1px solid rgb(var(--color-neutral-200));" class="dark:border-neutral-700">
            <span style="color:rgb(var(--color-primary-600)); font-weight:bold; margin-right:0.75rem; font-size:1.1rem;">✓</span>
            <strong>Local discounts:</strong>
            <ul style="list-style:none; padding-left:2rem; margin-top:0.5rem; font-size:0.95rem; color:rgb(var(--color-neutral-600));" class="dark:text-neutral-400">
              <li>• Dominos</li>
              <li>• Imperial Newsagents</li>
              <li>• Euphoria</li>
            </ul>
          </li>
        </ul>
        
        <button type="button" class="evt-benefits-close-btn w-full mt-5 py-2.5 px-4 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-neutral-50 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors">Close</button>
      </div>
    </div>
    ` : ''}
  `;
}

window.initEventPurchase = function initEventPurchase(event) {
  const eventId = String(event.id);
  const root = document.querySelector('.event-purchase[data-event-id="'+eventId+'"]');
  const modal = document.getElementById('evt-modal-'+eventId);
  const cardEl = document.getElementById('evt-card-'+eventId);
  let turnstileWidgetId = null;
  let turnstileLoggedWidgetId = null;
  let turnstileRenderTimeout = null;
  let userApplicablePrice = null;
  let hasActiveMembership = false;
  let membershipPlans = []; // Store available membership plans
  let selectedMembershipPlan = null; // Currently selected plan for bundle
  
  if (!root || !modal) return;
  
  // Apply visibility controls now that the HTML is in the DOM
  if (window.utils && window.utils.applyVisibilityControls) {
    utils.applyVisibilityControls();
  }
  
  // Check membership status and update button text if needed
  async function checkMembershipAndUpdateButton() {
    const user = getLoggedInUser();
    const buyBtn = root.querySelector('.evt-buy-btn');
    if (!buyBtn) return;
    
    const memberPrice = parseFloat(buyBtn.dataset.memberPrice || 0);
    const nonMemberPrice = parseFloat(buyBtn.dataset.nonmemberPrice || 0);
    
    if (user && user.email) {
      // User is logged in - check for membership
      try {
        const sessionToken = localStorage.getItem('admin_session');
        if (sessionToken) {
          const resp = await fetch(API_BASE + '/account/info', {
            headers: { 'X-Session-Token': sessionToken }
          });
          if (resp.ok) {
            const data = await resp.json();
            hasActiveMembership = data.membership !== null && data.membership !== undefined;
            
            // Update applicable price
            userApplicablePrice = hasActiveMembership ? memberPrice : nonMemberPrice;
            
            // Track if this is free for member, but don't change button text
            if (hasActiveMembership && memberPrice === 0) {
              buyBtn.dataset.isFreeForMember = 'true';
            }
          }
        }
      } catch (e) {
        console.error('[eventPurchase] Error checking membership:', e);
      }
    } else {
      // Not logged in - use non-member price
      userApplicablePrice = nonMemberPrice;
    }
  }
  
  // Run membership check on init
  checkMembershipAndUpdateButton();
  
  // Load membership plans for bundle upsell
  async function loadMembershipPlans() {
    try {
      const resp = await fetch(API_BASE + '/membership/plans');
      if (resp.ok) {
        const data = await resp.json();
        membershipPlans = data.plans || [];
      }
    } catch (e) {
      console.error('[eventPurchase] Failed to load membership plans:', e);
    }
  }
  
  // Show bundle upsell modal with plan cards
  function showBundleUpsell(onSelect) {
    const bundleModal = document.getElementById('evt-bundle-modal-' + eventId);
    if (!bundleModal) return;
    
    const memberPrice = parseFloat(event.membership_price || 0);
    const nonMemberPrice = parseFloat(event.non_membership_price || 0);
    const savings = nonMemberPrice - memberPrice;
    
    // Generate single bundle card with plan selector
    const plansContainer = bundleModal.querySelector('.evt-bundle-plans-grid');
    if (plansContainer && membershipPlans.length > 0) {
      const eventName = event.event_name || event.title || 'Event';
      
      // Calculate prices for all plans
      const planOptions = membershipPlans.map(plan => ({
        code: plan.code,
        name: plan.name,
        months: plan.months,
        price: parseFloat(plan.amount || 0),
        bundlePrice: parseFloat(plan.amount || 0) + memberPrice
      }));
      
      // Use first plan as default
      const defaultPlan = planOptions[0];
      
      plansContainer.innerHTML = `
        <div class="evt-bundle-card bundle-card" style="max-width: 500px; margin: 0 auto;">
          ${savings > 0 ? `<div class="bundle-badge">Save £${savings.toFixed(2)}</div>` : ''}
          <div class="bundle-label">Bundle Deal</div>
          <h4 class="bundle-title">Membership + ${eventName}</h4>
          
          <div style="margin: 1.5rem 0 1rem 0;">
            <label style="display: block; margin-bottom: 0.75rem; font-weight: 600; color: rgb(var(--color-neutral-700)); font-size: 0.875rem;">Choose membership duration:</label>
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              ${planOptions.map((plan, index) => `
                <label class="evt-plan-option" data-plan-code="${plan.code}" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem; border: 2px solid rgb(var(--color-neutral-300)); border-radius: 8px; cursor: pointer; transition: all 0.2s;">
                  <input type="radio" name="bundle-plan" value="${plan.code}" ${index === 0 ? 'checked' : ''} style="width: 1.25rem; height: 1.25rem; cursor: pointer;">
                  <div style="flex: 1;">
                    <div style="font-weight: 600; color: rgb(var(--color-neutral-900)); font-size: 0.938rem;">${plan.name}</div>
                  </div>
                  <div style="font-weight: 700; color: rgb(var(--color-primary-600)); font-size: 1.125rem;">£${plan.price.toFixed(2)}</div>
                </label>
              `).join('')}
            </div>
          </div>
          
          <div class="bundle-breakdown" style="background: rgb(var(--color-neutral-50)); border-radius: 8px; padding: 0.875rem; margin: 1rem 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; color: rgb(var(--color-neutral-700)); font-size: 0.875rem;">
              <span id="evt-plan-name">${defaultPlan.name}</span>
              <span style="font-weight: 600;" id="evt-plan-price">£${defaultPlan.price.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; color: rgb(var(--color-neutral-700)); font-size: 0.875rem; padding-bottom: 0.5rem; border-bottom: 1px solid rgb(var(--color-neutral-200));">
              <span>${eventName} (member price)</span>
              <span style="font-weight: 600;">${memberPrice === 0 ? 'FREE' : '£' + memberPrice.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 0.5rem; color: rgb(var(--color-neutral-900)); font-weight: 700; font-size: 1rem;">
              <span>Total</span>
              <span style="color: rgb(var(--color-primary-600));" id="evt-bundle-total">£${defaultPlan.bundlePrice.toFixed(2)}</span>
            </div>
          </div>
          
          ${savings > 0 ? `
            <div style="text-align: center; font-size: 0.813rem; color: rgb(var(--color-success-700)); font-weight: 600; margin-bottom: 0.75rem;">
              ✓ You save £${savings.toFixed(2)} vs. non-member price
            </div>
          ` : ''}
          
          <button type="button" id="evt-select-bundle-btn" class="bundle-btn bundle-btn-secondary">Purchase Together</button>
        </div>
      `;
      
      // Add dark mode styles
      const darkStyles = `
        .dark .bundle-breakdown {
          background: rgb(var(--color-neutral-900)) !important;
        }
        .dark .bundle-breakdown > div {
          color: rgb(var(--color-neutral-300)) !important;
        }
        .dark .bundle-breakdown > div:last-child {
          color: rgb(var(--color-neutral-100)) !important;
        }
        .dark .bundle-breakdown > div:last-child span:last-child {
          color: rgb(var(--color-primary-400)) !important;
        }
        .dark .evt-plan-option {
          border-color: rgb(var(--color-neutral-600)) !important;
          background: rgb(var(--color-neutral-800)) !important;
        }
        .dark .evt-plan-option > div > div:first-child {
          color: rgb(var(--color-neutral-100)) !important;
        }
        .dark .evt-plan-option > div > div:last-child {
          color: rgb(var(--color-neutral-400)) !important;
        }
        .evt-plan-option:has(input:checked) {
          border-color: rgb(var(--color-primary-500)) !important;
          background: rgba(var(--color-primary-50), 0.5) !important;
        }
        .dark .evt-plan-option:has(input:checked) {
          background: rgba(var(--color-primary-900), 0.3) !important;
        }
        .evt-plan-option:hover {
          border-color: rgb(var(--color-primary-400)) !important;
        }
      `;
      if (!document.getElementById('bundle-breakdown-styles')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'bundle-breakdown-styles';
        styleEl.textContent = darkStyles;
        document.head.appendChild(styleEl);
      }
      
      // Handle plan selection changes
      const planNameEl = document.getElementById('evt-plan-name');
      const planPriceEl = document.getElementById('evt-plan-price');
      const bundleTotalEl = document.getElementById('evt-bundle-total');
      
      const radioButtons = document.querySelectorAll('input[name="bundle-plan"]');
      radioButtons.forEach(radio => {
        radio.addEventListener('change', (e) => {
          const selectedCode = e.target.value;
          const selectedPlan = planOptions.find(p => p.code === selectedCode);
          if (selectedPlan) {
            planNameEl.textContent = selectedPlan.name;
            planPriceEl.textContent = `£${selectedPlan.price.toFixed(2)}`;
            bundleTotalEl.textContent = `£${selectedPlan.bundlePrice.toFixed(2)}`;
          }
        });
      });
      
      // Also allow clicking the label to select
      document.querySelectorAll('.evt-plan-option').forEach(label => {
        label.addEventListener('click', (e) => {
          if (e.target.tagName !== 'INPUT') {
            const radio = label.querySelector('input[type="radio"]');
            radio.checked = true;
            radio.dispatchEvent(new Event('change'));
          }
        });
      });
      
      // Handle bundle selection
      document.getElementById('evt-select-bundle-btn').addEventListener('click', () => {
        const selectedRadio = document.querySelector('input[name="bundle-plan"]:checked');
        selectedMembershipPlan = selectedRadio ? selectedRadio.value : planOptions[0].code;
        bundleModal.style.display = 'none';
        onSelect(true);
      });
    }
    
    // Handle benefits link in header
    const showBenefitsHeaderBtn = bundleModal.querySelector('.evt-show-benefits-header');
    if (showBenefitsHeaderBtn) {
      showBenefitsHeaderBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showBenefitsPopup();
      });
    }
    
    // Handle "No thanks" button click
    const noThanksBtn = bundleModal.querySelector('.evt-bundle-no-thanks');
    const bundleClose = bundleModal.querySelector('.evt-bundle-close');
    
    const handleNoThanks = () => {
      selectedMembershipPlan = null;
      bundleModal.style.display = 'none';
      onSelect(false); // false = user declined bundle
    };
    
    noThanksBtn.onclick = handleNoThanks;
    bundleClose.onclick = handleNoThanks;
    
    // Show the modal
    bundleModal.style.display = 'flex';
  }
  
  // Show benefits popup
  function showBenefitsPopup() {
    const benefitsModal = document.getElementById('evt-benefits-modal-' + eventId);
    if (benefitsModal) {
      benefitsModal.style.display = 'flex';
      
      // Close button handlers
      const closeBtn = benefitsModal.querySelector('.evt-benefits-close');
      const closeBtnAlt = benefitsModal.querySelector('.evt-benefits-close-btn');
      
      const handleClose = () => {
        benefitsModal.style.display = 'none';
      };
      
      closeBtn.onclick = handleClose;
      closeBtnAlt.onclick = handleClose;
      
      // Click backdrop to close
      benefitsModal.addEventListener('click', (e) => {
        if (e.target === benefitsModal) {
          handleClose();
        }
      });
    }
  }
  
  // Load plans if not a member
  if (!hasActiveMembership) {
    loadMembershipPlans();
  }
  
  // Auto-register function for logged-in members with free access
  async function autoRegisterMember() {
    const user = getLoggedInUser();
    if (!user || !user.email) {
      console.error('[autoRegister] No user found');
      return;
    }
    
    // Show a subtle loading indicator
    const buyBtn = root.querySelector('.evt-buy-btn');
    if (buyBtn) {
      buyBtn.disabled = true;
      buyBtn.textContent = 'Registering...';
    }
    
    try {
      // Get Turnstile token (will be test token on localhost)
      const token = await window.utils.getTurnstileToken(null, null, IS_LOCALHOST);
      
      // Call registration endpoint
      const resp = await fetch(API_BASE + '/events/' + encodeURIComponent(eventId) + '/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: user.name || user.email,
          turnstileToken: token
        })
      });
      
      const data = await resp.json();
      
      if (!resp.ok) {
        console.error('[autoRegister] Registration failed:', data);
        if (buyBtn) {
          buyBtn.disabled = false;
          buyBtn.textContent = 'Register for Free';
        }
        // Show error in modal instead
        openPurchaseModal();
        showError(data?.message || data?.error || 'Registration failed');
        return;
      }
      
      if (data.success || data.registered) {
        // Check if user needs account setup
        if (data.needsAccountSetup && data.userEmail) {
          sessionStorage.setItem('pendingAccountSetup', JSON.stringify({
            email: data.userEmail,
            eventName: data.eventName || event.event_name || 'this event'
          }));
        }
        
        // Redirect to thank-you page
        const ticketId = data.ticketId || Date.now();
        const regRef = `REG-${eventId}-${ticketId}`;
        window.location.href = '/thank-you?orderRef=' + encodeURIComponent(regRef);
      }
    } catch (e) {
      console.error('[autoRegister] Error:', e);
      if (buyBtn) {
        buyBtn.disabled = false;
        buyBtn.textContent = 'Register for Free';
      }
    }
  }
  
  // Check if user is logged in
  function getLoggedInUser() {
    return utils.session.getUser();
  }
  
  function showError(msg) {
    const el = modal.querySelector('.evt-error');
    if (!el) return;
    el.textContent = msg || 'Error';
    el.style.display = 'block';
  }
  
  function clearError() {
    const el = modal.querySelector('.evt-error');
    if (el) {
      el.textContent = '';
      el.style.display = 'none';
    }
  }
  
  function showSuccess(emailSent = true) {
    const el = modal.querySelector('.evt-success');
    if (!el) return;
    
    // Update success message based on whether email was sent
    const message = el.querySelector('.success-message') || el;
    if (!emailSent && message) {
      const originalText = message.textContent || message.innerText;
      // Add note about email if not already mentioned
      if (!originalText.includes('check your email')) {
        const emailNote = document.createElement('p');
        emailNote.className = 'email-pending-note';
        emailNote.style.cssText = 'margin-top: 0.75rem; font-size: 0.9em; color: #f59e0b;';
        emailNote.textContent = 'Note: Your confirmation email is being processed and will arrive shortly.';
        el.appendChild(emailNote);
      }
    }
    
    el.style.display = 'block';
  }
  
  function showPending() {
    const el = modal.querySelector('.evt-success');
    if (!el) return;
    
    // Show processing message (webhook will complete payment)
    el.innerHTML = `
      <div style="text-align: center;">
        <h3>🎉 Payment Received!</h3>
        <p>Your payment is being processed. You'll receive a confirmation email shortly.</p>
        <p style="margin-top: 1rem; font-size: 0.9em; color: #666;">
          You can safely close this window. We'll email you once everything is confirmed.
        </p>
      </div>
    `;
    el.style.display = 'block';
  }
  
  async function renderTurnstile(isLoggedIn = false) {
    // Check if modal is still visible (in case it was closed while timeout was pending)
    if (!modal || modal.style.display === 'none') {
      console.log('Modal closed, skipping Turnstile render');
      return;
    }
    
    const tsElId = isLoggedIn ? 'evt-ts-logged-' + eventId : 'evt-ts-' + eventId;
    const widgetState = isLoggedIn 
      ? { get widgetId() { return turnstileLoggedWidgetId; }, set widgetId(val) { turnstileLoggedWidgetId = val; } }
      : { get widgetId() { return turnstileWidgetId; }, set widgetId(val) { turnstileWidgetId = val; } };
    
    const widgetId = await window.utils.renderTurnstile(tsElId, TURNSTILE_SITE_KEY, {
      skipOnLocalhost: IS_LOCALHOST,
      widgetState
    });
    
    console.log('Turnstile widget rendered:', widgetId, 'isLoggedIn:', isLoggedIn);
  }
  async function getTurnstileToken(isLoggedIn = false) {
    const tsElId = isLoggedIn ? 'evt-ts-logged-' + eventId : 'evt-ts-' + eventId;
    const currentWidgetId = isLoggedIn ? turnstileLoggedWidgetId : turnstileWidgetId;
    
    return await window.utils.getTurnstileToken(tsElId, currentWidgetId, IS_LOCALHOST);
  }
  async function confirmPayment(ref, pollOptions = {}) {
    console.log('[confirmPayment] Starting confirmation for ref:', ref, 'options:', pollOptions);
    const result = await window.utils.pollPaymentConfirmation('/events/confirm', ref, {
      pollInterval: pollOptions.pollInterval,
      maxAttempts: pollOptions.maxAttempts,
      onSuccess: (data) => {
        console.log('[confirmPayment] ✅ Success callback triggered with data:', data);
        
        // Check if user needs account setup and store data in sessionStorage
        if (data.needsAccountSetup && data.userEmail) {
          const setupInfo = {
            email: data.userEmail,
            eventName: data.eventName || 'this event'
          };
          
          // For bundles, note that they also got a membership
          if (data.isBundle) {
            setupInfo.isBundle = true;
            setupInfo.membershipPlan = data.membershipPlan;
          }
          
          sessionStorage.setItem('pendingAccountSetup', JSON.stringify(setupInfo));
        }
        
        // Log if email failed but still redirect - payment succeeded
        if (!data.emailSent) {
          console.warn('[eventPurchase] Payment succeeded but email failed. User:', data.userEmail);
        }
        
        // Redirect to thank-you page with event details
        const redirectUrl = '/thank-you?orderRef=' + encodeURIComponent(ref) + 
          (data.emailSent === false ? '&emailPending=1' : '');
        console.log('[confirmPayment] Redirecting to:', redirectUrl);
        window.location.href = redirectUrl;
      },
      onError: (errorMsg) => {
        console.error('[confirmPayment] ❌ Error callback triggered:', errorMsg);
        showError(errorMsg);
      },
      onTimeout: () => {
        console.log('[confirmPayment] ⏱️ Timeout callback triggered');
        // Payment is processing - webhook will complete it
        // Redirect to thank-you with processing flag
        window.location.href = '/thank-you?orderRef=' + encodeURIComponent(ref) + '&processing=1';
      }
    });
    
    console.log('[confirmPayment] Poll completed with result:', result);
    return result !== null;
  }
    function unmountWidget() {
    // Properly unmount SumUp widget if it exists
    if (window.SumUpCard && window.SumUpCard.unmount) {
      try {
        window.SumUpCard.unmount({ id: 'evt-card-'+eventId });
        console.log('SumUp widget unmounted');
      } catch(e) {
        console.log('SumUp unmount failed:', e);
      }
    }
    if (cardEl) {
      cardEl.innerHTML = '';
      cardEl.style.display = 'none';
    }
  }
  
  async function mountWidget(checkoutId, orderRef) {
    try {
      await window.utils.loadSumUpSdk();
    } catch(e) {
      showError('Payment widget failed.');
      return;
    }
    
    try {
      clearError();
      
      // First unmount any existing widget to ensure clean state
      unmountWidget();
      
      // Hide all form steps and show payment section
      const detailsEl = modal.querySelector('.evt-details');
      const confirmLoggedEl = modal.querySelector('.evt-confirm-logged-in');
      if (detailsEl) detailsEl.style.display = 'none';
      if (confirmLoggedEl) confirmLoggedEl.style.display = 'none';
      cardEl.style.display = 'block';
        // Mount fresh widget
      window.SumUpCard.mount({
        id: 'evt-card-'+eventId,
        checkoutId,
        onResponse: async (type, body) => {
          console.log('SumUp onResponse:', type, body);
          
          // Clear any previous errors when user tries again
          clearError();
          
          // Handle final states only - intermediate states like verification should not trigger actions
          if (type === 'success') {
            // Payment succeeded! Try immediate verification (should be instant)
            // Use reduced polling: 3s intervals, only 20 attempts (1 minute)
            // Webhook will handle it if user closes browser
            await confirmPayment(orderRef, { pollInterval: 3000, maxAttempts: 20 });
          } else if (type === 'error' || type === 'fail') {
            // Payment failed
            showError(body.message || 'Payment failed. Please try again.');
          } else if (type === 'cancel') {
            // User cancelled the payment
            showError('Payment cancelled. You can try again when ready.');
          } else {
            // Intermediate state (e.g., verification check) - don't do anything, let user complete it
            console.log('SumUp intermediate state:', type, body);
          }
        },
        onBack: () => {
          console.log('SumUp onBack triggered');
          // User clicked back button in widget - return to details
          unmountWidget();
          modal.querySelector('.evt-details').style.display = 'block';
        }
      });
    } catch(e) {
      console.error('SumUp mount error:', e);
      showError('Could not start payment');
    }
  }
  
  function newIdempotencyKey() {
    try {
      return crypto.randomUUID();
    } catch {
      return String(Date.now()) + '-' + Math.random().toString(36).slice(2);
    }
  }
  
  async function startCheckout(email, name, privacy, turnstileToken) {
    clearError();
    
    // If user's applicable price is 0, use free registration
    if (userApplicablePrice === 0) {
      await startRegistration(email, name, turnstileToken);
      return;
    }
    
    // Check if the email has an active membership (for non-logged-in users entering a member email)
    if (!hasActiveMembership) {
      try {
        const checkResp = await fetch(API_BASE + '/membership/check?email=' + encodeURIComponent(email));
        if (checkResp.ok) {
          const checkData = await checkResp.json();
          if (checkData.hasActiveMembership) {
            // User entered a member email - update status and price
            hasActiveMembership = true;
            const memberPrice = parseFloat(event.membership_price || 0);
            userApplicablePrice = memberPrice;
            
            // Show simple modal notification
            const modalHtml = `
              <div style="position: fixed; inset: 0; z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 1rem; background: rgba(0,0,0,0.6);">
                <div style="background: white; border-radius: 12px; max-width: 400px; width: 100%; padding: 2rem; box-shadow: 0 20px 60px rgba(0,0,0,0.4);">
                  <h3 style="margin: 0 0 1rem 0; font-size: 1.5rem; font-weight: 600; color: #1f2937;">You're Already a Member! 🎉</h3>
                  <p style="margin: 0 0 1.5rem 0; color: #4b5563;">Great news! This email is already registered as a member, so you're getting the best price available.</p>
                  <button id="member-modal-btn" style="width: 100%; padding: 0.75rem 1.5rem; background: rgb(var(--color-primary-600)); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
                    Continue
                  </button>
                </div>
              </div>
            `;
            
            const modalEl = document.createElement('div');
            modalEl.innerHTML = modalHtml;
            document.body.appendChild(modalEl);
            
            document.getElementById('member-modal-btn').addEventListener('click', async () => {
              document.body.removeChild(modalEl);
              if (memberPrice === 0) {
                await startRegistration(email, name, turnstileToken);
              } else {
                await proceedWithRegularCheckout(email, name, privacy, turnstileToken);
              }
            });
            
            return;
          }
        }
      } catch (e) {
        console.error('[eventPurchase] Error checking membership for email:', e);
        // Continue with normal flow on error
      }
    }
    
    // For non-members on paid events, show bundle upsell before payment
    if (!hasActiveMembership && membershipPlans.length > 0) {
      showBundleUpsell((selectedBundle) => {
        if (selectedBundle && selectedMembershipPlan) {
          // User selected a bundle
          startBundleCheckout(email, name, privacy, turnstileToken);
        } else {
          // User declined bundle, proceed with regular checkout
          proceedWithRegularCheckout(email, name, privacy, turnstileToken);
        }
      });
      return;
    }
    
    // Otherwise proceed with regular paid checkout directly
    await proceedWithRegularCheckout(email, name, privacy, turnstileToken);
  }
  
  async function proceedWithRegularCheckout(email, name, privacy, turnstileToken) {
    let resp;
    try {
      resp = await fetch(API_BASE + '/events/' + encodeURIComponent(eventId) + '/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': newIdempotencyKey()
        },
        body: JSON.stringify({
          email,
          name,
          privacyConsent: privacy,
          turnstileToken
        })
      });
    } catch(e) {
      showError('Network error');
      return;
    }
    
    const data = await resp.json();
    if (!resp.ok) {
      showError(data?.message || data?.error || 'Checkout failed');
      return;
    }
    
    if (data.checkoutId) {
      mountWidget(data.checkoutId, data.orderRef);
      return;
    }
    
    showError('Missing checkout ID');
  }

  async function startRegistration(email, name, turnstileToken) {
    clearError();
    let resp;
    try {
      resp = await fetch(API_BASE + '/events/' + encodeURIComponent(eventId) + '/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          name,
          turnstileToken
        })
      });
    } catch(e) {
      showError('Network error');
      return;
    }
    const data = await resp.json();
    if (!resp.ok) {
      showError(data?.message || data?.error || 'Registration failed');
      return;
    }
      if (data.success || data.registered || data.already_registered) {
      // Check if user needs account setup and store data in sessionStorage
      if (data.needsAccountSetup && data.userEmail) {
        sessionStorage.setItem('pendingAccountSetup', JSON.stringify({
          email: data.userEmail,
          eventName: data.eventName || 'this event'
        }));
      }
      
      // Redirect to thank you page with registration reference
      // Format: REG-{eventId}-{ticketId}
      const ticketId = data.ticketId || Date.now();
      const regRef = `REG-${eventId}-${ticketId}`;
      window.location.href = '/thank-you?orderRef=' + encodeURIComponent(regRef);
      return;
    }
    
    showError('Registration failed');
  }

  async function startBundleCheckout(email, name, privacy, turnstileToken) {
    clearError();
    
    if (!selectedMembershipPlan) {
      showError('Please select a membership plan');
      return;
    }
    
    // Check if they want auto-renewal (we can add a checkbox for this later)
    const autoRenew = true; // Auto-renewal is always enabled
    
    let resp;
    try {
      resp = await fetch(API_BASE + '/events/' + encodeURIComponent(eventId) + '/checkout-with-membership', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': newIdempotencyKey()
        },
        body: JSON.stringify({
          email,
          name,
          privacyConsent: privacy,
          turnstileToken,
          membershipPlan: selectedMembershipPlan,
          autoRenew
        })
      });
    } catch(e) {
      showError('Network error');
      return;
    }
    
    const data = await resp.json();
    if (!resp.ok) {
      showError(data?.message || data?.error || 'Checkout failed');
      return;
    }
    
    if (data.checkoutId) {
      mountWidget(data.checkoutId, data.orderRef);
      return;
    }
    
    showError('Missing checkout ID');
  }

  async function startRegistration(email, name, turnstileToken) {
    clearError();
    let resp;
    try {
      resp = await fetch(API_BASE + '/events/' + encodeURIComponent(eventId) + '/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          name,
          turnstileToken
        })
      });
    } catch(e) {
      showError('Network error');
      return;
    }
    const data = await resp.json();
    if (!resp.ok) {
      showError(data?.message || data?.error || 'Registration failed');
      return;
    }
      if (data.success || data.registered || data.already_registered) {
      // Check if user needs account setup and store data in sessionStorage
      if (data.needsAccountSetup && data.userEmail) {
        sessionStorage.setItem('pendingAccountSetup', JSON.stringify({
          email: data.userEmail,
          eventName: data.eventName || 'this event'
        }));
      }
      
      // Redirect to thank you page with registration reference
      // Format: REG-{eventId}-{ticketId}
      const ticketId = data.ticketId || Date.now();
      const regRef = `REG-${eventId}-${ticketId}`;
      window.location.href = '/thank-you?orderRef=' + encodeURIComponent(regRef);
      return;
    }
    
    showError('Registration failed');
  }

  function openPurchaseModal() {
    // Check if this is a free registration for a logged-in member
    const buyBtn = root.querySelector('.evt-buy-btn');
    const user = getLoggedInUser();
    
    if (buyBtn && buyBtn.dataset.isFreeForMember === 'true' && user && user.email) {
      // Show modal with auto-filled info and Turnstile, then auto-submit
      modal.style.display = 'flex';
      
      // Show logged-in confirmation screen
      const confirmStep = modal.querySelector('.evt-confirm-logged-in');
      const detailsStep = modal.querySelector('.evt-details');
      const userEmailEl = modal.querySelector('.evt-user-email');
      
      if (confirmStep && detailsStep && userEmailEl) {
        userEmailEl.textContent = user.email;
        detailsStep.style.display = 'none';
        confirmStep.style.display = 'block';
        
        // Update title and message for free registration
        const titleEl = modal.querySelector('.evt-modal-title');
        const messageEl = modal.querySelector('.evt-logged-message');
        const btnEl = modal.querySelector('.evt-continue-logged');
        
        if (titleEl) titleEl.textContent = 'Event Registration';
        if (messageEl) messageEl.textContent = 'Registering as';
        if (btnEl) btnEl.textContent = 'Complete Registration';
        
        // Render Turnstile
        turnstileRenderTimeout = setTimeout(() => {
          turnstileRenderTimeout = null;
          renderTurnstile(true).catch((e) => {
            console.error('Failed to render Turnstile:', e);
          });
        }, 50);
      }
      return;
    }
    
    if (modal) {
      // Check if user is logged in
      const isLoggedIn = user && user.email;
      
      // Show modal FIRST so Turnstile can render properly
      modal.style.display = 'flex';
      
      // Show appropriate screen based on login status
      const detailsScreen = modal.querySelector('.evt-details');
      const loggedInScreen = modal.querySelector('.evt-confirm-logged-in');
      
      if (isLoggedIn) {
        // Show logged-in confirmation screen
        detailsScreen.style.display = 'none';
        loggedInScreen.style.display = 'block';
        
        // Populate user email
        const emailDisplay = modal.querySelector('.evt-user-email');
        if (emailDisplay) {
          emailDisplay.textContent = user.email;
        }
        
        // Render Turnstile for logged-in flow
        turnstileRenderTimeout = setTimeout(() => {
          turnstileRenderTimeout = null;
          renderTurnstile(true).catch((e) => {
            console.error('Failed to render Turnstile:', e);
          });
        }, 50);
      } else {
        // Show guest form
        detailsScreen.style.display = 'block';
        loggedInScreen.style.display = 'none';
        
        // Focus name input
        const nameInput = modal.querySelector('.evt-name');
        if (nameInput) nameInput.focus();
        
        // Render Turnstile for guest flow
        turnstileRenderTimeout = setTimeout(() => {
          turnstileRenderTimeout = null;
          renderTurnstile(false).catch((e) => {
            console.error('Failed to render Turnstile:', e);
          });
        }, 50);
      }
    }
  }
  function closePurchaseModal() {
    if (modal) {
      // Cancel pending Turnstile render if modal closes before timeout fires
      if (turnstileRenderTimeout !== null) {
        clearTimeout(turnstileRenderTimeout);
        turnstileRenderTimeout = null;
        console.log('Cancelled pending Turnstile render');
      }
      
      // Note: Turnstile cleanup happens automatically on next render via element replacement
      turnstileWidgetId = null;
      turnstileLoggedWidgetId = null;
      
      // Use the unmount helper to properly clean up SumUp widget
      unmountWidget();
        // Hide modal and reset state
      modal.style.display = 'none';
      const detailsScreen = modal.querySelector('.evt-details');
      const loggedInScreen = modal.querySelector('.evt-confirm-logged-in');
      if (detailsScreen) detailsScreen.style.display = 'block';
      if (loggedInScreen) loggedInScreen.style.display = 'none';
      
      clearError();
      const s = modal.querySelector('.evt-success');
      if (s) s.style.display = 'none';
      
      // Reset form fields
      const nameField = modal.querySelector('.evt-name');
      const emailField = modal.querySelector('.evt-email');
      const privacyField = modal.querySelector('.evt-privacy');
      if (nameField) nameField.value = '';
      if (emailField) emailField.value = '';
      if (privacyField) privacyField.checked = false;
    }
  }root.querySelector('.evt-buy-btn')?.addEventListener('click', openPurchaseModal);
  root.querySelector('.evt-register-btn')?.addEventListener('click', openPurchaseModal);
  
  modal.querySelector('.evt-close')?.addEventListener('click', closePurchaseModal);
  
  const contBtn = modal.querySelector('.evt-continue');
  contBtn && contBtn.addEventListener('click', async () => {
    const name = modal.querySelector('.evt-name').value.trim();
    const email = modal.querySelector('.evt-email').value.trim();
    const privacyCheckbox = modal.querySelector('.evt-privacy');
    const privacy = privacyCheckbox ? privacyCheckbox.checked : true;
    const isFreeEvent = !privacyCheckbox;
    
    if (!name) {
      showError('Enter your full name');
      return;
    }
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      showError('Enter a valid email');
      return;
    }
    if (!isFreeEvent && !privacy) {
      showError('Please agree to the Privacy Policy');
      return;
    }
    
    clearError();
    contBtn.disabled = true;
    
    let token;
    try {
      token = await getTurnstileToken(false);
    } catch(e) {
      showError(e.message || 'Security check failed.');
      contBtn.disabled = false;
      return;
    }
    
    contBtn.disabled = false;
    
    // Route to registration or checkout based on event type
    if (isFreeEvent) {
      startRegistration(email, name, token);
    } else {
      startCheckout(email, name, privacy, token);
    }
  });
  
  // Logged-in flow: Continue to payment button
  const contLoggedBtn = modal.querySelector('.evt-continue-logged');
  contLoggedBtn && contLoggedBtn.addEventListener('click', async () => {
    const user = getLoggedInUser();
    if (!user || !user.email) {
      showError('Session expired. Please refresh and try again.');
      return;
    }
    
    clearError();
    contLoggedBtn.disabled = true;
    
    let token;
    try {
      token = await getTurnstileToken(true);
    } catch(e) {
      showError(e.message || 'Security check failed.');
      contLoggedBtn.disabled = false;
      return;
    }
      contLoggedBtn.disabled = false;
    // Use user's name from session if available, otherwise use email
    const name = user.name || user.email;
    
    // Route based on user's applicable price (not just event type)
    // If member has 0 price, use free registration even if event has paid tier
    if (userApplicablePrice === 0) {
      startRegistration(user.email, name, token);
    } else {
      startCheckout(user.email, name, true, token);
    }
  });
  
  // Switch account button (show guest form)
  const switchAccountBtn = modal.querySelector('.evt-switch-account');
  switchAccountBtn && switchAccountBtn.addEventListener('click', () => {
    const detailsScreen = modal.querySelector('.evt-details');
    const loggedInScreen = modal.querySelector('.evt-confirm-logged-in');
    
    // Hide logged-in screen, show guest form
    if (loggedInScreen) loggedInScreen.style.display = 'none';
    if (detailsScreen) {
      detailsScreen.style.display = 'block';
      // Focus name input
      const nameInput = modal.querySelector('.evt-name');
      if (nameInput) nameInput.focus();
    }
    
    // Render Turnstile for guest flow
    renderTurnstile(false).catch((e) => {
      console.error('Failed to render Turnstile:', e);
    });
  });
  
  ['input', 'change'].forEach(ev => {
    ['.evt-name', '.evt-email', '.evt-privacy'].forEach(sel => {
      const el = modal.querySelector(sel);
      if (el) el.addEventListener(ev, clearError);
    });
  });
  
  // Check for order confirmation in URL
  const qs = new URLSearchParams(location.search);
  const ref = qs.get('orderRef');
  if (ref) {
    confirmPayment(ref).then(() => {
      const u = new URL(location.href);
      u.searchParams.delete('orderRef');
      history.replaceState({}, '', u);
    });
  }
}
