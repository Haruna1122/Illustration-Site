document.documentElement.classList.add("js-enabled");

const root = document.documentElement;
const body = document.body;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const revealTargets = document.querySelectorAll("[data-reveal]");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
  );

  revealTargets.forEach((target) => revealObserver.observe(target));
} else {
  revealTargets.forEach((target) => target.classList.add("is-visible"));
}

const yearTarget = document.querySelector("[data-year]");
if (yearTarget) yearTarget.textContent = new Date().getFullYear();

function updatePointerVars(event) {
  const x = `${(event.clientX / window.innerWidth) * 100}%`;
  const y = `${(event.clientY / window.innerHeight) * 100}%`;
  root.style.setProperty("--pointer-x", x);
  root.style.setProperty("--pointer-y", y);
}

function updateParallax(event) {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  const offsetX = event.clientX - centerX;
  const offsetY = event.clientY - centerY;

  document.querySelectorAll(".parallax").forEach((element) => {
    const depth = Number(element.dataset.depth || 0.01);
    const x = offsetX * depth;
    const y = offsetY * depth;
    element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  });

  document.querySelectorAll(".liquid-img").forEach((image, index) => {
    const depth = 0.003 + index * 0.0016;
    const x = offsetX * depth;
    const y = offsetY * depth;
    image.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${1 + index * 0.012})`;
  });
}

if (!prefersReducedMotion) {
  window.addEventListener(
    "pointermove",
    (event) => {
      updatePointerVars(event);
      updateParallax(event);
    },
    { passive: true }
  );
}



const svgNamespace = "http://www.w3.org/2000/svg";
const hoverMorphSets = [
  {
    selectors: ["#clip-mermaid path", ".image-rim--one"],
    duration: "1.55s",
    values:
      "M162 78C236 35 327 64 350 151C383 274 322 449 207 470C93 490 48 374 60 262C69 178 87 121 162 78Z;" +
      "M142 58C242 16 348 87 356 181C365 285 316 438 218 489C103 548 37 401 74 246C99 139 82 91 142 58Z;" +
      "M176 92C259 36 337 77 365 148C408 258 316 463 190 462C72 461 47 345 56 248C64 164 102 119 176 92Z;" +
      "M162 78C236 35 327 64 350 151C383 274 322 449 207 470C93 490 48 374 60 262C69 178 87 121 162 78Z",
  },
  {
    selectors: ["#clip-cat path", ".image-rim--two"],
    duration: "1.72s",
    values:
      "M314 88C402 36 528 42 592 111C675 201 650 392 561 478C472 563 321 532 271 447C224 367 228 139 314 88Z;" +
      "M331 54C438 23 560 60 612 146C685 266 614 427 526 501C423 587 286 518 255 405C226 300 237 89 331 54Z;" +
      "M296 104C384 34 544 34 606 101C694 197 676 389 571 492C482 580 318 547 259 453C208 371 207 174 296 104Z;" +
      "M314 88C402 36 528 42 592 111C675 201 650 392 561 478C472 563 321 532 271 447C224 367 228 139 314 88Z",
  },
  {
    selectors: ["#clip-chroma path", ".image-rim--three"],
    duration: "1.42s",
    values:
      "M625 92C714 32 836 71 861 182C889 307 819 462 714 484C613 505 570 401 588 286C601 199 563 134 625 92Z;" +
      "M650 64C740 21 847 96 858 206C870 329 805 487 690 475C592 465 555 376 595 256C625 166 575 106 650 64Z;" +
      "M612 98C721 28 833 50 870 168C908 291 814 445 726 500C620 566 564 392 586 276C604 183 548 139 612 98Z;" +
      "M625 92C714 32 836 71 861 182C889 307 819 462 714 484C613 505 570 401 588 286C601 199 563 134 625 92Z",
  },
  {
    selectors: [".membrane-fill", ".membrane-line"],
    duration: "1.9s",
    values:
      "M97 94C198 6 323 40 417 34C567 22 746 -3 842 101C938 204 896 366 826 466C748 578 605 520 489 544C338 576 193 608 95 501C10 409 21 181 97 94Z;" +
      "M134 55C249 -8 343 74 452 42C581 4 756 18 837 128C928 252 858 393 769 487C673 589 557 498 444 557C300 632 144 568 69 450C2 345 16 126 134 55Z;" +
      "M77 111C198 14 333 25 437 52C576 88 724 -22 837 89C948 198 918 372 835 475C742 590 598 540 488 527C343 511 198 623 88 493C-1 388 5 192 77 111Z;" +
      "M97 94C198 6 323 40 417 34C567 22 746 -3 842 101C938 204 896 366 826 466C748 578 605 520 489 544C338 576 193 608 95 501C10 409 21 181 97 94Z",
  },
];

function buildHoverMorphs() {
  const animations = [];

  hoverMorphSets.forEach((set) => {
    set.selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((target) => {
        const hoverAnimation = document.createElementNS(svgNamespace, "animate");
        hoverAnimation.setAttribute("attributeName", "d");
        hoverAnimation.setAttribute("dur", set.duration);
        hoverAnimation.setAttribute("values", set.values);
        hoverAnimation.setAttribute("repeatCount", "indefinite");
        hoverAnimation.setAttribute("begin", "indefinite");
        hoverAnimation.setAttribute("calcMode", "spline");
        hoverAnimation.setAttribute("keyTimes", "0;0.34;0.68;1");
        hoverAnimation.setAttribute("keySplines", "0.16 1 0.3 1;0.22 1 0.36 1;0.16 1 0.3 1");
        hoverAnimation.setAttribute("data-fluid-hover-anim", "");
        target.appendChild(hoverAnimation);
        animations.push(hoverAnimation);
      });
    });
  });

  return animations;
}

if (!prefersReducedMotion) {
  const fluidStage = document.querySelector("[data-fluid-stage]");
  const hoverAnimations = buildHoverMorphs();

  fluidStage?.addEventListener("pointerenter", () => {
    fluidStage.classList.add("is-liquid-hovering");
    hoverAnimations.forEach((animation) => animation.beginElement());
  });

  fluidStage?.addEventListener("pointerleave", () => {
    fluidStage.classList.remove("is-liquid-hovering");
    hoverAnimations.forEach((animation) => animation.endElement());
  });
}

document.querySelectorAll("[data-theme-button]").forEach((button) => {
  button.addEventListener("click", () => {
    body.dataset.fluidTheme = button.dataset.themeButton;
  });
});

const motionToggle = document.querySelector("[data-motion-toggle]");
motionToggle?.addEventListener("click", () => {
  const paused = body.classList.toggle("is-motion-paused");
  motionToggle.setAttribute("aria-pressed", paused ? "true" : "false");
  motionToggle.textContent = paused ? "Paused" : "Motion";
});

document.querySelectorAll("form").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    form.classList.add("is-submitted");
    window.setTimeout(() => form.classList.remove("is-submitted"), 900);
  });
});


// v9: lower content hover membrane.
// The previous versions spawned visible water ripples on hover. In v9 the
// pointer still feeds local light coordinates, but the visual emphasis is the
// frame itself morphing continuously while hovered.
const hoverFrameTargets = document.querySelectorAll('[data-ripple]');

function setLocalPointerVars(target, event) {
  const rect = target.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  target.style.setProperty('--local-x', `${x}%`);
  target.style.setProperty('--local-y', `${y}%`);
}

hoverFrameTargets.forEach((target) => {
  target.addEventListener('pointerenter', (event) => {
    setLocalPointerVars(target, event);
    target.classList.add('is-hover-warping');
  });

  target.addEventListener('pointermove', (event) => {
    setLocalPointerVars(target, event);
  }, { passive: true });

  target.addEventListener('pointerleave', () => {
    target.classList.remove('is-hover-warping');
  });
});

// v7: a softer parallax pass for the lower fluid canvas nodes.
if (!prefersReducedMotion) {
  window.addEventListener(
    'pointermove',
    (event) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const offsetX = event.clientX - centerX;
      const offsetY = event.clientY - centerY;
      document.querySelectorAll('.deep-current .fluid-art, .deep-current .fluid-node, .deep-current .phone-drift').forEach((element, index) => {
        const depth = Number(element.dataset.depth || (0.0012 + (index % 5) * 0.00025));
        element.style.setProperty('--drift-x', `${offsetX * depth}px`);
        element.style.setProperty('--drift-y', `${offsetY * depth}px`);
      });
    },
    { passive: true }
  );
}

// v10: lower cards now use the same motion model as the TOP hero.
// Each card owns SVG <animate> nodes with begin="indefinite"; hover starts
// continuous path morphing and leaving the card ends the accelerated morph.
if (!prefersReducedMotion) {
  document.querySelectorAll('[data-lower-liquid-card]').forEach((card) => {
    const hoverAnimations = Array.from(card.querySelectorAll('[data-lower-hover-animate]'));

    card.addEventListener('pointerenter', () => {
      card.classList.add('is-top-motion-hovering');
      hoverAnimations.forEach((animation) => {
        try {
          animation.beginElement();
        } catch (error) {
          // Some older browsers do not expose SMIL controls. The CSS hover
          // state still provides the glow and image response in that case.
        }
      });
    });

    card.addEventListener('pointerleave', () => {
      card.classList.remove('is-top-motion-hovering');
      hoverAnimations.forEach((animation) => {
        try {
          animation.endElement();
        } catch (error) {}
      });
    });
  });
}
