// Central client-side script for UI, search, auth guards, selling/listing rendering, chat hooks.
// Assumes firebase-auth.js, firebase-chat.js, firebase-selling.js expose helper functions described below.

document.addEventListener('DOMContentLoaded', () => {
  // Auth-aware nav and logout
  const logoutBtn = document.getElementById('logout-btn');
  const loginLink = document.getElementById('login-link');

  if (typeof window.authOnReady === 'function') {
    window.authOnReady((user) => {
      if (logoutBtn) logoutBtn.hidden = !user;
      if (loginLink) loginLink.style.display = user ? 'none' : '';
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      if (window.firebaseSignOut) await window.firebaseSignOut();
      location.href = 'index.html';
    });
  }

  // Guarded pages redirect if not logged in
  if (typeof window.authRequire === 'function') {
    const guardedOnly = document.querySelector('.guarded-only');
    if (guardedOnly) {
      window.authRequire().catch(() => location.href = 'login.html');
    }
  }

  /* -------------------------
     Prices search UI
     ------------------------- */
  const priceSearch = document.getElementById('price-search');
  const priceList = document.getElementById('price-list');
  const priceNoResults = document.getElementById('price-no-results');
  const priceClear = document.getElementById('price-clear');

  if (priceSearch && priceList) {
    const filterPrices = () => {
      const term = priceSearch.value.toLowerCase().trim();
      let matches = 0;
      [...priceList.querySelectorAll('li')].forEach(li => {
        const item = (li.dataset.item || li.textContent || '').toLowerCase();
        const show = item.includes(term);
        li.style.display = show ? '' : 'none';
        if (show) matches++;
      });
      priceNoResults.style.display = matches === 0 ? '' : 'none';
      if (priceClear) priceClear.style.display = term.length > 0 ? '' : 'none';
    };
    priceSearch.addEventListener('input', filterPrices);
    if (priceClear) priceClear.addEventListener('click', () => {
      priceSearch.value = '';
      filterPrices();
      priceSearch.focus();
    });
  }

  /* -------------------------
     Craft search UI
     ------------------------- */
  const craftSearch = document.getElementById('craft-search');
  const craftList = document.getElementById('craft-list');
  const craftNoResults = document.getElementById('craft-no-results');
  const craftClear = document.getElementById('craft-clear');

  if (craftSearch && craftList) {
    const filterCraft = () => {
      const term = craftSearch.value.toLowerCase().trim();
      let matches = 0;
      [...craftList.querySelectorAll('[data-item]')].forEach(card => {
        const item = (card.dataset.item || card.textContent || '').toLowerCase();
        const show = item.includes(term);
        card.style.display = show ? '' : 'none';
        if (show) matches++;
      });
      craftNoResults.style.display = matches === 0 ? '' : 'none';
      if (craftClear) craftClear.style.display = term.length > 0 ? '' : 'none';
    };
    craftSearch.addEventListener('input', filterCraft);
    if (craftClear) craftClear.addEventListener('click', () => {
      craftSearch.value = '';
      filterCraft();
      craftSearch.focus();
    });
  }

  /* -------------------------
     Selling listings rendering
     ------------------------- */
  const listingGrid = document.getElementById('listing-grid');
  if (listingGrid && typeof window.onListings === 'function') {
    window.onListings((listings) => {
      listingGrid.innerHTML = '';
      listings.forEach(l => {
        const el = document.createElement('article');
        el.className = 'card';
        el.innerHTML = `
          <h3>${escapeHtml(l.item)} <span class="tag ${tagClass(l.tag)}">${escapeHtml(l.tag)}</span></h3>
          <p><strong>Price:</strong> ${escapeHtml(String(l.price))} coins</p>
          <p><strong>Seller:</strong> ${escapeHtml(l.username || 'anon')}</p>
          <p class="muted">Posted: ${new Date(l.createdAt || Date.now()).toLocaleString()}</p>
        `;
        listingGrid.appendChild(el);
      });
    });
  }

  /* -------------------------
     Sell modal submit
     ------------------------- */
  const sellForm = document.getElementById('sell-form');
  const sellModal = document.getElementById('sell-modal');
  const sellStatus = document.getElementById('sell-status');
  if (sellForm) {
    sellForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const item = document.getElementById('sell-item').value.trim();
      const price = Number(document.getElementById('sell-price').value);
      const username = document.getElementById('sell-username').value.trim();
      if (!item || !price || !username) {
        sellStatus.textContent = 'Please fill all fields.';
        return;
      }

      // Try to find price range from prices list
      let min = null, max = null;
      if (priceList) {
        const match = [...priceList.querySelectorAll('li')].find(li => (li.dataset.item || '').toLowerCase() === item.toLowerCase());
        if (match) {
          const text = match.textContent || '';
          const nums = text.match(/(\d+)[^\d]+(\d+)/);
          if (nums) { min = Number(nums[1]); max = Number(nums[2]); }
        }
      }

      const tag = computePriceTag(price, min, max);
      try {
        if (typeof window.postListing === 'function') {
          await window.postListing({ item, price, username, tag });
          sellStatus.textContent = `Posted with tag: ${tag}`;
          setTimeout(() => { if (sellModal && sellModal.close) sellModal.close(); }, 600);
        } else {
          sellStatus.textContent = 'Posting not available.';
        }
      } catch (err) {
        sellStatus.textContent = 'Failed to post listing.';
      }
    });
  }

  /* -------------------------
     Login / Signup handlers (UI only; actual auth in firebase-auth.js)
     ------------------------- */
  const loginForm = document.getElementById('login-form');
  const loginStatus = document.getElementById('login-status');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const ident = document.getElementById('login-ident').value.trim();
      const password = document.getElementById('login-password').value;
      try {
        if (typeof window.firebaseLogin === 'function') {
          await window.firebaseLogin(ident, password);
          loginStatus.textContent = 'Logged in.';
          location.href = 'dashboard.html';
        } else {
          loginStatus.textContent = 'Login not available.';
        }
      } catch (err) {
        loginStatus.textContent = 'Login failed.';
      }
    });
  }

  const signupForm = document.getElementById('signup-form');
  const signupStatus = document.getElementById('signup-status');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('signup-email').value.trim();
      const username = document.getElementById('signup-username').value.trim();
      const password = document.getElementById('signup-password').value;
      const tos = document.getElementById('tos-check').checked;
      if (!tos) {
        signupStatus.textContent = 'You must agree to the terms.';
        return;
      }
      try {
        if (typeof window.firebaseSignup === 'function') {
          await window.firebaseSignup(email, username, password);
          signupStatus.textContent = 'Account created.';
          location.href = 'dashboard.html';
        } else {
          signupStatus.textContent = 'Signup not available.';
        }
      } catch (err) {
        signupStatus.textContent = 'Signup failed.';
      }
    });
  }

  /* -------------------------
     Chat submit and rendering
     ------------------------- */
  const chatForm = document.getElementById('chat-form');
  const chatMessages = document.getElementById('chat-messages');
  if (chatForm && typeof window.postMessage === 'function' && typeof window.onMessages === 'function') {
    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('chat-username').value.trim();
      const content = document.getElementById('chat-input').value.trim();
      if (!username || !content) return;
      const clean = filterProfanity(content);
      await window.postMessage({ username, content: clean });
      document.getElementById('chat-input').value = '';
    });

    window.onMessages((msgs) => {
      if (!chatMessages) return;
      chatMessages.innerHTML = '';
      msgs.forEach(m => {
        const line = document.createElement('div');
        line.className = 'card';
        line.innerHTML = `
          <p><strong>${escapeHtml(m.username)}:</strong> ${escapeHtml(m.content)}</p>
          <p class="muted">User ID: ${escapeHtml(m.uid || 'anon')} • ${new Date(m.createdAt || Date.now()).toLocaleString()}</p>
        `;
        chatMessages.appendChild(line);
      });
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });
  }
});

/* Helpers */
function computePriceTag(price, min, max) {
  if (min == null || max == null) return 'fair';
  if (price === min) return 'minimum';
  if (price === max) return 'maximum';
  if (price < min) return 'under-priced';
  if (price > max) return 'over-priced';
  return 'fair';
}
function tagClass(tag) {
  switch (tag) {
    case 'under-priced': return 'under';
    case 'over-priced': return 'over';
    case 'minimum': return 'min';
    case 'maximum': return 'max';
    default: return 'fair';
  }
}
function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}
function filterProfanity(text) {
  const bad = /\b(fuck|shit|bitch|asshole|bastard|dick|cunt)\b/gi;
  return text.replace(bad, m => '*'.repeat(m.length));
}
