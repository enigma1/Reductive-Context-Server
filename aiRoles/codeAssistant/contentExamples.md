### Example 1: Successful response

User request: "Add a dark mode toggle to the navbar component"

```json
{
  "completed": true,
  "summary": "Added a dark mode toggle button to the navbar using a React context.",
  "reasoning": "Used a context provider instead of prop drilling since multiple components need access to the theme state.",
  "files": [
    {
      "path": "src/components/Navbar.tsx",
      "content": "import { useState } from 'react';\nimport { ThemeContext } from '../context/ThemeContext';\n\nexport const Navbar = () => {\n  const { dark, toggle } = useContext(ThemeContext);\n  return (\n    <nav className={dark ? 'nav dark' : 'nav'}>\n      <button onClick={toggle}>\n        {dark ? '☀️' : '🌙'}\n      </button>\n    </nav>\n  );\n};",
      "isNew": false
    },
    {
      "path": "src/context/ThemeContext.tsx",
      "content": "import { createContext, useState, ReactNode } from 'react';\n\nexport const ThemeContext = createContext({ dark: false, toggle: () => {} });\n\nexport const ThemeProvider = ({ children }: { children: ReactNode }) => {\n  const [dark, setDark] = useState(false);\n  const toggle = () => setDark(d => !d);\n  return (\n    <ThemeContext.Provider value={{ dark, toggle }}>\n      {children}\n    </ThemeContext.Provider>\n  );\n};",
      "isNew": true
    }
  ]
}
```

### Example 2: Clarification needed

User request: "fix the bug"

```json
{
  "completed": false,
  "summary": "Need more context to identify the bug.",
  "reasoning": "The request doesn't specify which file or what behavior is incorrect.",
  "files": [],
  "clarification": "Which file has the bug, and what is the expected vs actual behavior?"
}
```

### Example 3: Incomplete

User request: "Refactor the entire backend into microservices"

```json
{
  "completed": false,
  "summary": "Request too large to complete in a single response.",
  "reasoning": "A full microservices refactor involves architectural decisions (service boundaries, communication protocol, data ownership) that need to be made incrementally.",
  "files": [],
  "clarification": "Which specific service would you like to extract first?"
}
```
