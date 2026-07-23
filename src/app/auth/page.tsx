import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "./_components/login-form";
import { RegisterForm } from "./_components/register-form";

export default function LoginPage() {
	return (
		<div>
			<Tabs
				defaultValue="login"
				className="w-[400px] mx-auto mt-20 flex flex-col"
			>
				<TabsList className="mx-auto mb-10">
					<TabsTrigger value="login">Login</TabsTrigger>
					<TabsTrigger value="register">Register</TabsTrigger>
				</TabsList>
				<TabsContent value="login">
					<LoginForm />
				</TabsContent>
				<TabsContent value="register">
					<RegisterForm />
				</TabsContent>
			</Tabs>
		</div>
	);
}
