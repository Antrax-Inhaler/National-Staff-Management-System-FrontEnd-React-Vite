// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppRouter from "./v1/AppRouter.tsx";
import "./assets/styles.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: 5,
      retryDelay: 3000,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  // <StrictMode>
  <QueryClientProvider client={queryClient}>
    {/* CAUTION: FOR V1 */}
    <AppRouter />
    {/* <App /> */}
  </QueryClientProvider>
  // </StrictMode>
);
