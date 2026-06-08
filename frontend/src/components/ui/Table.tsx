import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function Table({ children }: Props) {
  return <table className="w-full border">{children}</table>;
}
