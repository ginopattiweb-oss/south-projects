"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("ginopattiweb@gmail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    if (result?.ok) {
      router.push("/dashboard");
    } else {
      setError("Acceso denegado. Credenciales incorrectas.");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="orb-purple" />
      <div className="orb-cyan" />

      <div className="relative z-10 w-full max-w-sm px-4">
        <div className="glass rounded-2xl p-8 space-y-7">
          <div className="space-y-4">
            <div className="size-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center glow-violet">
              <span className="text-sm font-bold text-white">SP</span>
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground tracking-tight">
                SOUTH PROJECTS
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">Sistema Operativo de Negocio</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                required
                autoFocus
                className="bg-white/[0.05] border-white/[0.1] text-foreground placeholder:text-muted-foreground/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                Contraseña
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-white/[0.05] border-white/[0.1] text-foreground placeholder:text-muted-foreground/50"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-400">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white transition-all glow-violet"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Ingresar"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
