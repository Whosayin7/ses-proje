import React, { useState } from "react";
import { Lock, Unlock, ShieldCheck } from "lucide-react";
import AudioInput from "./components/AudioInput";
import KeyVisualizer from "./components/KeyVisualizer";
import { KeyArray } from "./types";
import { encryptText, decryptText } from "./utils/crypto";

export default function App() {
  const [key, setKey] = useState<KeyArray>([]);
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [mode, setMode] = useState<"ENCRYPT" | "DECRYPT">("ENCRYPT");

  const handleKeyGenerated = (newKey: KeyArray) => {
    setKey(newKey);
    // Clear outputs when key changes for security/clarity
    setOutputText("");
  };

  const handleProcess = () => {
    if (key.length === 0) return;

    if (mode === "ENCRYPT") {
      const result = encryptText(inputText, key);
      setOutputText(result);
    } else {
      const result = decryptText(inputText, key);
      setOutputText(result);
    }
  };

  // Copy result to clipboard
  const handleCopy = () => {
    if (outputText) {
      navigator.clipboard.writeText(outputText);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans selection:bg-cyber-primary selection:text-black">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex items-center gap-4 border-b border-cyber-700 pb-6">
          <div className="bg-cyber-primary/10 p-3 rounded-full border border-cyber-primary/20">
            <ShieldCheck className="w-8 h-8 text-cyber-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Ses Şifreleme
            </h1>
            <p className="text-cyber-secondary font-mono text-sm mt-1">
              FFT Tabanlı Dinamik Ses Şifreleme
            </p>
          </div>
        </header>

        {/* Section 1: Key Generation */}
        <section className="bg-cyber-900/50 rounded-2xl p-1">
          <AudioInput onKeyGenerated={handleKeyGenerated} />

          <div className="mt-4">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-mono text-gray-500 uppercase">
                Frekans Spektrumu (Anahtar Kaynağı v.1.0)
              </span>
              <span
                className={`text-xs font-mono px-2 py-1 rounded ${
                  key.length > 0
                    ? "bg-green-900/30 text-green-400 border border-green-800"
                    : "bg-gray-800 text-gray-500"
                }`}
              >
                {key.length > 0 ? "ANAHTAR OLUŞTURULDU" : "ANAHTAR YOK"}
              </span>
            </div>
            <KeyVisualizer data={key} />
          </div>
        </section>

        {/* Section 2: Cryptography */}
        <section
          className={`transition-opacity duration-500 ${
            key.length > 0
              ? "opacity-100"
              : "opacity-50 pointer-events-none grayscale"
          }`}
        >
          <div className="bg-cyber-800 rounded-xl border border-cyber-600 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-cyber-600">
              <button
                onClick={() => setMode("ENCRYPT")}
                className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors
                  ${
                    mode === "ENCRYPT"
                      ? "bg-cyber-700 text-cyber-primary border-b-2 border-cyber-primary"
                      : "text-gray-500 hover:text-gray-300"
                  }
                `}
              >
                <Lock className="w-4 h-4" /> ŞİFRELE
              </button>
              <button
                onClick={() => setMode("DECRYPT")}
                className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors
                  ${
                    mode === "DECRYPT"
                      ? "bg-cyber-700 text-cyber-secondary border-b-2 border-cyber-secondary"
                      : "text-gray-500 hover:text-gray-300"
                  }
                `}
              >
                <Unlock className="w-4 h-4" /> ÇÖZ
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Input */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-gray-400 uppercase">
                  {mode === "ENCRYPT" ? "Düz metin" : "Şifreli Metin"}
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    mode === "ENCRYPT"
                      ? "Gizli mesajınızı yazınız..."
                      : "Şifrelenmiş mesajınızı buraya yazınız..."
                  }
                  className="w-full bg-cyber-900 border border-cyber-600 rounded-lg p-4 text-white placeholder-gray-600 focus:outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary h-32 font-mono text-sm resize-none"
                />
              </div>

              {/* Action Button */}
              <button
                onClick={handleProcess}
                disabled={!inputText || key.length === 0}
                className={`w-full py-3 rounded-lg font-bold text-black uppercase tracking-widest transition-all
                  ${
                    mode === "ENCRYPT"
                      ? "bg-cyber-primary hover:bg-cyber-primary/90 shadow-[0_0_15px_rgba(0,255,157,0.3)]"
                      : "bg-cyber-secondary hover:bg-cyber-secondary/90 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
                `}
              >
                {mode === "ENCRYPT" ? "Mesajı Şifrele" : "Mesajı Çöz"}
              </button>

              {/* Output */}
              <div className="space-y-2 relative">
                <label className="text-xs font-mono text-gray-400 uppercase">
                  Şifreleme Sonucu
                </label>
                <div
                  onClick={handleCopy}
                  className="w-full bg-black/50 border border-cyber-600 border-dashed rounded-lg p-4 text-gray-300 h-32 font-mono text-sm overflow-y-auto break-all cursor-pointer hover:border-gray-400 transition-colors"
                  title="Click to copy"
                >
                  {outputText || (
                    <span className="text-gray-700 italic">
                      Sonuç burada...
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
