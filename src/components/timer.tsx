import { formatTime } from "@/lib/utils";

type Props = {
  isRecording: boolean;
  elapsed: number;
};

const Timer = (props: Props) => {
  const { isRecording, elapsed } = props;
  return (
    <span
      className={`font-mono text-4xl font-light tracking-widest tabular-nums ${
        isRecording ? "text-primary" : "text-muted-foreground"
      }`}
    >
      {formatTime(elapsed)}
    </span>
  );
};

export default Timer;
