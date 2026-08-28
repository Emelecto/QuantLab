import { useMemo, useState } from 'react';
import { TOURNAMENT_SERIES, botResults } from '../data/tournaments';
import { runStrategy, defaultParams } from '../lib/runner';
import { getTemplate } from '../data/strategies';
import { progress } from '../lib/progress';
import type { StrategyParams } from '../types';
import { EquityChart } from './charts/EquityChart';

const TOURNEY_ID = 'debut-weekly';

interface TournamentProps {
  savedStrategy: { templateId: string; params: StrategyParams } | null;
}

interface RankingRow {
  name: string;
  equity: number[];
  ret: number;
  isYou: boolean;
}

export function Tournament({ savedStrategy }: TournamentProps) {
  const [entered, setEntered] = useState(progress.get().tournamentsEntered.includes(TOURNEY_ID));

  const config = savedStrategy ?? { templateId: 'ma_cross', params: defaultParams('ma_cross') };
  const tpl = getTemplate(config.templateId);

  const ranking = useMemo<RankingRow[]>(() => {
    const you = runStrategy(config, TOURNAMENT_SERIES);
    const bots = botResults();
    const rows: RankingRow[] = [
      { name: 'Tú', equity: you.equityCurve, ret: you.totalReturn, isYou: true },
      ...bots.map((b) => ({ name: b.name, equity: b.result!.equityCurve, ret: b.result!.totalReturn, isYou: false })),
    ];
    rows.sort((a, b) => b.ret - a.ret);
    return rows;
  }, [config]);

  const youRank = ranking.findIndex((r) => r.isYou) + 1;

  function enter() {
    progress.enterTournament(TOURNEY_ID);
    progress.completeModule(5); // debuting in the live tournament completes the Ruta Aprendiz
    setEntered(true);
  }

  return (
    <div className="tournament">
      <header className="tourney-head">
        <h1>🏆 Torneo de Debut — Semana 42</h1>
        <p>Estrategia cargada: <b>{tpl?.name}</b> · {tpl?.params.map((p) => `${p.label.split(' ')[0]}=${config.params[p.key]}`).join(', ')}</p>
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
              <tr key={r.name} className={r.isYou ? 'you' : ''}>
                <td>{i + 1}</td>
                <td>{r.name}{r.isYou ? ' (tú)' : ''}</td>
                <td className={r.ret >= 0 ? 'good' : 'bad'}>{(r.ret * 100).toFixed(1)}%</td>
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
