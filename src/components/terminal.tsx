"use client";
import { useTerminal } from "@/hooks/use-terminal";
import { useEffect, useRef, useState } from "react";
import { Input } from "./ui/input";

const Prompt = ({ path }: { path: string }) => {
  return (
    <div className="flex gap-2">
      <span className="text-accent">FileExplorer:{path}&gt;</span>
    </div>
  );
};

export function Terminal() {
  const { history, currentPath, executeCommand, isExited } = useTerminal();
  const [input, setInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const endOfHistoryRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endOfHistoryRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim() === "") return;
    executeCommand(input);
    setCommandHistory(prev => [input, ...prev]);
    setHistoryIndex(-1);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setInput(commandHistory[newIndex]);
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setInput(commandHistory[newIndex]);
        } else {
            setHistoryIndex(-1);
            setInput("");
        }
    }
  }

  const handleClick = () => {
    inputRef.current?.focus();
  };


  return (
    <div 
      className="w-full h-full bg-background border rounded-lg shadow-2xl p-4 overflow-y-auto font-code text-sm"
      onClick={handleClick}
    >
      <div className="flex flex-col">
        {history.map((item) => (
          <div key={item.id} className="mb-2">
            {item.command && <div className="flex"><Prompt path={item.path} /><span>{item.command}</span></div>}
            <div className="text-foreground whitespace-pre-wrap animate-in fade-in-0 duration-500">{item.output}</div>
          </div>
        ))}

        {!isExited && (
          <form onSubmit={handleSubmit} className="flex items-center">
            <Prompt path={currentPath} />
            <Input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto ml-2"
              autoFocus
              autoComplete="off"
            />
          </form>
        )}
      </div>
      <div ref={endOfHistoryRef} />
    </div>
  );
}
