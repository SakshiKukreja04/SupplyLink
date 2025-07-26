import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// Flow-up animation for cards and sections
export const flowUpAnimation = (selector: string, stagger = 0.2) => {
  gsap.from(selector, {
    scrollTrigger: {
      trigger: selector,
      start: "top 80%",
      end: "bottom 20%",
      toggleActions: "play none none reverse"
    },
    opacity: 0,
    y: 50,
    duration: 1,
    ease: "power2.out",
    stagger: stagger
  });
};

// Heading animation with delay
export const headingAnimation = (selector: string, delay = 0.3) => {
  gsap.from(selector, {
    scrollTrigger: {
      trigger: selector,
      start: "top 80%",
      end: "bottom 20%",
      toggleActions: "play none none reverse"
    },
    opacity: 0,
    y: 30,
    duration: 0.8,
    ease: "power2.out",
    delay: delay
  });
};

// Initialize all animations
export const initAnimations = () => {
  // Homepage card animations
  flowUpAnimation(".card-section", 0.2);
  
  // Heading animations
  headingAnimation(".hero-heading", 0.3);
  headingAnimation(".cta-heading", 0.2);
  
  // Form animations
  flowUpAnimation(".form-section", 0.1);
  
  // Dashboard card animations
  flowUpAnimation(".dashboard-card", 0.15);
  
  // Add hover effects for dashboard cards
  gsap.utils.toArray(".dashboard-card").forEach((card: any) => {
    card.addEventListener("mouseenter", () => {
      gsap.to(card, {
        scale: 1.02,
        duration: 0.3,
        ease: "power2.out"
      });
    });
    
    card.addEventListener("mouseleave", () => {
      gsap.to(card, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      });
    });
  });
};

// Cleanup function
export const cleanupAnimations = () => {
  ScrollTrigger.getAll().forEach(trigger => trigger.kill());
}; 