import { ReactNode } from "react";

export function DesktopOnly({ children }: { children: ReactNode }) {
	return (
		<>
			<div className="hidden custom-size:block">{children}</div>
			<div className="custom-size:hidden flex flex-col items-center mt-32">
				<p className="text-3xl italic">This web app is not designed for mobile devices or small screens.</p>
			</div>
		</>
	);
}
