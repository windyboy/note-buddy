import { EditorView, Decoration, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view';
import { StateField, StateEffect } from '@codemirror/state';
import { Editor } from 'obsidian';
import { Suggestion, Position } from '../models/operation';
import { AnnotationWidget, AnnotationCallbacks } from '../ui/annotations';

interface AnnotationState {
	suggestion: Suggestion;
	position: Position;
	callbacks: AnnotationCallbacks;
}

const addAnnotation = StateEffect.define<AnnotationState>();
const removeAnnotation = StateEffect.define<string>(); // suggestion ID

function annotationField() {
	return StateField.define<Map<string, Decoration>>({
		create() {
			return new Map();
		},
		update(decorations, tr) {
			const newDecorations = new Map(decorations);

			for (const effect of tr.effects) {
				if (effect.is(addAnnotation)) {
					const { suggestion, position, callbacks } = effect.value;
					const widget = new AnnotationWidget(
						suggestion,
						callbacks,
						0, // currentIndex
						1  // totalCount
					);
					const decoration = Decoration.widget({
						widget,
						side: 1,
						block: true
					});
					newDecorations.set(suggestion.id, decoration);
				} else if (effect.is(removeAnnotation)) {
					newDecorations.delete(effect.value);
				}
			}

			return newDecorations;
		},
		provide(field) {
			return EditorView.decorations.from(field, (decorations) => {
				const ranges: Array<{ from: number; to: number; value: Decoration }> = [];
				for (const [id, decoration] of decorations) {
					// Find line for position
					// For now, we'll use a simple approach
					// Note: This is a simplified implementation for MVP
					// In a full implementation, we'd need to map positions to actual line numbers
					ranges.push({ from: 0, to: 0, value: decoration });
				}
				return Decoration.set(ranges);
			});
		}
	});
}

export class AnnotationManager {
	private view: EditorView | null = null;
	private plugin: ViewPlugin<any> | null = null;

	attachToEditor(editor: Editor): void {
		// Get CodeMirror view from Obsidian editor
		// This is a simplified approach - in reality, we need to access the CodeMirror instance
		// Obsidian's editor wraps CodeMirror, so we need to access it differently
		console.log('Annotation manager attached');
	}

	showAnnotation(
		view: EditorView,
		suggestion: Suggestion,
		position: Position,
		callbacks: AnnotationCallbacks
	): void {
		if (!view) return;

		const effect = addAnnotation.of({ suggestion, position, callbacks });
		view.dispatch({
			effects: [effect]
		});
	}

	removeAnnotation(view: EditorView, suggestionId: string): void {
		if (!view) return;

		const effect = removeAnnotation.of(suggestionId);
		view.dispatch({
			effects: [effect]
		});
	}

	createAnnotationExtension() {
		return annotationField();
	}
}
