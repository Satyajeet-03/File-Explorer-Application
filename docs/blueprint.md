# **App Name**: Linux Console Explorer

## Core Features:

- List Directory Contents: Display files and directories in the current path with details like type and size.
- Change Directory: Navigate to specified directories and display the current path.
- File Manipulation: Create, copy, move, rename, and delete files or directories with error handling.
- File Search: Recursively search for files matching a given name and display their paths. Incorporate an LLM tool to intelligently apply substring or case-insensitive matching to expand the search, while avoiding common, unhelpful search terms.
- Permission Management: View and modify file permissions in readable formats using system calls.
- Command Interface: Interactive loop to accept user commands, parse input, and display help information.
- Error Handling and Feedback: Provide clear error messages for invalid commands and access issues, preventing critical system directory deletions.

## Style Guidelines:

- Primary color: Deep Indigo (#4B0082) to evoke a sense of technical depth.
- Background color: Very dark gray (#222222), near black, to improve readability and reduce eye strain in a console environment.
- Accent color: Teal (#008080) to provide contrast and highlight important information such as command prompts and file names.
- Code font: 'Source Code Pro' for consistent and readable display of filenames, paths and code.
- Clear formatting to differentiate file types (directories, files, executables) and sizes.
- Use simple symbols to represent file types in the console listing (e.g., [D] for directory, [F] for file).
- Subtle text-based animations for directory changes and command executions.