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
      const normalResult = await processText(inputText, selectedModel)
      setOutputText(normalResult.text)
      setApiTokenCount(prev => ({ 
        ...prev, 
        normal: normalResult.tokenCount,
        promptTokens: normalResult.promptTokens,
        responseTokens: normalResult.responseTokens
      }))

      if (keywords.trim()) {
        const keywordResult = await processTextWithKeywords(inputText, keywords, selectedModel)
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
        <input
          type="text"
          className="keyword-input"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="Enter keywords (optional, separate by commas)"
        />
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
