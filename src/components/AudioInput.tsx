import React, { useState, useRef, useEffect } from "react";
import { Mic, Upload, StopCircle } from "lucide-react";
import { generateKeyFromAudioBuffer } from "../utils/math";
import { KeyArray } from "../types";

interface Props {
  onKeyGenerated: (key: KeyArray) => void;
}

const AudioInput: React.FC<Props> = ({ onKeyGenerated }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  // Manage Audio URL lifecycle to prevent memory leaks
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const processBlob = async (blob: Blob) => {
    try {
      // Create URL for playback
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      const arrayBuffer = await blob.arrayBuffer();
      const audioCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const key = generateKeyFromAudioBuffer(audioBuffer);
      onKeyGenerated(key);
      setError(null);
    } catch (e) {
      console.error(e);
      setError(
        "Failed to process audio data. Try a longer recording or valid WAV file."
      );
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        await processBlob(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordTime(0);
      setFileName(null);
      setAudioUrl(null);

      timerRef.current = window.setInterval(() => {
        setRecordTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setError("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    processBlob(file);
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recorder Card */}
        <div
          className={`
                p-6 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center gap-4 cursor-pointer
                ${
                  isRecording
                    ? "bg-red-500/10 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                    : "bg-cyber-800 border-cyber-600 hover:border-cyber-primary hover:bg-cyber-800/80"
                }
            `}
          onClick={() => (isRecording ? stopRecording() : startRecording())}
        >
          {isRecording ? (
            <StopCircle className="w-12 h-12 text-red-500 animate-pulse" />
          ) : (
            <Mic className="w-12 h-12 text-cyber-primary" />
          )}
          <div className="text-center">
            <p className="font-bold text-lg text-white">
              {isRecording ? "Stop Recording" : "Sesini Kaydet"}
            </p>
            <p className="text-sm font-mono text-gray-400 mt-1">
              {isRecording ? formatTime(recordTime) : "Kaydı Başlat"}
            </p>
          </div>
        </div>

        {/* Upload Card */}
        <div
          className="p-6 rounded-xl border border-cyber-600 bg-cyber-800 hover:border-cyber-accent hover:bg-cyber-800/80 transition-all duration-300 flex flex-col items-center justify-center gap-4 cursor-pointer relative"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="audio/*"
            className="hidden"
          />
          <Upload className="w-12 h-12 text-cyber-accent" />
          <div className="text-center">
            <p className="font-bold text-lg text-white">Ses Dosyanı Yükle</p>
            <p className="text-sm font-mono text-gray-400 mt-1">
              {fileName ? fileName : "WAV/MP3 Seç"}
            </p>
          </div>
        </div>
      </div>

      {/* Audio Player */}
      {audioUrl && (
        <div className="w-full bg-cyber-800/50 border border-cyber-600 rounded-xl p-3 flex flex-col gap-2">
          <span className="text-xs font-mono text-gray-400 uppercase ml-1">
          Ses Önizlemesi
          </span>
          <audio controls src={audioUrl} className="w-full h-8" />
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm flex items-center gap-2">
          <span className="block w-2 h-2 rounded-full bg-red-500"></span>
          {error}
        </div>
      )}
    </div>
  );
};

export default AudioInput;
