"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Film, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

export function LoginScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [erro, setErro] = useState("")
  const [carregando, setCarregando] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setCarregando(true)
    setErro("")

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (error) {
      setErro("Credenciais inválidas. Tente novamente.")
      setCarregando(false)
    } else {
      window.location.href = "/dashboard"
    }
  }

  return (
    <div className="w-full max-w-md px-4">
      <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-card p-6 sm:p-8 shadow-xl">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary flex items-center justify-center">
              <Film className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-foreground">Pryme Plataform</span>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm text-center">Plataforma de Producao de Videos</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">

          {/* Mensagem de erro do Supabase */}
          {erro && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
              {erro}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              E-mail
            </label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 sm:h-11 rounded-lg sm:rounded-xl bg-secondary border-white/10 focus:border-primary placeholder:text-muted-foreground text-sm sm:text-base"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Senha
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 sm:h-11 rounded-lg sm:rounded-xl bg-secondary border-white/10 focus:border-primary placeholder:text-muted-foreground pr-10 text-sm sm:text-base"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={carregando}
            className="w-full h-10 sm:h-11 rounded-lg sm:rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all text-sm sm:text-base disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        {/* Rodapé explicativo do Login */}
        <div className="mt-6 space-y-4 text-center">
          <div className="pt-4 border-t border-white/10">
            <p className="text-sm text-muted-foreground">
              É cliente e não tem conta? <br />
              <span className="text-foreground font-medium">Solicite o acesso à sua agência.</span>
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              É produtor ou dono de agência?{" "}
              <Link href="/register" className="text-primary hover:underline font-medium">
                Cadastre seu estúdio
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
