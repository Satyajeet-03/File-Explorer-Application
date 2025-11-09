"use server";

import { intelligentFileSearch } from "@/ai/flows/intelligent-file-search";

export async function searchFilesOnServer(query: string) {
  try {
    // The AI flow searches the server's file system, starting from the project root.
    const result = await intelligentFileSearch({
      filename: query,
      directory: ".",
    });
    return result;
  } catch (error) {
    console.error("Error in intelligentFileSearch:", error);
    // Let's re-throw a simpler error message for the client
    throw new Error("Failed to execute AI search flow.");
  }
}
