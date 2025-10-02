import { attachAutoSelectHandlers } from './input-select-on-focus.js';

function describeScenario({ country, male, female, year }) {
  const maleValue = Number.parseFloat(male);
  const femaleValue = Number.parseFloat(female);

  if (Number.isNaN(maleValue) || Number.isNaN(femaleValue)) {
    return 'Provide both male and female enrollment percentages to see the comparison.';
  }

  const difference = femaleValue - maleValue;
  const leadText = difference === 0
    ? 'Male and female enrollment are identical.'
    : difference > 0
      ? `Female enrollment leads by ${difference.toFixed(1)} percentage points.`
      : `Male enrollment leads by ${(Math.abs(difference)).toFixed(1)} percentage points.`;

  const baseText = `${country || 'The selected country'} in ${year || 'the chosen year'} shows `;
  return `${baseText}${leadText}`;
}

function updateSummary(section, form) {
  const formData = new FormData(form);
  const text = describeScenario({
    country: formData.get('country')?.trim(),
    male: formData.get('male'),
    female: formData.get('female'),
    year: formData.get('year'),
  });

  section.textContent = text;
}

function setupPage() {
  const form = document.querySelector('.controls');
  const summarySection = document.querySelector('.summary');

  if (!form || !summarySection) {
    return;
  }

  attachAutoSelectHandlers(form);
  updateSummary(summarySection, form);

  form.addEventListener('input', () => updateSummary(summarySection, form));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupPage);
} else {
  setupPage();
}
