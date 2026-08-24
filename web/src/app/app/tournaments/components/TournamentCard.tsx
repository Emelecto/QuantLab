"use client";

import Link from "next/link";
import { Card, CardBody, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CountdownTimer } from "./CountdownTimer";

export interface TournamentSummary {
  id: string;
  name: string;
  type: "sharpe" | "returns" | "sortino" | "custom";
  status: "active" | "upcoming" | "finished";
  asset_type: "crypto" | "stock" | "any";
  symbol?: string;
  qp_prize: number;
  deadline: string;
  participants: number;
  max_participants?: number;
  metric_label: string;
  metric_value?: string;
}

const typeLabels: Record<TournamentSummary["type"], string> = {
  sharpe: "Sharpe",
  returns: "Retornos",
  sortino: "Sortino",
  custom: "Custom",
};

const statusTones: Record<TournamentSummary["status"], "long" | "cyan" | "neutral"> = {
  active: "long",
  upcoming: "cyan",
  finished: "neutral",
};

const statusLabels: Record<TournamentSummary["status"], string> = {
  active: "Activo",
  upcoming: "Próximo",
  finished: "Finalizado",
};

export function TournamentCard({ tournament }: { tournament: TournamentSummary }) {
  return (
    <Link
      href={`/app/tournaments/${tournament.id}`}
      className="block ql-perspective"
    >
      <Card className="ql-tilt h-full flex flex-col">
        <CardBody className="flex-1 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[15px] font-semibold text-ink leading-tight">
              {tournament.name}
            </h3>
            <Badge tone={statusTones[tournament.status]}>
              {statusLabels[tournament.status]}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Badge tone="cyan">{typeLabels[tournament.type]}</Badge>
            <Badge tone="neutral">
              {tournament.asset_type === "any"
                ? "Multi-activo"
                : tournament.asset_type === "crypto"
                ? "Crypto"
                : "Stocks"}
            </Badge>
            {tournament.symbol && (
              <Badge tone="neutral" mono>
                {tournament.symbol}
              </Badge>
            )}
          </div>

          <div className="mt-auto pt-2 flex items-end justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted">
                Premio
              </p>
              <p className="metric text-accent ql-glow-text text-lg font-semibold">
                {tournament.qp_prize.toLocaleString()} QP
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wider text-muted">
                Participantes
              </p>
              <p className="metric text-ink text-sm">
                {tournament.participants}
                {tournament.max_participants && (
                  <span className="text-muted">
                    {" "}
                    / {tournament.max_participants}
                  </span>
                )}
              </p>
            </div>
          </div>
        </CardBody>

        <CardFooter className="justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted">
              Métrica
            </p>
            <p className="text-xs text-ink">{tournament.metric_label}</p>
          </div>
          <CountdownTimer deadline={tournament.deadline} />
        </CardFooter>
      </Card>
    </Link>
  );
}