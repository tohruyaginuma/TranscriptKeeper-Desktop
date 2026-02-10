import { Button } from "@/components/ui/button";
import { Mic, Square } from "lucide-react";

type Props = {
  isRecording: boolean;
  onRecord: () => void;
  onStop: () => void;
};

const TimerController = (props: Props) => {
  const { isRecording, onRecord, onStop } = props;

  return (
    <div className="flex items-center gap-6">
      <Button
        variant="outline"
        size="icon"
        onClick={onRecord}
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

      <Button
        variant="outline"
        size="icon"
        onClick={onStop}
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
  );
};

export default TimerController