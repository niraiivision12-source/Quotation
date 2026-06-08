import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({ children, ...props }: Props) {
  return (
    <button {...props} className="px-4 py-2 rounded border">
      {children}
    </button>
  );
}
