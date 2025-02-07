import axios from 'axios';

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
const gemini15Url = import.meta.env.VITE_GEMINI_1_5_URL;
const gemini20Url = import.meta.env.VITE_GEMINI_2_0_URL;

const cleanText = (text) => {
  return text.replace(/[^a-zA-Z0-9]/g, '');
};

const extractSummaryFromResponse = (response, model) => {
  try {
    console.log(`API Response for model ${model}:`, response.data);
    
    if (model === '2.0') {
      // Gemini 2.0 response structure
      if (!response.data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Unexpected response structure from Gemini 2.0');
      }
      return {
        text: response.data.candidates[0].content.parts[0].text.replace(/[#*_`]/g, ''),
        tokenCount: response.data.usageMetadata?.totalTokenCount || 0,
        promptTokens: response.data.usageMetadata?.promptTokenCount || 0,
        responseTokens: response.data.usageMetadata?.candidatesTokenCount || 0
      };
    } else {
      // Gemini 1.5 response structure
      if (!response.data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Unexpected response structure from Gemini 1.5');
      }
      return {
        text: response.data.candidates[0].content.parts[0].text.replace(/[#*_`]/g, ''),
        tokenCount: response.data.usageMetadata?.totalTokenCount || 0,
        promptTokens: response.data.usageMetadata?.promptTokenCount || 0,
        responseTokens: response.data.usageMetadata?.candidatesTokenCount || 0
      };
    }
  } catch (error) {
    console.error('Error extracting summary:', error);
    console.error('Response data:', response.data);
    throw new Error(`Failed to process API response: ${error.message}`);
  }
};

export const processText = async (text, model = '1.5', customPrompt = '', keywords = '') => {
  const apiUrl = model === '1.5' ? gemini15Url : gemini20Url;
  
  if (!geminiApiKey || !apiUrl) {
    throw new Error('API configuration is missing or api limit exceeded');
  }

  const cleanedText = cleanText(text).replace(/\s+/g, '');
  const defaultPrompt = `Summarize the content in 5 points without using any bullets, numbers, or dashes. Each point should be 1-2 sentences or 3 sentences max. Start each point in a new line. Focus on the core subject, addressing the most relevant and critical aspects directly related to it. Avoid using introductory labels like 'What,' 'Why,' or 'When.' Eliminate tangential information and provide a summary that highlights only the most important details, ensuring it centers around the main topic.`;
  
  let prompt = customPrompt || defaultPrompt;
  
  // Add keyword instruction if keywords are provided
  if (keywords.trim()) {
    prompt += ` Additionally, ensure the summary emphasizes and incorporates these keywords and related concepts: ${keywords}.`;
  }

  prompt += ` ${cleanedText}`;

  // Debug logs
  console.log('Using API URL:', apiUrl);
  console.log('Model:', model);

  const requestData = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }]
  };

  try {
    const response = await axios.post(`${apiUrl}?key=${geminiApiKey}`, requestData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return extractSummaryFromResponse(response, model);
  } catch (error) {
    // Enhanced error logging
    console.error('API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    let errorMessage = 'Failed to process text';
    if (error.response?.data?.error?.message) {
      errorMessage += `: ${error.response.data.error.message}`;
    } else if (error.message) {
      errorMessage += `: ${error.message}`;
    }
    
    throw new Error(errorMessage);
  }
};

export const processTextWithKeywords = async (text, keywords, model = '1.5', customPrompt = '') => {
  // Just use processText with keywords
  return processText(text, model, customPrompt, keywords);
};

