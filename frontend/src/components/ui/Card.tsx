import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function Card({ children }: Props) {
  return <div className="border rounded p-4">{children}</div>;
}
