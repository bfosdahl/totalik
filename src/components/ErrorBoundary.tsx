import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Global Error Boundary - Catches runtime errors and displays a friendly error UI
 * instead of crashing the entire application.
 * 
 * This helps with:
 * 1. Better user experience when errors occur
 * 2. Easier debugging by showing error details
 * 3. Preventing white screen of death
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
    
    // Log to console with full details for debugging
    console.group("🔴 Application Error");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    console.error("Component Stack:", errorInfo.componentStack);
    console.groupEnd();
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

       const { error, errorInfo } = this.state;
       const isDev = import.meta.env.DEV;

       return (
         <div className="min-h-screen flex items-center justify-center bg-background p-4">
           <Card className="w-full max-w-lg">
             <CardHeader className="text-center">
               <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                 <AlertTriangle className="w-6 h-6 text-destructive" />
               </div>
               <CardTitle className="text-xl">Noe gikk galt</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <p className="text-center text-muted-foreground">
                 Det oppstod en uventet feil. Prøv å laste siden på nytt.
               </p>

               {error && (
                 <details className="mt-4 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                   <summary className="text-sm font-medium text-destructive cursor-pointer">
                     Vis feildetaljer
                   </summary>
                   <div className="mt-3 space-y-2">
                     <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                       <Bug className="w-4 h-4" />
                       Feilmelding
                     </div>
                     <p className="text-sm font-mono text-destructive/80 break-all">
                       {error.message}
                     </p>

                     {isDev && errorInfo?.componentStack && (
                       <details className="mt-2">
                         <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                           Vis komponentstack (dev)
                         </summary>
                         <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-40 p-2 bg-muted rounded">
                           {errorInfo.componentStack}
                         </pre>
                       </details>
                     )}
                   </div>
                 </details>
               )}
             </CardContent>
             <CardFooter className="flex flex-col sm:flex-row gap-2">
               <Button 
                 variant="outline" 
                 className="w-full sm:w-auto" 
                 onClick={this.handleGoHome}
               >
                 <Home className="w-4 h-4 mr-2" />
                 Gå til forsiden
               </Button>
               <Button 
                 variant="outline" 
                 className="w-full sm:w-auto" 
                 onClick={this.handleRetry}
               >
                 Prøv igjen
               </Button>
               <Button 
                 className="w-full sm:w-auto" 
                 onClick={this.handleReload}
               >
                 <RefreshCw className="w-4 h-4 mr-2" />
                 Last siden på nytt
               </Button>
             </CardFooter>
           </Card>
         </div>
       );
    }

    return this.props.children;
  }
}
