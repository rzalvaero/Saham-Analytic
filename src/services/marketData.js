// src/services/marketData.js

export const calculateSMA = (data, period = 14) => {
  const sma = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    sma.push({
      time: data[i].time,
      value: parseFloat((sum / period).toFixed(2))
    });
  }
  return sma;
};

export const calculateRSI = (data, period = 14) => {
  const rsi = [];
  if (data.length <= period) return rsi;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const difference = data[i].close - data[i - 1].close;
    if (difference >= 0) gains += difference;
    else losses -= difference;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period; i < data.length; i++) {
    const difference = data[i].close - data[i - 1].close;
    
    let currentGain = 0;
    let currentLoss = 0;
    
    if (difference >= 0) currentGain = difference;
    else currentLoss = -difference;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    let currentRSI = avgLoss === 0 ? 100 : 100 - (100 / (1 + rs));

    rsi.push({
      time: data[i].time,
      value: parseFloat(currentRSI.toFixed(2))
    });
  }
  return rsi;
};

export const analyzeStock = (stockData) => {
  if (stockData.length < 14) return { recommendation: 'HOLD', reason: 'Data tidak cukup' };

  const rsiData = calculateRSI(stockData, 14);
  const smaData = calculateSMA(stockData, 14);
  
  if (rsiData.length === 0 || smaData.length === 0) {
    return { recommendation: 'HOLD', reason: 'Analisis gagal' };
  }

  const currentPrice = stockData[stockData.length - 1].close;
  const rsi = rsiData[rsiData.length - 1].value;
  const sma = smaData[smaData.length - 1].value;

  let analysis = { recommendation: 'HOLD', reason: 'Netral' };

  if (currentPrice > sma && rsi < 70) {
    analysis.recommendation = 'BUY';
    analysis.reason = 'Tren harga di atas MA14 dan RSI belum overbought.';
  } else if (currentPrice < sma && rsi > 30) {
    analysis.recommendation = 'SELL';
    analysis.reason = 'Tren harga di bawah MA14 dan RSI belum oversold.';
  } else if (rsi >= 70) {
    analysis.recommendation = 'SELL';
    analysis.reason = 'RSI Overbought (>70), rawan aksi ambil untung.';
  } else if (rsi <= 30) {
    analysis.recommendation = 'BUY';
    analysis.reason = 'RSI Oversold (<30), potensi teknikal rebound.';
  } else {
    analysis = { recommendation: 'HOLD', reason: `Bearish/Neutral (RSI: ${rsi})` };
  }
  
  return analysis;
};

export const mockStocks = [
  { symbol: 'BBCA', name: 'Bank Central Asia Tbk.' },
  { symbol: 'BBRI', name: 'Bank Rakyat Indonesia Tbk.' },
  { symbol: 'GOTO', name: 'GoTo Gojek Tokopedia Tbk.' },
  { symbol: 'TLKM', name: 'Telkom Indonesia Tbk.' },
  { symbol: 'BMRI', name: 'Bank Mandiri Tbk.' },
];

export const fetchRealtimeData = async (symbol) => {
  try {
    const querySymbol = symbol.startsWith('^') ? symbol : `${symbol}.JK`;
    const response = await fetch(`/api/finance/v8/finance/chart/${querySymbol}?interval=1d&range=3mo`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    
    const data = await response.json();
    const result = data.chart.result[0];
    
    if (!result || !result.indicators || !result.indicators.quote[0]) return null;
    
    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0];
    
    const historicalData = [];
    
    for (let i = 0; i < timestamps.length; i++) {
      // Yahoo finance sometimes returns nulls or undefined for some days
      if (quotes?.open?.[i] != null && quotes?.close?.[i] != null) {
        // Convert timestamp to YYYY-MM-DD
        const dateObj = new Date(timestamps[i] * 1000);
        // Ensure local string format matches YYYY-MM-DD for the chart
        const timeStr = dateObj.toISOString().split('T')[0];
        
        historicalData.push({
          time: timeStr,
          open: parseFloat(quotes.open[i].toFixed(2)),
          high: parseFloat(quotes.high[i].toFixed(2)),
          low: parseFloat(quotes.low[i].toFixed(2)),
          close: parseFloat(quotes.close[i].toFixed(2)),
          volume: quotes.volume?.[i] || 0,
        });
      }
    }

    // Calculate volume stats
    const currentVolume = historicalData.length > 0 ? historicalData[historicalData.length - 1].volume : 0;
    let totalVol = 0;
    const volDays = Math.min(5, historicalData.length - 1);
    for (let i = historicalData.length - 1 - volDays; i < historicalData.length - 1 && i >= 0; i++) {
      totalVol += historicalData[i].volume;
    }
    const avgVolume = volDays > 0 ? totalVol / volDays : currentVolume;

    const analysis = analyzeStock(historicalData);
    const stockInfo = mockStocks.find(s => s.symbol === symbol);
    
    const currentPrice = historicalData[historicalData.length - 1].close;
    const previousPrice = historicalData.length > 1 ? historicalData[historicalData.length - 2].close : currentPrice;
    
    // Calculate SMA to pass to chart
    const smaData = calculateSMA(historicalData, 14);

    return {
      symbol,
      name: stockInfo ? stockInfo.name : symbol,
      historicalData,
      smaData,
      analysis,
      currentPrice: currentPrice,
      priceChange: parseFloat((currentPrice - previousPrice).toFixed(2)),
      volume: currentVolume,
      avgVolume: avgVolume
    };
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    return null;
  }
};
