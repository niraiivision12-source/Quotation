import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyPhone({ mobile }: { mobile: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(mobile);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 group/copy"
      title="Copy number"
    >
      <span className="text-foreground/70">{mobile}</span>
      <span className="opacity-0 group-hover/copy:opacity-100 transition-opacity">
        {copied
          ? <Check size={12} className="text-green-500" />
          : <Copy size={12} className="text-muted-foreground" />
        }
      </span>
    </button>
  );
}
