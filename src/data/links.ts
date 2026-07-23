import { NAV_ROUTE_GROUPS } from "@/data/nav-routes";
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

const ICONS_BY_HREF: Record<string, LucideIcon> = {
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

export const links: {
	group: {
		title: string;
		href: string;
		requiredRole: "Admin" | "Employee";
		icon: LucideIcon;
	}[];
}[] = NAV_ROUTE_GROUPS.map(({ group }) => ({
	group: group.map((route) => {
		const icon = ICONS_BY_HREF[route.href];
		if (!icon) {
			throw new Error(`Missing icon for nav route ${route.href}`);
		}
		return { ...route, icon };
	}),
}));
