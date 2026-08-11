"use client";

import Link from "next/link";
import { CalendarDays, Clock, Scissors } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";

const SECTIONS = [
  {
    href: "/painel/servicos",
    icon: Scissors,
    title: "Serviços",
    description: "O que você oferece, com duração e preço",
  },
  {
    href: "/painel/expediente",
    icon: Clock,
    title: "Expediente",
    description: "Os dias e horários em que você atende",
  },
  {
    href: "/painel/agenda",
    icon: CalendarDays,
    title: "Agenda",
    description: "Seus próximos agendamentos",
  },
];

export default function PainelPage() {
  const { professional } = useAuth();

  const firstName = professional?.name.split(" ")[0] ?? "";

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
        Olá, {firstName}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Configure sua agenda e acompanhe os agendamentos.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-xl border border-neutral-200 bg-white p-5 transition-all hover:border-neutral-900 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-50"
          >
            <section.icon className="size-5 text-neutral-400" />
            <p className="mt-3 font-medium text-neutral-900 dark:text-neutral-50">
              {section.title}
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              {section.description}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
