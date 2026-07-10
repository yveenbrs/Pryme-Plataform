"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function TesteConexao() {
  const [status, setStatus] = useState("Iniciando conexão com o Supabase...");

  useEffect(() => {
    async function testar() {
      try {
        const { data, error } = await supabase.from('agencias').select('*');
        
        if (error) {
          setStatus(`❌ Erro na conexão: ${error.message}`);
        } else {
          setStatus(`✅ Conexão bem-sucedida! Retorno: ${JSON.stringify(data)}`);
        }
      } catch (err) {
        setStatus(`❌ Erro inesperado: ${err}`);
      }
    }
    
    testar();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white p-6">
      <div className="bg-neutral-900 p-8 rounded-xl border border-white/10 max-w-lg w-full text-center">
        <h1 className="text-2xl font-bold mb-4 text-[#123B2D]">Status do Banco de Dados</h1>
        <p className="font-mono text-sm break-words bg-black/50 p-4 rounded">{status}</p>
      </div>
    </div>
  );
}