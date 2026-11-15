// What each showcase image is made of. Coordinates are CSS pixels on the
// canvas the image is designed for: 846 wide for the desktop column, 580 for
// the columns in between, 330 for a phone. Every image is rendered at twice
// that size.
//
// A narrower canvas never shrinks the wide composition: it shows less, at a
// size where the app's own text can be read (about 9 px or more).
const AMBER = '#FFB020';
const RUST = '#B45309';
const GOLD = '#E8C77B';
const S = '.work/shots';

/** A caption under a frame, with a short tick up to the frame it describes. */
const cap = (x, y, frameBottom, tag, text) => ({ type: 'callout', x, y, tag, text, from: [x + 3, y - 5], to: [x + 3, frameBottom + 3] });

const GREEN = 'linear-gradient(135deg,#071C13 0%,#0F3F2C 50%,#1E6B4C 100%)';
const BLUE = 'linear-gradient(135deg,#0C1D33 0%,#143A66 52%,#2A6CB4 100%)';
const VIOLET = 'linear-gradient(135deg,#1E1754 0%,#352887 55%,#4B36B0 100%)';
const INK = 'linear-gradient(135deg,#0B131E 0%,#17263A 100%)';
const PAPER = 'linear-gradient(135deg,#FBFAF6 0%,#F0EEE6 100%)';

const CV = `${S}/jobbliggaren/06-cv-granskning-rader.png`; // 1152 CSS px wide
const ACTIONS = `${S}/jobbliggaren/01-oversikt-krav-atgard.png`; // the "Kräver åtgärd" card, 767 CSS px wide
const AD_PHONE = `${S}/jobbliggaren/m-03-annons.png`; // 390 CSS px wide

const LABEL = {
  jobbliggaren: '<b>JOBBLIGGAREN</b> &nbsp;·&nbsp; SIGNED IN, TEST ACCOUNT',
  jobbliggarenShort: '<b>JOBBLIGGAREN</b> &nbsp;·&nbsp; TEST ACCOUNT',
  cv: '<b>JOBBLIGGAREN</b> &nbsp;·&nbsp; CV REVIEW',
  yobber: '<b>YOBBER</b> &nbsp;·&nbsp; PUBLIC SITE',
  kalaskoll: '<b>KALASKOLL</b> &nbsp;·&nbsp; DEMO DATA',
};

const STUDY = ['<b>Domain</b>', '<b>Application</b>     <i>CQRS</i>', '<b>Infrastructure</b>  <i>EF Core</i>', '<b>API</b>             <i>JWT</i>'];

/** The four smaller projects. `size` picks the layout: a row, two by two, or two by two for a phone. */
function also(size, light) {
  const base = { bg: light ? PAPER : INK, light, accent: light ? RUST : AMBER, quality: 84 };
  const mini = (x, y, w, h) => ({ type: 'browser', src: `${S}/also/miniats-live.png`, url: 'mini-ats', x, y, w, h, zoom: 2, pan: w / 2, scroll: Math.round(w * 0.29) });
  const detective = (x, y, w, h, url) => ({ type: 'browser', src: `${S}/also/detective.png`, url, x, y, w, h });
  const sky = (x, y, w, h, url) => ({ type: 'browser', src: `${S}/also/sky.png`, url, x, y, w, h, scroll: Math.round(w * 0.066) });
  if (size === 'wide') {
    return {
      ...base,
      h: 226,
      layers: [
        mini(28, 28, 181, 100),
        detective(231, 28, 181, 100, 'console-detective'),
        { type: 'code', title: 'StudyTracker.slnx', x: 434, y: 28, w: 181, h: 124, size: 9.4, lines: STUDY },
        sky(637, 28, 181, 100, 'sky-adventure'),
        cap(28, 172, 152, 'MINI-ATS', 'multi-tenant ATS'),
        cap(231, 172, 152, 'CONSOLE DETECTIVE', 'AI-generated cases'),
        cap(434, 172, 152, 'STUDYTRACKER', 'Clean Architecture API'),
        cap(637, 172, 152, 'SKY HIGH ADVENTURES', 'browser game'),
      ],
    };
  }
  if (size === 'medium') {
    return {
      ...base,
      w: 580,
      h: 468,
      layers: [
        mini(28, 28, 254, 140),
        detective(298, 28, 254, 140, 'console-detective'),
        { type: 'code', title: 'StudyTracker.slnx', x: 28, y: 254, w: 254, h: 164, size: 11.5, lines: STUDY },
        sky(298, 254, 254, 140, 'sky-adventure'),
        cap(28, 212, 192, 'MINI-ATS', 'multi-tenant ATS'),
        cap(298, 212, 192, 'CONSOLE DETECTIVE', 'AI-generated cases'),
        cap(28, 438, 418, 'STUDYTRACKER', 'Clean Architecture API'),
        cap(298, 438, 418, 'SKY HIGH ADVENTURES', 'browser game'),
      ],
    };
  }
  return {
    ...base,
    w: 330,
    h: 384,
    layers: [
      mini(20, 22, 139, 78),
      detective(171, 22, 139, 78, 'detective'),
      { type: 'code', title: 'tracker', x: 20, y: 200, w: 139, h: 102, size: 8.8, lines: ['<b>Domain</b>', '<b>Application</b>', '<b>Infrastructure</b>', '<b>API</b>'] },
      sky(171, 200, 139, 78, 'sky'),
      cap(20, 146, 124, 'MINI-ATS', 'multi-tenant ATS'),
      cap(171, 146, 124, 'DETECTIVE', 'AI-generated cases'),
      cap(20, 326, 302, 'STUDYTRACKER', 'Clean Architecture'),
      cap(171, 326, 302, 'SKY HIGH', 'browser game'),
    ],
  };
}

export const SHOWCASES = {
  // ---------- Jobbliggaren ----------
  jobbliggaren: {
    h: 428,
    bg: GREEN,
    accent: GOLD,
    label: LABEL.jobbliggaren,
    layers: [
      { type: 'browser', src: `${S}/jobbliggaren/01-oversikt-kort-viewport.png`, url: 'jobbliggaren.se/oversikt', x: 36, y: 58, w: 612, h: 256, zoom: 1.09, pan: 28 },
      // Zoomed in a step, so the grade and the matched skills can be read.
      { type: 'phone', src: AD_PHONE, x: 676, y: 50, w: 146, h: 300, zoom: 1.25, pan: 8, scroll: 74 },
      cap(48, 372, 338, 'OVERVIEW', 'what needs action today'),
      cap(456, 372, 338, 'PIPELINE', 'every application by status'),
      cap(676, 372, 350, 'MATCHING', 'a grade with reasons'),
    ],
  },
  'jobbliggaren-medium': {
    w: 580,
    h: 372,
    bg: GREEN,
    accent: GOLD,
    label: LABEL.jobbliggaren,
    layers: [
      { type: 'card', src: ACTIONS, x: 28, y: 52, w: 524, h: 248, radius: 8 },
      cap(28, 320, 300, 'OVERVIEW', 'what needs action today'),
    ],
  },
  'jobbliggaren-narrow': {
    w: 330,
    h: 480,
    bg: GREEN,
    accent: GOLD,
    label: LABEL.jobbliggarenShort,
    layers: [
      // Scrolled past the page banner so the action list is what the phone shows.
      { type: 'phone', src: `${S}/jobbliggaren/m-01-oversikt.png`, x: 20, y: 50, w: 290, h: 360, scroll: 214 },
      cap(20, 430, 410, 'OVERVIEW', 'what needs action today'),
    ],
  },

  // The CV review at a size where its text can be read.
  'jobbliggaren-detail': {
    h: 386,
    bg: GREEN,
    accent: GOLD,
    quality: 90,
    label: LABEL.cv,
    layers: [
      { type: 'card', src: CV, x: 28, y: 52, w: 790, h: 266, radius: 8 },
      cap(28, 336, 318, 'VERDICT WITH EVIDENCE', 'each row quotes the CV text it rests on'),
    ],
  },
  // Two criteria, cropped to status, criterion and evidence.
  'jobbliggaren-detail-medium': {
    w: 580,
    h: 296,
    bg: GREEN,
    accent: GOLD,
    quality: 90,
    label: LABEL.cv,
    layers: [
      { type: 'card', src: CV, x: 28, y: 52, w: 524, h: 172, radius: 8, zoom: 1.27 },
      cap(28, 244, 224, 'VERDICT WITH EVIDENCE', 'each row quotes the CV text'),
    ],
  },
  // One criterion on a phone: its verdict, then the quoted text, as two crops of the same row.
  'jobbliggaren-detail-narrow': {
    w: 330,
    h: 268,
    bg: GREEN,
    accent: GOLD,
    quality: 90,
    label: LABEL.cv,
    layers: [
      { type: 'card', src: CV, x: 20, y: 50, w: 290, h: 46, radius: 8, zoom: 2.72, pan: 6, scroll: 67 },
      { type: 'card', src: CV, x: 20, y: 106, w: 290, h: 90, radius: 8, zoom: 2.72, pan: 316, scroll: 65 },
      cap(20, 216, 196, 'VERDICT WITH EVIDENCE', 'the row quotes the CV text'),
    ],
  },

  // ---------- Yobber: the public site only ----------
  yobber: {
    h: 360,
    bg: BLUE,
    accent: AMBER,
    label: LABEL.yobber,
    layers: [
      { type: 'browser', src: `${S}/yobber/nya-top.png`, url: 'nya.yobber.se', x: 44, y: 58, w: 520, h: 206 },
      { type: 'phone', src: `${S}/yobber/nya-mobile-full.png`, x: 646, y: 48, w: 140, h: 240, scroll: 186 },
      cap(44, 308, 288, 'START PAGE', 'where job seekers begin'),
      cap(646, 308, 288, 'HOW IT WORKS', 'on a phone'),
    ],
  },
  'yobber-medium': {
    w: 580,
    h: 350,
    bg: BLUE,
    accent: AMBER,
    label: LABEL.yobber,
    layers: [
      { type: 'browser', src: `${S}/yobber/nya-top.png`, url: 'nya.yobber.se', x: 28, y: 52, w: 524, h: 202 },
      cap(28, 298, 278, 'START PAGE', 'where job seekers begin'),
    ],
  },
  'yobber-narrow': {
    w: 330,
    h: 440,
    bg: BLUE,
    accent: AMBER,
    label: LABEL.yobber,
    layers: [
      { type: 'phone', src: `${S}/yobber/nya-mobile.png`, x: 45, y: 50, w: 240, h: 320 },
      cap(45, 390, 370, 'START PAGE', 'where job seekers begin'),
    ],
  },

  // ---------- KalasKoll ----------
  kalaskoll: {
    h: 424,
    bg: VIOLET,
    accent: AMBER,
    label: LABEL.kalaskoll,
    layers: [
      { type: 'browser', src: `${S}/kalaskoll/landing.png`, url: 'kalaskoll.se', x: 40, y: 58, w: 440, h: 238 },
      { type: 'card', src: `${S}/kalaskoll/card.png`, x: 506, y: 60, w: 166, h: 256, radius: 10 },
      // Zoomed onto the invitation header and the yes/no choice.
      { type: 'phone', src: `${S}/kalaskoll/rsvp.png`, x: 698, y: 58, w: 132, h: 236, zoom: 1.24, pan: 14, scroll: 6 },
      cap(40, 368, 320, 'LANDING', 'kalaskoll.se'),
      cap(506, 368, 316, 'INVITATION', 'template or image model'),
      cap(698, 368, 294, 'RSVP', 'on a phone'),
    ],
  },
  'kalaskoll-medium': {
    w: 580,
    h: 412,
    bg: VIOLET,
    accent: AMBER,
    label: LABEL.kalaskoll,
    layers: [
      { type: 'card', src: `${S}/kalaskoll/card.png`, x: 28, y: 52, w: 188, h: 290, radius: 10 },
      { type: 'browser', src: `${S}/kalaskoll/landing.png`, url: 'kalaskoll.se', x: 236, y: 52, w: 316, h: 171 },
      cap(28, 360, 342, 'INVITATION', 'guests answer by QR code'),
      cap(236, 268, 247, 'LANDING', 'kalaskoll.se'),
    ],
  },
  'kalaskoll-narrow': {
    w: 330,
    h: 432,
    bg: VIOLET,
    accent: AMBER,
    label: LABEL.kalaskoll,
    layers: [
      { type: 'card', src: `${S}/kalaskoll/card.png`, x: 65, y: 50, w: 200, h: 308, radius: 10 },
      cap(65, 380, 358, 'INVITATION', 'guests answer by QR code'),
    ],
  },

  // ---------- The four smaller projects, following the page theme ----------
  'also-dark': also('wide', false),
  'also-light': also('wide', true),
  'also-medium-dark': also('medium', false),
  'also-medium-light': also('medium', true),
  'also-narrow-dark': also('narrow', false),
  'also-narrow-light': also('narrow', true),
};
