export function Footer() {
	return (
		<footer className="py-6 md:px-8 md:py-0">
			<div className="container flex flex-col items-center justify-center gap-4 md:h-14 md:flex-row">
				<p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
					© 2024 Gym Dashboard™. Built by{" "}
					<a
						href="https://marcoantolini.com"
						target="_blank"
						rel="noreferrer"
						className="font-medium underline underline-offset-4"
					>
						Marco Antolini
					</a>
					. All rights reserved.
				</p>
			</div>
		</footer>
	);
}
