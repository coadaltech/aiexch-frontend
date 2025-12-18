"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface CaptchaProps {
  onValidate: (isValid: boolean) => void;
}

export function Captcha({ onValidate }: CaptchaProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [userAnswer, setUserAnswer] = useState("");

  const generate = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const ops = ["+", "-", "*"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    
    const result = op === "+" ? num1 + num2 : op === "-" ? num1 - num2 : num1 * num2;
    
    setQuestion(`${num1} ${op} ${num2} = ?`);
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
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-foreground font-medium text-lg">{question}</span>
        <button
          type="button"
          onClick={generate}
          className="text-primary hover:text-primary/80 text-sm"
        >
          Refresh
        </button>
      </div>
      <Input
        type="text"
        placeholder="Enter answer"
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        className="h-10"
        required
      />
    </div>
  );
}