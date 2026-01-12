import { Message } from "../types";

export const streamPollinations = async (
  messages: Message[], 
  systemInstruction: string,
  model: string,
  onChunk: (text: string) => void,
  apiKey?: string
): Promise<void> => {
  
  const hasKey = apiKey && apiKey.trim().length > 0;
  const endpoint = hasKey
    ? "https://gen.pollinations.ai/v1/chat/completions" 
    : "https://text.pollinations.ai/v1/chat/completions";

  // Filter and format messages to avoid empty content errors
  const apiMessages = [
    { role: 'system', content: systemInstruction },
    ...messages
      .map(m => {
        // Reconstruct content: Text + Tool Calls (as XML/Text representation for the model's context)
        let content = m.text || '';
        
        // If the message has tool calls but no text (cleaned by UI), inject them back for context
        if (m.toolCalls && m.toolCalls.length > 0) {
            const toolsContext = m.toolCalls.map(tc => 
                `:::TOOL_CALL ${JSON.stringify({name: tc.name, args: tc.args})} :::`
            ).join('\n');
            
            if (content) {
                content += `\n${toolsContext}`;
            } else {
                content = toolsContext;
            }
        }
        
        return {
          role: m.role === 'model' ? 'assistant' : m.role,
          content: content
        };
      })
      .filter(m => m.content && m.content.trim().length > 0) // Remove completely empty messages to prevent 400 errors
  ];

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (hasKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        messages: apiMessages,
        model: model, 
        stream: true,
        jsonMode: false 
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        // Handle specific model not found error (often due to missing/invalid key for premium models)
        if (response.status === 404 && errorText.includes('Model not found')) {
            throw new Error(`Model '${model}' requires a valid API Key. Please check your settings.`);
        }
        throw new Error(`Server Error (${response.status}): ${errorText || response.statusText}`);
    }

    if (!response.body) throw new Error("No response body received");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;
      
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.slice(6);
            if (jsonStr === '[DONE]') continue;
            
            try {
                const json = JSON.parse(jsonStr);
                const content = json.choices?.[0]?.delta?.content;
                
                if (content) {
                    onChunk(content);
                }
            } catch (e) {
            }
        }
      }
    }

  } catch (e) {
    console.error("Pollinations API Error", e);
    throw e;
  }
};
