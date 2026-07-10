"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ClipboardList, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react"

export default function BriefingPage() {
    const params = useParams()
    const router = useRouter()
    const projectId = params?.id as string

    const [project, setProject] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // Campos do formulário
    const [objective, setObjective] = useState("")
    const [references, setReferences] = useState("")
    const [duration, setDuration] = useState("")

    // Alertas
    const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)

    useEffect(() => {
        async function fetchProject() {
            if (!projectId) return

            // Busca os detalhes do projeto para mostrar o nome na tela
            const { data, error } = await supabase
                .from("projetos")
                .select("*, agencias(nome_fantasia)")
                .eq("id", projectId)
                .single()

            if (error || !data) {
                setStatus({ type: "error", message: "Projeto não encontrado ou acesso negado." })
            } else {
                setProject(data)
                // Se o briefing já foi respondido antes, preenche os campos automaticamente
                if (data.briefing_answers) {
                    setObjective(data.briefing_answers.objetivo || "")
                    setReferences(data.briefing_answers.referencias || "")
                    setDuration(data.briefing_answers.duracao || "")
                }
            }
            setIsLoading(false)
        }

        fetchProject()
    }, [projectId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!objective || !duration) {
            setStatus({ type: "error", message: "Por favor, preencha os campos obrigatórios (*)." })
            return
        }

        setIsSaving(true)
        setStatus(null)

        const answers = {
            objetivo: objective,
            referencias: references,
            duracao: duration
        }

        // Atualiza o JSONB e altera o status do projeto no banco
        const { error } = await supabase
            .from("projetos")
            .update({
                briefing_answers: answers,
                status: "RESPONDIDO"
            })
            .eq("id", projectId)

        if (error) {
            setStatus({ type: "error", message: `Erro ao salvar: ${error.message}` })
        } else {
            setStatus({ type: "success", message: "Briefing enviado com sucesso! Redirecionando..." })
            setTimeout(() => {
                router.push("/dashboard")
            }, 2500)
        }
        setIsSaving(false)
    }

    if (isLoading) {
        return <div className="h-screen w-full bg-background flex items-center justify-center text-muted-foreground">Carregando formulário...</div>
    }

    return (
        <div className="h-screen w-full bg-background overflow-y-auto flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-xl bg-card border border-white/10 p-6 rounded-2xl shadow-xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                
                {/* Cabeçalho */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <ClipboardList className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Formulário de Briefing</h1>
                            <p className="text-xs text-muted-foreground">Projeto: <strong className="text-primary">{project?.nome || "---"}</strong></p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                    </Button>
                </div>

                {/* Status Popups */}
                {status && (
                    <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm animate-in fade-in ${status.type === "success" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
                        {status.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                        <p>{status.message}</p>
                    </div>
                )}

                {/* Formulário */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground/80">1. Qual o objetivo principal do vídeo? *</label>
                        <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-foreground"
                            placeholder="Ex: Comercial para campanha de tráfego pago no Instagram focado em conversão de vendas do produto X."
                            value={objective}
                            onChange={e => setObjective(e.target.value)}
                            disabled={isSaving}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground/80">2. Links ou referências visuais que você gosta (Opcional)</label>
                        <Input
                            placeholder="Links do YouTube, Instagram, concorrentes..."
                            value={references}
                            onChange={e => setReferences(e.target.value)}
                            disabled={isSaving}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground/80">3. Duração estimada ou formato do material? *</label>
                        <Input
                            placeholder="Ex: 1 vídeo de 30 segundos (Reels/Vertical) e 1 de 1 minuto (Horizontal)."
                            value={duration}
                            onChange={e => setDuration(e.target.value)}
                            disabled={isSaving}
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => router.push("/dashboard")} disabled={isSaving}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="flex-1 font-medium" disabled={isSaving}>
                            {isSaving ? "Enviando..." : "Enviar para Produção"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}