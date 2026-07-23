"use client";

import { Button } from "@/components/ui/button";
import {
	MoneyTone,
	PaymentTypeBadge,
	ProductKindBadge,
	type ProductKindKey,
} from "@/components/ui/domain-badge";
import { EntityShell } from "@/components/ui/entity-shell";
import { Separator } from "@/components/ui/separator";
import {
	getOverviewStats,
	type OverviewBreakdownRow,
	type OverviewDeskDay,
	type OverviewFreqBucket,
	type OverviewPeriod,
	type OverviewProductRankRow,
	type OverviewStats,
} from "@/data-access/overview";
import { formatCurrencyEur, formatDateIt } from "@/lib/format";
import {
	AT_RISK_DAY_OPTIONS,
	DEFAULT_AT_RISK_DAYS,
	type AtRiskDays,
} from "@/lib/retention-proxies";
import { cn } from "@/lib/utils";
import type { PaymentType } from "@prisma/client";
import {
	DoorOpen,
	Package,
	RefreshCw,
	Scale,
	ShoppingBag,
	TrendingDown,
	TrendingUp,
	UserRoundCheck,
	UserRoundX,
	type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const PERIODS: { value: OverviewPeriod; label: string }[] = [
	{ value: "current_month", label: "Mese corrente" },
	{ value: "last_30_days", label: "Ultimi 30 giorni" },
];

type ProductRankMode = "revenue" | "quantity";
type FreqDimension = "hour" | "weekday" | "month";

const FREQ_DIMENSIONS: { value: FreqDimension; label: string }[] = [
	{ value: "hour", label: "Ora del giorno" },
	{ value: "weekday", label: "Giorno settimana" },
	{ value: "month", label: "Mese" },
];

function toError(error: unknown): Error {
	if (error instanceof Error && error.message.trim()) return error;
	return new Error("Impossibile caricare la panoramica. Riprova.");
}

function breakdownKind(row: OverviewBreakdownRow): ProductKindKey | null {
	if (row.key === "Membership") return "Membership";
	if (row.key === "EntranceSet") return "EntranceSet";
	return null;
}

function rankKind(row: OverviewProductRankRow): ProductKindKey | null {
	if (row.kind === "Membership") return "Membership";
	if (row.kind === "EntranceSet") return "EntranceSet";
	return null;
}

const PAYMENT_TYPES = ["Salary", "Bill", "Equipment", "Intervention"] as const satisfies readonly PaymentType[];

function isPaymentTypeKey(key: string): key is PaymentType {
	return (PAYMENT_TYPES as readonly string[]).includes(key);
}

function freqBucketsFor(
	stats: OverviewStats,
	dimension: FreqDimension
): { buckets: OverviewFreqBucket[]; peak: OverviewFreqBucket | null; peakHint: string } {
	if (dimension === "hour") {
		return {
			buckets: stats.frequency.byHour,
			peak: stats.frequency.peaks.hour,
			peakHint: "ora con più Ingressi",
		};
	}
	if (dimension === "weekday") {
		return {
			buckets: stats.frequency.byWeekday,
			peak: stats.frequency.peaks.weekday,
			peakHint: "giorno della settimana con più Ingressi",
		};
	}
	return {
		buckets: stats.frequency.byMonth,
		peak: stats.frequency.peaks.month,
		peakHint: "mese con più Ingressi (nel periodo)",
	};
}

function BreakdownTable({
	caption,
	rows,
	emptyHint,
	mode,
}: {
	caption: string;
	rows: OverviewBreakdownRow[];
	emptyHint: string;
	mode: "product" | "payment";
}) {
	const hasRows = rows.some((row) => row.count > 0 || row.amount > 0);

	return (
		<section className="min-w-0">
			<h3 className="mb-1.5 text-sm font-medium text-foreground">{caption}</h3>
			<div className="overflow-x-auto rounded-md border contain-paint">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b bg-muted/40 text-left">
							<th className="px-3 py-1.5 font-medium">Tipo</th>
							<th className="px-3 py-1.5 text-right font-medium tabular-nums">N.</th>
							<th className="px-3 py-1.5 text-right font-medium tabular-nums">Importo</th>
						</tr>
					</thead>
					<tbody>
						{hasRows ? (
							rows.map((row) => (
								<tr key={row.key} className="border-b last:border-b-0">
									<td className="px-3 py-1.5 text-foreground">
										{mode === "product" ? (
											<ProductKindBadge kind={breakdownKind(row)} label={row.label} />
										) : isPaymentTypeKey(row.key) ? (
											<PaymentTypeBadge type={row.key} />
										) : (
											row.label
										)}
									</td>
									<td className="px-3 py-1.5 text-right tabular-nums text-foreground">
										{row.count}
									</td>
									<td className="px-3 py-1.5 text-right font-medium">
										<MoneyTone
											amount={row.amount}
											direction={mode === "product" ? "income" : "expense"}
										>
											{formatCurrencyEur(row.amount)}
										</MoneyTone>
									</td>
								</tr>
							))
						) : (
							<tr>
								<td colSpan={3} className="px-3 py-5 text-center text-muted-foreground text-pretty">
									{emptyHint}
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</section>
	);
}

function ProductRankingTable({
	rows,
	rankMode,
}: {
	rows: OverviewProductRankRow[];
	rankMode: ProductRankMode;
}) {
	const empty = rows.length === 0;

	return (
		<div className="overflow-x-auto rounded-md border contain-paint">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b bg-muted/40 text-left">
						<th className="w-10 px-3 py-1.5 font-medium tabular-nums">#</th>
						<th className="px-3 py-1.5 font-medium">Prodotto</th>
						<th className="px-3 py-1.5 font-medium">Tipo</th>
						<th className="px-3 py-1.5 text-right font-medium tabular-nums">Qtà</th>
						<th className="px-3 py-1.5 text-right font-medium tabular-nums">Ricavo</th>
					</tr>
				</thead>
				<tbody>
					{empty ? (
						<tr>
							<td colSpan={5} className="px-3 py-5 text-center text-muted-foreground text-pretty">
								Nessun Acquisto nel periodo: il ranking prodotti è vuoto.
							</td>
						</tr>
					) : (
						rows.map((row, index) => (
							<tr key={`${rankMode}-${row.productCode}`} className="border-b last:border-b-0">
								<td className="px-3 py-1.5 tabular-nums text-muted-foreground">{index + 1}</td>
								<td className="px-3 py-1.5 font-medium text-foreground">
									<code className="rounded bg-muted px-1.5 py-0.5 text-xs">{row.productCode}</code>
								</td>
								<td className="px-3 py-1.5">
									<ProductKindBadge kind={rankKind(row)} label={row.kindLabel} />
								</td>
								<td
									className={cn(
										"px-3 py-1.5 text-right tabular-nums",
										rankMode === "quantity" ? "font-medium text-foreground" : "text-foreground"
									)}
								>
									{row.count}
								</td>
								<td
									className={cn(
										"px-3 py-1.5 text-right",
										rankMode === "revenue" ? "font-medium" : ""
									)}
								>
									<MoneyTone amount={row.amount} direction="income">
										{formatCurrencyEur(row.amount)}
									</MoneyTone>
								</td>
							</tr>
						))
					)}
				</tbody>
			</table>
		</div>
	);
}

function FrequencyHistogram({
	buckets,
	peak,
	denseLabels,
}: {
	buckets: OverviewFreqBucket[];
	peak: OverviewFreqBucket | null;
	denseLabels?: boolean;
}) {
	const max = Math.max(...buckets.map((b) => b.count), 0);
	const hasData = max > 0;

	return (
		<div className="min-w-0">
			{hasData ? (
				<div
					className="flex h-32 items-end gap-px sm:gap-0.5"
					role="img"
					aria-label="Istogramma frequenza Ingressi"
				>
					{buckets.map((bucket) => {
						const heightPct = max === 0 ? 0 : (bucket.count / max) * 100;
						const isPeak = peak != null && bucket.key === peak.key && bucket.count === peak.count;
						const showLabel =
							!denseLabels || bucket.key % 3 === 0 || bucket.key === buckets.length - 1;
						return (
							<div
								key={bucket.key}
								className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
								title={`${bucket.label}: ${bucket.count} Ingressi`}
							>
								<span
									className={cn(
										"text-[10px] tabular-nums leading-none",
										isPeak ? "font-medium text-foreground" : "text-muted-foreground"
									)}
								>
									{bucket.count > 0 ? bucket.count : "\u00a0"}
								</span>
								<div className="flex h-20 w-full items-end">
									<div
										className={cn(
											"w-full min-h-0 rounded-sm transition-[height] duration-150 motion-reduce:transition-none",
											isPeak ? "bg-info" : "bg-info/55"
										)}
										style={{ height: `${Math.max(heightPct, bucket.count > 0 ? 4 : 0)}%` }}
									/>
								</div>
								<span
									className={cn(
										"w-full truncate text-center text-[10px] tabular-nums leading-none text-muted-foreground",
										!showLabel && "invisible"
									)}
								>
									{denseLabels ? String(bucket.key).padStart(2, "0") : bucket.label}
								</span>
							</div>
						);
					})}
				</div>
			) : (
				<p className="rounded-md border border-dashed border-border px-3 py-5 text-center text-sm text-muted-foreground text-pretty">
					Nessun Ingresso nel periodo: istogramma vuoto.
				</p>
			)}
		</div>
	);
}

function DeskLoadTable({ days, peakDay }: { days: OverviewDeskDay[]; peakDay: OverviewDeskDay | null }) {
	const maxTotal = Math.max(...days.map((d) => d.total), 0);
	const hasData = days.some((d) => d.total > 0);

	if (!hasData) {
		return (
			<p className="rounded-md border border-dashed border-border px-3 py-5 text-center text-sm text-muted-foreground text-pretty">
				Nessun Ingresso né Acquisto nel periodo: carico bancone a zero.
			</p>
		);
	}

	return (
		<div className="overflow-x-auto rounded-md border contain-paint">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b bg-muted/40 text-left">
						<th className="px-3 py-1.5 font-medium">Giorno</th>
						<th className="px-3 py-1.5 text-right font-medium tabular-nums">Ingressi</th>
						<th className="px-3 py-1.5 text-right font-medium tabular-nums">Acquisti</th>
						<th className="px-3 py-1.5 text-right font-medium tabular-nums">Totale</th>
						<th className="hidden px-3 py-1.5 font-medium sm:table-cell sm:w-[40%]">Carico</th>
					</tr>
				</thead>
				<tbody>
					{days.map((day) => {
						const isPeak = peakDay != null && day.date === peakDay.date;
						const widthPct = maxTotal === 0 ? 0 : (day.total / maxTotal) * 100;
						return (
							<tr
								key={day.date}
								className={cn("border-b last:border-b-0", isPeak && "bg-info/5")}
							>
								<td className="px-3 py-1.5 tabular-nums text-foreground">
									{day.label}
									{isPeak ? (
										<span className="ml-1.5 text-[10px] font-medium uppercase tracking-wide text-info">
											picco
										</span>
									) : null}
								</td>
								<td className="px-3 py-1.5 text-right tabular-nums text-foreground">
									{day.entrances}
								</td>
								<td className="px-3 py-1.5 text-right tabular-nums text-foreground">
									{day.purchases}
								</td>
								<td className="px-3 py-1.5 text-right font-medium tabular-nums text-foreground">
									{day.total}
								</td>
								<td className="hidden px-3 py-1.5 sm:table-cell">
									<div className="flex h-2 overflow-hidden rounded-sm bg-muted">
										{day.entrances > 0 ? (
											<div
												className="h-full bg-info/80"
												style={{
													width: `${maxTotal === 0 ? 0 : (day.entrances / maxTotal) * 100}%`,
												}}
												title={`Ingressi: ${day.entrances}`}
											/>
										) : null}
										{day.purchases > 0 ? (
											<div
												className="h-full bg-success/70"
												style={{
													width: `${maxTotal === 0 ? 0 : (day.purchases / maxTotal) * 100}%`,
												}}
												title={`Acquisti: ${day.purchases}`}
											/>
										) : null}
										{day.total === 0 ? (
											<div className="h-full" style={{ width: `${widthPct}%` }} />
										) : null}
									</div>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}

function CashFigure({
	label,
	amount,
	countLabel,
	direction,
	icon: Icon,
}: {
	label: string;
	amount: number;
	countLabel: string;
	direction: "income" | "expense" | "balance" | "ops";
	icon: LucideIcon;
}) {
	const surface =
		direction === "income"
			? "bg-success/10"
			: direction === "expense"
				? "bg-destructive/10"
				: direction === "ops"
					? "bg-info/10"
					: amount < 0
						? "bg-destructive/10"
						: amount > 0
							? "bg-success/10"
							: "bg-muted/60";

	const iconTone =
		direction === "income"
			? "text-success"
			: direction === "expense"
				? "text-destructive"
				: direction === "ops"
					? "text-info"
					: amount < 0
						? "text-destructive"
						: amount > 0
							? "text-success"
							: "text-muted-foreground";

	return (
		<div className="min-w-0 sm:border-l sm:border-border sm:pl-3 first:sm:border-l-0 first:sm:pl-0">
			<div className="flex items-center gap-2">
				<span
					className={cn("inline-flex size-7 items-center justify-center rounded-md", surface)}
					aria-hidden
				>
					<Icon className={cn("size-3.5", iconTone)} />
				</span>
				<p className="text-xs font-medium tracking-wide text-muted-foreground">{label}</p>
			</div>
			{direction === "ops" ? (
				<p className="mt-1 text-lg font-semibold tabular-nums tracking-tight text-foreground">
					{amount}
				</p>
			) : (
				<p className="mt-1 text-lg font-semibold tracking-tight">
					<MoneyTone
						amount={amount}
						direction={direction === "balance" ? "balance" : direction}
					>
						{formatCurrencyEur(amount)}
					</MoneyTone>
				</p>
			)}
			<p className="text-xs tabular-nums text-muted-foreground">{countLabel}</p>
		</div>
	);
}

export default function OverviewPage() {
	const [period, setPeriod] = useState<OverviewPeriod>("current_month");
	const [rankMode, setRankMode] = useState<ProductRankMode>("revenue");
	const [freqDimension, setFreqDimension] = useState<FreqDimension>("hour");
	const [atRiskDays, setAtRiskDays] = useState<AtRiskDays>(DEFAULT_AT_RISK_DAYS);
	const [stats, setStats] = useState<OverviewStats | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	const load = useCallback(async (nextPeriod: OverviewPeriod, nextAtRiskDays: AtRiskDays) => {
		setIsLoading(true);
		setError(null);
		try {
			const next = await getOverviewStats(nextPeriod, { atRiskDays: nextAtRiskDays });
			setStats(next);
		} catch (err) {
			setError(toError(err));
			setStats(null);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		void load(period, atRiskDays);
	}, [load, period, atRiskDays]);

	const isEmpty =
		stats != null &&
		stats.purchases.count === 0 &&
		stats.payments.count === 0 &&
		stats.entrances.count === 0;

	const rankingRows =
		stats == null
			? []
			: rankMode === "revenue"
				? stats.productRanking.byRevenue
				: stats.productRanking.byQuantity;

	const freqView = stats == null ? null : freqBucketsFor(stats, freqDimension);

	return (
		<EntityShell
			isLoading={isLoading && stats == null}
			error={error}
			onRetry={() => void load(period, atRiskDays)}
			entityLabel="Panoramica"
		>
			<div className="flex h-full flex-col">
				<div className="flex h-12 min-h-12 items-center justify-between gap-3 overflow-hidden px-4">
					<div className="flex min-w-0 items-baseline gap-2">
						<h1 className="shrink-0 text-base font-semibold tracking-tight text-foreground">
							Panoramica
						</h1>
						{stats ? (
							<p className="truncate text-sm text-muted-foreground">
								{formatDateIt(stats.from)} – {formatDateIt(stats.to)}
							</p>
						) : null}
					</div>
					<div
						className="inline-flex rounded-md border border-border p-0.5"
						role="group"
						aria-label="Periodo"
					>
						{PERIODS.map((option) => (
							<Button
								key={option.value}
								type="button"
								size="sm"
								variant={period === option.value ? "secondary" : "ghost"}
								className="h-7 px-2.5 text-xs"
								aria-pressed={period === option.value}
								onClick={() => setPeriod(option.value)}
							>
								{option.label}
							</Button>
						))}
					</div>
				</div>
				<Separator />
				<div className="flex-1 overflow-y-auto bg-background p-3 sm:p-4" aria-busy={isLoading}>
					{stats ? (
						<div
							className={cn(
								"mx-auto flex max-w-5xl flex-col gap-5 transition-opacity duration-150 motion-reduce:transition-none",
								isLoading && "opacity-60"
							)}
						>
							<section aria-labelledby="cash-heading" className="rounded-md border border-border p-3">
								<div className="mb-2.5 flex items-center justify-between gap-2">
									<h2 id="cash-heading" className="text-sm font-medium text-foreground">
										Cassa del periodo
									</h2>
									<p className="text-xs text-muted-foreground">Acquisti − Pagamenti</p>
								</div>
								<div className="grid gap-3 sm:grid-cols-2 sm:gap-0 lg:grid-cols-4">
									<CashFigure
										label="Entrate"
										amount={stats.purchases.totalAmount}
										countLabel={`${stats.purchases.count} Acquisti`}
										direction="income"
										icon={TrendingUp}
									/>
									<CashFigure
										label="Uscite"
										amount={stats.payments.totalAmount}
										countLabel={`${stats.payments.count} Pagamenti`}
										direction="expense"
										icon={TrendingDown}
									/>
									<CashFigure
										label="Saldo"
										amount={stats.balance}
										countLabel="Netto periodo"
										direction="balance"
										icon={Scale}
									/>
									<CashFigure
										label="Ingressi"
										amount={stats.entrances.count}
										countLabel="Accessi in palestra"
										direction="ops"
										icon={DoorOpen}
									/>
								</div>
							</section>

							{isEmpty ? (
								<section
									className="rounded-md border border-dashed border-border px-4 py-4 text-sm text-pretty"
									role="status"
								>
									<p className="font-medium text-foreground">Nessun movimento in questo periodo</p>
									<p className="mt-1 text-muted-foreground">
										Registra un Ingresso, un Acquisto o un Pagamento per vedere i totali e le
										ripartizioni qui.
									</p>
									<div className="mt-3 flex flex-wrap gap-2">
										<Button asChild size="sm" variant="outline">
											<Link href="/entrances" className="inline-flex items-center gap-1.5">
												<DoorOpen className="size-3.5" aria-hidden />
												Ingressi
											</Link>
										</Button>
										<Button asChild size="sm" variant="outline">
											<Link href="/purchases" className="inline-flex items-center gap-1.5">
												<TrendingUp className="size-3.5" aria-hidden />
												Acquisti
											</Link>
										</Button>
										<Button asChild size="sm" variant="outline">
											<Link href="/payments" className="inline-flex items-center gap-1.5">
												<TrendingDown className="size-3.5" aria-hidden />
												Pagamenti
											</Link>
										</Button>
									</div>
								</section>
							) : (
								<>
									<section aria-labelledby="breakdown-heading" className="min-w-0">
										<h2 id="breakdown-heading" className="mb-2 text-sm font-medium text-foreground">
											Ripartizioni
										</h2>
										<div className="grid gap-4 lg:grid-cols-2">
											<BreakdownTable
												caption="Entrate per tipo di Prodotto"
												rows={stats.purchases.byKind}
												emptyHint="Nessun Acquisto nel periodo."
												mode="product"
											/>
											<BreakdownTable
												caption="Uscite per tipo di Pagamento"
												rows={stats.payments.byType}
												emptyHint="Nessun Pagamento nel periodo."
												mode="payment"
											/>
										</div>
									</section>

									<section aria-labelledby="mix-heading" className="min-w-0">
										<div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
											<div className="flex items-center gap-2">
												<span
													className="inline-flex size-7 items-center justify-center rounded-md bg-info/10 text-info"
													aria-hidden
												>
													<Package className="size-3.5" />
												</span>
												<div>
													<h2 id="mix-heading" className="text-sm font-medium text-foreground">
														Mix prodotti
													</h2>
													<p className="text-xs text-muted-foreground">
														Abbonamento / Pacchetto ingressi · top 10
													</p>
												</div>
											</div>
											<div
												className="inline-flex rounded-md border border-border p-0.5"
												role="group"
												aria-label="Ordinamento ranking"
											>
												<Button
													type="button"
													size="sm"
													variant={rankMode === "revenue" ? "secondary" : "ghost"}
													className="h-7 px-2.5 text-xs"
													aria-pressed={rankMode === "revenue"}
													onClick={() => setRankMode("revenue")}
												>
													Per ricavo
												</Button>
												<Button
													type="button"
													size="sm"
													variant={rankMode === "quantity" ? "secondary" : "ghost"}
													className="h-7 px-2.5 text-xs"
													aria-pressed={rankMode === "quantity"}
													onClick={() => setRankMode("quantity")}
												>
													Per quantità
												</Button>
											</div>
										</div>
										<ProductRankingTable rows={rankingRows} rankMode={rankMode} />
									</section>

									<section aria-labelledby="freq-heading" className="min-w-0">
										<div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
											<div className="flex items-center gap-2">
												<span
													className="inline-flex size-7 items-center justify-center rounded-md bg-info/10 text-info"
													aria-hidden
												>
													<DoorOpen className="size-3.5" />
												</span>
												<div>
													<h2 id="freq-heading" className="text-sm font-medium text-foreground">
														Frequenza Ingressi
													</h2>
													<p className="text-xs text-muted-foreground">
														Ora / giorno settimana / mese · picchi operativi
													</p>
												</div>
											</div>
											<div
												className="inline-flex flex-wrap rounded-md border border-border p-0.5"
												role="group"
												aria-label="Dimensione frequenza"
											>
												{FREQ_DIMENSIONS.map((option) => (
													<Button
														key={option.value}
														type="button"
														size="sm"
														variant={freqDimension === option.value ? "secondary" : "ghost"}
														className="h-7 px-2.5 text-xs"
														aria-pressed={freqDimension === option.value}
														onClick={() => setFreqDimension(option.value)}
													>
														{option.label}
													</Button>
												))}
											</div>
										</div>
										{freqView ? (
											<>
												{freqView.peak ? (
													<p className="mb-2 text-xs text-muted-foreground">
														Picco:{" "}
														<span className="font-medium text-foreground">
															{freqView.peak.label}
														</span>{" "}
														({freqView.peak.count} Ingressi) — {freqView.peakHint}
													</p>
												) : null}
												<FrequencyHistogram
													buckets={freqView.buckets}
													peak={freqView.peak}
													denseLabels={freqDimension === "hour"}
												/>
											</>
										) : null}
									</section>

									<section aria-labelledby="desk-heading" className="min-w-0">
										<div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
											<div className="flex items-center gap-2">
												<span
													className="inline-flex size-7 items-center justify-center rounded-md bg-success/10 text-success"
													aria-hidden
												>
													<ShoppingBag className="size-3.5" />
												</span>
												<div>
													<h2 id="desk-heading" className="text-sm font-medium text-foreground">
														Carico bancone
													</h2>
													<p className="text-xs text-muted-foreground">
														Ingressi e Acquisti per giorno nel periodo
													</p>
												</div>
											</div>
											<div className="flex items-center gap-3 text-xs text-muted-foreground">
												<span className="inline-flex items-center gap-1.5">
													<span className="size-2 rounded-sm bg-info/80" aria-hidden />
													Ingressi
												</span>
												<span className="inline-flex items-center gap-1.5">
													<span className="size-2 rounded-sm bg-success/70" aria-hidden />
													Acquisti
												</span>
											</div>
										</div>
										{stats.deskLoad.peakDay ? (
											<p className="mb-2 text-xs text-muted-foreground">
												Giorno più carico:{" "}
												<span className="font-medium text-foreground">
													{stats.deskLoad.peakDay.label}
												</span>{" "}
												({stats.deskLoad.peakDay.entrances} Ingressi +{" "}
												{stats.deskLoad.peakDay.purchases} Acquisti ={" "}
												{stats.deskLoad.peakDay.total})
											</p>
										) : null}
										<DeskLoadTable
											days={stats.deskLoad.byDay}
											peakDay={stats.deskLoad.peakDay}
										/>
									</section>
								</>
							)}

							<section
								aria-labelledby="retention-heading"
								className="flex flex-col gap-4 border-t border-border pt-4"
							>
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div className="flex items-start gap-3">
										<span
											className="inline-flex size-7 items-center justify-center rounded-md bg-info/10 text-info"
											aria-hidden
										>
											<UserRoundCheck className="size-3.5" />
										</span>
										<div>
											<h2 id="retention-heading" className="text-sm font-medium text-foreground">
												Fidelizzazione (proxy OLTP)
											</h2>
											<p className="mt-0.5 max-w-2xl text-xs text-muted-foreground text-pretty">
												Indicatori operativi da Ingressi e Acquisti. La rilevanza del titolo usa
												gli snapshot sull&apos;Acquisto (durata / N ingressi), non il Prodotto
												corrente.
											</p>
										</div>
									</div>
									<div
										className="inline-flex rounded-md border border-border p-0.5"
										role="group"
										aria-label="Soglia giorni senza Ingresso"
									>
										{AT_RISK_DAY_OPTIONS.map((days) => (
											<Button
												key={days}
												type="button"
												size="sm"
												variant={atRiskDays === days ? "secondary" : "ghost"}
												className="h-7 px-2.5 text-xs tabular-nums"
												aria-pressed={atRiskDays === days}
												onClick={() => setAtRiskDays(days)}
											>
												{days}g
											</Button>
										))}
									</div>
								</div>

								<div className="grid gap-4 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-border">
									<div className="min-w-0 sm:pr-4">
										<div className="flex items-center gap-2">
											<span
												className="inline-flex size-7 items-center justify-center rounded-md bg-success/10 text-success"
												aria-hidden
											>
												<UserRoundCheck className="size-3.5" />
											</span>
											<p className="text-xs font-medium text-muted-foreground">Clienti attivi</p>
										</div>
										<p className="mt-1 text-lg font-semibold tabular-nums tracking-tight text-foreground">
											{stats.retention.activeClients}
										</p>
										<p className="text-xs text-muted-foreground text-pretty">
											Clienti distinti con almeno un Ingresso nel periodo selezionato.
										</p>
									</div>
									<div className="min-w-0 sm:px-4">
										<div className="flex items-center gap-2">
											<span
												className="inline-flex size-7 items-center justify-center rounded-md bg-info/10 text-info"
												aria-hidden
											>
												<RefreshCw className="size-3.5" />
											</span>
											<p className="text-xs font-medium text-muted-foreground">Riacquisti / rinnovi</p>
										</div>
										<p className="mt-1 text-lg font-semibold tabular-nums tracking-tight text-foreground">
											{stats.retention.renewalsCount}
											<span className="ml-1.5 text-xs font-normal text-muted-foreground">
												({stats.retention.renewingClientsCount} clienti)
											</span>
										</p>
										<p className="text-xs text-muted-foreground text-pretty">
											Acquisti nel periodo di clienti che avevano già almeno un Acquisto
											precedente (riacquisto o rinnovo).
										</p>
									</div>
									<div className="min-w-0 sm:pl-4">
										<div className="flex items-center gap-2">
											<span
												className="inline-flex size-7 items-center justify-center rounded-md bg-destructive/10 text-destructive"
												aria-hidden
											>
												<UserRoundX className="size-3.5" />
											</span>
											<p className="text-xs font-medium text-muted-foreground">A rischio</p>
										</div>
										<p className="mt-1 text-lg font-semibold tabular-nums tracking-tight text-foreground">
											{stats.retention.atRiskCount}
										</p>
										<p className="text-xs text-muted-foreground text-pretty">
											Titolo ancora rilevante (snapshot durata o residuo N) e nessun Ingresso da
											almeno {stats.retention.atRiskDays} giorni, oppure mai.
										</p>
									</div>
								</div>

								<div className="overflow-x-auto rounded-md border contain-paint">
									<table className="w-full text-sm">
										<caption className="sr-only">
											Campione clienti a rischio (massimo 15)
										</caption>
										<thead>
											<tr className="border-b bg-muted/40 text-left">
												<th className="px-3 py-1.5 font-medium">Cliente</th>
												<th className="px-3 py-1.5 font-medium">Titolo</th>
												<th className="px-3 py-1.5 text-right font-medium tabular-nums">
													Giorni senza Ingresso
												</th>
											</tr>
										</thead>
										<tbody>
											{stats.retention.atRiskSample.length === 0 ? (
												<tr>
													<td
														colSpan={3}
														className="px-3 py-5 text-center text-muted-foreground text-pretty"
													>
														Nessun cliente a rischio con soglia {stats.retention.atRiskDays}{" "}
														giorni.
													</td>
												</tr>
											) : (
												stats.retention.atRiskSample.map((row) => (
													<tr key={row.clientId} className="border-b last:border-b-0">
														<td className="px-3 py-1.5 font-medium text-foreground">
															{row.clientLabel}
														</td>
														<td className="px-3 py-1.5">
															<ProductKindBadge
																kind={
																	row.titleKind === "Abbonamento"
																		? "Membership"
																		: "EntranceSet"
																}
																label={
																	row.titleKind === "Abbonamento"
																		? "Abbonamento"
																		: "Pacchetto ingressi"
																}
															/>
														</td>
														<td className="px-3 py-1.5 text-right tabular-nums text-foreground">
															{row.daysSinceLastEntrance == null
																? "Mai"
																: row.daysSinceLastEntrance}
														</td>
													</tr>
												))
											)}
										</tbody>
									</table>
								</div>
								{stats.retention.atRiskCount > stats.retention.atRiskSample.length ? (
									<p className="text-xs text-muted-foreground">
										Mostrati {stats.retention.atRiskSample.length} di{" "}
										{stats.retention.atRiskCount} clienti a rischio (ordinati per assenza più
										lunga).
									</p>
								) : null}
							</section>

							{!isEmpty ? (
								<nav
									className="flex flex-wrap items-center gap-2 border-t border-border pt-3"
									aria-label="Scorciatoie operative"
								>
									<span className="mr-1 text-xs font-medium text-muted-foreground">Vai a</span>
									<Button asChild size="sm" variant="outline" className="h-7">
										<Link href="/entrances" className="inline-flex items-center gap-1.5">
											<DoorOpen className="size-3.5" aria-hidden />
											Ingressi
										</Link>
									</Button>
									<Button asChild size="sm" variant="outline" className="h-7">
										<Link href="/purchases" className="inline-flex items-center gap-1.5">
											<TrendingUp className="size-3.5" aria-hidden />
											Acquisti
										</Link>
									</Button>
									<Button asChild size="sm" variant="outline" className="h-7">
										<Link href="/payments" className="inline-flex items-center gap-1.5">
											<TrendingDown className="size-3.5" aria-hidden />
											Pagamenti
										</Link>
									</Button>
								</nav>
							) : null}
						</div>
					) : null}
				</div>
			</div>
		</EntityShell>
	);
}
