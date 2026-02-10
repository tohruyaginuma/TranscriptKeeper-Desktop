type Props = {
  isRecording: boolean;
};

const Visualizer = (props: Props) => {
  const { isRecording } = props;
  return (
    <div className="flex items-end justify-center gap-1 h-24 w-64">
      {Array.from({ length: 32 }).map((_, i) => (
        <div
          key={i}
          className="w-1.5 rounded-full bg-muted-foreground/30 transition-all duration-300"
          style={{
            height: isRecording
              ? `${Math.max(8, Math.random() * 96)}px`
              : "8px",
            backgroundColor: isRecording ? "var(--primary)" : undefined,
            animationDelay: `${i * 50}ms`,
            transition: isRecording ? "height 150ms ease" : "height 600ms ease",
          }}
        />
      ))}
    </div>
  );
};

export default Visualizer;
