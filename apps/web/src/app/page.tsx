import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-6 dark:bg-neutral-950">
      <div className="w-full max-w-xl text-center">
        <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
          Em desenvolvimento
        </span>

        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl dark:text-neutral-50">
          Agendei
        </h1>

        <p className="mt-4 text-balance text-lg text-neutral-600 dark:text-neutral-400">
          O link de agendamento do profissional autônomo. Seu cliente escolhe o
          serviço, vê os horários livres e marca — sem telefonema.
        </p>

        <Link
          href="/barbearia-do-vitor"
          className="mt-8 inline-flex h-11 items-center rounded-lg bg-neutral-900 px-6 text-sm font-medium text-neutral-50 transition-colors hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Ver uma página de exemplo
        </Link>
      </div>
    </main>
  );
}
