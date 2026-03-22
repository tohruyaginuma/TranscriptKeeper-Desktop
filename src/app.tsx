import { createRoot } from "react-dom/client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Text from "@/components/text";
import Flex from "@/components/flex";
import Visualizer from "@/components/visualizer";
import Timer from "@/components/timer";
import TimerController from "@/components/timer-controller";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import { useAudioRecorder } from "./hooks/use-audio-recorder";
import { useState } from "react";

const App = () => {
  // const { isRecording, elapsed, handleRecord, handleStop, handleLogout } =
  //   useApp();

  const {
    status,
    error,
    savedPath,
    uploadResult,
    start,
    stopAndSave,
    uploadSavedFile,
    isRecording,
  } = useAudioRecorder()
  const [uploadUrl, setUploadUrl] = useState('http://localhost:8787/upload')

  return (
    <Flex gapY="md" className="h-screen">
      <Flex hasPadding gapY="md" itemsCenter justifyCenter className="flex-1">
        <Visualizer isRecording={isRecording} />
        <Timer isRecording={isRecording} elapsed={0} />
        <TimerController
          isRecording={isRecording}
          onRecord={start}
          onStop={stopAndSave}
        />

<div style={{ marginBottom: 16 }}>
        <button
          onClick={() => uploadSavedFile(uploadUrl)}
          disabled={!savedPath || status === 'uploading'}
        >
          Upload saved file
        </button>
      </div>
              <p><strong>Status:</strong> {status}</p>
              {savedPath && (
        <p>
          <strong>Saved file:</strong> {savedPath}
        </p>
      )}
     <div style={{ marginBottom: 16 }}>
        <label>
          Upload URL:{' '}
          <input
            value={uploadUrl}
            onChange={(e) => setUploadUrl(e.target.value)}
            style={{ width: 420 }}
          />
        </label>
      </div>
      {uploadResult && (
        <pre
          style={{
            background: '#f5f5f5',
            padding: 12,
            borderRadius: 8,
            whiteSpace: 'pre-wrap',
          }}
        >
          {uploadResult}
        </pre>
      )}

      {error && (
        <p style={{ color: 'crimson' }}>
          <strong>Error:</strong> {error}
        </p>
      )}
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
            onClick={() => {}}
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
