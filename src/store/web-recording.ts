// Web only: keeps a copy of what you said while the browser's speech recogniser listens,
// so Voice entry can play it back. On phones expo-speech-recognition saves the file itself.
let recorder: MediaRecorder | null = null;
let chunks: Blob[] = [];

export async function startWebRecording(): Promise<void> {
  if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunks = [];
    recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    recorder.start();
  } catch {
    recorder = null;
  }
}

// Stops the microphone. Resolves to a playable blob URL, or null if nothing was kept.
export function stopWebRecording(): Promise<string | null> {
  const r = recorder;
  recorder = null;
  if (!r || r.state === 'inactive') return Promise.resolve(null);
  return new Promise((resolve) => {
    r.onstop = () => {
      r.stream.getTracks().forEach((t) => t.stop());
      resolve(chunks.length ? URL.createObjectURL(new Blob(chunks, { type: r.mimeType })) : null);
    };
    r.stop();
  });
}
