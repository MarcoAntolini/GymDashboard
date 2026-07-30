import { NAV_ROUTES, type AppRole } from "@/data/nav-routes";
import {
	BookOpen,
	BriefcaseBusiness,
	Clock,
	DoorOpen,
	Dumbbell,
	FileText,
	HandCoins,
	LayoutDashboard,
	type LucideIcon,
	Package,
	ShoppingBag,
	ShoppingCart,
	Ticket,
	UserCog,
	UserRound,
	Wallet,
	Wrench,
	Zap,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
	"/": LayoutDashboard,
	"/accounts": UserCog,
	"/employees": BriefcaseBusiness,
	"/contracts": FileText,
	"/clockings": Clock,
	"/salaries": HandCoins,
	"/equipment": Dumbbell,
	"/bills": Zap,
	"/interventions": Wrench,
	"/clients": UserRound,
	"/entrances": DoorOpen,
	"/products": ShoppingBag,
	"/memberships": Ticket,
	"/entrance-sets": Package,
	"/catalogs": BookOpen,
	"/payments": Wallet,
	"/purchases": ShoppingCart,
};

const ADMIN_HREFS = new Set(["/accounts", "/employees", "/contracts", "/clockings", "/salaries"]);

type LinkItem = {
	title: string;
	href: string;
	requiredRole: AppRole;
	icon: LucideIcon;
};

export type NavSection = {
	/** Visible section heading (CONTEXT / IA). */
	section: string;
	group: LinkItem[];
};

function toLink(route: (typeof NAV_ROUTES)[number]): LinkItem {
	const icon = ICONS[route.href];
	if (!icon) {
		throw new Error(`Missing icon for nav route ${route.href}`);
	}
	return { ...route, icon };
}

function linksFor(hrefs: string[]): LinkItem[] {
	return hrefs.map((href) => {
		const route = NAV_ROUTES.find((r) => r.href === href);
		if (!route) {
			throw new Error(`Unknown nav route ${href}`);
		}
		return toLink(route);
	});
}

/**
 * Operational IA groups. Panoramica leads alone; Employee loses Personale (Admin+).
 */
export const links: NavSection[] = [
	{
		section: "",
		group: linksFor(["/"]),
	},
	{
		section: "Personale",
		group: linksFor(["/accounts", "/employees", "/contracts", "/clockings"]),
	},
	{
		section: "Accessi",
		group: linksFor(["/clients", "/entrances"]),
	},
	{
		section: "Listino",
		group: linksFor(["/products", "/memberships", "/entrance-sets", "/catalogs"]),
	},
	{
		section: "Movimenti",
		group: linksFor(["/purchases", "/payments"]),
	},
	{
		section: "Uscite",
		group: linksFor(["/salaries", "/bills", "/equipment", "/interventions"]),
	},
];

export { roleAllows } from "@/data/nav-routes";
export type { AppRole };

/** @deprecated Prefer NAV_ROUTES; kept for call sites that only need Admin set. */
export const adminOnlyHrefs = ADMIN_HREFS;
