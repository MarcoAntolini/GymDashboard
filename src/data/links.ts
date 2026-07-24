import { NAV_ROUTES, type AppRole } from "@/data/nav-routes";
import {
	AlarmSmoke,
	BellElectric,
	BriefcaseBusiness,
	DoorOpen,
	Dumbbell,
	FolderKanban,
	HandCoins,
	Handshake,
	Lightbulb,
	type LucideIcon,
	Package,
	ReceiptText,
	ShoppingBasket,
	TrendingDown,
	TrendingUp,
	UserRound,
	UserRoundCog,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
	"/accounts": UserRoundCog,
	"/employees": BriefcaseBusiness,
	"/contracts": ReceiptText,
	"/clockings": BellElectric,
	"/salaries": HandCoins,
	"/equipment": Dumbbell,
	"/bills": Lightbulb,
	"/interventions": AlarmSmoke,
	"/clients": UserRound,
	"/entrances": DoorOpen,
	"/products": ShoppingBasket,
	"/memberships": Handshake,
	"/entrance-sets": Package,
	"/catalogs": FolderKanban,
	"/payments": TrendingDown,
	"/purchases": TrendingUp,
};

const ADMIN_HREFS = new Set(["/accounts", "/employees", "/contracts", "/clockings", "/salaries"]);

type LinkItem = {
	title: string;
	href: string;
	requiredRole: AppRole;
	icon: LucideIcon;
};

function toLink(route: (typeof NAV_ROUTES)[number]): LinkItem {
	const icon = ICONS[route.href];
	if (!icon) {
		throw new Error(`Missing icon for nav route ${route.href}`);
	}
	return { ...route, icon };
}

/** Same visual groups as before; roles come from `nav-routes.ts`. */
export const links: { group: LinkItem[] }[] = [
	{
		group: NAV_ROUTES.filter((r) =>
			["/accounts", "/employees", "/contracts", "/clockings"].includes(r.href)
		).map(toLink),
	},
	{
		group: NAV_ROUTES.filter((r) =>
			["/salaries", "/equipment", "/bills", "/interventions"].includes(r.href)
		).map(toLink),
	},
	{
		group: NAV_ROUTES.filter((r) =>
			["/clients", "/entrances", "/products"].includes(r.href)
		).map(toLink),
	},
	{
		group: NAV_ROUTES.filter((r) =>
			["/memberships", "/entrance-sets", "/catalogs"].includes(r.href)
		).map(toLink),
	},
	{
		group: NAV_ROUTES.filter((r) => ["/payments", "/purchases"].includes(r.href)).map(toLink),
	},
];

export { roleAllows } from "@/data/nav-routes";
export type { AppRole };

/** @deprecated Prefer NAV_ROUTES; kept for call sites that only need Admin set. */
export const adminOnlyHrefs = ADMIN_HREFS;
