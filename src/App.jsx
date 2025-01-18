import { useState } from 'react'
import { processText } from '../backend/call.js'
import './App.css'

function App() {
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiTokenCount, setApiTokenCount] = useState(0)

  // Calculate counts
  const getTextStats = (text) => {
    const charCount = text.length;
    const tokenCount = Math.ceil(charCount / 4);
    return { charCount, tokenCount };
  }

  const inputStats = getTextStats(inputText);
  const outputStats = getTextStats(outputText);

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const result = await processText(inputText)
      setOutputText(result.text)
      setApiTokenCount(result.tokenCount)
    } catch (err) {
      console.error('Error processing text:', err)
      setOutputText('Error processing text. Please try again.')
      setApiTokenCount(0)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(outputText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  return (
    <div className="container">
      <div className="input-section">
        <textarea
          className="text-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder=".."
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

      {outputText && (
        <div className="output-section">
          <button 
            className={`copy-button ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <div className="output-content">{outputText}</div>
          <div className="stats-container output-stats">
            <span>Characters: {outputStats.charCount}</span>
            <span>Tokens: {outputStats.tokenCount}</span>
            <span>API Tokens: {apiTokenCount}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
