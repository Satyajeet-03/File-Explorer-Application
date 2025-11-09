'use server';

/**
 * @fileOverview An AI-powered file search flow that intelligently expands search terms.
 *
 * - intelligentFileSearch - A function that performs file search with LLM-enhanced query expansion.
 * - IntelligentFileSearchInput - The input type for the intelligentFileSearch function.
 * - IntelligentFileSearchOutput - The return type for the intelligentFileSearch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import fs from 'fs';
import path from 'path';

const IntelligentFileSearchInputSchema = z.object({
  filename: z.string().describe('The name or partial name of the file to search for.'),
  directory: z.string().describe('The directory to search in. Defaults to the current directory.'),
});
export type IntelligentFileSearchInput = z.infer<
  typeof IntelligentFileSearchInputSchema
>;

const IntelligentFileSearchOutputSchema = z.object({
  filepaths: z.array(
    z.string().describe('The full paths of the files that match the search query.')
  ),
});
export type IntelligentFileSearchOutput = z.infer<
  typeof IntelligentFileSearchOutputSchema
>;

export async function intelligentFileSearch(
  input: IntelligentFileSearchInput
): Promise<IntelligentFileSearchOutput> {
  return intelligentFileSearchFlow(input);
}

const refineSearchQuery = ai.definePrompt({
  name: 'refineSearchQuery',
  input: {schema: IntelligentFileSearchInputSchema},
  output: {schema: z.string().describe('A refined or expanded search query.')},
  prompt: `You are a search query refinement tool. The user is trying to find files on their system and has provided the following filename:

  {{filename}}

The user is searching within the following directory:

  {{directory}}

Your job is to generate a refined search query to help them find the files they are looking for. Consider:

*   Expanding abbreviations and correcting misspellings.
*   Adding useful synonyms to the query.
*   Making the query case-insensitive.
*   Focusing on key search terms from the filename, and adding search parameters to improve the results.
*   Removing common terms such as "the", "a", or "of".

Return only the refined search query. Do not include any other text or explanation.`,
});

const intelligentFileSearchFlow = ai.defineFlow(
  {
    name: 'intelligentFileSearchFlow',
    inputSchema: IntelligentFileSearchInputSchema,
    outputSchema: IntelligentFileSearchOutputSchema,
  },
  async input => {
    const {filename, directory} = input;

    // Refine the search query using the LLM.
    const {text: refinedQuery} = await refineSearchQuery(input);

    // Perform the file search using the refined query.
    const filepaths: string[] = [];
    const searchDirectory = directory || '.';

    async function searchFiles(dir: string, query: string) {
      const entries = await fs.promises.readdir(dir, {withFileTypes: true});

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await searchFiles(fullPath, query);
        } else if (entry.isFile()) {
          if (entry.name.toLowerCase().includes(query.toLowerCase())) {
            filepaths.push(fullPath);
          }
        }
      }
    }

    await searchFiles(searchDirectory, refinedQuery);

    return {filepaths};
  }
);
