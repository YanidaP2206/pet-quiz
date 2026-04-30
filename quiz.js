/* quiz.js */
(function () {
  'use strict';

  const qs = (s, ctx = document) => ctx.querySelector(s);
  const qsa = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));
  const go = (url) => (location.href = url);

  const progressMap = {
    '20': { key: 'q1', next: 'q2.html', prev: 'index.html' },
    '40': { key: 'q2', next: 'q3.html', prev: 'q1.html' },
    '60': { key: 'q3', next: 'q4.html', prev: 'q2.html' },
    '80': { key: 'q4', next: 'q5.html', prev: 'q3.html' },
    '100': { key: 'q5', next: 'result.html', prev: 'q4.html' }
  };

  function tryPlay(src) {
    try {
      const a = new Audio(src);
      a.play().catch(() => {});
      return a;
    } catch (e) {
      return null;
    }
  }

  function initProgress(container) {
    const fill = qs('#progressFill', container) || qs('.progress-fill', container);
    const progress = container.dataset.progress || '0';
    if (fill) {
      fill.style.width = progress + '%';
      const progressBar = qs('.progress', container);
      if (progressBar) progressBar.setAttribute('aria-valuenow', progress);
    }
  }

  function initOptions(container, storageKey) {
    const labels = qsa('.options label', container);
    if (!labels.length) return;

    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const input = qs(`input[value="${saved}"]`, container);
        if (input) input.checked = true;
      }
    }

    labels.forEach(label => {
      const input = label.querySelector('input[type="radio"]');
      if (!input) return;
      if (input.checked) label.classList.add('selected');

      input.addEventListener('change', () => {
        labels.forEach(l => l.classList.remove('selected'));
        label.classList.add('selected');
      });

      input.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          input.checked = true;
          input.dispatchEvent(new Event('change', { bubbles: true }));
          const form = container.querySelector('form');
          if (form) form.requestSubmit?.();
        }
      });
    });
  }

  function initBackButton(container, prevUrl) {
    const backBtn = qs('#backBtn', container);
    if (!backBtn) return;
    backBtn.addEventListener('click', () => {
      if (history.length > 1) {
        history.back();
        setTimeout(() => { if (location.pathname.endsWith(location.pathname)) go(prevUrl); }, 250);
      } else {
        go(prevUrl);
      }
    });
  }

  function initForm(container, storageKey, nextUrl) {
    const form = qs('form', container);
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const answer = container.querySelector('input[type="radio"]:checked');
      if (!answer) {
        alert('Please select an answer!');
        return;
      }
      if (storageKey) localStorage.setItem(storageKey, answer.value);
      if (nextUrl) go(nextUrl);
    });
  }

  // Lottie loader with PNG fallback
  function showLottieForPersonality(personality, theme) {
    const container = document.getElementById('result-anim');
    if (!container) return;

    const map = {
      cat: 'animations/cat.json',
      dog: 'animations/dog.json',
      bird: 'animations/bird.json',
      rabbit: 'animations/rabbit.json',
      fox: 'animations/fox.json',
      turtle: 'animations/turtle.json'
    };
    const path = map[personality] || map.cat;
    const fallbackImg = theme.img;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      container.innerHTML = `<img src="${fallbackImg}" alt="${theme.text}" style="max-width:220px;border-radius:12px;">`;
      return;
    }

    try {
      container.innerHTML = '';
      const anim = lottie.loadAnimation({
        container: container,
        renderer: 'svg',
        loop: true,
        autoplay: false, // disable autoplay
        path: path
      });
      anim.play(); // explicitly start playback
    } catch (err) {
      container.innerHTML = `<img src="${fallbackImg}" alt="${theme.text}" style="max-width:220px;border-radius:12px;">`;
    }
  }

  function initResultPage() {
    const keys = ['q1','q2','q3','q4','q5'];
    const answers = keys.map(k => localStorage.getItem(k));
    if (answers.every(a => a === null)) {
      alert('No answers found. Please take the quiz.');
      go('index.html');
      return;
    }

    const counts = { cat:0, dog:0, bird:0, rabbit:0, fox:0, turtle:0 };
    answers.forEach(a => { if (a && counts[a] !== undefined) counts[a]++; });

    const max = Math.max(...Object.values(counts));
    const top = Object.keys(counts).filter(k => counts[k] === max);
    const personality = top[Math.floor(Math.random() * top.length)];

    const themes = {
      cat:{text:"You’re a Cat! Independent and thoughtful.",img:"images/cat.png",sound:"sounds/cat.mp3",facts:["Cats sleep a lot.","A group of cats is a clowder."]},
      dog:{text:"You’re a Dog! Loyal and social.",img:"images/dog.png",sound:"sounds/dog.mp3",facts:["Dogs can learn many words.","Dogs love company."]},
      bird:{text:"You’re a Bird! Free-spirited and curious.",img:"images/bird.png",sound:"sounds/bird.mp3",facts:["Some birds live decades.","Birds have feathers."]},
      rabbit:{text:"You’re a Rabbit! Gentle and playful.",img:"images/rabbit.png",sound:"sounds/rabbit.mp3",facts:["Rabbits communicate with thumps.","They love veggies."]},
      fox:{text:"You’re a Fox! Clever and adaptable.",img:"images/fox.png",sound:"sounds/fox.mp3",facts:["Foxes are vocal.","They are solitary hunters."]},
      turtle:{text:"You’re a Turtle! Calm and steady.",img:"images/turtle.png",sound:"sounds/turtle.mp3",facts:["Some turtles live 100+ years.","They move slowly."]}
    };

    const theme = themes[personality] || themes.cat;
    const resultTextEl = qs('#result-text');
    const funFactEl = qs('#fun-fact');

    if (resultTextEl) resultTextEl.innerText = theme.text;
    if (funFactEl) funFactEl.innerText = 'Fun Fact: ' + theme.facts[Math.floor(Math.random()*theme.facts.length)];

    // Show Lottie animation with fallback
    showLottieForPersonality(personality, theme);

    tryPlay('sounds/theme.mp3');
    tryPlay(theme.sound);

    const chartCanvas = qs('#scoreChart');
    if (chartCanvas && window.Chart) {
      const ctx = chartCanvas.getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: Object.keys(counts),
          datasets: [{
            label: 'Answer Count',
            data: Object.values(counts),
            backgroundColor: ['#9b59b6','#4CAF50','#3498db','#e67e22','#d35400','#27ae60']
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            title: { display: true, text: 'Your Answer Breakdown' }
          },
          scales: { y: { beginAtZero: true, precision: 0 } }
        }
      });
    }

    if (window.confetti) {
      const duration = 3000;
      const end = Date.now() + duration;
      (function frame() {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
        if (Date.now() < end) requestAnimationFrame(frame);
      }());
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const container = qs('.quiz-container');
    if (!container) return;
	
	    // If we are on the result page, initialize results
    if (qs('#result-area') || qs('#scoreChart')) {
      initResultPage();
      return;
    }

    // Otherwise, initialize quiz page
    initProgress(container);

    const progress = String(container.dataset.progress || '0');
    const map = progressMap[progress];
   
    const storageKey = map ? map.key : null;
    const nextUrl = map ? map.next : null;
    const prevUrl = map ? map.prev : 'index.html';

    initOptions(container, storageKey);
    initBackButton(container, prevUrl);
    initForm(container, storageKey, nextUrl);
  });

})();
