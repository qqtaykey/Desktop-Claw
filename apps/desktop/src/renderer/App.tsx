import React from 'react'

function App(): React.JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        margin: 0,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        background: '#1a1a2e',
        userSelect: 'none'
      }}
    >
      <h1 style={{ color: '#e0e0ff', fontSize: 32, margin: 0, letterSpacing: 1 }}>
        Hello, Claw 🐾
      </h1>
      <p style={{ color: '#7070aa', marginTop: 12, fontSize: 13 }}>
        Desktop-Claw · Milestone 0
      </p>
    </div>
  )
}

export default App
