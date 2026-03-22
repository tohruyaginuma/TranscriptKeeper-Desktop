import { Button } from "@/components/ui/button";
import { FileAudio } from "lucide-react";

type Props = {
  onClick: () => void
}

const Logo = ({ onClick }: Props) => {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className="h-auto px-0 py-0 text-center text-2xl font-semibold tracking-[0.24em]"
    >
			<div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
				<FileAudio className="w-4 h-4 text-primary-foreground" />
			</div>
			<span className="font-semibold text-foreground">Transcript Keeper</span>
    </Button>
  );
};

export default Logo;
