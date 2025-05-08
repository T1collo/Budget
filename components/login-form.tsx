import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SignIn, SignUpButton } from "@clerk/nextjs"

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Welcome to <span className="bg-clip-text text-transparent bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 animate-gradient">SpendWise</span></h1>

      </div>
      <div className="grid gap-6">
        <SignIn/>
      </div>
      
      
    </form>
  )
}
