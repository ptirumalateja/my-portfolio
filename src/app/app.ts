import { Component, signal, AfterViewInit, PLATFORM_ID, inject, HostListener } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements AfterViewInit {
  protected readonly title = signal('my-portfolio');
  protected navScrolled = false;
  protected activeSection = 'home';

  private readonly platformId = inject(PLATFORM_ID);
  private readonly sectionIds = ['home', 'about', 'skills', 'project', 'experience', 'contact'];

  @HostListener('window:scroll')
  onScroll(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.navScrolled = window.scrollY > 60;
    this.updateActiveSection();
  }

  protected setActiveSection(sectionId: string): void {
    this.activeSection = sectionId;
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );

    // requestAnimationFrame defers until after the browser's first layout/paint,
    // ensuring getBoundingClientRect() returns accurate positions.
    requestAnimationFrame(() => {
      document.querySelectorAll('.reveal, .service-card, .career-card, .whyus-card, .testimonial-card, .team-card, .engagement-card, .insight-card').forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight) {
          // Already in or above viewport — make visible immediately, no animation needed
          (el as HTMLElement).style.transition = 'none';
          el.classList.add('visible');
        } else {
          // Below fold — let observer trigger the animation on scroll
          observer.observe(el);
        }
      });

      this.initCarouselDots();
      this.updateActiveSection();
    });
  }

  private initCarouselDots(): void {
    document.querySelectorAll('.project-visual-card').forEach((card) => {
      const scroll = card.querySelector('.project-image-scroll') as HTMLElement;
      const dots = Array.from(card.querySelectorAll('.project-visual-dots span'));
      const images = Array.from(scroll?.querySelectorAll('img') ?? []) as HTMLElement[];

      if (!scroll || !dots.length || !images.length) return;

      let currentIndex = 0;
      let autoTimer: ReturnType<typeof setInterval>;

      const setActive = (index: number) => {
        currentIndex = index;
        dots.forEach((d, i) => d.classList.toggle('is-active', i === index));
      };

      const scrollToIndex = (index: number) => {
        scroll.scrollTo({ left: (images[index] as HTMLElement).offsetLeft, behavior: 'smooth' });
        setActive(index);
      };

      const startAuto = () => {
        clearInterval(autoTimer);
        autoTimer = setInterval(() => {
          const next = (currentIndex + 1) % images.length;
          scrollToIndex(next);
        }, 3000);
      };

      // Click dot → jump to image and reset timer
      dots.forEach((dot, i) => {
        (dot as HTMLElement).style.cursor = 'pointer';
        dot.addEventListener('click', () => {
          scrollToIndex(i);
          startAuto();
        });
      });

      // Sync dots on manual scroll
      scroll.addEventListener('scroll', () => {
        const scrollLeft = scroll.scrollLeft;
        let nearest = 0;
        let minDist = Infinity;
        images.forEach((img, i) => {
          const dist = Math.abs((img as HTMLElement).offsetLeft - scrollLeft);
          if (dist < minDist) { minDist = dist; nearest = i; }
        });
        if (nearest !== currentIndex) setActive(nearest);
      }, { passive: true });

      // Pause auto-scroll on hover, resume on leave
      card.addEventListener('mouseenter', () => clearInterval(autoTimer));
      card.addEventListener('mouseleave', () => startAuto());

      startAuto();
    });
  }

  private updateActiveSection(): void {
    const scrollMarker = window.scrollY + 140;

    for (const sectionId of [...this.sectionIds].reverse()) {
      const section = document.getElementById(sectionId);

      if (section && section.offsetTop <= scrollMarker) {
        this.activeSection = sectionId;
        return;
      }
    }

    this.activeSection = 'home';
  }
}
