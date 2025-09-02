document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('main section');
  const tocLinks = document.querySelectorAll('#toc a');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = entry.target.getAttribute('id');
        const tocLink = document.querySelector(`#toc a[href='#${id}']`);

        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          tocLinks.forEach((link) => link.classList.remove('active'));
          if (tocLink) {
            tocLink.classList.add('active');
          }
        }
      });
    },
    { rootMargin: '0px 0px -50% 0px', threshold: 0.5 }
  );

  sections.forEach((section) => {
    observer.observe(section);
  });
});
