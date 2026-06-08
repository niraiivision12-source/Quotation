import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement>;

export default function Input(props: Props) {
  return <input {...props} className="border rounded px-3 py-2 w-full" />;
}
