"use client";

export default function Button({ children, className = "", variant = "primary", ...props }) {
  const base = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-brand text-white hover:opacity-95 focus:ring-brand",
    secondary: "border border-black/10 bg-white text-foreground hover:bg-black/5 focus:ring-accent",
    ghost: "text-accent hover:bg-accent/10 focus:ring-accent",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}


