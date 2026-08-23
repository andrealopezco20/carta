const pages = [
  { type: "art", theme: "ink", image: "assets/01-portada.png", alt: "Dos personas compartiendo sus corazones", cover: true },
  { type: "art", theme: "cream", image: "assets/02-hilo-rojo.png", alt: "Dos manos unidas por un hilo rojo" },
  { type: "text", theme: "cream", title: "Me encanta de ti...", text: "esa forma tan tuya de encontrarme, como si un hilo invisible siempre nos llevara de vuelta." },
  { type: "art", theme: "mint", image: "assets/03-dinosaurio.png", alt: "Dinosaurio verde ofreciendo flores" },
  { type: "text", theme: "mint", title: "Me enamora...", text: "tu ternura, tus detalles pequeñitos y la alegría que llevas contigo a donde vas." },
  { type: "art", theme: "plum", image: "assets/04-mi-luz.png", alt: "Dos personajes compartiendo una luz" },
  { type: "text", theme: "plum", title: "Eres mi luz...", text: "porque contigo hasta mis días más grises encuentran una razón bonita para brillar." },
  { type: "art", theme: "blush", image: "assets/05-snoopy.png", alt: "Snoopy rodeado de corazones rosados" },
  { type: "text", theme: "blush", title: "Me gusta que...", text: "a tu lado puedo ser yo, reír sin medida y sentir que no necesito estar en ningún otro lugar." },
  { type: "art", theme: "sky", image: "assets/06-luna.png", alt: "Viaje de la Tierra a la Luna" },
  { type: "text", theme: "sky", title: "Te quiero tanto...", text: "que iría de aquí a la luna y volvería solo para verte sonreír una vez más." },
  { type: "art", theme: "night", image: "assets/07-nadie-como-tu.png", alt: "Una persona luminosa entre la multitud" },
  { type: "text", theme: "night", title: "Nadie como tú...", text: "porque entre millones de personas, mi corazón siempre sabría reconocerte." },
  { type: "art", theme: "ocean", image: "assets/08-tortugas.png", alt: "Dos tortugas nadando juntas" },
  { type: "text", theme: "ocean", title: "Quiero contigo...", text: "un amor sin prisa, lleno de paciencia, risas y muchos caminos recorridos de la mano." },
  { type: "art", theme: "jelly", image: "assets/09-medusas.png", alt: "Dos medusas enamoradas" },
  { type: "text", theme: "jelly", title: "En otra vida...", text: "volvería a buscarte, a elegirte y a enamorarme de cada pequeña parte de ti." },
  { type: "art", theme: "sand", image: "assets/10-huellas.png", alt: "Olas y huellas en la arena" },
  { type: "text", theme: "sand", title: "Y es que tú...", text: "dejaste huellas bonitas en mi vida y ahora formas parte de todos mis lugares favoritos." },
  { type: "text", theme: "rose", title: "Siempre tú", text: "Si pudiera volver a elegir, volvería a encontrarte y a quedarme contigo una y mil veces.", finale: true },
  { type: "art", theme: "love", image: "assets/11-hecho-con-amor.png", alt: "Mensaje hecho con amor en letras rojas" }
];

const book = document.querySelector("#book");
const container = document.querySelector("#bookPages");
const previousButtons = [document.querySelector("#previousButton"), document.querySelector("#mobilePrevious")];
const nextButtons = [document.querySelector("#nextButton"), document.querySelector("#mobileNext")];
const progressBar = document.querySelector("#progressBar");
const soundToggle = document.querySelector("#soundToggle");

let position = 0;
let isAnimating = false;
let musicEnabled = false;
let audioContext;
let musicTimer;
let musicMaster;
let musicStep = 0;

function makePage(page, side, number) {
  const element = document.createElement("article");
  const isArt = page.type === "art";
  element.className = `page page--${side} ${isArt ? "art-page" : "letter-page"} theme--${page.theme} ${page.cover ? "art-cover" : ""} ${page.finale ? "art-finale" : ""}`;
  const content = isArt
    ? `<div class="page-content art-content"><img class="page-art" src="${page.image}" alt="${page.alt}" draggable="false">${page.phrase ? `<div class="love-note"><span>${page.phrase}</span></div>` : ""}</div>`
    : `<div class="page-content letter-content"><span class="letter-sparkle">♡</span><h2>${page.title}</h2><span class="hand-line" aria-hidden="true"></span><p class="handwritten">${page.text}</p></div>`;
  element.innerHTML = `${content}${page.cover ? "" : `<span class="page-number">${number}</span>`}`;
  return element;
}

// Siempre conservamos pliegos de dos páginas, también en celulares.
let renderedMobile = false;

function buildBook() {
  container.replaceChildren();
  position = 0;
  const step = renderedMobile ? 1 : 2;
  for (let index = 0; index < pages.length; index += step) {
    const sheet = document.createElement("div");
    sheet.className = "sheet";
    sheet.dataset.index = String(index / step);
    sheet.style.zIndex = String(50 - index);
    sheet.append(makePage(pages[index], "front", index + 1));
    if (!renderedMobile) sheet.append(makePage(pages[index + 1] || pages[index], "back", index + 2));
    container.append(sheet);
  }
}

function isMobile() { return window.matchMedia("(max-width: 760px)").matches; }

function updateControls() {
  const total = document.querySelectorAll(".sheet").length;
  const step = renderedMobile ? 1 : 2;
  const maxPosition = pages.length % step === 0 ? total : total - 1;
  previousButtons.forEach(button => button.disabled = position === 0);
  nextButtons.forEach(button => button.disabled = position === maxPosition);
  progressBar.style.width = `${(position / maxPosition) * 100}%`;
  book.classList.toggle("is-closed", position === 0);
  document.querySelectorAll(".sheet").forEach((sheet, index) => {
    sheet.style.zIndex = index < position ? String(index + 1) : String(50 - index);
  });
}

const pianoProgression = [
  [261.63, 329.63, 392.00, 523.25],
  [220.00, 261.63, 329.63, 440.00],
  [174.61, 220.00, 261.63, 349.23],
  [196.00, 246.94, 293.66, 392.00]
];

function pianoNote(frequency, start, duration, volume = .055) {
  const oscillator = audioContext.createOscillator();
  const overtone = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const overtoneGain = audioContext.createGain();
  oscillator.type = "sine";
  overtone.type = "triangle";
  oscillator.frequency.value = frequency;
  overtone.frequency.value = frequency * 2;
  gain.gain.setValueAtTime(.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + .025);
  gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
  overtoneGain.gain.setValueAtTime(.0001, start);
  overtoneGain.gain.exponentialRampToValueAtTime(volume * .11, start + .018);
  overtoneGain.gain.exponentialRampToValueAtTime(.0001, start + duration * .55);
  oscillator.connect(gain).connect(musicMaster);
  overtone.connect(overtoneGain).connect(musicMaster);
  oscillator.start(start);
  overtone.start(start);
  oscillator.stop(start + duration + .05);
  overtone.stop(start + duration + .05);
}

function playPianoMeasure() {
  if (!musicEnabled) return;
  const now = audioContext.currentTime + .05;
  const chord = pianoProgression[musicStep % pianoProgression.length];
  chord.forEach((note, index) => pianoNote(note, now + index * .54, 2.4, index === 0 ? .045 : .052));
  pianoNote(chord[0] / 2, now, 3, .032);
  musicStep += 1;
}

function startMusic() {
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  audioContext.resume();
  musicMaster = audioContext.createGain();
  musicMaster.gain.setValueAtTime(.0001, audioContext.currentTime);
  musicMaster.gain.exponentialRampToValueAtTime(.7, audioContext.currentTime + .8);
  musicMaster.connect(audioContext.destination);
  musicStep = 0;
  playPianoMeasure();
  musicTimer = window.setInterval(playPianoMeasure, 2700);
}

function stopMusic() {
  window.clearInterval(musicTimer);
  if (musicMaster && audioContext) {
    const now = audioContext.currentTime;
    musicMaster.gain.cancelScheduledValues(now);
    musicMaster.gain.setValueAtTime(Math.max(musicMaster.gain.value, .0001), now);
    musicMaster.gain.exponentialRampToValueAtTime(.0001, now + .6);
  }
}

function turn(direction) {
  if (isAnimating) return;
  const sheets = [...document.querySelectorAll(".sheet")];
  const step = renderedMobile ? 1 : 2;
  const maxPosition = pages.length % step === 0 ? sheets.length : sheets.length - 1;
  const nextPosition = position + direction;
  if (nextPosition < 0 || nextPosition > maxPosition) return;
  isAnimating = true;
  const sheet = direction > 0 ? sheets[position] : sheets[position - 1];
  sheet.classList.add("is-turning");
  if (direction > 0) sheet.classList.add("is-turned");
  else sheet.classList.remove("is-turned");
  position = nextPosition;
  updateControls();
  window.setTimeout(() => { sheet.classList.remove("is-turning"); isAnimating = false; }, 1180);
}

previousButtons.forEach(button => button.addEventListener("click", () => turn(-1)));
nextButtons.forEach(button => button.addEventListener("click", () => turn(1)));

book.addEventListener("keydown", event => {
  if (event.key === "ArrowRight" || event.key === " ") { event.preventDefault(); turn(1); }
  if (event.key === "ArrowLeft") { event.preventDefault(); turn(-1); }
});

book.addEventListener("click", () => {
  if (position === 0) turn(1);
});

let touchStartX = 0;
let touchStartY = 0;
book.addEventListener("touchstart", event => {
  touchStartX = event.changedTouches[0].clientX;
  touchStartY = event.changedTouches[0].clientY;
}, { passive: true });
book.addEventListener("touchend", event => {
  const deltaX = event.changedTouches[0].clientX - touchStartX;
  const deltaY = event.changedTouches[0].clientY - touchStartY;
  if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY)) turn(deltaX < 0 ? 1 : -1);
}, { passive: true });

soundToggle.addEventListener("click", () => {
  musicEnabled = !musicEnabled;
  soundToggle.setAttribute("aria-pressed", String(musicEnabled));
  soundToggle.setAttribute("aria-label", musicEnabled ? "Pausar música suave de piano" : "Activar música suave de piano");
  if (musicEnabled) startMusic();
  else stopMusic();
});

window.addEventListener("resize", updateControls);
buildBook();
updateControls();
