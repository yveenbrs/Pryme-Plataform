"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, Building2, Link as LinkIcon, CheckCircle2, ArrowLeft } from "lucide-react"
import Link from "next/link"

const translateError = (errorMsg: string) => {
  const translations: Record<string, string> = {
    "User already registered": "Este e-mail já está cadastrado.",
    "Invalid login credentials": "E-mail ou senha incorretos.",
    "Password should be at least 6 characters": "A senha deve ter no mínimo 6 caracteres.",
    "Email rate limit exceeded": "Limite de envios excedido. Tente mais tarde."
  }
  for (const [eng, pt] of Object.entries(translations)) {
    if (errorMsg.includes(eng)) return pt;
  }
  return errorMsg;
}

const formatName = (text: string) => {
  if (!text) return "";
  return text.toLowerCase().split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.substring(1)
  ).join(' ');
}

export function RegisterScreen() {
  const [mode, setMode] = useState<"NOVA" | "VINCULAR">("NOVA")
  const [name, setName] = useState("")
  const [agencyName, setAgencyName] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg("")

    const formattedName = formatName(name)
    const formattedAgencyName = formatName(agencyName)

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })

    if (authError || !authData.user) {
      setErrorMsg(translateError(authError?.message || "Erro na autenticação."))
      setIsLoading(false)
      return
    }

    let finalAgencyId = ""
    let accessStatus = "PENDENTE"
    let userRole = "AGENTE"

    if (mode === "NOVA") {
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase()
      const { data: agencyData, error: agencyError } = await supabase
        .from('agencias')
        .insert([{ nome_fantasia: formattedAgencyName, codigo_convite: newCode }])
        .select().single()

      if (agencyError) {
        setErrorMsg("Erro ao criar agência.")
        setIsLoading(false)
        return
      }
      finalAgencyId = agencyData.id
      accessStatus = "APROVADO"
      userRole = "PRODUTOR"
    } else {
      const { data: searchAgency, error: searchError } = await supabase
        .from('agencias')
        .select('id')
        .eq('codigo_convite', inviteCode)
        .single()

      if (searchError || !searchAgency) {
        setErrorMsg("Código inválido ou agência não encontrada.")
        setIsLoading(false)
        return
      }
      finalAgencyId = searchAgency.id
    }

    const { error: dbError } = await supabase
      .from('usuarios')
      .insert([{ 
        id: authData.user.id, 
        agencia_id: finalAgencyId,
        nome: formattedName, email, role: userRole, status_acesso: accessStatus 
      }])

    if (dbError) {
      setErrorMsg("Erro ao salvar perfil.")
      setIsLoading(false)
    } else {
      if (mode === "VINCULAR") {
        setShowSuccessModal(true)
      } else {
        window.location.href = "/dashboard"
      }
    }
  }

  return (
    <div className="relative w-full max-w-md p-6 bg-card rounded-2xl border border-white/10 shadow-xl overflow-hidden">

      {/* Botão Voltar */}
      <Link href="/login" className="absolute top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      {showSuccessModal && (
        <div className="absolute inset-0 z-50 bg-card/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
          <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Solicitação enviada!</h2>
          <p className="text-muted-foreground mb-8">
            Seu cadastro foi realizado com sucesso. O gestor da agência precisa aprovar seu acesso.
          </p>
          <Button onClick={() => window.location.href = "/login"} className="w-full">
            Voltar para o Login
          </Button>
        </div>
      )}

      <div className="flex flex-col items-center mb-6 mt-8">
        <h1 className="text-2xl font-bold">Área do produtor</h1>
        <p className="text-muted-foreground text-sm">Crie seu estúdio ou junte-se à equipe</p>
      </div>

      <div className="flex gap-2 mb-6 bg-secondary p-1 rounded-lg">
        <button onClick={() => setMode("NOVA")} className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mode === "NOVA" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>Criar agência</button>
        <button onClick={() => setMode("VINCULAR")} className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mode === "VINCULAR" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>Já tenho código</button>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        {errorMsg && <p className="text-red-500 text-xs text-center bg-red-500/10 p-2 rounded">{errorMsg}</p>}

        <div className="space-y-2">
          <label className="text-sm font-medium">Nome completo</label>
          <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
        </div>

        {mode === "NOVA" ? (
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2"><Building2 className="w-4 h-4" /> Nome da agência</label>
            <Input required value={agencyName} onChange={(e) => setAgencyName(e.target.value)} placeholder="Ex: Pryme Estúdio" />
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2"><LinkIcon className="w-4 h-4" /> Código de convite</label>
            <Input required value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} placeholder="Ex: X8F9A2" maxLength={8} />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">E-mail</label>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={mode === "NOVA" ? "email@agencia.com" : "seu@email.com"}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Senha</label>
          <div className="relative">
            <Input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Button disabled={isLoading} className="w-full h-11 mt-4" type="submit">
          {isLoading ? "Processando..." : (mode === "NOVA" ? "Criar agência" : "Solicitar acesso")}
        </Button>
      </form>
    </div>
  )
}