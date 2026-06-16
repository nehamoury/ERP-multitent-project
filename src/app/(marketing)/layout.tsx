import Link from "next/link";
import { Button } from "@/components/ui/shared";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <span className="text-primary">Attend</span>IQ
          </Link>
          <nav className="ml-auto flex items-center gap-3 sm:gap-6">
            <Link href="/features" className="hidden sm:inline-block text-sm font-medium hover:text-primary underline-offset-4 hover:underline">
              Features
            </Link>
            <Link href="/pricing" className="hidden sm:inline-block text-sm font-medium hover:text-primary underline-offset-4 hover:underline">
              Pricing
            </Link>
            <Link href="/login" className="text-sm font-medium hover:text-primary underline-offset-4 hover:underline">
              Login
            </Link>
            <Link href="/start-free-trial">
              <Button size="sm" className="h-8 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm">Start Free Trial</Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="w-full border-t bg-muted/40 py-6 md:py-12">
        <div className="container mx-auto flex flex-col gap-6 px-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex items-center gap-2 font-semibold">
            <span>AttendIQ CRM</span>
          </div>
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {new Date().getFullYear()} AttendIQ. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">Terms</Link>
            <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
