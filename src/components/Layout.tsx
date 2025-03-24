import Sidebar from './Sidebar';
import LayoutWrapper from './LayoutWrapper';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      <Sidebar />
      <LayoutWrapper>{children}</LayoutWrapper>
    </div>
  );
}