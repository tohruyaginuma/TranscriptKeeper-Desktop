import { createRoot } from "react-dom/client";
import { useState } from "react";
import { LogIn, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Text from "@/components/text";
import Flex from "@/components/flex";
import Logo from "@/components/logo";
import Visualizer from "@/components/visualizer";
import Timer from "@/components/timer";
import TimerController from "@/components/timer-controller";
import { API_ROOT, WEB_ROOT } from "@/config/constants";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { buildTranscriptUrl, createNote } from "@/lib/api";
import dayjs from "dayjs";

const App = () => {
  const {
    user,
    idToken,
    isReady,
    isAuthenticating,
    isBackendAuthenticated,
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
    isRecording,
  } = useAudioRecorder();
  const [noteId, setNoteId] = useState<string | null>(null);
  const [transcriptId, setTranscriptId] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmittingTranscript, setIsSubmittingTranscript] = useState(false);

  const signedIn = Boolean(user);
  const displayName = user?.displayName || user?.email || "Signed in user";
  const secondaryText = user?.email || "Google account";
  const visibleToken = idToken ? `${idToken.slice(0, 24)}...` : null;
  const visibleError = submissionError || authError || error;
  const noteUrl = noteId ? `${WEB_ROOT}/notes/${noteId}` : null;

  const openExternalUrl = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const submitSavedAudio = async (filePath: string) => {
    if (!idToken) {
      throw new Error("ID token is not available");
    }

    const note = await createNote(idToken, `Recording at ${dayjs().format("DD MMM YYYY")}`);
    setNoteId(note.note_id);

    const transcript = await window.electronAPI.createTranscript(
      filePath,
      buildTranscriptUrl(note.note_id),
      "en",
      idToken
    );
    setTranscriptId(transcript.transcript_id);
  };

  const handleStop = async () => {
    setSubmissionError(null);
    setNoteId(null);
    setTranscriptId(null);

    const filePath = await stopAndSave();

    if (!filePath || !idToken) {
      return;
    }

    try {
      setIsSubmittingTranscript(true);
      await submitSavedAudio(filePath);
    } catch (err) {
      setSubmissionError(
        err instanceof Error ? err.message : "Failed to create transcript"
      );
    } finally {
      setIsSubmittingTranscript(false);
    }
  };

  return (
    <Flex gapY="md" className="h-screen">
      <Flex hasPadding gapY="md" itemsCenter justifyCenter className="flex-1">
        <div className="w-full text-center">
          <Logo
            onClick={() => {
              openExternalUrl(WEB_ROOT);
            }}
          />
        </div>

        <Visualizer isRecording={isRecording} />
        <Timer isRecording={isRecording} elapsed={0} />
        <TimerController
          isRecording={isRecording}
          disabled={!signedIn}
          onRecord={start}
          onStop={() => {
            void handleStop();
          }}
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
            onClick={() => {
              if (!savedPath) {
                return;
              }

              setSubmissionError(null);
              setNoteId(null);
              setTranscriptId(null);
              setIsSubmittingTranscript(true);

              void submitSavedAudio(savedPath)
                .catch((err) => {
                  setSubmissionError(
                    err instanceof Error ? err.message : "Failed to create transcript"
                  );
                })
                .finally(() => {
                  setIsSubmittingTranscript(false);
                });
            }}
            disabled={!savedPath || !signedIn || isSubmittingTranscript}
          >
            Retry note + transcript upload
          </button>
        </div>

        <p><strong>Status:</strong> {status}</p>
        <p><strong>API Root:</strong> {API_ROOT}</p>
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
            <p><strong>Backend auth:</strong> {isBackendAuthenticated ? "synced" : "pending"}</p>
          </>
        )}
        {noteId && <p><strong>Note ID:</strong> {noteId}</p>}
        {transcriptId && <p><strong>Transcript ID:</strong> {transcriptId}</p>}
        {isSubmittingTranscript && <p><strong>Submission:</strong> Creating note and transcript...</p>}
        {transcriptId && noteUrl && (
          <Button
            variant="outline"
            onClick={() => {
              openExternalUrl(noteUrl);
            }}
          >
            See transcript
          </Button>
        )}

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
