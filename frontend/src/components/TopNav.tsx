"use client";
import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export function TopNav() {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/?q=${encodeURIComponent(search.trim())}`);
    } else {
      router.push(`/`);
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-margin-desktop h-16 bg-background border-b border-border">
      <div className="flex items-center space-x-gutter">
        <div className="font-sans text-[28px] font-bold text-foreground uppercase tracking-widest">
          SENTINEL<span className="text-neon">_</span>
        </div>
      </div>
      <div className="flex-1 flex justify-start ml-8">
        <form onSubmit={handleSearch} className="relative w-96">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-muted">search</span>
          <input 
            className="w-full bg-surface border border-border rounded-none py-2 pl-10 pr-4 text-foreground placeholder-muted focus:outline-none focus:border-neon font-mono text-body-sm transition-colors" 
            placeholder="Search locations..." 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
      </div>
      <div className="flex items-center space-x-6 text-muted">
        <button className="hover:text-foreground transition-colors p-2 rounded-none active:opacity-80 transition-all">
          <span className="material-symbols-outlined">settings</span>
        </button>
        <button className="hover:text-foreground transition-colors p-2 rounded-none active:opacity-80 transition-all relative">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-neon rounded-none"></span>
        </button>
        <div className="w-8 h-8 rounded-none overflow-hidden border border-border grayscale hover:grayscale-0 transition-all">
          <Image 
            className="w-full h-full object-cover" 
            alt="User profile" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBuqbiY6Rw_Mc7SauoHEBRDJf-Eo4GhwyETgzaCYw60xNPG2sUjAfN4GpYDim_OXhn34JFOKhDgwHswTk9mwDl8EcBHErjD6ZeUrW42WycGaCcpHHfj7u3zF5XgUn6koI4KplZFMPMtC5oohDrRJuUYYuzT-Z8MFcgTY8KNyTkQrf2xqCaiLfBwcAjvzsEMnqtxJwlLJQLI9zy_gBWjmeh498ZPclYczYnihhIYDSZPSuprdBg0jdOqblZuCupwmV-f8zm5XFzA0XuP" 
            width={32}
            height={32}
          />
        </div>
      </div>
    </header>
  );
}
