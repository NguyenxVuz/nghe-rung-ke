import './style.css';

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
  document.querySelectorAll<HTMLAnchorElement>('.nav-link').forEach((link) => {
    link.classList.toggle('active', link.dataset.page === currentPage);
  });
  document.querySelectorAll<HTMLAnchorElement>('#main-nav a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
    });
  });

  menuButton.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
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
  }, { threshold: 0.12 });

  // Hide elements only after the observer is ready. A broken script still leaves content visible.
  document.documentElement.classList.add('reveal-ready');
  items.forEach((item) => observer.observe(item));
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
