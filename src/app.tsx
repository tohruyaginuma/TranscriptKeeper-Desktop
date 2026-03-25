import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
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
  const [elapsed, setElapsed] = useState(0);

  const signedIn = Boolean(user);
  const displayName = user?.displayName || user?.email || "Signed in user";
  const secondaryText = user?.email || "Google account";
  const avatarUrl = user?.photoURL || undefined;
  const avatarFallback = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'AU'
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
    setElapsed(0);
  };

  useEffect(() => {
    if (!isRecording) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setElapsed((currentElapsed) => currentElapsed + 1);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isRecording]);

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
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-primary/10 rounded-full blur-xl" />
      
      <Flex hasPadding gapY="md" itemsCenter justifyCenter className="flex-1">
        <div className="w-full text-center">
          <Logo
            onClick={() => {
              openExternalUrl(WEB_ROOT);
            }}
          />
        </div>

        <Visualizer isRecording={isRecording} />
        <Timer isRecording={isRecording} elapsed={elapsed} />
        <TimerController
          isRecording={isRecording}
          disabled={!signedIn}
          onRecord={() => {
            setElapsed(0);
            void start();
          }}
          onStop={() => {
            void handleStop();
          }}
        />

        <p><strong>Status:</strong> {status}</p>

        {noteId && <p className="text-muted-foreground"><strong>Note has been created with ID:</strong> {noteId}</p>}
        {transcriptId && <p className="text-muted-foreground"><strong>Transcript has been created with ID:</strong> {transcriptId}</p>}
        {isSubmittingTranscript && <p className="text-muted-foreground"><strong>Submission:</strong> Creating note and transcript...</p>}
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
        {!isReady && <p><strong>Auth:</strong> Checking sign-in state...</p>}

        <Flex hasPaddingXl direction="row" gapX="md">
        {!signedIn && isReady ? <>
          <Button
								variant="outline"
								className="w-full"
                onClick={() => void signInWithGoogle()} disabled={isAuthenticating} 
							>
								<svg
									className="mr-2 h-4 w-4"
									viewBox="0 0 24 24"
									aria-hidden="true"
									aria-label="Google"
								>
									<path
										fill="currentColor"
										d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
									/>
									<path
										fill="currentColor"
										d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
									/>
									<path
										fill="currentColor"
										d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
									/>
									<path
										fill="currentColor"
										d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
									/>
								</svg>
								{isAuthenticating ? "Signing in..." : "Continue with Google"}
							</Button>
        </> : <>
        <Avatar size="lg">
            <AvatarImage src={avatarUrl} alt={displayName} referrerPolicy="no-referrer" />
            <AvatarFallback>{avatarFallback}</AvatarFallback>
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
        </>}
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
