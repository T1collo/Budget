import React from "react";
import { Button } from "./ui/button";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { checkUser } from "@/lib/checkUser";
import { LayoutDashboard, PenBox, Settings } from "lucide-react";
import { GiFluffyFlame } from "react-icons/gi";
import { ThemeSwitcherBtn } from "./ThemeSwitcherBtn";

const Header = async () => {
  await checkUser();

  return (
    <header className="fixed top-0 z-50 h-16 w-full border-b bg-background/80 backdrop-blur-md">
      <nav className="container mx-auto flex h-full items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <GiFluffyFlame className="text-3xl text-primary" />
          <span className="text-xl font-semibold tracking-tight">BudgetIQ</span>
        </Link>

        <div className="flex items-center gap-2">
          <SignedIn>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <LayoutDashboard className="size-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className="size-9" asChild>
              <Link href="/settings" aria-label="Settings">
                <Settings className="size-4" />
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/transaction/create">
                <PenBox className="size-4" />
                <span className="hidden sm:inline">Add Transaction</span>
              </Link>
            </Button>
          </SignedIn>

          <SignedOut>
            <SignInButton forceRedirectUrl="/dashboard">
              <Button variant="ghost" size="sm">Login</Button>
            </SignInButton>
            <SignUpButton forceRedirectUrl="/dashboard">
              <Button size="sm">Sign Up</Button>
            </SignUpButton>
          </SignedOut>

          <ThemeSwitcherBtn />

          <SignedIn>
            <UserButton appearance={{ elements: { avatarBox: "size-8" } }} />
          </SignedIn>
        </div>
      </nav>
    </header>
  );
};

export default Header;
