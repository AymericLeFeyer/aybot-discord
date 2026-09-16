import { HomePage } from '@/presentation/pages/HomePage';
import { Toaster } from '@/presentation/components/ui/sonner';
import { TooltipProvider } from '@/presentation/components/ui/tooltip';

export function App() {
  return (
    <TooltipProvider>
      <HomePage />
      <Toaster position="bottom-right" richColors />
    </TooltipProvider>
  );
}
