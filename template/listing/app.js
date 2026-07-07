(() => {
  const cards = Array.from(document.querySelectorAll('.card'));
  const chips = Array.from(document.querySelectorAll('.chip'));
  const search = document.querySelector('.search');
  const empty = document.querySelector('.empty');
  let tag = '*';
  let query = '';

  const apply = () => {
    let shown = 0;
    for (const card of cards) {
      const tags = JSON.parse(card.dataset.tags || '[]');
      const ok =
        (tag === '*' || tags.includes(tag)) &&
        (!query || (card.dataset.search || '').includes(query));
      card.hidden = !ok;
      if (ok) shown += 1;
    }
    empty.hidden = shown !== 0;
  };

  for (const chip of chips) {
    chip.addEventListener('click', () => {
      tag = chip.dataset.tag;
      for (const c of chips) {
        const active = c === chip;
        c.classList.toggle('is-active', active);
        c.setAttribute('aria-pressed', String(active));
      }
      apply();
    });
  }

  search.addEventListener('input', () => {
    query = search.value.trim().toLowerCase();
    apply();
  });
})();
