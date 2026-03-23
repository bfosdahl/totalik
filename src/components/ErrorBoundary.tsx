import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, Bug, Copy } from "lucide-react";
import { logClientError } from "@/utils/logClientError";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  debugData: DebugData | null;
}

interface DebugData {
  timestamp: string;
  url: string;
  lastNetworkRequests: string[];
  componentStack: string;
  errorMessage: string;
}

/**
 * Global Error Boundary - Catches runtime errors and displays a friendly error UI
 * instead of crashing the entire application.
 * 
 * Debug mode: Add ?debug=1 to URL to see extended diagnostics
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    debugData: null,
  };

  private static isDebugMode(): boolean {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("debug") === "1";
  }

  private static captureNetworkRequests(): string[] {
    // Capture recent fetch/XHR from performance API
    try {
      const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      return entries
        .filter(e => e.initiatorType === "fetch" || e.initiatorType === "xmlhttprequest")
        .slice(-5)
        .map(e => `${e.name} (${Math.round(e.duration)}ms)`);
    } catch {
      return [];
    }
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const debugData: DebugData = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      lastNetworkRequests: ErrorBoundary.captureNetworkRequests(),
      componentStack: errorInfo.componentStack || "",
      errorMessage: error.message,
    };

    this.setState({ errorInfo, debugData });

    // Always log to console
    console.group("🔴 Application Error");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    console.error("Component Stack:", errorInfo.componentStack);
    
    if (ErrorBoundary.isDebugMode()) {
      console.group("🔍 Debug Data");
      console.log("Timestamp:", debugData.timestamp);
      console.log("URL:", debugData.url);
      console.log("Last Network Requests:", debugData.lastNetworkRequests);
      console.log("Full Debug Object:", JSON.stringify(debugData, null, 2));
      console.groupEnd();
    }
    
    console.groupEnd();
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, debugData: null });
  };

  private copyDebugData = () => {
    if (this.state.debugData) {
      navigator.clipboard.writeText(JSON.stringify(this.state.debugData, null, 2));
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const { error, errorInfo, debugData } = this.state;
      const isDev = import.meta.env.DEV;
      const isDebugMode = ErrorBoundary.isDebugMode();

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
                <div className="mt-2 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-medium text-destructive mb-2">
                    <Bug className="w-4 h-4" />
                    Feilmelding
                  </div>
                  <p className="text-sm font-mono text-destructive/80 break-all">{error.message}</p>

                  {(isDev || isDebugMode) && errorInfo?.componentStack && (
                    <details className="mt-3">
                      <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                        Vis komponentstack {isDebugMode ? "(debug)" : "(dev)"}
                      </summary>
                      <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-40 p-2 bg-muted rounded">
                        {errorInfo.componentStack}
                      </pre>
                    </details>
                  )}

                  {isDebugMode && debugData && (
                    <details className="mt-3">
                      <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                        🔍 Debug-data (siste nettverksforespørsler)
                      </summary>
                      <div className="mt-2 space-y-2">
                        <p className="text-xs text-muted-foreground">
                          <strong>Tidspunkt:</strong> {debugData.timestamp}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <strong>URL:</strong> {debugData.url}
                        </p>
                        {debugData.lastNetworkRequests.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">Siste nettverksforespørsler:</p>
                            <ul className="text-xs text-muted-foreground list-disc list-inside">
                              {debugData.lastNetworkRequests.map((req, i) => (
                                <li key={i} className="truncate">{req}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={this.copyDebugData}
                          className="mt-2"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Kopier debug-data
                        </Button>
                      </div>
                    </details>
                  )}
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" className="w-full sm:w-auto" onClick={this.handleGoHome}>
                <Home className="w-4 h-4 mr-2" />
                Gå til forsiden
              </Button>
              <Button variant="outline" className="w-full sm:w-auto" onClick={this.handleRetry}>
                Prøv igjen
              </Button>
              <Button className="w-full sm:w-auto" onClick={this.handleReload}>
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
