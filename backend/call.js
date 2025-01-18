import axios from 'axios';

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
const geminiApiUrl = import.meta.env.VITE_GEMINI_API_URL;

const cleanText = (text) => {
  return text.replace(/[^a-zA-Z0-9]/g, '');
};

export const processText = async (text) => {
  if (!geminiApiKey || !geminiApiUrl) {
    throw new Error('API configuration is missing or api limit exceeded');
  }

  const cleanedText = cleanText(text).replace(/\s+/g, '');
  
  const requestData = {
    contents: [{
      parts: [{
        text: `summarize this in single para format and no extra detail other than the topic ${cleanedText}`
      }]
    }]
  };

  try {
    const response = await axios.post(`${geminiApiUrl}?key=${geminiApiKey}`, requestData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Extract the summary and remove any markdown formatting
    const summary = response.data.candidates[0].content.parts[0].text.replace(/[#*_`]/g, '');
    
    return {
      text: summary,
      tokenCount: response.data.usageMetadata.totalTokenCount
    };
  } catch (error) {
    console.error('Error summarizing text:', error);
    throw new Error('Failed to process text');
  }
};