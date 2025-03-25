import { Header } from '@/components/Header'

export default async function PurchasesLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <div>{children}</div>
    )
  }