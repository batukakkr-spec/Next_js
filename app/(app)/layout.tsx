import { ProtectedAppLayout } from "@/components/ProtectedAppLayout";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedAppLayout>{children}</ProtectedAppLayout>;
}
