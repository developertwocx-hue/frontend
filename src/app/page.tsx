import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <main className="flex flex-col items-center gap-8 p-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome to Next.js + shadcn/ui
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Your project is set up with the latest Next.js and shadcn/ui components.
            Start building your application now!
          </p>
        </div>
        <div className="flex gap-4">
          <Button>Get Started</Button>
          <Button variant="outline">Learn More</Button>
          <Button variant="secondary">Documentation</Button>
        </div>
      </main>
    </div>
  );
}
