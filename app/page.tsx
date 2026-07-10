import Link from "next/link"
import { Film } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mb-6">
        <Film className="w-10 h-10 text-primary-foreground" />
      </div>
      
      <h1 className="text-4xl sm:text-5xl font-bold text-primary mb-4 text-center">
        Pryme Platform
      </h1>
      
      <p className="text-muted-foreground mb-10 text-center max-w-md text-lg">
        Gerencie suas produções audiovisuais e conecte-se com sua equipe.
      </p>

      <Link 
        href="/login" 
        className="w-full max-w-sm h-12 flex items-center justify-center rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all text-lg"
      >
        Acessar Sistema
      </Link>
    </div>
  )
}