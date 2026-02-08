import { createRoot } from "react-dom/client";
import { useState, useEffect, useCallback } from "react"

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Text from "@/components/text";
import  Flex from "@/components/flex";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Mic, Square } from "lucide-react"

function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  
const App = () => {
    const [isRecording, setIsRecording] = useState(false)
    const [elapsed, setElapsed] = useState(0)

    const handleRecord = () => {
        setIsRecording(true)
    }

    const handleStop = () => {
        setIsRecording(false)
    }
    
    const logout = () => {
        console.log("logout")
    }

    useEffect(() => {
        if (!isRecording) return
        const id = setInterval(() => setElapsed((s) => s + 1), 1000)
        return () => clearInterval(id)
      }, [isRecording])

	return (
		<Flex gapY="md" className="h-screen">
            <Flex noPadding gapY="sm">
                  {/* Waveform visualizer */}
                  <div className="flex items-end justify-center gap-1 h-24 w-64">
        {Array.from({ length: 32 }).map((_, i) => (
          <div
            key={i}
            className="w-1.5 rounded-full bg-muted-foreground/30 transition-all duration-300"
            style={{
              height: isRecording
                ? `${Math.max(8, Math.random() * 96)}px`
                : "8px",
              backgroundColor: isRecording
                ? "var(--primary)"
                : undefined,
              animationDelay: `${i * 50}ms`,
              transition: isRecording
                ? "height 150ms ease"
                : "height 600ms ease",
            }}
          />
        ))}
      </div>
                  {/* Timer */}
      <span
        className={`font-mono text-4xl font-light tracking-widest tabular-nums ${
          isRecording ? "text-primary" : "text-muted-foreground"
        }`}
      >
 {formatTime(elapsed)}
      </span>
            {/* Controls */}
            <div className="flex items-center gap-6">
        {/* Record button */}
        <Button
          variant="outline"
          size="icon"
          onClick={handleRecord}
          disabled={isRecording}
          aria-label="Recording"
          className={`relative h-16 w-16 rounded-full border-2 transition-all duration-300 ${
            isRecording
              ? "border-primary/40 text-primary"
              : "border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary"
          }`}
        >
          {isRecording && (
            <>
              <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
              <span className="absolute inset-0 rounded-full bg-primary/10" />
            </>
          )}
          <Mic className="relative z-10 h-6 w-6" />
          <span className="sr-only">Recording</span>
        </Button>

        {/* Stop button */}
        <Button
          variant="outline"
          size="icon"
          onClick={handleStop}
          disabled={!isRecording}
          aria-label="Stop"
          className={`h-16 w-16 rounded-full border-2 transition-all duration-300 ${
            isRecording
              ? "border-foreground/40 text-foreground hover:border-foreground hover:text-foreground"
              : "border-muted-foreground/20 text-muted-foreground/40"
          }`}
        >
          <Square className="h-5 w-5" />
          <span className="sr-only">Stop</span>
        </Button>
        </div>
            </Flex>
            <Flex noPadding grow />
            <Flex noPadding>
            <Separator />
            <Flex direction="row" noPadding gapX="md" className="pt-4">
                <Avatar size="lg">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <Flex noPadding>
                    <Text bold>Hoge HogeHoge</Text>
                    <Text>Hoge@hoge.com</Text>
                </Flex>
                <Button variant="outline" size="icon" aria-label="Submit">
                <LogOut onClick={logout} />
      </Button>
            </Flex>
            </Flex>
		</Flex>
	);
};

const root = createRoot(document.body);
root.render(<App />);
