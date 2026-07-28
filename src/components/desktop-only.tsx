import { ReactNode } from "react";

export function DesktopOnly({ children }: { children: ReactNode }) {
	return (
		<>
			<div className="custom-size:block hidden h-full min-h-0 min-w-0">{children}</div>
			<div className="custom-size:hidden mt-32 flex flex-col items-center">
				<p className="text-3xl italic">Questa app non è ottimizzata per dispositivi mobili o schermi piccoli.</p>
			</div>
		</>
	);
}
