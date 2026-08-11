"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, apiFetch } from "@/lib/api";
import type { AuthResponse } from "@/lib/types";

export default function SignInPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const data = await apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      signIn(data);
      toast.success(`Bem-vindo de volta, ${data.professional.name}!`);
      router.replace("/painel");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Não foi possível entrar agora.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-5 py-12 dark:bg-neutral-950">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
          Entrar no Agendei
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Acesse o painel da sua agenda.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <Button type="submit" disabled={submitting} className="h-11 w-full">
            {submitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Ainda não tem conta?{" "}
          <Link
            href="/criar-conta"
            className="font-medium text-neutral-900 underline underline-offset-4 dark:text-neutral-50"
          >
            Criar conta
          </Link>
        </p>
      </div>
    </main>
  );
}
