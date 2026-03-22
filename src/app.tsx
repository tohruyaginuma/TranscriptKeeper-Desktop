import { createRoot } from "react-dom/client";
import { useState } from "react";
import { LogIn, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Text from "@/components/text";
import Flex from "@/components/flex";
import Visualizer from "@/components/visualizer";
import Timer from "@/components/timer";
import TimerController from "@/components/timer-controller";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";

const App = () => {
  const {
    user,
    idToken,
    isReady,
    isAuthenticating,
    error: authError,
    signInWithGoogle,
    signOut,
  } = useAuth();
  
  const {
    status,
    error,
    savedPath,
    uploadResult,
    start,
    stopAndSave,
    uploadSavedFile,
    isRecording,
  } = useAudioRecorder();
  const [uploadUrl, setUploadUrl] = useState("http://localhost:8787/upload");

  const signedIn = Boolean(user);
  const displayName = user?.displayName || user?.email || "Signed in user";
  const secondaryText = user?.email || "Google account";
  const visibleToken = idToken ? `${idToken.slice(0, 24)}...` : null;
  const visibleError = authError || error;

  return (
    <Flex gapY="md" className="h-screen">
      <Flex hasPadding gapY="md" itemsCenter justifyCenter className="flex-1">
        <Visualizer isRecording={isRecording} />
        <Timer isRecording={isRecording} elapsed={0} />
        <TimerController
          isRecording={isRecording}
          disabled={!signedIn}
          onRecord={start}
          onStop={stopAndSave}
        />

        {!isReady && <p><strong>Auth:</strong> Checking sign-in state...</p>}
        {!signedIn && isReady && (
          <Button onClick={() => void signInWithGoogle()} disabled={isAuthenticating}>
            <LogIn />
            {isAuthenticating ? "Signing in..." : "Sign in with Google"}
          </Button>
        )}

        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => uploadSavedFile(uploadUrl, idToken ?? undefined)}
            disabled={!savedPath || !signedIn || status === "uploading"}
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
        {signedIn && (
          <>
            <p><strong>User:</strong> {displayName}</p>
            {visibleToken && (
              <p><strong>ID token:</strong> {visibleToken}</p>
            )}
          </>
        )}

        <div style={{ marginBottom: 16 }}>
          <label>
            Upload URL:{" "}
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
              background: "#f5f5f5",
              padding: 12,
              borderRadius: 8,
              whiteSpace: "pre-wrap",
            }}
          >
            {uploadResult}
          </pre>
        )}

        {visibleError && (
          <p style={{ color: "crimson" }}>
            <strong>Error:</strong> {visibleError}
          </p>
        )}
      </Flex>

      <Flex>
        <Separator />
        <Flex hasPadding direction="row" gapX="md">
          <Avatar size="lg">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>AU</AvatarFallback>
          </Avatar>
          <Flex>
            <Text bold>{signedIn ? displayName : "Not signed in"}</Text>
            <Text>{signedIn ? secondaryText : "Use Firebase Auth to continue"}</Text>
          </Flex>
          <Button
            variant="outline"
            size={signedIn ? "icon" : "default"}
            aria-label={signedIn ? "Sign out" : "Sign in with Google"}
            onClick={() => {
              if (signedIn) {
                void signOut();
                return;
              }

              void signInWithGoogle();
            }}
            disabled={!isReady || isAuthenticating}
          >
            {signedIn ? <LogOut /> : <><LogIn /> Sign in</>}
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
};

const root = createRoot(document.body);
root.render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
