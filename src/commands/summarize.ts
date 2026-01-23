import { Editor, MarkdownView, Notice } from 'obsidian';
import NoteAssistantPlugin from '../plugin';
import { OperationRequest, OperationType, OperationStatus, Suggestion } from '../models/operation';
import { v4 as uuidv4 } from 'uuid';
import { getTopInsertionLine, insertAtLine } from '../utils/markdown';
import { SuggestionModal } from '../ui/suggestion-modal';

export async function summarizeCommand(
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
		// Show error: empty note
		new Notice('Note is too short to summarize', 3000);
		return;
	}

	// Create operation request
	const request: OperationRequest = {
		id: uuidv4(),
		type: OperationType.SUMMARIZE,
		content: content,
		notePath: file.path,
		timestamp: Date.now(),
		status: OperationStatus.QUEUED
	};

	// Enqueue operation
	await plugin.operationQueue.enqueue(request, async (opRequest) => {
		await executeSummarize(plugin, editor, opRequest);
	});
}

async function executeSummarize(
	plugin: NoteAssistantPlugin,
	editor: Editor,
	request: OperationRequest
): Promise<void> {
	try {
		// Create session
		const sessionId = await plugin.opencodeClient.createSession();
		request.sessionId = sessionId;

		// Build prompt
		const prompt = `Please provide a concise summary of the following note in 3-5 bullet points. Focus on the main ideas and key takeaways.

Note content:
${request.content}

Return only the bullet points, no additional explanation.`;

		// Send message
		const response = await plugin.opencodeClient.sendMessage(sessionId, prompt);

		// Parse response
		if (!response || response.trim().length === 0) {
			request.status = OperationStatus.COMPLETED;
			new Notice('Note is too short to summarize', 3000);
			return;
		}

		// Parse bullet points
		const bullets = response
			.split('\n')
			.map(line => line.trim())
			.filter(line => line.startsWith('-') || line.startsWith('*'))
			.map(line => line.replace(/^[-*]\s+/, ''));

		if (bullets.length === 0) {
			request.status = OperationStatus.COMPLETED;
			new Notice('No summary bullets found in response', 3000);
			return;
		}

		// Format summary text
		const summaryText = bullets.map(b => `- ${b}`).join('\n');

		// Create suggestion
		const suggestion: Suggestion = {
			id: uuidv4(),
			type: 'summary',
			content: summaryText,
			position: {
				line: getTopInsertionLine(editor.getValue()),
				ch: 0
			},
			explanation: 'Summary of the note'
		};

		// Show suggestion modal with accept/reject/edit
		const modal = new SuggestionModal(
			plugin.app,
			suggestion,
			(suggestion, editedContent) => {
				// Accept handler
				const contentToInsert = editedContent || suggestion.content;
				const insertionLine = getTopInsertionLine(editor.getValue());
				const newContent = insertAtLine(editor.getValue(), insertionLine, contentToInsert + '\n\n');
				editor.setValue(newContent);
				new Notice('Summary added to note', 2000);
				request.status = OperationStatus.COMPLETED;
			},
			() => {
				// Reject handler
				new Notice('Summary rejected', 2000);
				request.status = OperationStatus.COMPLETED;
			}
		);

		modal.open();

		// Clean up session
		await plugin.opencodeClient.deleteSession(sessionId);

	} catch (error: any) {
		request.status = OperationStatus.FAILED;
		
		// Handle errors with user-friendly messages
		let errorMessage = 'Summarize operation failed';
		if (error.message?.includes('fetch') || error.message?.includes('ECONNREFUSED')) {
			errorMessage = 'Cannot connect to OpenCode service. Please check that the service is running.';
		} else if (error.message?.includes('timeout')) {
			errorMessage = 'Request timed out. The note may be too large.';
		} else if (error.message) {
			errorMessage = `Error: ${error.message}`;
		}

		new Notice(errorMessage, 5000);
		console.error('Summarize operation failed:', error);

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
