"use client";

import { ArrowUpRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { AlfaCodeLogo } from "@/components/brand/alfacode-logo";

const links = [
  { href: "#manifiesto", label: "El semillero" },
  { href: "#investigacion", label: "Investigación" },
  { href: "#proyectos", label: "Proyectos" },
  { href: "/equipo", label: "Equipo" },
];

export function AlfaLandingHeader() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const destinationRef = useRef<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && dialog && !dialog.open) dialog.showModal();
    else if (!open && dialog?.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 980px)");
    const resize = () => { if (media.matches) setOpen(false); };
    media.addEventListener("change", resize);
    return () => media.removeEventListener("change", resize);
  }, []);

  function followSection(href: string) {
    destinationRef.current = href.startsWith("#") ? href.slice(1) : null;
    setOpen(false);
  }

  return (
    <>
      <header className="alfa-landing-header" aria-label="Navegación de AlfaCode">
        <a href="#inicio" className="alfa-landing-brand" aria-label="AlfaCode, inicio">
          <AlfaCodeLogo tone="on-blue" width={176} height={53} priority />
        </a>
        <nav className="alfa-landing-desktop-nav" aria-label="Navegación principal">
          {links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
        </nav>
        <Link href="/ingresar" className="alfa-landing-hub-link">Entrar al HUB <ArrowUpRight size={16} aria-hidden="true" /></Link>
        <button ref={triggerRef} type="button" className="alfa-landing-menu-toggle" aria-label="Abrir navegación" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
          <Menu size={24} aria-hidden="true" />
        </button>
      </header>
      <dialog ref={dialogRef} className="alfa-landing-mobile-menu" aria-label="Navegación móvil" onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = event.currentTarget.querySelectorAll<HTMLElement>("a[href], button");
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }} onClose={() => {
        setOpen(false);
        const destination = destinationRef.current;
        destinationRef.current = null;
        if (destination) document.getElementById(destination)?.focus({ preventScroll: true });
        else triggerRef.current?.focus();
      }}>
        {open && <>
          <div className="alfa-landing-mobile-menu-top">
            <AlfaCodeLogo tone="on-blue" width={158} height={48} />
            <button type="button" className="alfa-landing-menu-close" aria-label="Cerrar navegación" onClick={() => setOpen(false)}><X size={25} aria-hidden="true" /></button>
          </div>
          <nav aria-label="Secciones de AlfaCode">
            {links.map((link, index) => <Link key={link.href} href={link.href} onClick={() => followSection(link.href)}><span>0{index + 1}</span>{link.label}<ArrowUpRight size={22} aria-hidden="true" /></Link>)}
          </nav>
          <Link href="/ingresar" className="alfa-landing-mobile-hub" onClick={() => setOpen(false)}>Entrar al HUB <ArrowUpRight size={19} aria-hidden="true" /></Link>
          <p>Research & Software Lab<br /><span>Ideas conectadas. Conocimiento compartido.</span></p>
        </>}
      </dialog>
    </>
  );
}
