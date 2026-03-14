"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { ShieldCheck, RefreshCw } from "lucide-react";

interface CaptchaProps {
  onValidate: (isValid: boolean) => void;
}

export function Captcha({ onValidate }: CaptchaProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [userAnswer, setUserAnswer] = useState("");

  const generate = () => {
    const useAdd = Math.random() > 0.4;
    let num1: number, num2: number;

    if (useAdd) {
      num1 = Math.floor(Math.random() * 9) + 1;
      num2 = Math.floor(Math.random() * 9) + 1;
    } else {
      num1 = Math.floor(Math.random() * 8) + 2;
      num2 = Math.floor(Math.random() * (num1 - 1)) + 1;
    }

    const op = useAdd ? "+" : "-";
    const result = useAdd ? num1 + num2 : num1 - num2;

    setQuestion(`${num1} ${op} ${num2}`);
    setAnswer(result.toString());
    setUserAnswer("");
  };

  useEffect(() => {
    generate();
  }, []);

  useEffect(() => {
    onValidate(userAnswer === answer && userAnswer !== "");
  }, [userAnswer, answer, onValidate]);

  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary/70" />
          <span className="text-xs text-muted-foreground">
            Verify you&apos;re human
          </span>
        </div>
        <button
          type="button"
          onClick={generate}
          className="text-muted-foreground hover:text-primary transition-colors p-1 rounded hover:bg-primary/10"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex items-center gap-3">
        <div className="bg-background/80 border border-border/30 rounded-md px-4 py-2.5 font-mono font-bold text-foreground text-lg tracking-wider select-none min-w-[100px] text-center">
          {question}
        </div>
        <Input
          type="text"
          inputMode="numeric"
          placeholder="= ?"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          className="h-10 flex-1"
          required
        />
      </div>
    </div>
  );
}
