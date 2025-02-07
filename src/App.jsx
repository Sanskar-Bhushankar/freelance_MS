import { useState } from 'react'
import { processText, processTextWithKeywords } from '../backend/call.js'
import './App.css'

function App() {
  const [inputText, setInputText] = useState('')
  const [keywords, setKeywords] = useState('')
  const [outputText, setOutputText] = useState('')
  const [keywordOutputText, setKeywordOutputText] = useState('')
  const [copied, setCopied] = useState({ normal: false, keyword: false })
  const [loading, setLoading] = useState(false)
  const [apiTokenCount, setApiTokenCount] = useState({ 
    normal: 0, 
    keyword: 0,
    promptTokens: 0,
    responseTokens: 0 
  })
  const [selectedModel, setSelectedModel] = useState('1.5')
  const [showPromptSelector, setShowPromptSelector] = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState('')
  const [promptType, setPromptType] = useState('custom')

  const predefinedPrompts = {
    detailed: [
      {
        id: 1,
        text: 'Summarize the content in 5 key points, focusing on the core aspects of the 5Ws (Who, What, Where, When, Why). Each point should cover a different element of the subject without exceeding 3 sentences. Ensure the summary is detailed, capturing the essential information and addressing each "W" clearly. Avoid bullets, numbers, or dashes. Eliminate tangential details.'
      },
      {
        id: 2,
        text: 'Provide a detailed summary of the content in 5 distinct points, emphasizing the 5Ws. Each point should address a specific "W" (Who, What, Where, When, Why) and be no longer than 3 sentences. Focus on capturing the most important and relevant details related to each element. Do not use bullets, dashes, or numbers, and avoid unrelated information.'
      }
    ],
    short: [
      {
        id: 3,
        text: 'Summarize the content in 5 brief points, each covering one aspect of the 5Ws. Keep each point to a maximum of 2 sentences, focusing only on the most crucial details. Exclude any introductory phrases, unnecessary information, and avoid bullets or dashes. Be concise and clear, covering the essence of the subject.'
      },
      {
        id: 4,
        text: 'Condense the content into 5 clear points based on the 5Ws (Who, What, Where, When, Why). Each point should be no more than 2 sentences, focusing on the core details. Exclude any extraneous content, and avoid the use of bullets, dashes, or numbers in your summary.'
      }
    ]
  };

  // Calculate counts
  const getTextStats = (text) => {
    const charCount = text.length;
    const tokenCount = Math.ceil(charCount / 4);
    return { charCount, tokenCount };
  }

  const inputStats = getTextStats(inputText);
  const outputStats = getTextStats(outputText);
  const keywordOutputStats = getTextStats(keywordOutputText);

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const normalResult = await processText(inputText, selectedModel, selectedPrompt)
      setOutputText(normalResult.text)
      setApiTokenCount(prev => ({ 
        ...prev, 
        normal: normalResult.tokenCount,
        promptTokens: normalResult.promptTokens,
        responseTokens: normalResult.responseTokens
      }))

      if (keywords.trim()) {
        const keywordResult = await processText(inputText, selectedModel, selectedPrompt, keywords)
        setKeywordOutputText(keywordResult.text)
        setApiTokenCount(prev => ({ ...prev, keyword: keywordResult.tokenCount }))
      } else {
        setKeywordOutputText('')
        setApiTokenCount(prev => ({ ...prev, keyword: 0 }))
      }
    } catch (err) {
      console.error('Error processing text:', err)
      setOutputText('Error processing text. Please try again.')
      setKeywordOutputText('')
      setApiTokenCount({ normal: 0, keyword: 0, promptTokens: 0, responseTokens: 0 })
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (type) => {
    try {
      const textToCopy = type === 'normal' ? outputText : keywordOutputText
      await navigator.clipboard.writeText(textToCopy)
      setCopied(prev => ({ ...prev, [type]: true }))
      setTimeout(() => setCopied(prev => ({ ...prev, [type]: false })), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  return (
    <div className="container">
      <div className="model-selector">
        <select 
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="model-dropdown"
        >
          <option value="1.5">Gemini 1.5 Flash</option>
          <option value="2.0">Gemini 2.0 Pro</option>
        </select>
      </div>
      <div className="input-section">
        <textarea
          className="text-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter your text here..."
        />
        
        <div className="input-controls">
          <input
            type="text"
            className="keyword-input"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Enter keywords (optional, separate by commas)"
          />
          <button 
            className="prompt-button"
            onClick={() => setShowPromptSelector(true)}
          >
            Add Custom Summarizer Prompt
          </button>
        </div>

        {showPromptSelector && (
          <div className="prompt-selector-overlay">
            <div className="prompt-selector">
              <h3>Customize Summary Generation</h3>
              
              <div className="custom-prompt">
                <h4>Enter Your Custom Prompt:</h4>
                <textarea
                  value={selectedPrompt}
                  onChange={(e) => setSelectedPrompt(e.target.value)}
                  placeholder="Enter your custom summarization prompt..."
                  className="custom-prompt-input"
                />
              </div>

              <div className="prompt-type-selector">
                <h4>Or Choose from Predefined Prompts:</h4>
                <div className="prompt-type-buttons">
                  <button 
                    className={`type-button ${promptType === 'detailed' ? 'active' : ''}`}
                    onClick={() => setPromptType('detailed')}
                  >
                    Detailed Prompts
                  </button>
                  <button 
                    className={`type-button ${promptType === 'short' ? 'active' : ''}`}
                    onClick={() => setPromptType('short')}
                  >
                    Short Prompts
                  </button>
                </div>
              </div>

              {promptType !== 'custom' && (
                <div className="predefined-prompts">
                  {predefinedPrompts[promptType].map((prompt) => (
                    <div 
                      key={prompt.id}
                      className={`prompt-option ${selectedPrompt === prompt.text ? 'selected' : ''}`}
                      onClick={() => setSelectedPrompt(prompt.text)}
                    >
                      <p>{prompt.text}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="prompt-actions">
                <button 
                  className="cancel-button"
                  onClick={() => {
                    setShowPromptSelector(false);
                    setPromptType('custom');
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="apply-button"
                  onClick={() => {
                    setShowPromptSelector(false);
                    setPromptType('custom');
                  }}
                >
                  Apply Prompt
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="stats-container">
          <span>Characters: {inputStats.charCount}</span>
          <span>Tokens: {inputStats.tokenCount}</span>
        </div>
        <button 
          className="submit-button" 
          onClick={handleSubmit}
          disabled={loading || !inputText.trim()}
        >
          {loading ? 'Processing...' : 'Generate'}
        </button>
      </div>

      <div className="summaries-container">
        {outputText && (
          <div className="output-section">
            <h3>General Summary</h3>
            <button 
              className={`copy-button ${copied.normal ? 'copied' : ''}`}
              onClick={() => handleCopy('normal')}
            >
              {copied.normal ? 'Copied!' : 'Copy'}
            </button>
            <div className="output-content">{outputText}</div>
            <div className="stats-container output-stats">
              <span>Characters: {outputStats.charCount}</span>
              <span>Tokens: {outputStats.tokenCount}</span>
              <span>API Tokens: {apiTokenCount.normal}</span>
              {apiTokenCount.promptTokens && (
                <>
                  <span>Prompt Tokens: {apiTokenCount.promptTokens}</span>
                  <span>Response Tokens: {apiTokenCount.responseTokens}</span>
                </>
              )}
            </div>
          </div>
        )}

        {keywordOutputText && (
          <div className="output-section">
            <h3>Keyword-Focused Summary</h3>
            <button 
              className={`copy-button ${copied.keyword ? 'copied' : ''}`}
              onClick={() => handleCopy('keyword')}
            >
              {copied.keyword ? 'Copied!' : 'Copy'}
            </button>
            <div className="output-content">{keywordOutputText}</div>
            <div className="stats-container output-stats">
              <span>Characters: {keywordOutputStats.charCount}</span>
              <span>Tokens: {keywordOutputStats.tokenCount}</span>
              <span>API Tokens: {apiTokenCount.keyword}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
