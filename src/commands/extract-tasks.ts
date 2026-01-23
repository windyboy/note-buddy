import { Editor, MarkdownView, Notice } from 'obsidian';
import NoteAssistantPlugin from '../plugin';
import { OperationRequest, OperationType, OperationStatus, Suggestion } from '../models/operation';
import { v4 as uuidv4 } from 'uuid';
import { findSection, createSection } from '../utils/markdown';
import { SuggestionModal } from '../ui/suggestion-modal';

export async function extractTasksCommand(
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
		type: OperationType.EXTRACT_TASKS,
		content: content,
		notePath: file.path,
		timestamp: Date.now(),
		status: OperationStatus.QUEUED
	};

	// Enqueue operation
	await plugin.operationQueue.enqueue(request, async (opRequest) => {
		await executeExtractTasks(plugin, editor, opRequest);
	});
}

async function executeExtractTasks(
	plugin: NoteAssistantPlugin,
	editor: Editor,
	request: OperationRequest
): Promise<void> {
	try {
		// Create session
		const sessionId = await plugin.opencodeClient.createSession();
		request.sessionId = sessionId;

		// Build prompt
		const prompt = `Please analyze the following note and extract all action items, tasks, or to-dos mentioned in natural language.

Note content:
${request.content}

Return each task as a markdown checkbox item (- [ ] task description). Only return the task list, no additional explanation.`;

		// Send message
		const response = await plugin.opencodeClient.sendMessage(sessionId, prompt);

		// Parse response
		if (!response || response.trim().length === 0) {
			request.status = OperationStatus.COMPLETED;
			new Notice('No tasks found in this note', 3000);
			return;
		}

		// Parse task items (markdown checkboxes)
		const taskLines = response
			.split('\n')
			.map(line => line.trim())
			.filter(line => line.startsWith('- [ ]') || line.startsWith('- [x]') || line.startsWith('* [ ]') || line.startsWith('* [x]'));

		if (taskLines.length === 0) {
			request.status = OperationStatus.COMPLETED;
			new Notice('No tasks found in this note', 3000);
			return;
		}

		// Format tasks text
		const tasksText = taskLines.join('\n');

		// Find or create Tasks section
		const currentContent = editor.getValue();
		const tasksSection = findSection(currentContent, 'Tasks');

		// Create suggestion
		const suggestion: Suggestion = {
			id: uuidv4(),
			type: 'tasks',
			content: tasksText,
			position: tasksSection
				? { line: tasksSection.endLine + 1, ch: 0 }
				: { line: currentContent.split('\n').length, ch: 0 },
			explanation: tasksSection
				? 'Add tasks to existing Tasks section'
				: 'Create new Tasks section with extracted tasks'
		};

		// Show suggestion modal
		const modal = new SuggestionModal(
			plugin.app,
			suggestion,
			(suggestion, editedContent) => {
				// Accept handler
				const contentToInsert = editedContent || suggestion.content;
				const currentContent = editor.getValue();
				const tasksSection = findSection(currentContent, 'Tasks');

				let newContent: string;
				if (tasksSection) {
					// Insert into existing Tasks section
					const lines = currentContent.split('\n');
					const insertLine = tasksSection.endLine;
					lines.splice(insertLine, 0, contentToInsert);
					newContent = lines.join('\n');
				} else {
					// Create new Tasks section
					newContent = createSection(currentContent, 'Tasks', 2);
					const lines = newContent.split('\n');
					lines.push(contentToInsert);
					newContent = lines.join('\n');
				}

				editor.setValue(newContent);
				new Notice('Tasks added to note', 2000);
				request.status = OperationStatus.COMPLETED;
			},
			() => {
				// Reject handler
				new Notice('Tasks extraction rejected', 2000);
				request.status = OperationStatus.COMPLETED;
			}
		);

		modal.open();

		// Clean up session
		await plugin.opencodeClient.deleteSession(sessionId);

	} catch (error: any) {
		request.status = OperationStatus.FAILED;
		
		// Handle errors
		let errorMessage = 'Extract tasks operation failed';
		if (error.message?.includes('fetch') || error.message?.includes('ECONNREFUSED')) {
			errorMessage = 'Cannot connect to OpenCode service. Please check that the service is running.';
		} else if (error.message?.includes('timeout')) {
			errorMessage = 'Request timed out. The note may be too large.';
		} else if (error.message) {
			errorMessage = `Error: ${error.message}`;
		}

		new Notice(errorMessage, 5000);
		console.error('Extract tasks operation failed:', error);

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
