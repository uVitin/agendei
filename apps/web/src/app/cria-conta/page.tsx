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

export default function SignUpPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});

    try {
      const data = await apiFetch<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });

      signIn(data);
      toast.success("Conta criada! Seu link é /" + data.professional.slug);
      router.replace("/painel");
    } catch (error) {
      if (error instanceof ApiError && error.issues?.length) {
        setErrors(
          Object.fromEntries(
            error.issues.map((issue) => [issue.field, issue.message]),
          ),
        );
        toast.error("Confira os dados informados.");
      } else {
        toast.error(
          error instanceof ApiError
            ? error.message
            : "Não foi possível criar a conta.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-5 py-12 dark:bg-neutral-950">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
          Criar conta
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Seu link público é gerado a partir do nome.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do negócio</Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Barbearia do Vitor"
              autoComplete="organization"
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
            />
            <p className="text-xs text-neutral-500">Mínimo de 8 caracteres.</p>
            {errors.password && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.password}
              </p>
            )}
          </div>

          <Button type="submit" disabled={submitting} className="h-11 w-full">
            {submitting ? "Criando..." : "Criar conta"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Já tem conta?{" "}
          <Link
            href="/entrar"
            className="font-medium text-neutral-900 underline underline-offset-4 dark:text-neutral-50"
          >
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
