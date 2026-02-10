import { createRoot } from "react-dom/client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Text from "@/components/text";
import Flex from "@/components/flex";
import Visualizer from "@/components/visualizer";
import Timer from "@/components/timer";
import TimerController from "@/components/timer-controller";
import useApp from "@/hooks/use-app";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";

const App = () => {
  const { isRecording, elapsed, handleRecord, handleStop, handleLogout } =
    useApp();
  return (
    <Flex gapY="md" className="h-screen">
      <Flex hasPadding gapY="md" itemsCenter justifyCenter className="flex-1">
        <Visualizer isRecording={isRecording} />
        <Timer isRecording={isRecording} elapsed={elapsed} />
        <TimerController
          isRecording={isRecording}
          onRecord={handleRecord}
          onStop={handleStop}
        />
      </Flex>
      <Flex>
        <Separator />
        <Flex hasPadding direction="row" gapX="md">
          <Avatar size="lg">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Flex>
            <Text bold>Hoge HogeHoge</Text>
            <Text>Hoge@hoge.com</Text>
          </Flex>
          <Button
            variant="outline"
            size="icon"
            aria-label="Submit"
            onClick={handleLogout}
          >
            <LogOut />
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
};

const root = createRoot(document.body);
root.render(<App />);
