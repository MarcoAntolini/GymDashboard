import { Role } from "@prisma/client";
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
	LucideIcon,
	Package,
	ReceiptText,
	ShoppingBasket,
	TrendingDown,
	TrendingUp,
	UserRound,
	UserRoundCog,
} from "lucide-react";

export const links: {
	group: {
		title: string;
		href: string;
		requiredRole: Role;
		icon: LucideIcon;
	}[];
}[] = [
	{
		group: [
			{
				title: "Accounts",
				href: "/accounts",
				requiredRole: "Admin",
				icon: UserRoundCog,
			},
			{
				title: "Employees",
				href: "/employees",
				requiredRole: "Admin",
				icon: BriefcaseBusiness,
			},
			{
				title: "Contracts",
				href: "/contracts",
				requiredRole: "Admin",
				icon: ReceiptText,
			},
			{
				title: "Clockings",
				href: "/clockings",
				requiredRole: "Admin",
				icon: BellElectric,
			},
		],
	},
	{
		group: [
			{
				title: "Salaries",
				href: "/salaries",
				requiredRole: "Admin",
				icon: HandCoins,
			},
			{
				title: "Equipment",
				href: "/equipment",
				requiredRole: "Employee",
				icon: Dumbbell,
			},
			{
				title: "Bills",
				href: "/bills",
				requiredRole: "Employee",
				icon: Lightbulb,
			},
			{
				title: "Interventions",
				href: "/interventions",
				requiredRole: "Employee",
				icon: AlarmSmoke,
			},
		],
	},
	{
		group: [
			{
				title: "Clients",
				href: "/clients",
				requiredRole: "Employee",
				icon: UserRound,
			},
			{
				title: "Entrances",
				href: "/entrances",
				requiredRole: "Employee",
				icon: DoorOpen,
			},
			{
				title: "Products",
				href: "/products",
				requiredRole: "Employee",
				icon: ShoppingBasket,
			},
		],
	},
	{
		group: [
			{
				title: "Memberships",
				href: "/memberships",
				requiredRole: "Employee",
				icon: Handshake,
			},
			{
				title: "Entrance Sets",
				href: "/entrance-sets",
				requiredRole: "Employee",
				icon: Package,
			},
			{
				title: "Catalogs",
				href: "/catalogs",
				requiredRole: "Employee",
				icon: FolderKanban,
			},
		],
	},
	{
		group: [
			{
				title: "Payments",
				href: "/payments",
				requiredRole: "Employee",
				icon: TrendingDown,
			},
			{
				title: "Purchases",
				href: "/purchases",
				requiredRole: "Employee",
				icon: TrendingUp,
			},
		],
	},
];
