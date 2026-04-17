/* ============================================================
   QuizForge — script.js
   Vanilla JS Quiz Application
   Features: Shuffle, Timer, Progress, Live Score, Results
   ============================================================ */

'use strict';

/* ── Question Bank ──────────────────────────────────────────
   Each object: { question, options: [a,b,c,d], answer: 0-based index }
   ─────────────────────────────────────────────────────────── */
const QUESTION_BANK = [
  {
    question: "What is the powerhouse of the cell?",
    options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi Apparatus"],
    answer: 2
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    answer: 1
  },
  {
    question: "Who painted the Mona Lisa?",
    options: ["Michelangelo", "Raphael", "Leonardo da Vinci", "Donatello"],
    answer: 2
  },
  {
    question: "What is the chemical symbol for Gold?",
    options: ["Go", "Gd", "Au", "Ag"],
    answer: 2
  },
  {
    question: "Which country invented the Internet (World Wide Web)?",
    options: ["United States", "United Kingdom", "Germany", "Japan"],
    answer: 1
  },
  {
    question: "How many bones are there in the adult human body?",
    options: ["186", "206", "226", "246"],
    answer: 1
  },
  {
    question: "What is the capital of Australia?",
    options: ["Sydney", "Melbourne", "Brisbane", "Canberra"],
    answer: 3
  },
  {
    question: "Which programming language is known as the 'mother' of many languages?",
    options: ["Python", "Java", "C", "FORTRAN"],
    answer: 2
  },
  {
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
    answer: 3
  },
  {
    question: "Who developed the Theory of General Relativity?",
    options: ["Isaac Newton", "Nikola Tesla", "Albert Einstein", "Stephen Hawking"],
    answer: 2
  },
  {
    question: "What does CPU stand for?",
    options: ["Central Process Unit", "Central Processing Unit", "Core Processing Unit", "Compute Processing Unit"],
    answer: 1
  },
  {
    question: "Which element has the atomic number 1?",
    options: ["Helium", "Oxygen", "Carbon", "Hydrogen"],
    answer: 3
  },
  {
    question: "In what year did World War II end?",
    options: ["1943", "1944", "1945", "1946"],
    answer: 2
  },
  {
    question: "What is the smallest country in the world?",
    options: ["Monaco", "San Marino", "Vatican City", "Liechtenstein"],
    answer: 2
  },
  {
    question: "What does HTTP stand for?",
    options: [
      "HyperText Transfer Protocol",
      "HighText Terminal Protocol",
      "HyperTerminal Transfer Process",
      "High Transfer Text Protocol"
    ],
    answer: 0
  }
];

/* ── Config ── */
const TOTAL_QUESTIONS = 10;   // How many questions to pick per game
const TIMER_SECONDS   = 20;   // Time per question

/* ── State ── */
let questions      = [];   // Shuffled subset of QUESTION_BANK
let currentIndex   = 0;
let score          = 0;
let correctCount   = 0;
let wrongCount     = 0;
let skippedCount   = 0;
let answered       = false;
let timerInterval  = null;
let timeLeft       = TIMER_SECONDS;

/* ── DOM References ── */
const startScreen   = document.getElementById('start-screen');
const quizScreen    = document.getElementById('quiz-screen');
const resultScreen  = document.getElementById('result-screen');

const startBtn      = document.getElementById('start-btn');
const nextBtn       = document.getElementById('next-btn');
const restartBtn    = document.getElementById('restart-btn');

const qCurrent      = document.getElementById('q-current');
const qTotal        = document.getElementById('q-total');
const progressBar   = document.getElementById('progress-bar');
const liveScore     = document.getElementById('live-score');

const timerCount    = document.getElementById('timer-count');
const ringFill      = document.getElementById('ring-fill');

const questionText  = document.getElementById('question-text');
const optionsGrid   = document.getElementById('options-grid');
const feedback      = document.getElementById('feedback');

const resultEmoji   = document.getElementById('result-emoji');
const resultLabel   = document.getElementById('result-label');
const resultMessage = document.getElementById('result-message');
const finalScore    = document.getElementById('final-score');
const scFill        = document.getElementById('sc-fill');
const statCorrect   = document.getElementById('stat-correct');
const statWrong     = document.getElementById('stat-wrong');
const statSkipped   = document.getElementById('stat-skipped');

/* ── Timer ring constants ── */
const RING_CIRC = 2 * Math.PI * 26; // circumference for r=26
const SC_CIRC   = 2 * Math.PI * 52; // circumference for r=52

/* ============================================================
   Utility: Fisher-Yates shuffle
   ============================================================ */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ============================================================
   Screen management
   ============================================================ */
function showScreen(screen) {
  [startScreen, quizScreen, resultScreen].forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

/* ============================================================
   Start / Restart
   ============================================================ */
function initQuiz() {
  // Shuffle bank and pick TOTAL_QUESTIONS
  questions    = shuffle(QUESTION_BANK).slice(0, TOTAL_QUESTIONS);
  currentIndex = 0;
  score        = 0;
  correctCount = 0;
  wrongCount   = 0;
  skippedCount = 0;

  qTotal.textContent = TOTAL_QUESTIONS;
  liveScore.textContent = 0;

  showScreen(quizScreen);
  loadQuestion();
}

/* ============================================================
   Load a question
   ============================================================ */
function loadQuestion() {
  answered = false;

  const q   = questions[currentIndex];
  const num = currentIndex + 1;

  // Progress
  qCurrent.textContent = num;
  const pct = ((num - 1) / TOTAL_QUESTIONS) * 100;
  progressBar.style.width = pct + '%';

  // Shuffle options to prevent same-position correct answer
  const indices = shuffle([0, 1, 2, 3]);

  // Question
  questionText.textContent = q.question;

  // Clear old options & feedback
  optionsGrid.innerHTML = '';
  hideFeedback();
  nextBtn.classList.add('hidden');

  // Build option buttons
  const letters = ['A', 'B', 'C', 'D'];
  indices.forEach((origIdx, pos) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.dataset.origIdx = origIdx;

    btn.innerHTML = `<span class="option-letter">${letters[pos]}</span>${q.options[origIdx]}`;

    btn.addEventListener('click', () => onOptionClick(btn, origIdx, q.answer));
    optionsGrid.appendChild(btn);
  });

  // Start timer
  startTimer();
}

/* ============================================================
   Option clicked
   ============================================================ */
function onOptionClick(clickedBtn, selectedIdx, correctIdx) {
  if (answered) return;
  answered = true;

  stopTimer();
  disableOptions();

  if (selectedIdx === correctIdx) {
    // Correct
    clickedBtn.classList.add('correct');
    score++;
    correctCount++;
    liveScore.textContent = score;
    showFeedback('correct', '✓ Correct! Well done.');
  } else {
    // Wrong — highlight correct answer
    clickedBtn.classList.add('wrong');
    wrongCount++;
    highlightCorrect(correctIdx);
    const correctText = questions[currentIndex].options[correctIdx];
    showFeedback('wrong', `✗ Wrong! The answer was: ${correctText}`);
  }

  nextBtn.classList.remove('hidden');
}

/* ============================================================
   Timer
   ============================================================ */
function startTimer() {
  timeLeft = TIMER_SECONDS;
  updateTimerUI();
  ringFill.classList.remove('warning');

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerUI();

    if (timeLeft <= 5) ringFill.classList.add('warning');

    if (timeLeft <= 0) {
      stopTimer();
      onTimeOut();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function updateTimerUI() {
  timerCount.textContent = timeLeft;
  // Animate ring: dashoffset from 0 (full) → RING_CIRC (empty)
  const offset = RING_CIRC * (1 - timeLeft / TIMER_SECONDS);
  ringFill.style.strokeDashoffset = offset;
}

function onTimeOut() {
  if (answered) return;
  answered = true;
  skippedCount++;
  disableOptions();
  highlightCorrect(questions[currentIndex].answer);
  showFeedback('timeout', `⏱ Time's up! The answer was: ${questions[currentIndex].options[questions[currentIndex].answer]}`);
  nextBtn.classList.remove('hidden');
}

/* ============================================================
   Helpers
   ============================================================ */
function disableOptions() {
  optionsGrid.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
}

function highlightCorrect(correctIdx) {
  optionsGrid.querySelectorAll('.option-btn').forEach(btn => {
    if (parseInt(btn.dataset.origIdx) === correctIdx) {
      btn.classList.add('correct');
    }
  });
}

function showFeedback(type, msg) {
  feedback.textContent   = msg;
  feedback.className     = 'feedback'; // reset
  if (type === 'correct')  feedback.classList.add('correct-fb');
  if (type === 'wrong')    feedback.classList.add('wrong-fb');
  if (type === 'timeout')  feedback.classList.add('timeout-fb');
}

function hideFeedback() {
  feedback.className = 'feedback hidden';
  feedback.textContent = '';
}

/* ============================================================
   Next question / End quiz
   ============================================================ */
function onNext() {
  currentIndex++;

  if (currentIndex >= TOTAL_QUESTIONS) {
    endQuiz();
  } else {
    loadQuestion();
  }
}

/* ============================================================
   End quiz — Show results
   ============================================================ */
function endQuiz() {
  stopTimer();

  // Update progress to 100%
  progressBar.style.width = '100%';

  showScreen(resultScreen);

  // Populate stats
  finalScore.textContent   = score;
  statCorrect.textContent  = correctCount;
  statWrong.textContent    = wrongCount;
  statSkipped.textContent  = skippedCount;

  // Determine result tier
  const pct = score / TOTAL_QUESTIONS;
  let emoji, label, message;

  if (pct === 1) {
    emoji   = '🏆';
    label   = 'Perfect!';
    message = 'Flawless! You got every single question right. You\'re a walking encyclopedia!';
  } else if (pct >= 0.8) {
    emoji   = '🌟';
    label   = 'Excellent!';
    message = 'Outstanding performance! You clearly know your stuff. Just a couple slipped by.';
  } else if (pct >= 0.6) {
    emoji   = '👍';
    label   = 'Good Job!';
    message = 'Solid effort! You\'ve got a good base. A little more revision and you\'ll ace it.';
  } else if (pct >= 0.4) {
    emoji   = '📚';
    label   = 'Keep Going!';
    message = 'Not bad for a start! Review the topics and try again — you\'ll improve for sure.';
  } else {
    emoji   = '💪';
    label   = 'Try Again!';
    message = 'Every expert was once a beginner. Hit restart and give it another shot!';
  }

  resultEmoji.textContent   = emoji;
  resultLabel.textContent   = label;
  resultMessage.textContent = message;

  // Animate score ring
  const offset = SC_CIRC * (1 - pct);
  // Slight delay to let screen transition finish
  setTimeout(() => {
    scFill.style.strokeDashoffset = offset;
  }, 200);
}

/* ============================================================
   Event Listeners
   ============================================================ */
startBtn.addEventListener('click', initQuiz);
nextBtn.addEventListener('click', onNext);
restartBtn.addEventListener('click', () => {
  // Reset result ring immediately before re-init
  scFill.style.strokeDashoffset = SC_CIRC;
  initQuiz();
});
