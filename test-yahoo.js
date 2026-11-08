const fetch = require('node-fetch');
(async () => {
  const url = 'https://query1.finance.yahoo.com/v8/finance/chart/XAUUSD=X?interval=1d&range=3mo';
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(JSON.stringify(data.chart.result[0].indicators.quote[0], null, 2).substring(0, 300));
  } catch(e) {
    console.error(e);
  }
})();
