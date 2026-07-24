import { ReactNode } from "react";

export function DesktopOnly({ children }: { children: ReactNode }) {
	return (
		<>
			<div className="hidden h-full min-h-0 custom-size:block">{children}</div>
			<div className="custom-size:hidden mt-32 flex flex-col items-center">
				<p className="text-3xl italic">This web app is not designed for mobile devices or small screens.</p>
			</div>
		</>
	);
}
