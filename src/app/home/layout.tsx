
import { MainLayout } from "@/components/main-layout";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <MainLayout hideNav={true}>{children}</MainLayout>
  );
}
