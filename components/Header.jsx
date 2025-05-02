import React from "react";
import { Button } from "./ui/button";
// import { PenBox, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { checkUser } from "@/lib/checkUser";
import Image from "next/image";
import { GiFluffyFlame } from "react-icons/gi";
import { ThemeSwitcherBtn } from "./ThemeSwitcherBtn";

const Header = async () => {
  await checkUser();

  return (
    <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 hover:-translate-y-2 transform duration-700">
            <GiFluffyFlame className="text-7xl text-blue-400 animate-accordion-up" />
            <h1 className="text-blue-500 text-4xl font-semibold">BudgetIQ</h1>
          </Link>
        </div>

        {/* Navigation Links - Different for signed in/out users */}
        <div className="hidden md:flex items-center space-x-8">
          <SignedOut>
            <a href="#features" className="text-gray-600 hover:text-blue-600">
              Features
            </a>
            <a
              href="#testimonials"
              className="text-gray-600 hover:text-blue-600"
            >
              Testimonials
            </a>
          </SignedOut>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          <SignedIn>
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-blue-600 flex items-center gap-2"
            >
              <Button variant="outline">
                {/* <LayoutDashboard size={18} /> */}
                <span className="hidden md:inline">Dashboard</span>
              </Button>
            </Link>
            <a href="/transaction/create">
              <Button className="flex items-center gap-2">
                {/* <PenBox size={18} /> */}
                <span className="hidden md:inline">Add Transaction</span>
              </Button>
            </a>
          </SignedIn>
          <SignedOut>
            <SignInButton forceRedirectUrl="/dashboard">
              <Button variant="outline">Login</Button>
            </SignInButton>
            <SignUpButton forceRedirectUrl="/dashboard">
              <Button >Sign Up</Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                },
              }}
            />
          </SignedIn>
        </div>
      </nav>
    </header>
  );
};

export default Header;