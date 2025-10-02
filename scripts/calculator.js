import { attachAutoSelectHandlers } from './input-select-on-focus.js';

const currencyFormatter = new Intl.NumberFormat('el-GR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentageFormatter = new Intl.NumberFormat('el-GR', {
  style: 'percent',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const FORM_STREAMS = [
  { key: 'dividends', label: 'Μερίσματα', amountField: 'dividendsAmount', rateField: 'dividendsRate' },
  { key: 'interest', label: 'Τόκοι', amountField: 'interestAmount', rateField: 'interestRate' },
  { key: 'capitalGains', label: 'Κεφαλαιακά κέρδη', amountField: 'capitalGainsAmount', rateField: 'capitalGainsRate' },
  { key: 'royalties', label: 'Δικαιώματα', amountField: 'royaltiesAmount', rateField: 'royaltiesRate' },
];

const form = document.querySelector('#investment-form');
const resultsSection = document.querySelector('.results');
const grossEl = resultsSection?.querySelector('[data-role="gross"]');
const taxEl = resultsSection?.querySelector('[data-role="tax"]');
const netEl = resultsSection?.querySelector('[data-role="net"]');
const breakdownContainer = resultsSection?.querySelector('[data-role="breakdown"]');
const chartContainer = document.querySelector('#sankey-chart');
const chartPlaceholder = resultsSection?.querySelector('[data-role="chart-placeholder"]');

let currentBreakdown = [];
let sankeyChart;
let googleChartsReady = null;
let lastDrawnWidth = 0;

function ensureGoogleChartsLoaded() {
  if (!googleChartsReady) {
    googleChartsReady = new Promise((resolve) => {
      const loadCharts = () => {
        google.charts.load('current', { packages: ['sankey'] });
        google.charts.setOnLoadCallback(() => resolve());
      };

      if (window.google?.charts) {
        loadCharts();
        return;
      }

      const loaderScript = document.querySelector('script[src*="loader.js"]');
      if (!loaderScript) {
        resolve();
        return;
      }

      loaderScript.addEventListener('load', loadCharts, { once: true });
    });
  }

  return googleChartsReady;
}

function clampToNonNegative(value) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function normalisePercentage(value) {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return value;
}

function readStreams() {
  if (!form) {
    return [];
  }

  return FORM_STREAMS.map((stream) => {
    const amount = clampToNonNegative(Number.parseFloat(form.elements[stream.amountField]?.value));
    const rate = normalisePercentage(Number.parseFloat(form.elements[stream.rateField]?.value));
    const tax = amount * (rate / 100);
    const net = amount - tax;

    return {
      key: stream.key,
      label: stream.label,
      amount,
      rate,
      tax,
      net,
    };
  });
}

function formatPercent(value) {
  return percentageFormatter.format(value / 100);
}

function updateSummaryCards(streams) {
  if (!grossEl || !taxEl || !netEl) {
    return;
  }

  const gross = streams.reduce((total, stream) => total + stream.amount, 0);
  const totalTax = streams.reduce((total, stream) => total + stream.tax, 0);
  const net = gross - totalTax;

  grossEl.textContent = currencyFormatter.format(gross);
  taxEl.textContent = currencyFormatter.format(totalTax);
  netEl.textContent = currencyFormatter.format(net);
}

function createBreakdownRow(stream) {
  const row = document.createElement('article');
  row.className = 'breakdown-row';

  row.innerHTML = `
    <header class="breakdown-row__header">
      <h4>${stream.label}</h4>
      <span class="badge">${formatPercent(stream.rate)}</span>
    </header>
    <dl class="breakdown-row__metrics">
      <div>
        <dt>Ποσό</dt>
        <dd>${currencyFormatter.format(stream.amount)}</dd>
      </div>
      <div>
        <dt>Φόρος</dt>
        <dd class="is-negative">-${currencyFormatter.format(stream.tax)}</dd>
      </div>
      <div>
        <dt>Καθαρό</dt>
        <dd class="is-positive">${currencyFormatter.format(stream.net)}</dd>
      </div>
    </dl>
  `;

  return row;
}

function renderBreakdown(streams) {
  if (!breakdownContainer) {
    return;
  }

  breakdownContainer.replaceChildren();

  const activeStreams = streams.filter((stream) => stream.amount > 0);

  if (!activeStreams.length) {
    const emptyState = document.createElement('p');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'Προσθέστε ποσά για να εμφανιστεί λεπτομερής ανάλυση κάθε κατηγορίας.';
    breakdownContainer.appendChild(emptyState);
    return;
  }

  activeStreams.forEach((stream) => breakdownContainer.appendChild(createBreakdownRow(stream)));
}

function buildSankeyData(streams) {
  return streams
    .filter((stream) => stream.amount > 0)
    .flatMap((stream) => {
      const rows = [];

      if (stream.tax > 0) {
        rows.push([stream.label, 'Φόρος', stream.tax]);
      }

      const netAmount = stream.net > 0 ? stream.net : 0;
      if (netAmount > 0) {
        rows.push([stream.label, 'Καθαρό', netAmount]);
      }

      return rows;
    });
}

function drawSankey(force = false) {
  if (!chartContainer) {
    return;
  }

  if (!currentBreakdown.length) {
    chartPlaceholder?.classList.remove('is-hidden');
    chartContainer.replaceChildren();
    return;
  }

  ensureGoogleChartsLoaded().then(() => {
    if (!window.google || !google.visualization) {
      return;
    }

    if (!sankeyChart) {
      sankeyChart = new google.visualization.Sankey(chartContainer);
    }

    const dataTable = new google.visualization.DataTable();
    dataTable.addColumn('string', 'Προέλευση');
    dataTable.addColumn('string', 'Προορισμός');
    dataTable.addColumn('number', 'Ποσό');
    dataTable.addRows(buildSankeyData(currentBreakdown));

    const width = Math.round(chartContainer.getBoundingClientRect().width);
    if (width === 0) {
      if (force) {
        setTimeout(() => drawSankey(true), 120);
      } else {
        requestAnimationFrame(() => drawSankey(true));
      }
      return;
    }

    lastDrawnWidth = width;

    chartPlaceholder?.classList.add('is-hidden');
    const options = {
      width,
      height: 320,
      backgroundColor: 'transparent',
      sankey: {
        node: {
          label: {
            color: '#e5edff',
            fontSize: 14,
            bold: true,
          },
          colors: ['#609bff', '#ff6b81', '#2bd4a8'],
        },
        link: {
          colorMode: 'gradient',
          colors: ['#4f76ff', '#ff5d6c', '#1bbb8a'],
          opacity: 0.5,
        },
      },
    };

    sankeyChart.draw(dataTable, options);
  });
}

function handleResize(entries) {
  const entry = entries[0];
  if (!entry) {
    return;
  }

  const width = Math.round(entry.contentRect.width);
  if (width === 0 || width === lastDrawnWidth) {
    return;
  }

  drawSankey(true);
}

function render() {
  const streams = readStreams();
  currentBreakdown = streams.filter((stream) => stream.amount > 0);

  updateSummaryCards(streams);
  renderBreakdown(streams);
  drawSankey();
}

function setup() {
  if (!form || !resultsSection) {
    return;
  }

  attachAutoSelectHandlers(form);

  if (typeof ResizeObserver !== 'undefined' && chartContainer) {
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainer);
  } else {
    window.addEventListener('resize', () => drawSankey(true));
  }

  form.addEventListener('input', render);
  form.addEventListener('submit', (event) => event.preventDefault());

  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setup);
} else {
  setup();
}
