const canvas = document.getElementById('background-canvas');
const ctx = canvas.getContext('2d');
let width, height;
let particles = [];

function init() {
  resize();
  createParticles();
  animate();
}

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}

function createParticles() {
  particles = [];
  for (let i = 0; i < 80; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.7,
      speedY: (Math.random() - 0.5) * 0.7,
      opacity: Math.random() * 0.5 + 0.3,
    });
  }
}

function animate() {
  ctx.clearRect(0, 0, width, height);
  particles.forEach(p => {
    p.x += p.speedX;
    p.y += p.speedY;
    if (p.x < 0 || p.x > width) p.speedX = -p.speedX;
    if (p.y < 0 || p.y > height) p.speedY = -p.speedY;

    ctx.beginPath();
    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 10);
    gradient.addColorStop(0, `rgba(108, 189, 255, ${p.opacity})`);
    gradient.addColorStop(1, 'rgba(108, 189, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.arc(p.x, p.y, p.size * 10, 0, Math.PI * 2);
    ctx.fill();
  });
  requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
  resize();
  createParticles();
});

init();
