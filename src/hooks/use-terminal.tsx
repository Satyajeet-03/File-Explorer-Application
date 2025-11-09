"use client";

import { useState, useCallback, ReactNode } from "react";
import {
  getInitialFileSystem,
  FSEntity,
  Directory,
  File,
  findNodeByPath,
  resolvePath,
  formatSize,
  formatPermissions,
  getParentAndName,
} from "@/lib/fs-utils";
import { searchFilesOnServer } from "@/app/actions";

export type HistoryItem = {
  id: number;
  command?: string;
  output: ReactNode;
  path: string;
};

export const useTerminal = () => {
  const [fs, setFs] = useState<Directory>(getInitialFileSystem());
  const [history, setHistory] = useState<HistoryItem[]>([
    {
      id: 0,
      path: "~",
      output:
        "Welcome to Linux Console Explorer! Type 'help' to see available commands.",
    },
  ]);
  const [currentPath, setCurrentPath] = useState("~");
  const [isExited, setIsExited] = useState(false);

  const executeCommand = useCallback(
    async (commandStr: string) => {
      if (isExited) return;
      const newHistory: HistoryItem[] = [...history];
      newHistory.push({
        id: history.length,
        command: commandStr,
        path: currentPath,
        output: "",
      });

      const [command, ...args] = commandStr.trim().split(/\s+/);
      let output: ReactNode = "";

      const updateFsAndState = (newFs: Directory) => {
          setFs(newFs);
      }

      switch (command) {
        case "help":
          output = (
            <div className="text-foreground whitespace-pre-wrap">
              {'Available commands:\n'}
              <span className="text-accent">ls</span> - List files and directories{'\n'}
              <span className="text-accent">pwd</span> - Print working directory{'\n'}
              <span className="text-accent">cd {'<dir>'}</span> - Change directory{'\n'}
              <span className="text-accent">home</span> - Go to home directory (~){'\n'}
              <span className="text-accent">touch {'<file>'}</span> - Create a new empty file{'\n'}
              <span className="text-accent">mkdir {'<dir>'}</span> - Create a new directory{'\n'}
              <span className="text-accent">rm {'<file/dir>'}</span> - Remove a file or directory{'\n'}
              <span className="text-accent">cp {'<src> <dest>'}</span> - Copy a file or directory{'\n'}
              <span className="text-accent">mv {'<src> <dest>'}</span> - Move or rename a file or directory{'\n'}
              <span className="text-accent">find {'<name>'}</span> - Search for files on server{'\n'}
              <span className="text-accent">perm {'<file>'}</span> - View file permissions{'\n'}
              <span className="text-accent">chmod {'<mode> <file>'}</span> - Change file permissions (e.g., 755){'\n'}
              <span className="text-accent">clear</span> - Clear the terminal{'\n'}
              <span className="text-accent">exit</span> - Exit the application
            </div>
          );
          break;

        case "ls":
          const node = findNodeByPath(currentPath, fs);
          if (node && node.type === "directory") {
            const allChildren = node.children.sort((a,b) => a.name.localeCompare(b.name));
            output = (
              <div>
                {allChildren.map((child, i) => (
                  <div key={i} className="flex gap-4">
                    {child.type === 'directory' ? 
                    <span className="text-chart-1 w-48">[D] {child.name}/</span> : 
                    <span className="text-primary-foreground w-48">[F] {child.name}</span>}
                    <span className="text-muted-foreground">{formatSize((child as File).size || 0)}</span>
                  </div>
                ))}
              </div>
            );
          } else {
            output = `ls: cannot access '${currentPath}': No such file or directory`;
          }
          break;

        case "pwd":
          output = currentPath;
          break;

        case "cd":
          const targetPath = args[0] || "~";
          if (targetPath === "..") {
            if (currentPath === "~" || currentPath === "/") {
              // no-op
            } else {
              const newPath = currentPath.substring(0, currentPath.lastIndexOf('/')) || '~';
              setCurrentPath(newPath);
            }
          } else {
            const newPath = resolvePath(currentPath, targetPath);
            const targetNode = findNodeByPath(newPath, fs);
            if (targetNode && targetNode.type === "directory") {
              setCurrentPath(newPath);
            } else {
              output = `cd: no such file or directory: ${targetPath}`;
            }
          }
          break;

        case "home":
          setCurrentPath("~");
          break;

        case "mkdir": {
            if (!args[0]) {
                output = "mkdir: missing operand";
                break;
            }
            const newDirPath = resolvePath(currentPath, args[0]);
            const { parent, name } = getParentAndName(newDirPath, fs);

            if (parent && parent.children.every(c => c.name !== name)) {
                const newDir: Directory = { type: 'directory', name, children: [], permissions: '755' };
                parent.children.push(newDir);
                updateFsAndState({...fs});
            } else {
                output = `mkdir: cannot create directory ‘${args[0]}’: File exists or invalid path`;
            }
            break;
        }

        case 'touch': {
            if (!args[0]) {
                output = "touch: missing file operand";
                break;
            }
            const newFilePath = resolvePath(currentPath, args[0]);
            const { parent, name } = getParentAndName(newFilePath, fs);
            if (parent && parent.children.every(c => c.name !== name)) {
                const newFile: File = { type: 'file', name, content: '', size: 0, permissions: '644' };
                parent.children.push(newFile);
                updateFsAndState({...fs});
            } else {
                // In a real shell, touch updates timestamp. Here we just do nothing if file exists.
            }
            break;
        }
        
        case 'rm': {
            if (!args[0]) {
                output = "rm: missing operand";
                break;
            }
            const targetPath = resolvePath(currentPath, args[0]);
            if (targetPath === '/' || targetPath === '~') {
                output = "rm: cannot remove '/' or '~' directories";
                break;
            }
            const { parent, name } = getParentAndName(targetPath, fs);
            if (parent) {
                const index = parent.children.findIndex(c => c.name === name);
                if (index > -1) {
                    parent.children.splice(index, 1);
                    updateFsAndState({...fs});
                } else {
                    output = `rm: cannot remove '${args[0]}': No such file or directory`;
                }
            } else {
                output = `rm: cannot remove '${args[0]}': No such file or directory`;
            }
            break;
        }
        
        case 'perm': {
            if (!args[0]) {
                output = "perm: missing operand";
                break;
            }
            const targetPath = resolvePath(currentPath, args[0]);
            const node = findNodeByPath(targetPath, fs);
            if (node) {
                output = `${formatPermissions(node.permissions)} (${node.permissions}) ${node.name}`;
            } else {
                output = `perm: cannot access '${args[0]}': No such file or directory`;
            }
            break;
        }

        case 'chmod': {
            if (args.length < 2) {
                output = "chmod: missing operand";
                break;
            }
            const [mode, filePath] = args;
            if (!/^[0-7]{3}$/.test(mode)) {
                output = `chmod: invalid mode: '${mode}'`;
                break;
            }
            const targetPath = resolvePath(currentPath, filePath);
            const node = findNodeByPath(targetPath, fs);
            if (node) {
                node.permissions = mode;
                updateFsAndState({...fs});
            } else {
                output = `chmod: cannot access '${filePath}': No such file or directory`;
            }
            break;
        }

        case "find":
          if (!args[0]) {
            output = "find: missing search query";
          } else {
            output = "Searching on server with AI-enhanced query...";
            setHistory(
              newHistory.map((item, i) =>
                i === newHistory.length - 1 ? { ...item, output } : item
              )
            );
            try {
              const result = await searchFilesOnServer(args.join(" "));
              if (result.filepaths && result.filepaths.length > 0) {
                output = (
                  <div>
                    <p>Found {result.filepaths.length} matching file(s) on server:</p>
                    {result.filepaths.map((path, i) => <div key={i}>{path}</div>)}
                  </div>
                );
              } else {
                output = "No matching files found on server.";
              }
            } catch (e: any) {
              output = `Error during search: ${e.message}`;
            }
          }
          break;

        case "clear":
          setHistory([]);
          return;

        case "exit":
          output = "Goodbye!";
          setIsExited(true);
          break;
        
        case "":
            break;

        default:
          output = `bash: command not found: ${command}`;
          break;
      }

      setHistory(
        newHistory.map((item, i) =>
          i === newHistory.length - 1 ? { ...item, output } : item
        )
      );
    },
    [history, currentPath, fs, isExited]
  );

  return { history, currentPath, executeCommand, isExited };
};
