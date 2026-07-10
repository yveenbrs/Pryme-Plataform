"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Film, Check, CalendarIcon, ArrowLeft, ArrowRight, Send } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export function BriefingScreen() {
  const [step, setStep] = useState(1)
  const [projectName, setProjectName] = useState("")
  const [serviceType, setServiceType] = useState("")
  const [referenceLinks, setReferenceLinks] = useState("")
  const [deadline, setDeadline] = useState<Date>()

  const totalSteps = 2
  const progress = (step / totalSteps) * 100

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    } else {
      // Handle submit
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b border-white/10 bg-card/50 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary flex items-center justify-center">
              <Film className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-foreground">Pryme</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <div className="flex-1 flex items-start sm:items-center justify-center p-4 py-6 sm:py-4">
          <div className="w-full max-w-xl">
            {/* Progress Section */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Novo Briefing</h1>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Etapa {step} de {totalSteps}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="h-1.5 sm:h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Step Indicators */}
              <div className="flex justify-between mt-4 gap-2">
                {[1, 2].map((s) => (
                  <div 
                    key={s}
                    className={`flex items-center gap-2 ${s <= step ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all shrink-0 ${
                      s < step 
                        ? 'bg-primary text-primary-foreground' 
                        : s === step 
                          ? 'bg-primary/20 text-primary border-2 border-primary' 
                          : 'bg-secondary text-muted-foreground'
                    }`}>
                      {s < step ? <Check className="w-3 h-3 sm:w-4 sm:h-4" /> : s}
                    </div>
                    <span className="text-xs sm:text-sm font-medium hidden xs:block sm:block">
                      {s === 1 ? 'Informacoes Basicas' : 'Detalhes do Projeto'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Card */}
            <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-card p-4 sm:p-6 shadow-xl">
              {step === 1 && (
                <div className="space-y-4 sm:space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="projectName" className="text-sm font-medium text-foreground">
                      Nome do Projeto
                    </label>
                    <Input
                      id="projectName"
                      type="text"
                      placeholder="Ex: Video Institucional 2026"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="h-10 sm:h-11 rounded-lg sm:rounded-xl bg-secondary border-white/10 focus:border-primary placeholder:text-muted-foreground text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="serviceType" className="text-sm font-medium text-foreground">
                      Tipo de Servico
                    </label>
                    <Select value={serviceType} onValueChange={setServiceType}>
                      <SelectTrigger className="h-10 sm:h-11 rounded-lg sm:rounded-xl bg-secondary border-white/10 focus:border-primary w-full text-sm sm:text-base">
                        <SelectValue placeholder="Selecione o tipo de servico" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl bg-card border-white/10">
                        <SelectItem value="video" className="rounded-lg">
                          <div className="flex items-center gap-2">
                            <span>Video</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="fotografia" className="rounded-lg">
                          <div className="flex items-center gap-2">
                            <span>Fotografia</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="design" className="rounded-lg">
                          <div className="flex items-center gap-2">
                            <span>Design</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 sm:space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="referenceLinks" className="text-sm font-medium text-foreground">
                      Links de Referencia
                    </label>
                    <Input
                      id="referenceLinks"
                      type="url"
                      placeholder="https://youtube.com/watch?v=..."
                      value={referenceLinks}
                      onChange={(e) => setReferenceLinks(e.target.value)}
                      className="h-10 sm:h-11 rounded-lg sm:rounded-xl bg-secondary border-white/10 focus:border-primary placeholder:text-muted-foreground text-sm sm:text-base"
                    />
                    <p className="text-xs text-muted-foreground">
                      Cole links de videos ou imagens que servem de inspiracao
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="deadline" className="text-sm font-medium text-foreground">
                      Prazo Desejado
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full h-10 sm:h-11 rounded-lg sm:rounded-xl bg-secondary border-white/10 hover:bg-secondary/80 justify-start text-left font-normal text-sm sm:text-base"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                          {deadline ? (
                            <span className="truncate">{format(deadline, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                          ) : (
                            <span className="text-muted-foreground">Selecione uma data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-xl border-white/10 bg-card" align="start">
                        <Calendar
                          mode="single"
                          selected={deadline}
                          onSelect={setDeadline}
                          locale={ptBR}
                          disabled={(date) => date < new Date()}
                          className="rounded-xl"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-6 sm:mt-8">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 h-10 sm:h-11 rounded-lg sm:rounded-xl border-white/10 hover:bg-secondary text-sm sm:text-base"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <Button
                  onClick={handleNext}
                  className="flex-1 h-10 sm:h-11 rounded-lg sm:rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base"
                >
                  {step === totalSteps ? (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar Briefing
                    </>
                  ) : (
                    <>
                      Avancar
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
