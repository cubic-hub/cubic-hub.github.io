// Central client-side script for UI, search.
// Add in firebase scripts as needed for auth, database, etc. Base off of backup-script.js

document.addEventListener('DOMContentLoaded', () => {
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
});
