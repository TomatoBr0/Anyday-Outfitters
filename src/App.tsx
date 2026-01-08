import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./components/MainLayout"; // Import the new layout
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding"; // Import Onboarding
import Closet from "./pages/Closet"; // Import Closet
import AddClothingItem from "./pages/AddClothingItem"; // Import AddClothingItem
import CalendarPage from "./pages/CalendarPage"; // Import CalendarPage
import Favorites from "./pages/Favorites"; // Import Favorites
import Settings from "./pages/Settings"; // Import Settings

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} /> {/* Onboarding route */}
          <Route path="/" element={<MainLayout />}> {/* Use MainLayout for main app routes */}
            <Route index element={<Index />} />
            <Route path="closet" element={<Closet />} />
            <Route path="add-item" element={<AddClothingItem />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="settings" element={<Settings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;