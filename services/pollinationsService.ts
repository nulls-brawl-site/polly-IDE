import { Message, TokenUsage } from "../types";

export const getUserBalance = async (apiKey: string): Promise<number | null> => {
  if (!apiKey || !apiKey.trim()) return null;
  const sanitizedKey = apiKey.trim();
  try {
    const response = await fetch("https://gen.pollinations.ai/account/balance", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${sanitizedKey}`
      }
    });
    
    if (!response.ok) return null;
    const data = await response.json();
    return typeof data.balance === 'number' ? data.balance : null;
  } catch (e) {
    console.error("Failed to fetch balance", e);
    return null;
  }
};

export const streamPollinations = async (
  messages: Message[], 
  systemInstruction: string,
  model: string,
  onChunk: (text: string) => void,
  apiKey?: string,
  onUsage?: (usage: TokenUsage) => void
): Promise<void> => {
  
  const sanitizedKey = apiKey ? apiKey.trim() : '';
  const hasKey = sanitizedKey.length > 0;
  const endpoint = hasKey
    ? "https://gen.pollinations.ai/v1/chat/completions" 
    : "https://text.pollinations.ai/v1/chat/completions";

  const apiMessages = [
    { role: 'system', content: systemInstruction },
    ...messages
      .map(m => {
        let content = m.text || '';
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
      .filter(m => m.content && m.content.trim().length > 0)
  ];

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (hasKey) {
    headers['Authorization'] = `Bearer ${sanitizedKey}`;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        messages: apiMessages,
        model: model, 
        stream: true,
        jsonMode: false,
        stream_options: { include_usage: true }
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
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
                
                if (json.usage && onUsage) {
                    onUsage({
                        promptTokens: json.usage.prompt_tokens,
                        completionTokens: json.usage.completion_tokens,
                        totalTokens: json.usage.total_tokens
                    });
                }

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
        
