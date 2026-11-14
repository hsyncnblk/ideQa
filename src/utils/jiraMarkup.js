/**
 * Helper to convert Markdown formatting to Jira wiki markup
 * Jira Server/Cloud standard text fields use Jira Markup, where:
 * # / ## / ### means numbered lists!
 * For headings, Jira requires h1. / h2. / h3.
 * Bold is *text* (not **text**)
 * Inline code is {{text}} (not `text`)
 */
export function markdownToJira(text = '') {
  if (!text || typeof text !== 'string') return '';

  return text
    // Replace headings: #### -> h4., ### -> h3., ## -> h2., # -> h1.
    .replace(/^#### (.*$)/gm, 'h4. $1')
    .replace(/^### (.*$)/gm, 'h3. $1')
    .replace(/^## (.*$)/gm, 'h2. $1')
    .replace(/^# (.*$)/gm, 'h1. $1')
    // Bold: **text** or __text__ -> *text*
    .replace(/\*\*(.*?)\*\*/g, '*$1*')
    .replace(/__(.*?)__/g, '*$1*')
    // Inline code: `text` -> {{text}}
    .replace(/`([^`\n]+)`/g, '{{$1}}')
    // Code blocks: ```lang ... ``` -> {code:lang} ... {code}
    .replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const langAttr = lang ? `:${lang}` : '';
      return `{code${langAttr}}\n${code.trim()}\n{code}`;
    });
}

