// Builds every hand-designed SVG in assets/, in a dark and a light variant.
import { tokens, THEMES, write } from './lib/svg.mjs';
import { heroWide, heroMedium, heroNarrow } from './assets/hero.mjs';
import { pill } from './assets/pill.mjs';
import { pipelineWide, pipelineMedium, pipelineNarrow } from './assets/pipeline.mjs';

const PRODUCTS = [
  ['jobbliggaren', 'jobbliggaren.se', 'own product · job search tracker'],
  ['yobber', 'yobber.se', 'internship · recruitment platform'],
  ['kalaskoll', 'kalaskoll.se', 'own product · party invitations'],
];

const report = [];
const emit = (rel, svg) => report.push([rel, write(rel, svg)]);

for (const theme of THEMES) {
  const t = tokens.themes[theme];
  emit(`assets/hero-wide-${theme}.svg`, heroWide(theme, t));
  emit(`assets/hero-medium-${theme}.svg`, heroMedium(theme, t));
  emit(`assets/hero-narrow-${theme}.svg`, heroNarrow(theme, t));
  emit(`assets/pipeline-wide-${theme}.svg`, pipelineWide(theme, t));
  emit(`assets/pipeline-medium-${theme}.svg`, pipelineMedium(theme, t));
  emit(`assets/pipeline-narrow-${theme}.svg`, pipelineNarrow(theme, t));
  PRODUCTS.forEach(([key, domain, note]) => {
    emit(`assets/pill-${key}-${theme}.svg`, pill({ t, color: tokens.brands[key][theme], domain, note }));
  });
}

for (const [rel, bytes] of report) console.log(`${(bytes / 1024).toFixed(1).padStart(6)} KB  ${rel}`);
