// export default function Stepper({ steps, current }) {
//   return (
//     <ol className="mb-6 flex items-center gap-3">
//       {steps.map((label, idx) => {
//         const stepNumber = idx + 1;
//         const isActive = current === stepNumber;
//         const isDone = current > stepNumber;
//         return (
//           <li key={label} className="flex items-center gap-2 text-sm">
//             <span
//               className={`grid h-6 w-6 place-items-center rounded-full border text-[11px] font-semibold ${
//                 isActive
//                   ? "border-brand bg-brand text-white"
//                   : isDone
//                   ? "border-brand bg-brand text-white"
//                   : "border-black/20 bg-white text-foreground/70"
//               }`}
//               aria-current={isActive ? "step" : undefined}
//             >
//               {stepNumber}
//             </span>
//             <span className={`${isActive ? "text-brand" : "text-foreground/70"}`}>
//               {label}
//             </span>
//             {idx < steps.length - 1 && (
//               <span className="mx-1 h-px w-6 bg-black/10" aria-hidden />
//             )}
//           </li>
//         );
//       })}
//     </ol>
//   );
// }


import { Check } from "lucide-react";

// A utility to combine class names conditionally
const cn = (...classes) => classes.filter(Boolean).join(' ');

export default function Stepper({ steps, current, completedStep = 0, onStepClick }) {
  return (
    <ol className="mb-12 mt-4 flex w-full items-center">
      {steps.map((label, idx) => {
        const stepNumber = idx + 1;
        const isActive = current === stepNumber;
        // Corrected Logic: A step is completed if its number is less than the current step.
        const isCompleted = stepNumber < current; 
        // const isClickable = isCompleted && !isActive;
        const isClickable = true

        return (
          <li key={label} className="flex w-full items-center">
            <div
              className={cn("flex flex-col items-center gap-1 relative", isClickable && "cursor-pointer")}
              onClick={() => isClickable && onStepClick(stepNumber)}
            >
              <div
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-full border-2 font-semibold transition-colors",
                  isActive && "border-brand bg-brand/10 text-brand",
                  isCompleted && "border-brand bg-brand text-white",
                  !isActive && !isCompleted && "border-gray-300 bg-white text-gray-500"
                )}
                aria-current={isActive ? "step" : undefined}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : stepNumber}
              </div>
              {/* Responsive Label: Hidden on mobile */}
              <p className={cn(
                "hidden text-center text-xs font-medium transition-colors md:block absolute top-full mt-2 whitespace-nowrap",
                isActive && "text-brand",
                isCompleted && "text-gray-600",
                !isActive && !isCompleted && "text-gray-400"
                )}>
                {label}
              </p>
            </div>

            {/* Connector Line */}
            {idx < steps.length - 1 && (
              <div className={cn(
                "mx-2 h-0.5 w-full flex-auto transition-colors",
                isCompleted ? "bg-brand" : "bg-gray-200"
                )} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

