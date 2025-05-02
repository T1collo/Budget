import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[100vh] px-4 text-center bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage:
          "url('https://cdn.pixabay.com/photo/2024/07/20/17/12/warning-8908707_1280.png')",
      }}
    >
      <div className="bg-white/80 backdrop-blur-md p-8 rounded-xl shadow-lg">
        <h1 className="text-6xl font-bold gradient-title mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          Oops! The page you&apos;re looking for doesn&apos;t exist or has been
          moved.
        </p>
        <Link href="/">
          <Button>Return Home</Button>
        </Link>
      </div>
    </div>
  );
}
