import './style.css';
import { speciesCards, speciesGroups } from './species';

const escapeHtml = (value: string): string => value
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const statusLevel = (status: string): string => {
  if (status.includes('Cực kỳ nguy cấp')) return 'critical';
  if (status.includes('Sắp nguy cấp')) return 'near';
  if (status.includes('Nguy cấp')) return 'endangered';
  return 'protected';
};

const cardMarkup = (number: string, name: string, image: string, status: string, description: string): string => `
  <button class="species-card" type="button" data-species-card data-number="${escapeHtml(number)}" data-name="${escapeHtml(name)}" data-image="${escapeHtml(image)}" data-status="${escapeHtml(status)}" data-description="${escapeHtml(description)}">
    <img src="${escapeHtml(image)}" alt="Ảnh minh họa: ${escapeHtml(name)}" width="600" height="400" loading="lazy" decoding="async" />
    <span class="species-card-number">${escapeHtml(number)}</span>
    <strong>${escapeHtml(name)}</strong>
    <span class="species-status-badge species-status-${statusLevel(status)}"><b>Tình trạng</b>: ${escapeHtml(status)}</span>
    <span class="species-description"><b>Đặc điểm nhận diện</b>: ${escapeHtml(description)}</span>
  </button>`;

const renderSpecies = (): void => {
  const container = document.querySelector<HTMLElement>('#species-groups');
  if (!container) return;

  container.innerHTML = speciesGroups.map((group) => `
  <section class="species-group" id="species-group-${speciesGroups.indexOf(group)}" role="tabpanel" data-species-group="${escapeHtml(group)}">
    <h3>${escapeHtml(group)}</h3>
      <div class="species-grid">${speciesCards
        .filter((species) => species.group === group)
        .map((species) => cardMarkup(species.number, species.name, species.image, species.status, species.description))
        .join('')}</div>
    </section>`).join('');

  const dialog = document.querySelector<HTMLDialogElement>('#species-dialog');
  const image = document.querySelector<HTMLImageElement>('#species-dialog-image');
  const number = document.querySelector<HTMLElement>('#species-dialog-number');
  const title = document.querySelector<HTMLElement>('#species-dialog-title');
  const status = document.querySelector<HTMLElement>('#species-dialog-status');
  const description = document.querySelector<HTMLElement>('#species-dialog-description');
  if (!dialog || !image || !number || !title || !status || !description) {
    throw new Error('Không tìm thấy thành phần thẻ sinh vật.');
  }

  container.querySelectorAll<HTMLButtonElement>('[data-species-card]').forEach((card) => {
    card.addEventListener('click', () => {
      image.src = card.dataset.image ?? '';
      image.alt = `Ảnh minh họa: ${card.dataset.name ?? ''}`;
      number.textContent = card.dataset.number ?? '';
      title.textContent = card.dataset.name ?? '';
      status.textContent = card.dataset.status ?? '';
      description.textContent = card.dataset.description ?? '';
      dialog.showModal();
    });
  });
};

const setupSpeciesFilters = (): void => {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-species-filter]'));
  const filters = document.querySelector<HTMLElement>('.species-filters');
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.speciesFilter;
      filters?.style.setProperty('--active-index', String(index));
      buttons.forEach((item) => {
        const isActive = item === button;
        item.classList.toggle('active', isActive);
        item.setAttribute('aria-selected', String(isActive));
      });
      document.querySelectorAll<HTMLElement>('[data-species-group]').forEach((group) => {
        group.hidden = group.dataset.speciesGroup !== filter;
        if (!group.hidden) {
          group.classList.remove('is-switching');
          void group.offsetWidth;
          group.classList.add('is-switching');
        }
      });
    });
    button.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      const delta = event.key === 'ArrowRight' ? 1 : -1;
      const next = (index + delta + buttons.length) % buttons.length;
      buttons[next]?.focus();
      buttons[next]?.click();
    });
  });
  buttons[0]?.click();
};

const setupMagazineReveal = (): void => {
  const items = document.querySelectorAll<HTMLElement>(
    '.rescue-story-card, .rescue-love li, .rescue-home li, .species-card, .trip-activities article, .volunteer-sections > article, .volunteer-links a',
  );
  if (!items.length || !('IntersectionObserver' in window)
    || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('magazine-revealed');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.01, rootMargin: '0px 0px 15% 0px' });

  items.forEach((item, index) => {
    item.style.setProperty('--reveal-delay', `${(index % 4) * 70}ms`);
    item.classList.add('magazine-reveal');
    observer.observe(item);
  });
  window.setTimeout(() => {
    items.forEach((item) => item.classList.add('magazine-revealed'));
    observer.disconnect();
  }, 1500);
};

renderSpecies();
setupSpeciesFilters();
setupMagazineReveal();
document.querySelector('#species-dialog .dialog-close')?.addEventListener('click', () => {
  document.querySelector<HTMLDialogElement>('#species-dialog')?.close();
});
const speciesDialog = document.querySelector<HTMLDialogElement>('#species-dialog');
speciesDialog?.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') speciesDialog.close();
});
speciesDialog?.addEventListener('click', (event) => {
  if (event.target === event.currentTarget) {
    speciesDialog.close();
  }
});
