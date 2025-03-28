import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ThemeProvider } from "./hooks/useTheme";

// Pages
import Index from "./pages/Index";
import Forms from "./pages/Forms";
import Create from "./pages/Create";
import View from "./pages/View";
import NotFound from "./pages/NotFound";
import { WakuContextProvider } from "./hooks/useWaku";

const queryClient = new QueryClient();

const status = (text:string, typ:string) => {
  console.log(text) //use toast instead
} 

const App = () => (
  <ThemeProvider>
    <WakuContextProvider updateStatus={status}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/forms" element={<Forms />} />
                <Route path="/create" element={<Create />} />
                <Route path="/view/:id" element={<View />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AnimatePresence>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </WakuContextProvider>
  </ThemeProvider>
);

export default App;
