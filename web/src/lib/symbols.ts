/**
 * Catálogo de símbolos para el combobox de "Crear estrategia".
 * Crypto: pares USDT de Binance (datos reales vía API pública).
 * Stocks/ETFs: tickers de Yahoo Finance (datos reales vía yfinance).
 *
 * La lista es un atajo curado; el usuario también puede escribir un ticker
 * libre (el worker valida contra la fuente real en el backtest).
 */

export type AssetType = "crypto" | "stock" | "etf";

export type SymbolEntry = {
  symbol: string;
  name: string;
  asset_type: AssetType;
};

export const CRYPTO_SYMBOLS: SymbolEntry[] = [
  { symbol: "BTCUSDT", name: "Bitcoin", asset_type: "crypto" },
  { symbol: "ETHUSDT", name: "Ethereum", asset_type: "crypto" },
  { symbol: "SOLUSDT", name: "Solana", asset_type: "crypto" },
  { symbol: "BNBUSDT", name: "BNB", asset_type: "crypto" },
  { symbol: "XRPUSDT", name: "XRP", asset_type: "crypto" },
  { symbol: "ADAUSDT", name: "Cardano", asset_type: "crypto" },
  { symbol: "DOGEUSDT", name: "Dogecoin", asset_type: "crypto" },
  { symbol: "AVAXUSDT", name: "Avalanche", asset_type: "crypto" },
  { symbol: "LINKUSDT", name: "Chainlink", asset_type: "crypto" },
  { symbol: "DOTUSDT", name: "Polkadot", asset_type: "crypto" },
  { symbol: "MATICUSDT", name: "Polygon", asset_type: "crypto" },
  { symbol: "LTCUSDT", name: "Litecoin", asset_type: "crypto" },
  { symbol: "TRXUSDT", name: "TRON", asset_type: "crypto" },
  { symbol: "ATOMUSDT", name: "Cosmos", asset_type: "crypto" },
  { symbol: "NEARUSDT", name: "NEAR Protocol", asset_type: "crypto" },
  { symbol: "APTUSDT", name: "Aptos", asset_type: "crypto" },
  { symbol: "ARBUSDT", name: "Arbitrum", asset_type: "crypto" },
  { symbol: "OPUSDT", name: "Optimism", asset_type: "crypto" },
  { symbol: "INJUSDT", name: "Injective", asset_type: "crypto" },
  { symbol: "SUIUSDT", name: "Sui", asset_type: "crypto" },
  { symbol: "SEIUSDT", name: "Sei", asset_type: "crypto" },
  { symbol: "TIAUSDT", name: "Celestia", asset_type: "crypto" },
  { symbol: "RNDRUSDT", name: "Render", asset_type: "crypto" },
  { symbol: "FILUSDT", name: "Filecoin", asset_type: "crypto" },
  { symbol: "ETCUSDT", name: "Ethereum Classic", asset_type: "crypto" },
  { symbol: "UNIUSDT", name: "Uniswap", asset_type: "crypto" },
  { symbol: "AAVEUSDT", name: "Aave", asset_type: "crypto" },
  { symbol: "MKRUSDT", name: "Maker", asset_type: "crypto" },
  { symbol: "PEPEUSDT", name: "Pepe", asset_type: "crypto" },
  { symbol: "SHIBUSDT", name: "Shiba Inu", asset_type: "crypto" },
];

export const STOCK_SYMBOLS: SymbolEntry[] = [
  { symbol: "AAPL", name: "Apple Inc.", asset_type: "stock" },
  { symbol: "MSFT", name: "Microsoft Corp.", asset_type: "stock" },
  { symbol: "NVDA", name: "NVIDIA Corp.", asset_type: "stock" },
  { symbol: "TSLA", name: "Tesla Inc.", asset_type: "stock" },
  { symbol: "AMZN", name: "Amazon.com Inc.", asset_type: "stock" },
  { symbol: "GOOGL", name: "Alphabet Inc. (Clase A)", asset_type: "stock" },
  { symbol: "META", name: "Meta Platforms Inc.", asset_type: "stock" },
  { symbol: "AMD", name: "Advanced Micro Devices", asset_type: "stock" },
  { symbol: "NFLX", name: "Netflix Inc.", asset_type: "stock" },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", asset_type: "stock" },
  { symbol: "V", name: "Visa Inc.", asset_type: "stock" },
  { symbol: "KO", name: "The Coca-Cola Company", asset_type: "stock" },
  { symbol: "DIS", name: "The Walt Disney Company", asset_type: "stock" },
  { symbol: "INTC", name: "Intel Corp.", asset_type: "stock" },
  { symbol: "BA", name: "The Boeing Company", asset_type: "stock" },
  { symbol: "XOM", name: "Exxon Mobil Corp.", asset_type: "stock" },
  { symbol: "WMT", name: "Walmart Inc.", asset_type: "stock" },
  { symbol: "PYPL", name: "PayPal Holdings", asset_type: "stock" },
  { symbol: "UBER", name: "Uber Technologies", asset_type: "stock" },
  { symbol: "COIN", name: "Coinbase Global", asset_type: "stock" },
  { symbol: "MSTR", name: "MicroStrategy", asset_type: "stock" },
  { symbol: "PLTR", name: "Palantir Technologies", asset_type: "stock" },
  { symbol: "SHOP", name: "Shopify Inc.", asset_type: "stock" },
  { symbol: "SNOW", name: "Snowflake Inc.", asset_type: "stock" },
];

export const ETF_SYMBOLS: SymbolEntry[] = [
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", asset_type: "etf" },
  { symbol: "QQQ", name: "Invesco QQQ Trust (Nasdaq 100)", asset_type: "etf" },
  { symbol: "VTI", name: "Vanguard Total Stock Market", asset_type: "etf" },
  { symbol: "VOO", name: "Vanguard S&P 500 ETF", asset_type: "etf" },
  { symbol: "IWM", name: "iShares Russell 2000 ETF", asset_type: "etf" },
  { symbol: "DIA", name: "SPDR Dow Jones Industrial Average", asset_type: "etf" },
  { symbol: "ARKK", name: "ARK Innovation ETF", asset_type: "etf" },
  { symbol: "XLK", name: "Technology Select Sector SPDR", asset_type: "etf" },
  { symbol: "XLF", name: "Financial Select Sector SPDR", asset_type: "etf" },
  { symbol: "XLE", name: "Energy Select Sector SPDR", asset_type: "etf" },
  { symbol: "GLD", name: "SPDR Gold Shares", asset_type: "etf" },
  { symbol: "SLV", name: "iShares Silver Trust", asset_type: "etf" },
  { symbol: "EEM", name: "iShares MSCI Emerging Markets", asset_type: "etf" },
  { symbol: "TLT", name: "iShares 20+ Year Treasury Bond", asset_type: "etf" },
  { symbol: "IBIT", name: "iShares Bitcoin Trust ETF", asset_type: "etf" },
];

export const ALL_SYMBOLS: SymbolEntry[] = [
  ...CRYPTO_SYMBOLS,
  ...STOCK_SYMBOLS,
  ...ETF_SYMBOLS,
];

/** Timeframes disponibles por tipo de activo (según la fuente real de datos). */
export const TIMEFRAMES_BY_ASSET: Record<AssetType, { value: string; label: string }[]> = {
  crypto: [
    { value: "1m", label: "1 minuto" },
    { value: "5m", label: "5 minutos" },
    { value: "15m", label: "15 minutos" },
    { value: "30m", label: "30 minutos" },
    { value: "1h", label: "1 hora" },
    { value: "2h", label: "2 horas" },
    { value: "4h", label: "4 horas" },
    { value: "6h", label: "6 horas" },
    { value: "12h", label: "12 horas" },
    { value: "1d", label: "1 día" },
    { value: "3d", label: "3 días" },
    { value: "1w", label: "1 semana" },
    { value: "1M", label: "1 mes" },
  ],
  stock: [
    { value: "1d", label: "1 día" },
    { value: "1wk", label: "1 semana" },
    { value: "1mo", label: "1 mes" },
  ],
  etf: [
    { value: "1d", label: "1 día" },
    { value: "1wk", label: "1 semana" },
    { value: "1mo", label: "1 mes" },
  ],
};
