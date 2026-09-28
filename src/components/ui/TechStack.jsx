import React from 'react';

const technologies = [
  ['React', 'react'],
  ['Flask', 'flask'],
  ['Grafana', 'grafana'],
  ['Prometheus', 'prometheus'],
  ['Docker', 'docker'],
  ['Tailscale', 'tailscale'],
  ['Windows Exporter', 'windows'],
  ['Python', 'python'],
  ['Vite', 'vite'],
  ['Tailwind CSS', 'tailwindcss'],
];

const TechStack = () => (
  <section className="card p-5" aria-label="Powered by">
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <p className="eyebrow">Platform</p>
        <h2 className="text-base font-semibold text-white">Powered by SHMS Stack</h2>
      </div>
      <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">SHMS v3</span>
    </div>
    <div className="flex flex-wrap justify-end gap-2">
      {technologies.map(([label, slug]) => (
        <span key={label} title={label} className="group inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-2 text-[10px] text-zinc-400 transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10 hover:text-white">
          <img src={`https://cdn.simpleicons.org/${slug}/ffffff`} alt="" aria-hidden="true" className="h-3.5 w-3.5 opacity-60 transition group-hover:opacity-100" loading="lazy" />
          {label}
        </span>
      ))}
    </div>
  </section>
);

export default TechStack;
