"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ExternalLink, LogOut } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { token, professional, loading, signOut } = useAuth();

  // Guarda de rota: sem sessão válida, vai para o login.
  useEffect(() => {
    if (!loading && !token) {
      router.replace("/entrar");
    }
  }, [loading, token, router]);

  if (loading || !token || !professional) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4 px-5 py-16">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  function handleSignOut() {
    signOut();
    router.replace("/entrar");
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-5 py-4">
          <div className="min-w-0">
            <p className="truncate font-medium text-neutral-900 dark:text-neutral-50">
              {professional.name}
            </p>
            <Link
              href={`/${professional.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-50"
            >
              /{professional.slug}
              <ExternalLink className="size-3" />
            </Link>
          </div>

          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="size-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 py-10">{children}</main>
    </div>
  );
}
