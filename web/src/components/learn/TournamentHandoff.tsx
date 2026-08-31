"use client";

import { useMemo, useState } from "react";
import { TOURNAMENT_SERIES, botResults } from "@/lib/learn/tournaments";
import { runStrategy, defaultParams } from "@/lib/learn/runner";
import { getTemplate } from "@/lib/learn/strategies";
import { progress } from "@/lib/learn/progress";
import type { StrategyParams } from "@/lib/learn/types";
import { EquityChart } from "./EquityChart";

const TOURNEY_ID = "debut-weekly";

interface TournamentHandoffProps {
  savedParams: StrategyParams;
  series: number[];
  onEnter: () => void;
}

interface RankingRow {
  name: string;
  equity: number[];
  ret: number;
  isYou: boolean;
}

// M14 debut: shows the saved strategy preloaded (Seam 3 — zero copy-paste) and
// the live ranking against deterministic bots.
export function TournamentHandoff({ savedParams, series, onEnter }: TournamentHandoffProps) {
  const [entered, setEntered] = useState(progress.get().tournamentsEntered.includes(TOURNEY_ID));
  const tpl = getTemplate("ma_cross")!;
  const [params, setParams] = useState<StrategyParams>(savedParams);
  const result = useMemo(() => runStrategy({ templateId: "ma_cross", params }, series), [params, series]);

  const ranking = useMemo<RankingRow[]>(() => {
    const you = runStrategy({ templateId: "ma_cross", params }, TOURNAMENT_SERIES);
    const bots = botResults();
    const rows: RankingRow[] = [
      { name: "Tú", equity: you.equityCurve, ret: you.totalReturn, isYou: true },
      ...bots.map((b) => ({ name: b.name, equity: b.result!.equityCurve, ret: b.result!.totalReturn, isYou: false })),
    ];
    rows.sort((a, b) => b.ret - a.ret);
    return rows;
  }, [params]);

  const youRank = ranking.findIndex((r) => r.isYou) + 1;

  function enter() {
    progress.enterTournament(TOURNEY_ID);
    progress.completeModule(14);
    setEntered(true);
    onEnter();
  }

  return (
    <div className="tournament">
      <header className="tourney-head">
        <h1>🏆 Torneo de Debut — Semana 42</h1>
        <p>Estrategia cargada: <b>{tpl?.name}</b> · {tpl?.params.map((p) => `${p.label.split(" ")[0]}=${params[p.key]}`).join(", ")}</p>
      </header>

      {!entered ? (
        <div className="enter-card">
          <p>Tu estrategia está lista. Al entrar, quedas compitiendo contra la comunidad en este torneo real.</p>
          <button className="btn-primary" onClick={enter}>Entrar al torneo</button>
        </div>
      ) : (
        <div className="entered-banner">✅ Estás compitiendo. Buena suerte, Aprendiz.</div>
      )}

      <div className="tourney-board">
        <h2>Tabla en vivo</h2>
        <table className="board">
          <thead>
            <tr><th>#</th><th>Competidor</th><th>Retorno</th><th>Equity</th></tr>
          </thead>
          <tbody>
            {ranking.map((r, i) => (
              <tr key={r.name} className={r.isYou ? "you" : ""}>
                <td>{i + 1}</td>
                <td>{r.name}{r.isYou ? " (tú)" : ""}</td>
                <td className={r.ret >= 0 ? "good" : "bad"}>{(r.ret * 100).toFixed(1)}%</td>
                <td className="spark-cell">
                  <EquityChart equity={r.equity} height={48} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="rank-note">Tu puesto actual: <b>#{youRank}</b> de {ranking.length}.</p>
      </div>
    </div>
  );
}

// kept for parity with the SPA's default fallback signature
export const DEFAULT_TOURNEY_CONFIG = { templateId: "ma_cross", params: defaultParams("ma_cross") };
