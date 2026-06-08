import { useAuthStore } from "@/store/auth.store";

export default function Header() {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="border-b p-4">
      <div>{user?.name}</div>
    </header>
  );
}
