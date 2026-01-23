import { Editor, MarkdownView, Notice } from 'obsidian';
import NoteAssistantPlugin from '../plugin';
import { OperationRequest, OperationType, OperationStatus, Suggestion } from '../models/operation';
import { v4 as uuidv4 } from 'uuid';
import { insertAtLine } from '../utils/markdown';
import { SuggestionModal } from '../ui/suggestion-modal';

interface StructureSuggestion {
	type: string;
	content: string;
	line: number;
	explanation: string;
}

export async function improveStructureCommand(
	plugin: NoteAssistantPlugin,
	editor: Editor,
	view: MarkdownView
): Promise<void> {
	const file = view.file;
	if (!file) {
		console.error('No active file');
		return;
	}

	// Get selected text or full note content
	const selectedText = plugin.getSelectedText(editor);
	const content = selectedText || editor.getValue();

	if (!content || content.trim().length === 0) {
		new Notice('Note is empty', 3000);
		return;
	}

	// Create operation request
	const request: OperationRequest = {
		id: uuidv4(),
		type: OperationType.IMPROVE_STRUCTURE,
		content: content,
		notePath: file.path,
		timestamp: Date.now(),
		status: OperationStatus.QUEUED
	};

	// Enqueue operation
	await plugin.operationQueue.enqueue(request, async (opRequest) => {
		await executeImproveStructure(plugin, editor, opRequest);
	});
}

async function executeImproveStructure(
	plugin: NoteAssistantPlugin,
	editor: Editor,
	request: OperationRequest
): Promise<void> {
	try {
		// Create session
		const sessionId = await plugin.opencodeClient.createSession();
		request.sessionId = sessionId;

		// Build prompt
		const prompt = `Please analyze the structure of the following note and suggest specific improvements such as:
- Adding headings to organize sections
- Splitting long paragraphs
- Improving logical flow

Note content:
${request.content}

For each suggestion, provide:
1. The type of change (heading, paragraph_split, etc.)
2. The exact content to insert
3. The line number where it should be inserted (0-indexed)
4. A brief explanation

Format as JSON array.`;

		// Send message
		const response = await plugin.opencodeClient.sendMessage(sessionId, prompt);

		// Parse response
		if (!response || response.trim().length === 0) {
			request.status = OperationStatus.COMPLETED;
			new Notice('Note structure looks good', 3000);
			return;
		}

		// Try to parse JSON response
		let suggestions: StructureSuggestion[] = [];
		try {
			// Extract JSON from response (might be wrapped in markdown code blocks)
			const jsonMatch = response.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
			const jsonStr = jsonMatch ? jsonMatch[1] : response.trim();
			suggestions = JSON.parse(jsonStr);
		} catch (parseError) {
			// If JSON parsing fails, try to extract suggestions from text
			console.warn('Failed to parse JSON response, trying text parsing:', parseError);
			// Fallback: treat as single suggestion
			suggestions = [{
				type: 'improvement',
				content: response,
				line: 0,
				explanation: 'Structure improvement suggestion'
			}];
		}

		if (suggestions.length === 0) {
			request.status = OperationStatus.COMPLETED;
			new Notice('Note structure looks good', 3000);
			return;
		}

		// Process suggestions sequentially (one at a time)
		await processSuggestionsSequentially(plugin, editor, suggestions, request);

		// Clean up session
		await plugin.opencodeClient.deleteSession(sessionId);
		request.status = OperationStatus.COMPLETED;

	} catch (error: any) {
		request.status = OperationStatus.FAILED;
		
		// Handle errors
		let errorMessage = 'Improve structure operation failed';
		if (error.message?.includes('fetch') || error.message?.includes('ECONNREFUSED')) {
			errorMessage = 'Cannot connect to OpenCode service. Please check that the service is running.';
		} else if (error.message?.includes('timeout')) {
			errorMessage = 'Request timed out. The note may be too large.';
		} else if (error.message) {
			errorMessage = `Error: ${error.message}`;
		}

		new Notice(errorMessage, 5000);
		console.error('Improve structure operation failed:', error);

		// Clean up session if created
		if (request.sessionId) {
			try {
				await plugin.opencodeClient.deleteSession(request.sessionId);
			} catch (cleanupError) {
				console.error('Failed to cleanup session:', cleanupError);
			}
		}
	}
}

async function processSuggestionsSequentially(
	plugin: NoteAssistantPlugin,
	editor: Editor,
	suggestions: StructureSuggestion[],
	request: OperationRequest
): Promise<void> {
	for (let i = 0; i < suggestions.length; i++) {
		const structSuggestion = suggestions[i];
		const currentIndex = i;
		const totalCount = suggestions.length;

		// Create suggestion object
		const suggestion: Suggestion = {
			id: uuidv4(),
			type: structSuggestion.type,
			content: structSuggestion.content,
			position: {
				line: structSuggestion.line,
				ch: 0
			},
			explanation: `${structSuggestion.explanation} (Suggestion ${currentIndex + 1} of ${totalCount})`
		};

		// Show suggestion modal and wait for user decision
		await new Promise<void>((resolve) => {
			const modal = new SuggestionModal(
				plugin.app,
				suggestion,
				(suggestion, editedContent) => {
					// Accept handler
					const contentToInsert = editedContent || suggestion.content;
					const currentContent = editor.getValue();
					const newContent = insertAtLine(currentContent, suggestion.position!.line, contentToInsert + '\n');
					editor.setValue(newContent);
					new Notice(`Suggestion ${currentIndex + 1} of ${totalCount} applied`, 2000);
					resolve();
				},
				() => {
					// Reject handler
					new Notice(`Suggestion ${currentIndex + 1} of ${totalCount} skipped`, 2000);
					resolve();
				}
			);

			modal.open();
		});
	}
}
