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
import type { BanconeDailyPoint, FrequencyPoint } from "@/lib/frequency-aggregation";
import { formatEur } from "@/lib/format";
import {
	isOverviewPeriodPreset,
	OVERVIEW_PERIOD_LABELS,
	type OverviewPeriodPreset,
} from "@/lib/overview-period";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

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
					Nessuna Vendita nel periodo — il ranking prodotti è vuoto.
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

function FrequencyBarChart({
	caption,
	rows,
	compactLabels,
}: {
	caption: string;
	rows: FrequencyPoint[];
	compactLabels?: boolean;
}) {
	const hasData = rows.some((row) => row.count > 0);
	return (
		<div className="min-w-0">
			<p className="mb-2 text-sm font-medium text-foreground">{caption}</p>
			{!hasData ? (
				<p className="text-sm text-muted-foreground">Nessun Ingresso nel periodo.</p>
			) : (
				<div className="h-[200px]">
					<ResponsiveContainer width="100%" height="100%">
						<BarChart data={rows}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis
								dataKey="label"
								interval={compactLabels ? 2 : 0}
								tick={{ fontSize: 11 }}
								minTickGap={8}
							/>
							<YAxis allowDecimals={false} width={32} tick={{ fontSize: 11 }} />
							<Tooltip />
							<Bar dataKey="count" name="Ingressi" fill="#3b82f6" radius={[3, 3, 0, 0]} />
						</BarChart>
					</ResponsiveContainer>
				</div>
			)}
		</div>
	);
}

function BanconeDailyChart({ rows }: { rows: BanconeDailyPoint[] }) {
	const hasData = rows.some((row) => row.ingressi > 0 || row.vendite > 0);
	const chartData = rows.map((row) => ({
		...row,
		axisLabel: row.label.replace(/\s+\d{4}$/, ""),
	}));
	return (
		<div className="min-w-0">
			<p className="mb-2 text-sm font-medium text-foreground">
				Carico bancone (Ingressi e Vendite per giorno)
			</p>
			{!hasData ? (
				<p className="text-sm text-muted-foreground">
					Nessun Ingresso né Vendita nel periodo.
				</p>
			) : (
				<div className="h-[240px]">
					<ResponsiveContainer width="100%" height="100%">
						<BarChart data={chartData}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis
								dataKey="axisLabel"
								interval="preserveStartEnd"
								minTickGap={20}
								tick={{ fontSize: 11 }}
							/>
							<YAxis allowDecimals={false} width={32} tick={{ fontSize: 11 }} />
							<Tooltip />
							<Legend />
							<Bar
								dataKey="ingressi"
								name="Ingressi"
								fill="#3b82f6"
								radius={[3, 3, 0, 0]}
							/>
							<Bar
								dataKey="vendite"
								name="Vendite"
								fill="#64748b"
								radius={[3, 3, 0, 0]}
							/>
						</BarChart>
					</ResponsiveContainer>
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
					<p className="text-xs text-muted-foreground">Vendite</p>
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
					hint="Registra una Vendita, un Ingresso o un Pagamento per vedere i totali qui."
					action={
						<div className="flex flex-wrap items-center justify-center gap-2">
							<Button asChild variant="outline" size="sm">
								<Link href="/sales">Vendite</Link>
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
					caption="Ripartizione Entrate (Vendite)"
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

			<section className="flex flex-col gap-6 border-t pt-6">
				<div>
					<p className="text-sm font-medium text-foreground">Frequenza Ingressi</p>
					<p className="text-sm text-muted-foreground">
						Picchi di affluenza per ora, giorno della settimana e mese.
					</p>
				</div>
				<div className="grid gap-6 md:grid-cols-2">
					<FrequencyBarChart
						caption="Per ora del giorno"
						rows={stats.entranceFrequency.byHour}
						compactLabels
					/>
					<FrequencyBarChart
						caption="Per giorno della settimana"
						rows={stats.entranceFrequency.byWeekday}
					/>
				</div>
				<FrequencyBarChart
					caption="Per mese dell'anno"
					rows={stats.entranceFrequency.byMonth}
				/>
				<BanconeDailyChart rows={stats.banconeDaily} />
			</section>

			<section className="flex flex-col gap-4 border-t pt-6">
				<div>
					<p className="text-sm font-medium text-foreground">Fidelizzazione (proxy OLTP)</p>
					<p className="text-sm text-muted-foreground">
						Indicatori da Vendite e Ingressi — niente modelli predittivi.
					</p>
				</div>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<div>
						<p className="text-xs font-medium text-muted-foreground">Clienti attivi</p>
						<p className="mt-1 text-lg font-medium tabular-nums text-foreground">
							{stats.fidelity.activeClientsCount}
						</p>
						<p className="text-xs text-muted-foreground">{stats.fidelity.activeDefinition}</p>
					</div>
					<div>
						<p className="text-xs font-medium text-muted-foreground">Rinnovi</p>
						<p className="mt-1 text-lg font-medium tabular-nums text-foreground">
							{stats.fidelity.renewalsCount}
						</p>
						<p className="text-xs text-muted-foreground">
							{stats.fidelity.renewalDefinition} ({stats.fidelity.renewingClientsCount}{" "}
							clienti).
						</p>
					</div>
					<div>
						<p className="text-xs font-medium text-muted-foreground">
							A rischio (N={stats.fidelity.atRiskDays} gg)
						</p>
						<p className="mt-1 text-lg font-medium tabular-nums text-foreground">
							{stats.fidelity.atRiskCount}
						</p>
						<p className="text-xs text-muted-foreground">{stats.fidelity.atRiskDefinition}</p>
					</div>
				</div>
				{stats.fidelity.atRisk.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						Nessun Cliente a rischio con le soglie documentate.
					</p>
				) : (
					<div className="min-w-0">
						<p className="mb-2 text-sm font-medium text-foreground">Clienti a rischio</p>
						<div className="overflow-hidden rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Cliente</TableHead>
										<TableHead className="text-right">Gg senza Ingresso</TableHead>
										<TableHead>Titolo</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{stats.fidelity.atRisk.map((row) => (
										<TableRow key={row.clientId}>
											<TableCell className="font-medium">
												{row.surname} {row.name}
											</TableCell>
											<TableCell>
												<NumericCell muted>
													{row.daysSinceLastEntrance == null
														? "Mai"
														: row.daysSinceLastEntrance}
												</NumericCell>
											</TableCell>
											<TableCell>
												<DotBadge
													label={
														row.titleStatus === "valid"
															? "Valido"
															: "Scaduto di recente"
													}
													tone={row.titleStatus === "valid" ? "warning" : "info"}
												/>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</div>
				)}
			</section>

			<div className="flex flex-wrap items-center gap-2 border-t pt-4">
				<p className="mr-2 text-sm text-muted-foreground">Vai a</p>
				<Button asChild variant="ghost" size="sm">
					<Link href="/entrances">Ingressi · Analisi frequenza</Link>
				</Button>
				<Button asChild variant="ghost" size="sm">
					<Link href="/sales">Vendite · Analisi entrate</Link>
				</Button>
				<Button asChild variant="ghost" size="sm">
					<Link href="/payments">Pagamenti · Analisi uscite</Link>
				</Button>
				<Button asChild variant="ghost" size="sm">
					<Link href="/clients">Clienti</Link>
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
