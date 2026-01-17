import { useState, useEffect } from "react";
import { Play, Square, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StartStopTimerProps {
  onComplete: (hours: number) => void;
  isDisabled?: boolean;
}

export function StartStopTimer({ onComplete, isDisabled }: StartStopTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedSeconds, setPausedSeconds] = useState(0);

  // Load saved timer state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("activeTimer");
    if (saved) {
      const { startTime: savedStart, pausedSeconds: savedPaused, isPaused: savedIsPaused } = JSON.parse(saved);
      setStartTime(new Date(savedStart));
      setPausedSeconds(savedPaused || 0);
      setIsPaused(savedIsPaused || false);
      setIsRunning(true);
    }
  }, []);

  // Update elapsed time every second
  useEffect(() => {
    if (!isRunning || !startTime || isPaused) return;

    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000) - pausedSeconds;
      setElapsedSeconds(Math.max(0, elapsed));
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, startTime, isPaused, pausedSeconds]);

  // Save timer state to localStorage
  useEffect(() => {
    if (isRunning && startTime) {
      localStorage.setItem("activeTimer", JSON.stringify({
        startTime: startTime.toISOString(),
        pausedSeconds,
        isPaused,
      }));
    }
  }, [isRunning, startTime, pausedSeconds, isPaused]);

  const handleStart = () => {
    const now = new Date();
    setStartTime(now);
    setElapsedSeconds(0);
    setPausedSeconds(0);
    setIsPaused(false);
    setIsRunning(true);
  };

  const handlePause = () => {
    if (!isPaused) {
      // Pausing - record when we paused
      setIsPaused(true);
      localStorage.setItem("pauseStart", new Date().toISOString());
    } else {
      // Resuming - add paused time
      const pauseStart = localStorage.getItem("pauseStart");
      if (pauseStart) {
        const pauseDuration = Math.floor((new Date().getTime() - new Date(pauseStart).getTime()) / 1000);
        setPausedSeconds(prev => prev + pauseDuration);
        localStorage.removeItem("pauseStart");
      }
      setIsPaused(false);
    }
  };

  const handleStop = () => {
    if (!startTime) return;
    
    const hours = elapsedSeconds / 3600;
    
    // Only register if at least 1 minute
    if (hours >= 1/60) {
      onComplete(Math.round(hours * 4) / 4); // Round to nearest 0.25 hour
    }
    
    // Reset state
    setIsRunning(false);
    setStartTime(null);
    setElapsedSeconds(0);
    setPausedSeconds(0);
    setIsPaused(false);
    localStorage.removeItem("activeTimer");
    localStorage.removeItem("pauseStart");
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isRunning) {
    return (
      <Button 
        onClick={handleStart} 
        disabled={isDisabled}
        size="lg"
        className="w-full h-14 text-lg gap-3"
      >
        <Play className="h-6 w-6" />
        Start arbeidstid
      </Button>
    );
  }

  return (
    <Card className={cn(
      "border-2",
      isPaused ? "border-orange-500 bg-orange-500/5" : "border-green-500 bg-green-500/5"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant={isPaused ? "secondary" : "default"} className={cn(
                "animate-pulse",
                !isPaused && "bg-green-500"
              )}>
                {isPaused ? "Pause" : "Pågår"}
              </Badge>
              {startTime && (
                <span className="text-xs text-muted-foreground">
                  Startet {startTime.toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
            <p className="text-3xl font-mono font-bold mt-1 tabular-nums">
              {formatTime(elapsedSeconds)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePause}
              className="h-12 w-12"
            >
              {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={handleStop}
              className="h-12 w-12"
            >
              <Square className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
