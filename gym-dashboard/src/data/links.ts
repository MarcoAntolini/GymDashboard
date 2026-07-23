import { navRoutes } from "@/data/nav-routes";
import {
	AlarmSmoke,
	BellElectric,
	BriefcaseBusiness,
	DoorOpen,
	Dumbbell,
	FolderKanban,
	HandCoins,
	Handshake,
	LayoutDashboard,
	Lightbulb,
	LucideIcon,
	Package,
	ReceiptText,
	ShoppingBasket,
	TrendingDown,
	TrendingUp,
	UserRound,
	UserRoundCog,
	CircleUserRound,
} from "lucide-react";

const iconsByHref: Record<string, LucideIcon> = {
	"/": LayoutDashboard,
	"/profile": CircleUserRound,
	"/accounts": UserRoundCog,
	"/employees": BriefcaseBusiness,
	"/contracts": ReceiptText,
	"/clockings": BellElectric,
	"/clients": UserRound,
	"/entrances": DoorOpen,
	"/products": ShoppingBasket,
	"/memberships": Handshake,
	"/entrance-sets": Package,
	"/catalogs": FolderKanban,
	"/payments": TrendingDown,
	"/purchases": TrendingUp,
	"/salaries": HandCoins,
	"/equipment": Dumbbell,
	"/bills": Lightbulb,
	"/interventions": AlarmSmoke,
};

/** Keep in sync with section names on `navRoutes` (order = sidebar order). */
const sectionOrder = ["Operazioni", "Listino", "Movimenti", "Uscite", "Personale"] as const;

export const links: {
	title: string;
	group: {
		title: string;
		href: string;
		requiredRole: "Admin" | "Employee";
		icon: LucideIcon;
	}[];
}[] = sectionOrder.map((section) => ({
	title: section,
	group: navRoutes
		.filter((route) => route.section === section)
		.map((route) => {
			const icon = iconsByHref[route.href];
			if (!icon) {
				throw new Error(`Missing nav icon for ${route.href}`);
			}
			return {
				title: route.title,
				href: route.href,
				requiredRole: route.requiredRole,
				icon,
			};
		}),
}));
