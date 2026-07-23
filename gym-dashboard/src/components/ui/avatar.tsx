"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

const Avatar = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
	({ className, ...props }, ref) => (
		<span
			ref={ref}
			className={cn("relative flex size-10 shrink-0 overflow-hidden rounded-full", className)}
			{...props}
		/>
	)
);
Avatar.displayName = "Avatar";

const AvatarImage = React.forwardRef<
	HTMLImageElement,
	React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, alt = "", ...props }, ref) => (
	// eslint-disable-next-line @next/next/no-img-element -- local/upload URLs; avoid next/image config churn
	<img ref={ref} alt={alt} className={cn("aspect-square size-full object-cover", className)} {...props} />
));
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
	({ className, ...props }, ref) => (
		<span
			ref={ref}
			className={cn(
				"flex size-full items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground",
				className
			)}
			{...props}
		/>
	)
);
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarFallback, AvatarImage };
