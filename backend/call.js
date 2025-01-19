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
  //const promt = `Summarize the content in 5 bullet points, ensuring each point is detailed (1-23 sentences) and directly addresses key aspects focus on the main points. Avoid using introductory labels like "What," "Why," or "When" in the summary; focus on providing direct and relevant information. ${cleanedText}`
  const promt = `Summarize the content in 5 detailed bullet points, each with 1-2 sentences or 3 sentences max. Focus on the core subject, addressing the most relevant and critical aspects directly related to it. Avoid using introductory labels like 'What,' 'Why,' or 'When.' Eliminate tangential information and provide a summary that highlights only the most important details, ensuring it centers around the main topic. ${cleanedText}`

  const requestData = {
    contents: [{
      parts: [{
        text: `${promt}`
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

