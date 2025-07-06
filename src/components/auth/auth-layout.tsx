import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FlashFlowLogo } from "@/components/flashflow-logo";

export function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md border-0 bg-transparent shadow-none sm:border sm:bg-card sm:shadow-lg">
                <CardHeader className="flex flex-col items-center text-center">
                    <FlashFlowLogo />
                    <CardTitle className="mt-4 text-3xl font-bold font-headline">FlashFlow</CardTitle>
                    <CardDescription>Enhance your writing with AI</CardDescription>
                </CardHeader>
                <CardContent>
                    {children}
                </CardContent>
            </Card>
        </div>
    );
}
