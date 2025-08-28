export default function Stepper({ steps, current }) {
  return (
    <ol className="mb-6 flex items-center gap-3">
      {steps.map((label, idx) => {
        const stepNumber = idx + 1;
        const isActive = current === stepNumber;
        const isDone = current > stepNumber;
        return (
          <li key={label} className="flex items-center gap-2 text-sm">
            <span
              className={`grid h-6 w-6 place-items-center rounded-full border text-[11px] font-semibold ${
                isActive
                  ? "border-brand bg-brand text-white"
                  : isDone
                  ? "border-brand bg-brand text-white"
                  : "border-black/20 bg-white text-foreground/70"
              }`}
              aria-current={isActive ? "step" : undefined}
            >
              {stepNumber}
            </span>
            <span className={`${isActive ? "text-brand" : "text-foreground/70"}`}>
              {label}
            </span>
            {idx < steps.length - 1 && (
              <span className="mx-1 h-px w-6 bg-black/10" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}



