"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Film, Settings, LogOut, Users, UserPlus, ShieldCheck, FolderOpen, CheckCircle2, AlertCircle, Copy, Check, Eye, EyeOff, Edit2, Trash2, Video, Plus, ClipboardList, MessageSquare
} from "lucide-react"

type NavTab = "projetos" | "novo" | "configuracoes" | "gestao"

const translateError = (errorMsg: string) => {
    const translations: Record<string, string> = {
        "User already registered": "Este e-mail já está cadastrado.",
        "Password should be at least 6 characters": "A senha deve ter no mínimo 6 caracteres.",
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

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState<NavTab>("projetos")
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [isCheckingAuth, setIsCheckingAuth] = useState(true)
    const [userProfile, setUserProfile] = useState<any>(null)
    const [agencyData, setAgencyData] = useState<any>(null)
    const [realtimeChannel, setRealtimeChannel] = useState<any>(null)

    // Estados de Gestão
    const [newClientEmail, setNewClientEmail] = useState("")
    const [newClientName, setNewClientName] = useState("")
    const [newClientPassword, setNewClientPassword] = useState("")
    const [showNewClientPassword, setShowNewClientPassword] = useState(false)
    const [pendingAgents, setPendingAgents] = useState<any[]>([])
    const [agencyUsers, setAgencyUsers] = useState<any[]>([])
    const [isManagementLoading, setIsManagementLoading] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [copiedCode, setCopiedCode] = useState(false)

    // Estados de Projetos
    const [projects, setProjects] = useState<any[]>([])
    const [newProjectTitle, setNewProjectTitle] = useState("")
    const [newProjectClientId, setNewProjectClientId] = useState("")
    const [isProjectLoading, setIsProjectLoading] = useState(false)
    const [projectsCount, setProjectsCount] = useState<Record<string, number>>({})

    // Modais
    const [modal, setModal] = useState<{ open: boolean; type: "success" | "error"; title: string; message: string }>({
        open: false, type: "success", title: "", message: ""
    })
    const [editUserModal, setEditUserModal] = useState({ open: false, id: "", nome: "" })
    const [deleteUserModal, setDeleteUserModal] = useState({ open: false, id: "", nome: "" })
    const [deleteProjectModal, setDeleteProjectModal] = useState({ open: false, id: "", nome: "" }) // Novo modal para projetos
    const [viewBriefingModal, setViewBriefingModal] = useState({ open: false, answers: null, projectName: "" })

    const showModal = (type: "success" | "error", title: string, message: string) => {
        setModal({ open: true, type, title, message })
    }

    const closeModal = () => setModal({ ...modal, open: false })

    useEffect(() => {
        let channel: any;

        async function loadData() {
            await new Promise(resolve => setTimeout(resolve, 300));

            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                window.location.href = "/login"
                return
            }

            const { data: profile, error } = await supabase.from('usuarios').select('*').eq('id', session.user.id).single();

            if (error) {
                console.error("Erro no RLS/Banco:", error);
            }
            
            if (!profile) {
                console.log("Perfil não encontrado, deslogando...");
                await supabase.auth.signOut();
                window.location.href = "/login";
                return;
            }

            setUserProfile(profile)

            if (profile?.status_acesso === 'PENDENTE') {
                setIsPending(true)
                setIsCheckingAuth(false)
                return
            }

            if (profile?.agencia_id) {
                const { data: agency } = await supabase.from('agencias').select('*').eq('id', profile.agencia_id).single()
                setAgencyData(agency)

                const { data: users } = await supabase.from('usuarios').select('*').eq('agencia_id', profile.agencia_id)
                const verifiedUsers = users || []
                setAgencyUsers(verifiedUsers.filter(u => u.status_acesso === 'APROVADO'))
                setPendingAgents(verifiedUsers.filter(u => u.status_acesso === 'PENDENTE'))

                const { data: projs } = await supabase.from('projetos').select('*').eq('agencia_id', profile.agencia_id).order('created_at', { ascending: false })
                setProjects(projs || [])

                const counts: Record<string, number> = {}
                projs?.forEach(p => {
                    if (p.cliente_id) counts[p.cliente_id] = (counts[p.cliente_id] || 0) + 1
                })
                setProjectsCount(counts)

                // REALTIME
                channel = supabase.channel('mudancas-agencia', { config: { broadcast: { ack: false } } })
                    .on('broadcast', { event: 'force_logout' }, (payload) => {
                        if (payload.payload.id === profile.id) {
                            supabase.auth.signOut().then(() => window.location.href = "/login")
                        }
                    })
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios', filter: `agencia_id=eq.${profile.agencia_id}` }, (payload) => {
                        if (profile.role === 'CLIENTE') return;
                        if (payload.eventType === 'INSERT') {
                            if (payload.new.status_acesso === 'PENDENTE') setPendingAgents(atual => [...atual, payload.new])
                            else if (payload.new.status_acesso === 'APROVADO') setAgencyUsers(atual => [...atual, payload.new])
                        }
                        else if (payload.eventType === 'UPDATE') {
                            if (payload.new.status_acesso === 'APROVADO') {
                                setPendingAgents(atual => atual.filter(a => a.id !== payload.new.id))
                                setAgencyUsers(atual => {
                                    const exists = atual.find(a => a.id === payload.new.id)
                                    return exists ? atual.map(a => a.id === payload.new.id ? payload.new : a) : [...atual, payload.new]
                                })
                            } else {
                                setAgencyUsers(atual => atual.map(a => a.id === payload.new.id ? payload.new : a))
                            }
                        }
                        else if (payload.eventType === 'DELETE') {
                            setAgencyUsers(atual => atual.filter(a => a.id !== payload.old.id))
                        }
                    })
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'projetos', filter: `agencia_id=eq.${profile.agencia_id}` }, (payload) => {
                        if (payload.eventType === 'INSERT') {
                            if (profile.role === 'CLIENTE' && payload.new.cliente_id !== profile.id) return;
                            setProjects(atual => [payload.new, ...atual])
                            setProjectsCount(prev => ({ ...prev, [payload.new.cliente_id]: (prev[payload.new.cliente_id] || 0) + 1 }))
                        }
                        else if (payload.eventType === 'UPDATE') {
                            setProjects(atual => atual.map(p => p.id === payload.new.id ? payload.new : p))
                        }
                        else if (payload.eventType === 'DELETE') {
                            setProjects(atual => atual.filter(p => p.id !== payload.old.id))
                        }
                    })

                channel.subscribe()
                setRealtimeChannel(channel)
            }

            setIsCheckingAuth(false)
        }

        loadData()

        return () => {
            if (channel) supabase.removeChannel(channel)
        }
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = "/login"
    }

    const copyCode = () => {
        navigator.clipboard.writeText(agencyData?.codigo_convite || "")
        setCopiedCode(true)
        setTimeout(() => setCopiedCode(false), 2000)
    }

    // --- MÉTODOS DE CONTROLE ---
    const approveAgent = async (agentId: string) => {
        const { error } = await supabase.from('usuarios').update({ status_acesso: 'APROVADO' }).eq('id', agentId)
        if (!error) showModal("success", "Agente Aprovado", "O acesso do agente foi liberado.")
    }

    const executeDeleteUser = async () => {
        const userId = deleteUserModal.id;
        setDeleteUserModal({ open: false, id: "", nome: "" });
        if (realtimeChannel) await realtimeChannel.send({ type: 'broadcast', event: 'force_logout', payload: { id: userId } })
        await supabase.from('usuarios').delete().eq('id', userId)
    }

    const updateUserName = async () => {
        if (!editUserModal.nome) return;
        const formatted = formatName(editUserModal.nome);
        await supabase.from('usuarios').update({ nome: formatted }).eq('id', editUserModal.id)
        setEditUserModal({ open: false, id: "", nome: "" })
    }

    const registerClient = async () => {
        if (!newClientName || !newClientEmail || !newClientPassword) return;
        setIsManagementLoading(true)
        const { data: authData, error: authError } = await supabase.auth.signUp({ email: newClientEmail, password: newClientPassword })
        if (authError) {
            showModal("error", "Erro", translateError(authError.message))
            setIsManagementLoading(false)
            return
        }
        const formatted = formatName(newClientName)
        await supabase.from('usuarios').insert([{ id: authData.user?.id, agencia_id: userProfile.agencia_id, nome: formatted, email: newClientEmail, role: 'CLIENTE', status_acesso: 'APROVADO' }])
        setNewClientName(""); setNewClientEmail(""); setNewClientPassword("");
        setIsManagementLoading(false)
    }

    // --- PROJETOS ---
    const createProject = async () => {
        if (!newProjectTitle || !newProjectClientId) return;
        setIsProjectLoading(true)
        const { error } = await supabase.from('projetos').insert([{
            agencia_id: userProfile.agencia_id,
            cliente_id: newProjectClientId,
            nome: newProjectTitle,
            status: 'AGUARDANDO_BRIEFING'
        }])
        if (!error) {
            setNewProjectTitle(""); setNewProjectClientId("");
            showModal("success", "Projeto Criado", "Aguardando o cliente preencher o briefing.")
        } else {
            showModal("error", "Erro ao criar", error.message)
        }
        setIsProjectLoading(false)
    }

    const executeDeleteProject = async () => {
        const projId = deleteProjectModal.id;
        setDeleteProjectModal({ open: false, id: "", nome: "" });
        const { error } = await supabase.from('projetos').delete().eq('id', projId);
        if (error) showModal("error", "Erro ao excluir projeto", error.message);
    }

    if (isCheckingAuth) return <div className="h-screen w-full bg-background" />

    if (isPending) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-background p-6 text-center">
                <ShieldCheck className="w-12 h-12 text-yellow-500 mb-4" />
                <h1 className="text-xl font-bold">Acesso em Análise</h1>
                <Button onClick={handleLogout} className="mt-4" variant="outline">Sair</Button>
            </div>
        )
    }

    const firstName = userProfile?.nome?.split(' ')[0] || "Usuário"
    const isGestor = userProfile?.role === 'PRODUTOR'
    const isEquipe = userProfile?.role === 'PRODUTOR' || userProfile?.role === 'AGENTE'
    const clientsList = agencyUsers.filter(u => u.role === 'CLIENTE')

    return (
        <>
            {/* Modal Principal Sucesso/Erro */}
            {modal.open && (
                <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
                    <div className="bg-card w-full max-w-sm p-6 rounded-2xl border border-white/10 shadow-xl flex flex-col items-center text-center">
                        {modal.type === "success" ? <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" /> : <AlertCircle className="w-16 h-16 text-red-500 mb-4" />}
                        <h2 className="text-xl font-bold mb-2 text-foreground">{modal.title}</h2>
                        <p className="text-sm text-muted-foreground mb-6">{modal.message}</p>
                        <Button onClick={closeModal} className="w-full">Ok, entendi</Button>
                    </div>
                </div>
            )}

            {/* Modal VISUALIZAR BRIEFING RESPONDIDO (Equipe vê) */}
            {viewBriefingModal.open && viewBriefingModal.answers && (
                <div className="fixed inset-0 z-[90] bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-card w-full max-w-md p-6 rounded-2xl border border-white/10 shadow-xl space-y-4">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><MessageSquare className="text-primary" /> Briefing: {viewBriefingModal.projectName}</h2>
                        <div className="space-y-4 pt-2 text-left bg-secondary/30 p-4 rounded-xl border border-white/5">
                            <div>
                                <h4 className="text-xs font-bold text-primary uppercase">Objetivo do Vídeo:</h4>
                                <p className="text-sm text-foreground mt-0.5">{(viewBriefingModal.answers as any).objetivo}</p>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-primary uppercase">Referências Fornecidas:</h4>
                                <p className="text-sm text-foreground mt-0.5">{(viewBriefingModal.answers as any).referencias || "Nenhuma referência enviada."}</p>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-primary uppercase">Duração Estimada:</h4>
                                <p className="text-sm text-foreground mt-0.5">{(viewBriefingModal.answers as any).duracao}</p>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button className="w-full" onClick={() => setViewBriefingModal({ open: false, answers: null, projectName: "" })}>Fechar Detalhes</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modais de Exclusão e Edição */}
            {editUserModal.open && (
                <div className="fixed inset-0 z-[90] bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                    <div className="bg-card w-full max-w-sm p-6 rounded-2xl border border-white/10 shadow-xl">
                        <h2 className="text-lg font-bold mb-4">Editar Usuário</h2>
                        <Input value={editUserModal.nome} onChange={e => setEditUserModal({ ...editUserModal, nome: e.target.value })} />
                        <div className="flex gap-2 justify-end mt-4">
                            <Button variant="outline" onClick={() => setEditUserModal({ open: false, id: "", nome: "" })}>Cancelar</Button>
                            <Button onClick={updateUserName}>Salvar</Button>
                        </div>
                    </div>
                </div>
            )}

            {deleteUserModal.open && (
                <div className="fixed inset-0 z-[90] bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                    <div className="bg-card w-full max-w-sm p-6 rounded-2xl border border-white/10 shadow-xl text-center">
                        <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-lg font-bold mb-2">Remover Acesso?</h2>
                        <p className="text-sm text-muted-foreground mb-6">Remover <strong>{deleteUserModal.nome}</strong> permanentemente?</p>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setDeleteUserModal({ open: false, id: "", nome: "" })}>Cancelar</Button>
                            <Button variant="destructive" className="flex-1" onClick={executeDeleteUser}>Excluir</Button>
                        </div>
                    </div>
                </div>
            )}

            {deleteProjectModal.open && (
                <div className="fixed inset-0 z-[90] bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                    <div className="bg-card w-full max-w-sm p-6 rounded-2xl border border-white/10 shadow-xl text-center">
                        <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-lg font-bold mb-2">Excluir Projeto?</h2>
                        <p className="text-sm text-muted-foreground mb-6">Remover a pasta <strong>{deleteProjectModal.nome}</strong>? Essa ação é irreversível.</p>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setDeleteProjectModal({ open: false, id: "", nome: "" })}>Cancelar</Button>
                            <Button variant="destructive" className="flex-1" onClick={executeDeleteProject}>Excluir</Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="h-screen overflow-hidden bg-background flex flex-col">
                <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 z-50 px-4 w-full sm:w-auto max-w-[calc(100%-2rem)] sm:max-w-none">
                    <div className="flex items-center justify-center gap-1 p-1 rounded-lg sm:rounded-xl bg-card/80 backdrop-blur-md border border-white/10 shadow-lg">
                        <Button variant={activeTab === "projetos" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("projetos")} className="h-9 px-4 text-sm">
                            <FolderOpen className="w-4 h-4 mr-2" /> Meus Projetos
                        </Button>
                        {isEquipe && (
                            <Button variant={activeTab === "gestao" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("gestao")} className="h-9 px-4 text-sm">
                                <Users className="w-4 h-4 mr-2" /> Gestão
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex-1 pt-14 sm:pt-16 overflow-hidden flex">
                    {/* Lateral Atualizada */}
                    <aside className="w-72 bg-sidebar border-r border-sidebar-border flex flex-col pt-16">
                        <div className="p-6 border-b border-sidebar-border flex flex-col gap-1 shrink-0">
                            <p className="text-xs text-muted-foreground font-medium">Olá {firstName}, bem-vindo!</p>
                            <div className="flex items-center gap-3 mt-1">
                                <Film className="w-5 h-5 text-primary" />
                                <span className="text-xl font-bold truncate">{agencyData?.nome_fantasia || "Pryme"}</span>
                            </div>
                        </div>

                        {/* Nova Área de Projetos na Lateral */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-1">
                            <p className="text-xs text-muted-foreground uppercase font-bold mb-3 px-2">Projetos</p>
                            {projects.length === 0 ? (
                                <p className="text-xs text-muted-foreground px-2">Nenhum projeto.</p>
                            ) : (
                                projects.map(proj => (
                                    <div key={proj.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-secondary/50 group cursor-pointer transition-colors" onClick={() => setActiveTab("projetos")}>
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <FolderOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                                            <span className="text-sm truncate text-foreground/80 group-hover:text-foreground">{proj.nome}</span>
                                        </div>
                                        {/* Apenas o Gestor pode excluir pela sidebar */}
                                        {isGestor && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Evita que o clique "vaze" e mude de aba
                                                    setDeleteProjectModal({ open: true, id: proj.id, nome: proj.nome });
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-400 transition-opacity shrink-0"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 mt-auto border-t border-sidebar-border shrink-0">
                            {isGestor && (
                                <div className="mb-4 px-3">
                                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Cód. Convite</p>
                                    <div className="flex items-center gap-3">
                                        <p className="text-lg font-mono text-primary font-bold tracking-wider">{agencyData?.codigo_convite || "---"}</p>
                                        <button onClick={copyCode} className="text-muted-foreground hover:text-foreground">
                                            {copiedCode ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            )}
                            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                                <LogOut className="w-4 h-4" /> Sair da Conta
                            </button>
                        </div>
                    </aside>

                    <main className="flex-1 flex flex-col min-w-0 overflow-y-auto p-4 sm:p-8">

                        {/* ================= GESTÃO ================= */}
                        {activeTab === "gestao" && isEquipe && (
                            <div className="max-w-4xl mx-auto w-full space-y-8 animate-in fade-in pb-20">
                                <h1 className="text-2xl font-bold">Painel de Gestão</h1>
                                {isGestor && (
                                    <section className="bg-card p-6 rounded-2xl border border-white/10 shadow-sm space-y-4">
                                        <div className="flex items-center gap-2"><UserPlus className="text-primary w-5 h-5" /><h2 className="text-lg font-semibold">Novo Cliente</h2></div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <Input placeholder="Nome Completo" value={newClientName} onChange={e => setNewClientName(e.target.value)} />
                                            <Input placeholder="E-mail" value={newClientEmail} onChange={e => setNewClientEmail(e.target.value)} />
                                            <Input type="password" placeholder="Senha Temporária" value={newClientPassword} onChange={e => setNewClientPassword(e.target.value)} />
                                            <Button onClick={registerClient} disabled={isManagementLoading} className="sm:col-span-3">Criar Acesso</Button>
                                        </div>
                                    </section>
                                )}

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <section className="bg-card p-6 rounded-2xl border border-white/10 shadow-sm">
                                        <h2 className="text-lg font-semibold mb-4 border-b border-white/10 pb-2">Equipe Interna</h2>
                                        <div className="space-y-3">
                                            {agencyUsers.filter(u => u.role !== 'CLIENTE').map(user => (
                                                <div key={user.id} className="flex justify-between items-center p-2 group">
                                                    <div><p className="text-sm font-medium">{user.nome}</p><p className="text-xs text-muted-foreground">{user.email}</p></div>
                                                    {isGestor && user.id !== userProfile.id && (
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100"><Button size="icon" variant="ghost" onClick={() => setEditUserModal({ open: true, id: user.id, nome: user.nome })}><Edit2 className="w-3 h-3" /></Button><Button size="icon" variant="ghost" onClick={() => setDeleteUserModal({ open: true, id: user.id, nome: user.nome })}><Trash2 className="w-3 h-3 text-red-400" /></Button></div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                    <section className="bg-card p-6 rounded-2xl border border-white/10 shadow-sm">
                                        <h2 className="text-lg font-semibold mb-4 border-b border-white/10 pb-2">Clientes da Agência</h2>
                                        <div className="space-y-3">
                                            {clientsList.map(client => (
                                                <div key={client.id} className="flex justify-between items-center p-2 group">
                                                    <div><p className="text-sm font-medium">{client.nome}</p><span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-medium">{projectsCount[client.id] || 0} Projetos</span></div>
                                                    {isGestor && (
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100"><Button size="icon" variant="ghost" onClick={() => setEditUserModal({ open: true, id: client.id, nome: client.nome })}><Edit2 className="w-3 h-3" /></Button><Button size="icon" variant="ghost" onClick={() => setDeleteUserModal({ open: true, id: client.id, nome: client.nome })}><Trash2 className="w-3 h-3 text-red-400" /></Button></div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            </div>
                        )}

                        {/* ================= PROJETOS ================= */}
                        {activeTab === "projetos" && (
                            <div className="max-w-5xl mx-auto w-full space-y-8 animate-in fade-in pb-20">
                                <h1 className="text-2xl font-bold">Meus Projetos</h1>

                                {isEquipe && (
                                    <section className="bg-card p-6 rounded-2xl border border-white/10 shadow-sm space-y-4">
                                        <div className="flex items-center gap-2"><Video className="text-primary w-5 h-5" /><h2 className="text-lg font-semibold">Novo Projeto / Pasta</h2></div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                                            <Input placeholder="Nome do Projeto" value={newProjectTitle} onChange={e => setNewProjectTitle(e.target.value)} />
                                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newProjectClientId} onChange={e => setNewProjectClientId(e.target.value)}>
                                                <option value="" disabled>Selecione o Cliente...</option>
                                                {clientsList.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                            </select>
                                            <Button onClick={createProject} disabled={isProjectLoading}>Criar Pasta do Projeto</Button>
                                        </div>
                                    </section>
                                )}

                                {projects.length === 0 ? (
                                    <div className="text-center py-16 bg-card/50 rounded-2xl border border-dashed border-white/10">
                                        <Film className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-foreground mb-1">Nenhum projeto encontrado</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {isEquipe ? "Crie um novo projeto acima para começar." : "A equipe da agência ainda não atribuiu nenhum projeto a você."}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {projects.map(proj => {
                                            const projClient = agencyUsers.find(u => u.id === proj.cliente_id)
                                            return (
                                                <div key={proj.id} className="bg-card p-5 rounded-2xl border border-white/10 shadow-sm flex flex-col h-full justify-between">
                                                    <div>
                                                        <div className="flex justify-between items-start mb-4">
                                                            <Video className="w-5 h-5 text-primary" />
                                                            <span className={`text-[10px] px-2 py-1 rounded-full uppercase font-bold tracking-wider ${proj.status === 'RESPONDIDO' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                                                {proj.status.replace('_', ' ')}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-lg font-bold text-foreground truncate">{proj.nome}</h3>
                                                        {isEquipe && <p className="text-xs text-muted-foreground mt-1">Cliente: {projClient?.nome || 'Não encontrado'}</p>}
                                                    </div>

                                                    <div className="pt-6 mt-auto">
                                                        {/* Redirecionamento Dinâmico para a página de Briefing */}
                                                        {proj.status === 'AGUARDANDO_BRIEFING' && !isEquipe && (
                                                            <Button className="w-full text-xs bg-yellow-600 hover:bg-yellow-700" onClick={() => window.location.href = `/briefing/${proj.id}`}>
                                                                <ClipboardList className="w-3.5 h-3.5 mr-2" /> Responder Briefing
                                                            </Button>
                                                        )}

                                                        {proj.status === 'AGUARDANDO_BRIEFING' && isEquipe && (
                                                            <Button variant="outline" className="w-full text-xs" disabled>
                                                                Aguardando Resposta
                                                            </Button>
                                                        )}

                                                        {proj.status === 'RESPONDIDO' && (
                                                            <Button variant="secondary" className="w-full text-xs border border-white/5" onClick={() => setViewBriefingModal({ open: true, answers: proj.briefing_answers, projectName: proj.nome })}>
                                                                <MessageSquare className="w-3.5 h-3.5 mr-2" /> Ver Respostas
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </>
    )
}