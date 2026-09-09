/**
 * Academia visuals — librería visual interactiva de C1 y C2.
 * charts: envoltorios lightweight-charts + Reveal + CountUp.
 * lesson-data: datasets inline transcritos de los CSV de fundamentos y python.
 * c1-l1…c1-l4: un componente visual por lección.
 * c2-l1…c2-l9: visuales del curso Python (default export).
 */
export { AcademiaAreaChart, CountUp, Reveal, type TiempoValor } from "./charts";
export {
  MONEDA_PNL, MONEDA_PAGO, MONEDA_PERDIDA,
  PRECIOS, BTC_RETORNOS, SOL_EQUITY, SOL_RETORNOS, SOL_FECHA_INICIAL,
  CORREL, SMA20, type SmaFila, BTC_CIERRES, BTC_FECHA_INICIAL, sumarDias,
  C2_ENTORNO_OHLCV, type VelaC2, C2_GAPS_HORARIO, type PuntoHorario,
  C2_LOOKUP_CIERRES, C2_EQUITY, C2_KLINES, C2_BACKTEST_PRECIOS,
  C2_VENTANAS_WF, type VentanaWF, C2_GRID, type CeldaGrid, C2_PIPELINE_ETH,
} from "./lesson-data";
export {
 C5_L1_CIERRES, C5_L2_CIERRES, C5_L3_CIERRES, C5_L3_WF,
 C5_L4_CIERRES, C5_L4_MODELOS, C5_L5_CIERRES, C5_L5_HITRATE,
 C5_L6_CIERRES, C5_L6_PESOS, C5_L7_CIERRES, C5_L8_CIERRES,
 C5_L9_CIERRES, C5_L9_MONITOREO,
 } from "./lesson-data";
export { C1L1SimuladorEsperanza } from "./c1-l1";
export { C1L2PrecioRetornos } from "./c1-l2";
export { C1L3Histograma } from "./c1-l3";
export { C1L4EquityUnderwater } from "./c1-l4";
export { default as C2L1Entorno } from "./c2-l1";
export { default as C2L2Gaps } from "./c2-l2";
export { default as C2L3Vector } from "./c2-l3";
export { default as C2L4Equity } from "./c2-l4";
export { default as C2L5Klines } from "./c2-l5";
export { default as C2L6BrutoNeto } from "./c2-l6";
export { default as C2L7WalkForward } from "./c2-l7";
export { default as C2L8Grid } from "./c2-l8";
export { default as C2L9Pipeline } from "./c2-l9";
export { default as C5L1Features } from "./c5-l1";
export { default as C5L2Fuga } from "./c5-l2";
export { default as C5L3WalkForward } from "./c5-l3";
export { default as C5L4RidgeGbm } from "./c5-l4";
export { default as C5L5MlpSecuencial } from "./c5-l5";
export { default as C5L6Stacking } from "./c5-l6";
export { default as C5L7Costos } from "./c5-l7";
export { default as C5L8Pipeline } from "./c5-l8";
export { default as C5L9Semaforo } from "./c5-l9";
