"use client"
// components/RedirectIfSignedIn.tsx
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useEffect } from "react";

const RedirectIfSignedIn = () => {
  const { isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      router.push("/dashboard");
    }
  }, [isSignedIn, router]);

  return null; // Return nothing or you can show a loading spinner during the redirect
};

export default RedirectIfSignedIn;
