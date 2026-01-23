export interface Heading {
	level: number;
	text: string;
	line: number;
}

export interface Section {
	heading: Heading | null;
	startLine: number;
	endLine: number;
	content: string;
}

/**
 * Parse headings from markdown content
 */
export function parseHeadings(content: string): Heading[] {
	const lines = content.split('\n');
	const headings: Heading[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const match = line.match(/^(#{1,6})\s+(.+)$/);
		if (match) {
			headings.push({
				level: match[1].length,
				text: match[2].trim(),
				line: i
			});
		}
	}

	return headings;
}

/**
 * Find a section by heading text (case-insensitive)
 */
export function findSection(content: string, headingText: string): Section | null {
	const lines = content.split('\n');
	const headings = parseHeadings(content);
	
	// Find the target heading
	const targetHeading = headings.find(h => 
		h.text.toLowerCase() === headingText.toLowerCase()
	);

	if (!targetHeading) {
		return null;
	}

	// Find the next heading at same or higher level, or end of file
	let endLine = lines.length;
	for (let i = targetHeading.line + 1; i < lines.length; i++) {
		const line = lines[i];
		const match = line.match(/^(#{1,6})\s+/);
		if (match && match[1].length <= targetHeading.level) {
			endLine = i;
			break;
		}
	}

	const sectionContent = lines
		.slice(targetHeading.line, endLine)
		.join('\n');

	return {
		heading: targetHeading,
		startLine: targetHeading.line,
		endLine: endLine - 1,
		content: sectionContent
	};
}

/**
 * Create a new section with the given heading
 */
export function createSection(content: string, headingText: string, level: number = 2): string {
	const lines = content.split('\n');
	const heading = `${'#'.repeat(level)} ${headingText}\n\n`;
	
	// Append to end of content
	return content.trim() + '\n\n' + heading;
}

/**
 * Insert content at a specific line
 */
export function insertAtLine(content: string, line: number, text: string): string {
	const lines = content.split('\n');
	lines.splice(line, 0, text);
	return lines.join('\n');
}

/**
 * Get line number for insertion at the top of the note
 */
export function getTopInsertionLine(content: string): number {
	// Skip frontmatter if present
	const lines = content.split('\n');
	if (lines[0] === '---') {
		let endFrontmatter = 1;
		for (let i = 1; i < lines.length; i++) {
			if (lines[i] === '---') {
				endFrontmatter = i + 1;
				break;
			}
		}
		return endFrontmatter;
	}
	return 0;
}

/**
 * Check if a line is inside a code block
 */
export function isInCodeBlock(content: string, lineNumber: number): boolean {
	const lines = content.split('\n');
	let inCodeBlock = false;
	let codeBlockDelimiter = '';

	for (let i = 0; i <= lineNumber && i < lines.length; i++) {
		const line = lines[i];
		
		// Check for code block delimiters (``` or ~~~)
		if (line.trim().startsWith('```') || line.trim().startsWith('~~~')) {
			if (!inCodeBlock) {
				inCodeBlock = true;
				codeBlockDelimiter = line.trim().substring(0, 3);
			} else if (line.trim().startsWith(codeBlockDelimiter)) {
				inCodeBlock = false;
				codeBlockDelimiter = '';
			}
		}
	}

	return inCodeBlock;
}

/**
 * Check if a line is inside a math block
 */
export function isInMathBlock(content: string, lineNumber: number): boolean {
	const lines = content.split('\n');
	let inMathBlock = false;

	for (let i = 0; i <= lineNumber && i < lines.length; i++) {
		const line = lines[i];
		
		// Check for math block delimiters ($$)
		if (line.trim() === '$$') {
			inMathBlock = !inMathBlock;
		}
	}

	return inMathBlock;
}

/**
 * Check if a line is inside a table
 */
export function isInTable(content: string, lineNumber: number): boolean {
	const lines = content.split('\n');
	
	// Tables are identified by pipe characters (|)
	// A line is in a table if it contains | and the previous line also contains |
	if (lineNumber === 0) return false;
	
	const currentLine = lines[lineNumber];
	const prevLine = lines[lineNumber - 1];
	
	return currentLine.includes('|') && prevLine.includes('|');
}

/**
 * Find a safe insertion line (not in code blocks, math blocks, or tables)
 */
export function findSafeInsertionLine(content: string, preferredLine: number): number {
	const lines = content.split('\n');
	
	// Start from preferred line and search upward
	for (let i = preferredLine; i >= 0; i--) {
		if (!isInCodeBlock(content, i) && !isInMathBlock(content, i) && !isInTable(content, i)) {
			return i;
		}
	}
	
	// If no safe line found above, search downward
	for (let i = preferredLine + 1; i < lines.length; i++) {
		if (!isInCodeBlock(content, i) && !isInMathBlock(content, i) && !isInTable(content, i)) {
			return i;
		}
	}
	
	// Fallback to end of file
	return lines.length;
}
