import { Editor, MarkdownView, Notice } from 'obsidian';
import NoteAssistantPlugin from '../plugin';
import { OperationRequest, OperationType, OperationStatus, Suggestion } from '../models/operation';
import { v4 as uuidv4 } from 'uuid';
import { insertAtLine } from '../utils/markdown';
import { SuggestionModal } from '../ui/suggestion-modal';

interface LinkSuggestion {
	note: string;
	line: number;
	explanation: string;
}

export async function suggestLinksCommand(
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
		type: OperationType.SUGGEST_LINKS,
		content: content,
		notePath: file.path,
		timestamp: Date.now(),
		status: OperationStatus.QUEUED
	};

	// Enqueue operation
	await plugin.operationQueue.enqueue(request, async (opRequest) => {
		await executeSuggestLinks(plugin, editor, opRequest);
	});
}

async function executeSuggestLinks(
	plugin: NoteAssistantPlugin,
	editor: Editor,
	request: OperationRequest
): Promise<void> {
	try {
		// Create session
		const sessionId = await plugin.opencodeClient.createSession();
		request.sessionId = sessionId;

		// Get vault note list
		const vaultNotes = plugin.vaultCache.getNoteList();

		// Build prompt
		const prompt = `Please analyze the following note and suggest relevant links to other notes in the vault.

Note content:
${request.content}

Available notes in vault:
${vaultNotes}

For each suggestion, provide:
1. The note to link to (exact title from the list above)
2. The line number where the link should be inserted (0-indexed)
3. A brief explanation of why it's relevant

Format as JSON array.`;

		// Send message
		const response = await plugin.opencodeClient.sendMessage(sessionId, prompt);

		// Parse response
		if (!response || response.trim().length === 0) {
			request.status = OperationStatus.COMPLETED;
			new Notice('No related notes found', 3000);
			return;
		}

		// Try to parse JSON response
		let suggestions: LinkSuggestion[] = [];
		try {
			// Extract JSON from response (might be wrapped in markdown code blocks)
			const jsonMatch = response.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
			const jsonStr = jsonMatch ? jsonMatch[1] : response.trim();
			suggestions = JSON.parse(jsonStr);
		} catch (parseError) {
			// If JSON parsing fails, try to extract suggestions from text
			console.warn('Failed to parse JSON response, trying text parsing:', parseError);
			// Fallback: treat as single suggestion
			const lines = response.split('\n').filter(l => l.trim());
			if (lines.length > 0) {
				suggestions = [{
					note: lines[0],
					line: 0,
					explanation: 'Related note suggestion'
				}];
			}
		}

		if (suggestions.length === 0) {
			request.status = OperationStatus.COMPLETED;
			new Notice('No related notes found', 3000);
			return;
		}

		// Process each suggestion
		for (const linkSuggestion of suggestions) {
			// Create wiki-link format
			const wikiLink = `[[${linkSuggestion.note}]]`;
			
			// Create suggestion object
			const suggestion: Suggestion = {
				id: uuidv4(),
				type: 'link',
				content: wikiLink,
				position: {
					line: linkSuggestion.line,
					ch: 0
				},
				explanation: linkSuggestion.explanation
			};

			// Show suggestion modal and wait for user decision
			await new Promise<void>((resolve) => {
				const modal = new SuggestionModal(
					plugin.app,
					suggestion,
					(suggestion, editedContent) => {
						// Accept handler
						const linkToInsert = editedContent || suggestion.content;
						const currentContent = editor.getValue();
						const newContent = insertAtLine(currentContent, suggestion.position!.line, linkToInsert + ' ');
						editor.setValue(newContent);
						new Notice('Link added to note', 2000);
						resolve();
					},
					() => {
						// Reject handler
						new Notice('Link suggestion rejected', 2000);
						resolve();
					}
				);

				modal.open();
			});
		}

		// Clean up session
		await plugin.opencodeClient.deleteSession(sessionId);
		request.status = OperationStatus.COMPLETED;

	} catch (error: any) {
		request.status = OperationStatus.FAILED;
		
		// Handle errors
		let errorMessage = 'Suggest links operation failed';
		if (error.message?.includes('fetch') || error.message?.includes('ECONNREFUSED')) {
			errorMessage = 'Cannot connect to OpenCode service. Please check that the service is running.';
		} else if (error.message?.includes('timeout')) {
			errorMessage = 'Request timed out. The note may be too large.';
		} else if (error.message) {
			errorMessage = `Error: ${error.message}`;
		}

		new Notice(errorMessage, 5000);
		console.error('Suggest links operation failed:', error);

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
