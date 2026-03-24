type Props = {
  isRecording: boolean;
};

const BAR_COUNT = 32;

const Visualizer = (props: Props) => {
  const { isRecording } = props;
  return (
    <div className="flex items-end justify-center gap-1 h-24 w-64">
      {Array.from({ length: BAR_COUNT }).map((_, i) => {
        const barHeight = 28 + ((i * 19) % 56);
        const peakScale = 0.45 + ((i * 7) % 8) / 10;
        const duration = 900 + (i % 6) * 140;

        return (
        <div
          key={i}
          className={`visualizer-bar w-1.5 rounded-full ${
            isRecording ? "bg-primary" : "bg-muted-foreground/30"
          }`}
          style={{
            height: `${barHeight}px`,
            animationDelay: `${i * 55}ms`,
            animationDuration: `${duration}ms`,
            animationPlayState: isRecording ? "running" : "paused",
            transform: isRecording ? "scaleY(1)" : "scaleY(0.16)",
            ['--visualizer-peak' as string]: peakScale.toString(),
          }}
        />
        );
      })}
    </div>
  );
};

export default Visualizer;
