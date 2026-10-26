export const SITE_CONFIG = {
  showFacebook: false,
  facebookUrl: '',
  showBuiltWith: false,
} as const;

export const setupOptionalFooterContent = (): void => {
  const facebookItems = document.querySelectorAll<HTMLElement>('[data-site-facebook], .footer-placeholder');
  if (SITE_CONFIG.showFacebook) {
    if (!SITE_CONFIG.facebookUrl) {
      throw new Error('Cần cấu hình URL Facebook trước khi bật liên kết Facebook.');
    }
    facebookItems.forEach((item) => {
      const link = document.createElement('a');
      link.href = SITE_CONFIG.facebookUrl;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = 'Facebook';
      item.replaceWith(link);
    });
  } else {
    facebookItems.forEach((item) => item.remove());
  }

  if (!SITE_CONFIG.showBuiltWith) {
    document.querySelectorAll('[data-site-built-with]').forEach((item) => item.remove());
  }
};

setupOptionalFooterContent();
