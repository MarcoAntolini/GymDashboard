"use client";

import { Button } from "@/components/ui/button";
import { DotBadge, MoneyTone, NumericCell } from "@/components/ui/domain-badge";
import { Separator } from "@/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableEmptyState } from "@/components/ui/data-table/table-empty-state";
import { TableErrorState } from "@/components/ui/data-table/table-error-state";
import { TableLoadingState } from "@/components/ui/data-table/table-loading-state";
import {
	getOverviewStats,
	type OverviewBreakdownRow,
	type OverviewStats,
	type ProductRankingRow,
} from "@/data-access/overview";
import { ProductKind } from "@/lib/domain/product-kind";
import { formatEur } from "@/lib/format";
import {
	isOverviewPeriodPreset,
	OVERVIEW_PERIOD_LABELS,
	type OverviewPeriodPreset,
} from "@/lib/overview-period";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

function kindTone(kind: ProductKind): "info" | "primary" {
	return kind === ProductKind.Membership ? "info" : "primary";
}

function BreakdownTable({
	caption,
	rows,
	tone,
}: {
	caption: string;
	rows: OverviewBreakdownRow[];
	tone: "income" | "expense";
}) {
	return (
		<div className="min-w-0">
			<p className="mb-2 text-sm font-medium text-foreground">{caption}</p>
			<div className="overflow-hidden rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Tipo</TableHead>
							<TableHead className="text-right">N°</TableHead>
							<TableHead className="text-right">Importo</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.map((row) => (
							<TableRow key={row.key}>
								<TableCell>{row.label}</TableCell>
								<TableCell>
									<NumericCell muted>{row.count}</NumericCell>
								</TableCell>
								<TableCell>
									<NumericCell>
										<MoneyTone tone={tone}>{formatEur(row.amount)}</MoneyTone>
									</NumericCell>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}

function ProductRankingTable({ rows }: { rows: ProductRankingRow[] }) {
	return (
		<div className="min-w-0">
			<p className="mb-2 text-sm font-medium text-foreground">
				Mix prodotti (ricavo e quantità)
			</p>
			{rows.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					Nessun Acquisto nel periodo — il ranking prodotti è vuoto.
				</p>
			) : (
				<div className="overflow-hidden rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Prodotto</TableHead>
								<TableHead>Tipo</TableHead>
								<TableHead className="text-right">N°</TableHead>
								<TableHead className="text-right">Ricavo</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map((row) => (
								<TableRow key={row.productCode}>
									<TableCell className="font-medium">{row.productCode}</TableCell>
									<TableCell>
										<DotBadge label={row.kindLabel} tone={kindTone(row.kind)} />
									</TableCell>
									<TableCell>
										<NumericCell muted>{row.count}</NumericCell>
									</TableCell>
									<TableCell>
										<NumericCell>
											<MoneyTone tone="income">{formatEur(row.amount)}</MoneyTone>
										</NumericCell>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
}

function OverviewBody({ stats }: { stats: OverviewStats }) {
	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
			<p className="text-sm text-muted-foreground">{stats.periodCaption}</p>

			<div className="grid grid-cols-2 gap-x-8 gap-y-4 border-b pb-4 sm:grid-cols-4">
				<div>
					<p className="text-xs font-medium text-muted-foreground">Entrate</p>
					<p className="mt-1 text-lg font-medium">
						<MoneyTone tone="income">{formatEur(stats.entrate)}</MoneyTone>
					</p>
					<p className="text-xs text-muted-foreground">Acquisti</p>
				</div>
				<div>
					<p className="text-xs font-medium text-muted-foreground">Uscite</p>
					<p className="mt-1 text-lg font-medium">
						<MoneyTone tone="expense">{formatEur(stats.uscite)}</MoneyTone>
					</p>
					<p className="text-xs text-muted-foreground">Pagamenti</p>
				</div>
				<div>
					<p className="text-xs font-medium text-muted-foreground">Saldo</p>
					<p className="mt-1 text-lg font-medium">
						<MoneyTone tone="signed" amount={stats.saldo}>
							{formatEur(stats.saldo)}
						</MoneyTone>
					</p>
					<p className="text-xs text-muted-foreground">Entrate − Uscite</p>
				</div>
				<div>
					<p className="text-xs font-medium text-muted-foreground">Ingressi</p>
					<p className="mt-1 text-lg font-medium tabular-nums text-foreground">
						{stats.ingressiCount}
					</p>
					<p className="text-xs text-muted-foreground">Accessi in palestra</p>
				</div>
			</div>

			{stats.isEmpty ? (
				<TableEmptyState
					title="Nessun movimento in questo periodo"
					hint="Registra un Acquisto, un Ingresso o un Pagamento per vedere i totali qui."
					action={
						<div className="flex flex-wrap items-center justify-center gap-2">
							<Button asChild variant="outline" size="sm">
								<Link href="/purchases">Acquisti</Link>
							</Button>
							<Button asChild variant="outline" size="sm">
								<Link href="/entrances">Ingressi</Link>
							</Button>
							<Button asChild variant="outline" size="sm">
								<Link href="/payments">Pagamenti</Link>
							</Button>
						</div>
					}
				/>
			) : null}

			<div className="grid gap-6 md:grid-cols-2">
				<BreakdownTable
					caption="Ripartizione Entrate (Acquisti)"
					rows={stats.entrateByKind}
					tone="income"
				/>
				<BreakdownTable
					caption="Ripartizione Uscite (Pagamenti)"
					rows={stats.usciteByType}
					tone="expense"
				/>
			</div>

			<ProductRankingTable rows={stats.productRanking} />

			<div className="flex flex-wrap items-center gap-2 border-t pt-4">
				<p className="mr-2 text-sm text-muted-foreground">Vai a</p>
				<Button asChild variant="ghost" size="sm">
					<Link href="/entrances">Ingressi</Link>
				</Button>
				<Button asChild variant="ghost" size="sm">
					<Link href="/purchases">Acquisti · Analisi entrate</Link>
				</Button>
				<Button asChild variant="ghost" size="sm">
					<Link href="/payments">Pagamenti · Analisi uscite</Link>
				</Button>
			</div>
		</div>
	);
}

export default function PanoramicaPage() {
	const [preset, setPreset] = useState<OverviewPeriodPreset>("current_month");
	const [stats, setStats] = useState<OverviewStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async (nextPreset: OverviewPeriodPreset) => {
		setLoading(true);
		setError(null);
		try {
			const next = await getOverviewStats(nextPreset);
			setStats(next);
		} catch (err) {
			const message =
				err instanceof Error && err.message
					? err.message
					: "Impossibile caricare la Panoramica.";
			setError(message);
			setStats(null);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void load(preset);
	}, [load, preset]);

	return (
		<div className="flex h-full min-h-0 min-w-0 flex-col">
			<div className="flex h-14 shrink-0 items-center justify-between gap-3 px-4 py-2">
				<h1 className="text-sm font-medium text-foreground">Panoramica</h1>
				<Tabs
					value={preset}
					onValueChange={(value) => {
						if (isOverviewPeriodPreset(value)) setPreset(value);
					}}
				>
					<TabsList aria-label="Periodo panoramica">
						<TabsTrigger value="current_month">
							{OVERVIEW_PERIOD_LABELS.current_month}
						</TabsTrigger>
						<TabsTrigger value="last_30_days">
							{OVERVIEW_PERIOD_LABELS.last_30_days}
						</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>
			<Separator />
			<div className="min-h-0 min-w-0 flex-1 overflow-auto bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				{loading ? (
					<TableLoadingState />
				) : error ? (
					<TableErrorState
						title="Panoramica non disponibile"
						message={error}
						onRetry={() => void load(preset)}
					/>
				) : stats ? (
					<OverviewBody stats={stats} />
				) : null}
			</div>
		</div>
	);
}
