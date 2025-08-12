export function Card({ children, className = "" }) {
  return (
    <div className={`rounded-lg border border-black/10 bg-white ${className}`}>{children}</div>
  );
}

export function CardHeader({ children, className = "" }) {
  return <div className={`border-b bg-black/5 px-5 py-3 ${className}`}>{children}</div>;
}

export function CardContent({ children, className = "" }) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>;
}



