// src/services/marketData.js

/**
 * Pembulatan sesuai fraksi harga resmi Bursa Efek Indonesia (BEI / IDX)
 */
export const roundToIdxTick = (price) => {
  if (!price || isNaN(price) || price <= 0) return 0;
  let tick = 1;
  if (price < 200) tick = 1;
  else if (price < 500) tick = 2;
  else if (price < 2000) tick = 5;
  else if (price < 5000) tick = 10;
  else tick = 25;
  return Math.round(price / tick) * tick;
};

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

export const calculateATR = (data, period = 14) => {
  if (!data || data.length < 2) return [];
  const tr = [];
  for (let i = 1; i < data.length; i++) {
    const current = data[i];
    const prev = data[i - 1];
    const hl = current.high - current.low;
    const hc = Math.abs(current.high - prev.close);
    const lc = Math.abs(current.low - prev.close);
    tr.push(Math.max(hl, hc, lc));
  }
  if (tr.length < period) return [];
  let sum = 0;
  for (let i = 0; i < period; i++) sum += tr[i];
  const atr = [sum / period];
  for (let i = period; i < tr.length; i++) {
    const currentATR = (atr[atr.length - 1] * (period - 1) + tr[i]) / period;
    atr.push(currentATR);
  }
  return atr;
};

/**
 * Sniper Kuantitatif BEI — Terinspirasi dari konsep DEX Volume/Momentum Hunter
 * Menghitung lonjakan volume akumulasi, deteksi fresh breakout, dan target harga presisi (Beli, TP1, TP2, SL)
 */
export const analyzeStock = (stockData) => {
  if (!stockData || stockData.length < 14) {
    return {
      recommendation: 'HOLD',
      actionType: 'HOLD',
      badge: '⏳ DATA KURANG',
      score: 50,
      reason: 'Riwayat data belum cukup untuk kalkulasi kuantitatif',
      executionNotes: 'Pantau emiten hingga data candle harian mencukupi.',
      buyZone: { min: 0, max: 0, label: '-' },
      targetPrice1: { price: 0, percent: '+0.0%', label: '-' },
      targetPrice2: { price: 0, percent: '+0.0%', label: '-' },
      stopLoss: { price: 0, percent: '-0.0%', label: '-' },
      riskReward: '1 : 2.0',
      volumeSpike: '1.0x'
    };
  }

  const rsiData = calculateRSI(stockData, 14);
  const sma14Data = calculateSMA(stockData, 14);
  const sma20Data = calculateSMA(stockData, Math.min(20, stockData.length - 1));
  const atrData = calculateATR(stockData, 14);

  const currentPrice = stockData[stockData.length - 1].close;
  const previousPrice = stockData.length > 1 ? stockData[stockData.length - 2].close : currentPrice;
  const currentVolume = stockData[stockData.length - 1].volume || 0;

  // 20-day Volume Average
  const volPeriod = Math.min(20, stockData.length - 1);
  let totalVol = 0;
  for (let i = stockData.length - 1 - volPeriod; i < stockData.length - 1 && i >= 0; i++) {
    totalVol += stockData[i].volume || 0;
  }
  const avgVolume20 = volPeriod > 0 ? totalVol / volPeriod : currentVolume;
  const volumeMultiplier = avgVolume20 > 0 ? (currentVolume / avgVolume20) : 1.0;
  const volumeSpikeStr = `${volumeMultiplier.toFixed(1)}x`;

  // 20-day High & Low (Breakout Resistance & Support Channels)
  const lookbackPeriod = Math.min(20, stockData.length - 1);
  const recentCandles = stockData.slice(-1 - lookbackPeriod, -1);
  const high20 = recentCandles.length > 0 ? Math.max(...recentCandles.map((d) => d.high)) : currentPrice;
  const low20 = recentCandles.length > 0 ? Math.min(...recentCandles.map((d) => d.low)) : currentPrice;

  const rsi = rsiData.length > 0 ? rsiData[rsiData.length - 1].value : 50;
  const sma14 = sma14Data.length > 0 ? sma14Data[sma14Data.length - 1].value : currentPrice;
  const sma20 = sma20Data.length > 0 ? sma20Data[sma20Data.length - 1].value : sma14;
  const atr = atrData.length > 0 ? atrData[atrData.length - 1] : currentPrice * 0.03;

  // Baseline Price Targets (Rounded to BEI Ticks)
  let buyMin = roundToIdxTick(currentPrice * 0.985);
  let buyMax = roundToIdxTick(currentPrice * 1.01);
  let stopLossPrice = roundToIdxTick(Math.min(currentPrice * 0.962, currentPrice - atr * 1.2));
  let tp1Price = roundToIdxTick(Math.max(currentPrice * 1.06, currentPrice + atr * 1.8));
  let tp2Price = roundToIdxTick(Math.max(currentPrice * 1.15, currentPrice + atr * 4.2));

  // Ensure logical hierarchy: StopLoss < BuyMin <= currentPrice <= TP1 < TP2
  if (stopLossPrice >= currentPrice) stopLossPrice = roundToIdxTick(currentPrice * 0.96);
  if (tp1Price <= currentPrice) tp1Price = roundToIdxTick(currentPrice * 1.055);
  if (tp2Price <= tp1Price) tp2Price = roundToIdxTick(tp1Price * 1.08);

  const slPct = (((stopLossPrice - currentPrice) / currentPrice) * 100).toFixed(1);
  const tp1Pct = (((tp1Price - currentPrice) / currentPrice) * 100).toFixed(1);
  const tp2Pct = (((tp2Price - currentPrice) / currentPrice) * 100).toFixed(1);

  const risk = Math.max(1, currentPrice - stopLossPrice);
  const reward1 = Math.max(1, tp1Price - currentPrice);
  const rrRatio = (reward1 / risk).toFixed(1);
  const riskRewardStr = `1 : ${rrRatio}`;

  let recommendation = 'HOLD';
  let actionType = 'HOLD';
  let badge = '⏳ KONSOLIDASI';
  let score = 55;
  let reason = 'Konsolidasi wajar dalam rentang normal.';
  let executionNotes = 'Volume stabil, belum ada dorongan akumulasi besar. Tunggu sinyal breakout.';

  // KONSEP DEX SNIPER: Deteksi Fresh Breakout, Accumulation Bounce, atau Warning Overbought
  const isFreshBreakout =
    (currentPrice >= high20 * 0.995 || (currentPrice > sma20 && previousPrice <= sma20)) &&
    volumeMultiplier >= 1.25 &&
    rsi >= 46 &&
    rsi <= 72;

  const isAccumulationBounce =
    (currentPrice >= low20 * 0.99 && currentPrice <= low20 * 1.04 || (currentPrice > sma14 && previousPrice <= sma14)) &&
    rsi >= 32 &&
    rsi < 52 &&
    volumeMultiplier >= 1.1;

  const isTakeProfitZone = rsi >= 72 || currentPrice >= sma20 * 1.14;

  const isMomentumRunner = currentPrice > sma14 && currentPrice > sma20 && rsi >= 50 && rsi < 70;

  if (isTakeProfitZone) {
    recommendation = 'SELL';
    actionType = 'SELL';
    badge = '💰 TAKE PROFIT ZONE';
    score = 35;
    reason = `RSI Overbought (${rsi}) & harga bergerak terlalu jauh di atas MA. Rawan aksi profit taking.`;
    executionNotes = `JANGAN kejar beli di pucuk. Amankan profit bertahap (TP1 di Rp ${tp1Price.toLocaleString('id-ID')}). Naikkan trailing stop ke Rp ${roundToIdxTick(currentPrice * 0.97).toLocaleString('id-ID')}.`;
    buyMin = roundToIdxTick(sma14 * 0.99);
    buyMax = roundToIdxTick(sma14 * 1.01);
  } else if (isFreshBreakout) {
    recommendation = 'BUY';
    actionType = 'BUY';
    badge = '🔥 FRESH BREAKOUT';
    score = Math.min(96, Math.round(75 + volumeMultiplier * 8));
    reason = `Breakout resisten kuat disertai lonjakan volume akumulasi ${volumeSpikeStr} di atas rata-rata.`;
    executionNotes = `Area beli optimal Rp ${buyMin.toLocaleString('id-ID')} - Rp ${buyMax.toLocaleString('id-ID')}. Target TP1 Rp ${tp1Price.toLocaleString('id-ID')} (+${tp1Pct}%), TP2 potensi ARA Rp ${tp2Price.toLocaleString('id-ID')} (+${tp2Pct}%). Cut Loss tegas bila tembus Rp ${stopLossPrice.toLocaleString('id-ID')}.`;
  } else if (isAccumulationBounce) {
    recommendation = 'BUY';
    actionType = 'BUY';
    badge = '🎯 ACCUMULATION BOUNCE';
    score = Math.min(88, Math.round(70 + volumeMultiplier * 6));
    reason = `Pantulan dari area support/akumulasi bawah dengan volume serap aktif (${volumeSpikeStr}).`;
    executionNotes = `Beli bertahap di area Rp ${buyMin.toLocaleString('id-ID')} - Rp ${buyMax.toLocaleString('id-ID')}. Rasio Risk:Reward optimal ${riskRewardStr}. Stop Loss di Rp ${stopLossPrice.toLocaleString('id-ID')} (${slPct}%).`;
  } else if (isMomentumRunner) {
    recommendation = 'BUY';
    actionType = 'BUY';
    badge = '⚡ MOMENTUM RUNNER';
    score = 75;
    reason = `Tren bullish konsisten di atas MA14 & MA20. RSI (${rsi}) sehat dalam fase ekspansi.`;
    executionNotes = `Pertahankan posisi hold runner. Entry susulan hanya dianjurkan saat pullback mendekati area Rp ${buyMin.toLocaleString('id-ID')}. Target TP2 di Rp ${tp2Price.toLocaleString('id-ID')}.`;
  } else if (rsi <= 30) {
    recommendation = 'BUY';
    actionType = 'BUY';
    badge = '🛡️ OVERSOLD REVERSAL';
    score = 72;
    reason = `RSI Oversold (${rsi}). Potensi technical rebound kuat dari titik jenuh jual.`;
    executionNotes = `Spekulasi beli cicil di Rp ${buyMin.toLocaleString('id-ID')}. Jual cepat di TP1 Rp ${tp1Price.toLocaleString('id-ID')}. Disiplin Cut Loss di Rp ${stopLossPrice.toLocaleString('id-ID')}.`;
  } else {
    recommendation = 'HOLD';
    actionType = 'HOLD';
    badge = '⏳ KONSOLIDASI';
    score = 52;
    reason = `Konsolidasi sideways (RSI: ${rsi}). Volume transaksi masih dalam rentang wajar (${volumeSpikeStr}).`;
    executionNotes = `Wait & See. Tunggu konfirmasi lonjakan volume di atas 1.3x atau candle breakout menembus Rp ${high20.toLocaleString('id-ID')}.`;
  }

  return {
    recommendation,
    actionType,
    badge,
    score,
    currentPrice,
    rsi,
    sma14,
    sma20,
    high20,
    low20,
    buyZone: {
      min: buyMin,
      max: buyMax,
      label: `Rp ${buyMin.toLocaleString('id-ID')} - Rp ${buyMax.toLocaleString('id-ID')}`
    },
    targetPrice1: {
      price: tp1Price,
      percent: `+${tp1Pct}%`,
      label: `Rp ${tp1Price.toLocaleString('id-ID')} (+${tp1Pct}%)`
    },
    targetPrice2: {
      price: tp2Price,
      percent: `+${tp2Pct}%`,
      label: `Rp ${tp2Price.toLocaleString('id-ID')} (+${tp2Pct}% ARA)`
    },
    stopLoss: {
      price: stopLossPrice,
      percent: `${slPct}%`,
      label: `Rp ${stopLossPrice.toLocaleString('id-ID')} (${slPct}%)`
    },
    riskReward: riskRewardStr,
    volumeSpike: volumeSpikeStr,
    reason,
    executionNotes
  };
};

export const mockStocks = [
  { symbol: 'PANI', name: 'Pantai Indah Kapuk Dua Tbk.' },
  { symbol: 'BREN', name: 'Barito Renewables Energy Tbk.' },
  { symbol: 'CUAN', name: 'Petrindo Jaya Kreasi Tbk.' },
  { symbol: 'AMMN', name: 'Amman Mineral Internasional Tbk.' },
  { symbol: 'BRPT', name: 'Barito Pacific Tbk.' },
  { symbol: 'TPIA', name: 'Chandra Asri Pacific Tbk.' },
  { symbol: 'ANTM', name: 'Aneka Tambang Tbk.' },
  { symbol: 'MDKA', name: 'Merdeka Copper Gold Tbk.' },
  { symbol: 'ADRO', name: 'Alamtri Resources Indonesia Tbk.' },
  { symbol: 'PTBA', name: 'Bukit Asam Tbk.' },
  { symbol: 'PGEO', name: 'Pertamina Geothermal Energy Tbk.' },
  { symbol: 'MEDC', name: 'Medco Energi Internasional Tbk.' },
  { symbol: 'BBCA', name: 'Bank Central Asia Tbk.' },
  { symbol: 'BBRI', name: 'Bank Rakyat Indonesia Tbk.' },
  { symbol: 'BMRI', name: 'Bank Mandiri Tbk.' },
  { symbol: 'BBNI', name: 'Bank Negara Indonesia Tbk.' },
  { symbol: 'UNTR', name: 'United Tractors Tbk.' },
  { symbol: 'INCO', name: 'Vale Indonesia Tbk.' },
  { symbol: 'KLBF', name: 'Kalbe Farma Tbk.' },
  { symbol: 'ICBP', name: 'Indofood CBP Sukses Makmur Tbk.' },
  { symbol: 'GOTO', name: 'GoTo Gojek Tokopedia Tbk.' },
  { symbol: 'TLKM', name: 'Telkom Indonesia Tbk.' },
  { symbol: 'ASII', name: 'Astra International Tbk.' },
  { symbol: '^JKSE', name: 'IHSG Composite (Bursa Efek Indonesia)' },
  { symbol: 'EURUSD=X', name: 'Euro / US Dollar' },
  { symbol: 'GBPUSD=X', name: 'British Pound / US Dollar' },
  { symbol: 'USDJPY=X', name: 'US Dollar / Japanese Yen' },
  { symbol: 'AUDUSD=X', name: 'Australian Dollar / US Dollar' },
  { symbol: 'GC=F', name: 'Gold (XAU) / US Dollar' },
];

/**
 * Ukuran tick (fraksi harga) resmi BEI.
 * Dipakai untuk membulatkan level harga agar profil arus tidak pecah
 * menjadi puluhan level tipis yang sebenarnya satu harga.
 */
export const idxTickSize = (price) => {
  if (price < 200) return 1;
  if (price < 500) return 2;
  if (price < 2000) return 5;
  if (price < 5000) return 10;
  return 25;
};

/**
 * fetchOrderFlow - Membangun profil arus beli/jual per level harga dari data
 * intraday 1 menit.
 *
 * CATATAN KEJUJURAN DATA (penting, jangan diubah menjadi klaim palsu):
 * Bursa Efek Indonesia tidak menyediakan order book L2 (antrian bid/ask broker)
 * melalui Yahoo Finance. Endpoint quote Yahoo mengembalikan 401 Unauthorized.
 * Jadi ini BUKAN order book asli dan BUKAN data broker asing/masing-masing.
 *
 * Yang benar-benar dihitung: klasifikasi volume tiap bar 1 menit menjadi
 * sisi BELI atau JUAL memakai tick rule (close vs open, fallback ke close
 * sebelumnya), lalu diagregasi per level harga sesuai fraksi tick BEI.
 * Ini pendekatan standar "volume profile + delta" yang dipakai trader untuk
 * membaca agresor mana yang dominan di suatu harga.
 */
export const fetchOrderFlow = async (symbol) => {
  try {
    const querySymbol = symbol.startsWith('^') ? symbol : `${symbol}.JK`;
    const response = await fetch(
      `/api/finance/v8/finance/chart/${querySymbol}?interval=1m&range=1d&_=${Date.now()}`
    );
    if (!response.ok) throw new Error('Gagal mengambil data intraday');

    const data = await response.json();
    const result = data.chart?.result?.[0];
    if (!result?.indicators?.quote?.[0] || !result.timestamp) return null;

    const q = result.indicators.quote[0];
    const meta = result.meta || {};

    // Kumpulkan bar yang benar-benar punya transaksi
    const bars = [];
    for (let i = 0; i < result.timestamp.length; i++) {
      if (q.close?.[i] == null || !q.volume?.[i]) continue;
      bars.push({
        t: result.timestamp[i],
        o: q.open?.[i] ?? q.close[i],
        h: q.high?.[i] ?? q.close[i],
        l: q.low?.[i] ?? q.close[i],
        c: q.close[i],
        v: q.volume[i],
      });
    }
    if (bars.length === 0) return null;

    let buyVol = 0;
    let sellVol = 0;
    const levels = new Map();
    const series = [];

    let cumDelta = 0;

    for (let i = 0; i < bars.length; i++) {
      const b = bars[i];

      // Tick rule: bandingkan close dengan open bar yang sama. Jika harga
      // tidak bergerak, warisi arah dari bar sebelumnya (metode standar).
      let side = 0;
      if (b.c > b.o) side = 1;
      else if (b.c < b.o) side = -1;
      else if (i > 0) {
        const prev = bars[i - 1].c;
        side = b.c > prev ? 1 : b.c < prev ? -1 : 0;
      }

      if (side > 0) buyVol += b.v;
      else if (side < 0) sellVol += b.v;

      cumDelta += side * b.v;
      series.push({
        time: Math.floor(b.t / 60) * 60,
        value: cumDelta,
        price: b.c,
      });

      const tick = idxTickSize(b.c);
      const key = Math.round(b.c / tick) * tick;
      if (!levels.has(key)) levels.set(key, { price: key, buy: 0, sell: 0 });
      const lv = levels.get(key);

      if (side > 0) lv.buy += b.v;
      else if (side < 0) lv.sell += b.v;
      else {
        // Volume tanpa arah dibagi rata agar tidak menciptakan bias palsu
        lv.buy += b.v / 2;
        lv.sell += b.v / 2;
      }
    }

    const levelArr = Array.from(levels.values())
      .map((lv) => ({
        ...lv,
        total: lv.buy + lv.sell,
        delta: lv.buy - lv.sell,
      }))
      .sort((a, b) => b.total - a.total);

    const totalVol = buyVol + sellVol;
    const maxLevel = levelArr.length ? levelArr[0].total : 0;

    // Lima level dengan transaksi terbesar = "dinding" harga hari ini
    const walls = levelArr.slice(0, 8);

    return {
      symbol,
      bars: bars.length,
      buyVol,
      sellVol,
      totalVol,
      delta: buyVol - sellVol,
      buyPct: totalVol > 0 ? (buyVol / totalVol) * 100 : 0,
      sellPct: totalVol > 0 ? (sellVol / totalVol) * 100 : 0,
      levels: levelArr,
      walls,
      maxLevel,
      series,
      lastPrice: meta.regularMarketPrice ?? bars[bars.length - 1].c,
      prevClose: meta.chartPreviousClose ?? null,
      marketTime: meta.regularMarketTime ? meta.regularMarketTime * 1000 : Date.now(),
    };
  } catch (error) {
    console.error(`Error fetching order flow for ${symbol}:`, error);
    return null;
  }
};

export const fetchRealtimeData = async (symbol) => {
  try {
    let querySymbol;
    if (symbol.startsWith('^')) querySymbol = symbol;
    else if (symbol.endsWith('=X') || symbol.endsWith('=F')) querySymbol = symbol;
    else querySymbol = `${symbol}.JK`;
    
    // Cache-busting timestamp memastikan data realtime per menit dan tidak tertahan cache disk/browser
    const cacheBuster = Date.now();
    const response = await fetch(`/api/finance/v8/finance/chart/${querySymbol}?interval=1d&range=3mo&_=${cacheBuster}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    
    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result || !result.indicators || !result.indicators.quote[0]) return null;
    
    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0];
    const meta = result.meta || {};
    
    const historicalData = [];
    
    for (let i = 0; i < timestamps.length; i++) {
      if (quotes?.open?.[i] != null && quotes?.close?.[i] != null) {
        const dateObj = new Date(timestamps[i] * 1000);
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

    if (historicalData.length === 0) return null;

    // Ambil harga pasar realtime aktual dari meta quote (fresh per menit)
    const livePrice = (typeof meta.regularMarketPrice === 'number' && meta.regularMarketPrice > 0)
      ? meta.regularMarketPrice
      : historicalData[historicalData.length - 1].close;

    const previousClose = (typeof meta.chartPreviousClose === 'number' && meta.chartPreviousClose > 0)
      ? meta.chartPreviousClose
      : (historicalData.length > 1 ? historicalData[historicalData.length - 2].close : livePrice);

    // Sinkronkan candle terakhir dengan live market price jika bursa sedang berjalan
    if (historicalData.length > 0) {
      const lastCandle = historicalData[historicalData.length - 1];
      lastCandle.close = parseFloat(livePrice.toFixed(2));
      lastCandle.high = Math.max(lastCandle.high, livePrice);
      lastCandle.low = Math.min(lastCandle.low, livePrice);
      if (meta.regularMarketVolume) {
        lastCandle.volume = meta.regularMarketVolume;
      }
    }

    // Calculate volume stats (20-day moving average volume)
    const currentVolume = meta.regularMarketVolume || historicalData[historicalData.length - 1].volume || 0;
    let totalVol = 0;
    const volDays = Math.min(20, historicalData.length - 1);
    for (let i = historicalData.length - 1 - volDays; i < historicalData.length - 1 && i >= 0; i++) {
      totalVol += historicalData[i].volume || 0;
    }
    const avgVolume = volDays > 0 ? totalVol / volDays : currentVolume;

    const analysis = analyzeStock(historicalData);
    const stockInfo = mockStocks.find(s => s.symbol === symbol);
    
    // Calculate SMA to pass to chart
    const smaData = calculateSMA(historicalData, 14);

    const priceChange = parseFloat((livePrice - previousClose).toFixed(2));

    return {
      symbol,
      name: stockInfo ? stockInfo.name : symbol,
      historicalData,
      smaData,
      analysis,
      currentPrice: parseFloat(livePrice.toFixed(2)),
      priceChange: priceChange,
      changePercent: previousClose > 0 ? parseFloat(((priceChange / previousClose) * 100).toFixed(2)) : 0,
      volume: currentVolume,
      avgVolume: avgVolume,
      marketTime: meta.regularMarketTime ? meta.regularMarketTime * 1000 : Date.now()
    };
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    return null;
  }
};
