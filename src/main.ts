import './style.css';
import './site-config';

type Theme = 'light' | 'dark';

const THEME_KEY = 'nghe-rung-ke:theme';

const setupTheme = (): void => {
  const button = document.querySelector<HTMLButtonElement>('#theme-toggle');
  if (!button) return;

  const preferredDark = matchMedia('(prefers-color-scheme: dark)').matches;
  let theme = (localStorage.getItem(THEME_KEY) as Theme | null)
    ?? (preferredDark ? 'dark' : 'light');

  const renderTheme = (): void => {
    document.documentElement.dataset.theme = theme;
    button.setAttribute('aria-pressed', String(theme === 'dark'));
    button.setAttribute(
      'aria-label',
      theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối',
    );
  };

  renderTheme();
  button.addEventListener('click', () => {
    theme = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, theme);
    renderTheme();
  });
};

const setupNavigation = (): void => {
  const header = document.querySelector<HTMLElement>('.site-header');
  const nav = document.querySelector<HTMLElement>('#main-nav');
  const menuButton = document.querySelector<HTMLButtonElement>('#menu-toggle');
  if (!header || !nav || !menuButton) return;

  const currentPage = document.body.dataset.page;
  document.querySelectorAll<HTMLElement>('.nav-link').forEach((link) => {
    link.classList.toggle('active', link.dataset.page === currentPage);
  });
  const menuItems = Array.from(nav.querySelectorAll<HTMLElement>('.nav-item'));
  const navToggles = Array.from(nav.querySelectorAll<HTMLButtonElement>('.nav-toggle'));
  const closeItem = (item: HTMLElement): void => {
    item.classList.remove('open');
    item.querySelector<HTMLButtonElement>('.nav-toggle')?.setAttribute('aria-expanded', 'false');
  };
  const closeDropdowns = (): void => menuItems.forEach(closeItem);
  const isMobile = (): boolean => matchMedia('(max-width: 1050px)').matches;
  const closeMobileMenu = (restoreFocus = false): void => {
    nav.classList.remove('open');
    closeDropdowns();
    document.body.classList.remove('menu-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Mở menu');
    if (restoreFocus) menuButton.focus();
  };

  navToggles.forEach((toggle) => {
    const item = toggle.closest<HTMLElement>('.nav-item');
    if (!item) return;
    toggle.addEventListener('click', () => {
      const shouldOpen = !item.classList.contains('open');
      closeDropdowns();
      item.classList.toggle('open', shouldOpen);
      toggle.setAttribute('aria-expanded', String(shouldOpen));
    });
    item.addEventListener('pointerenter', () => {
      if (isMobile()) return;
      closeDropdowns();
      item.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
    });
    item.addEventListener('pointerleave', () => {
      if (isMobile() || item.contains(document.activeElement)) return;
      closeItem(item);
    });
    item.addEventListener('focusin', () => {
      if (isMobile()) return;
      closeDropdowns();
      item.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
    });
    item.addEventListener('focusout', (event) => {
      if (isMobile() || item.contains(event.relatedTarget as Node | null)) return;
      closeItem(item);
    });
  });

  document.querySelectorAll<HTMLAnchorElement>('#main-nav a').forEach((link) => {
    link.addEventListener('click', () => {
      if (isMobile()) closeMobileMenu();
      else closeDropdowns();
    });
  });

  menuButton.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Đóng menu' : 'Mở menu');
    document.body.classList.toggle('menu-open', isOpen);
    if (isOpen) navToggles[0]?.focus();
    else closeDropdowns();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (isMobile() && nav.classList.contains('open')) {
        closeMobileMenu(true);
        return;
      }
      const openItem = menuItems.find((item) => item.classList.contains('open'));
      if (openItem) {
        const toggle = openItem.querySelector<HTMLButtonElement>('.nav-toggle');
        closeItem(openItem);
        toggle?.focus();
      }
      return;
    }

    if (event.key !== 'Tab' || !isMobile() || !nav.classList.contains('open')) return;
    const focusable = Array.from(header.querySelectorAll<HTMLElement>(
      '#main-nav.open a[href], #main-nav.open button:not(:disabled), #menu-toggle, .header-actions a[href], .header-actions button:not(:disabled)',
    )).filter((element) => element.getClientRects().length > 0);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  document.addEventListener('click', (event) => {
    if (isMobile() && nav.classList.contains('open') && !header.contains(event.target as Node)) {
      closeMobileMenu();
    }
  });

  window.addEventListener('resize', () => {
    if (!isMobile()) closeMobileMenu();
  });

  const updateHeader = (): void => {
    header.classList.toggle('scrolled', scrollY > 18 || !document.querySelector('.hero'));
  };
  updateHeader();
  addEventListener('scroll', updateHeader, { passive: true });
};

const setupReveal = (): void => {
  const items = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (!items.length || !('IntersectionObserver' in window)
    || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('revealed');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.01, rootMargin: '0px 0px 15% 0px' });

  document.documentElement.classList.add('reveal-ready');
  items.forEach((item) => observer.observe(item));
  window.setTimeout(() => {
    items.forEach((item) => item.classList.add('revealed'));
    observer.disconnect();
  }, 1200);
};

const setupTimeline = (): void => {
  const timeline = document.querySelector<HTMLElement>('.timeline');
  if (!timeline) return;

  const dots = timeline.querySelectorAll<HTMLButtonElement>('.timeline-dot');
  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const article = dot.closest<HTMLElement>('article');
      if (!article) return;

      timeline.querySelectorAll<HTMLElement>('article').forEach((item) => {
        const isActive = item === article;
        item.classList.toggle('active', isActive);
        item.querySelector<HTMLButtonElement>('.timeline-dot')
          ?.setAttribute('aria-pressed', String(isActive));
      });
    });
  });
};

setupReveal();
setupTheme();
setupNavigation();
setupTimeline();

// Only the participation page needs Supabase and the map libraries.
if (document.querySelector('#plant-dialog')) {
  void import('./counter')
    .then(({ setupForestPlanting }) => setupForestPlanting())
    .catch((error: unknown) => {
      console.error('Không thể tải chức năng trồng cây:', error);
      const message = document.querySelector<HTMLElement>('#toast');
      if (message) {
        message.textContent = 'Bản đồ đang tạm thời không khả dụng. Vui lòng thử lại sau.';
        message.classList.add('show');
      }
      document.querySelectorAll<HTMLButtonElement>('[data-open-plant]').forEach((button) => {
        button.disabled = true;
        button.title = 'Chức năng trồng cây đang tạm thời không khả dụng';
      });
    });
}
