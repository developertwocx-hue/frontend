# MCP (Model Context Protocol) Server Setup

This project is configured with MCP support to enable AI assistants to interact with your codebase and install shadcn/ui components via natural language.

## What is MCP?

MCP (Model Context Protocol) is an open protocol that enables AI assistants to:
- 🔍 Browse and discover available UI components
- 📦 Install components using natural language commands
- 🔧 Access component registries and templates
- 🤖 Automate component integration

## Configuration Files

The following MCP configuration files have been set up:

### 1. `.mcp.json` (Claude Code)
Location: `frontend/.mcp.json`
```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

### 2. `.cursor/mcp.json` (Cursor IDE)
Location: `frontend/.cursor/mcp.json`

### 3. `.vscode/mcp.json` (VS Code with GitHub Copilot)
Location: `frontend/.vscode/mcp.json`

### 4. `components.json` (Component Registry)
The `components.json` file includes registry configuration:
```json
{
  "registries": {
    "@shadcn": "https://ui.shadcn.com/r/{name}.json"
  }
}
```

## How to Use MCP

### Using Claude Code

1. Open your project in Claude Code
2. The MCP server will automatically detect the `.mcp.json` configuration
3. Use natural language to interact with components:

**Examples:**
```
"Show me all available shadcn components"
"Add the data-table component to my project"
"Install button, dialog and card components"
"Create a contact form using shadcn components"
```

### Using Cursor IDE

1. Open your project in Cursor
2. Cursor will automatically load the `.cursor/mcp.json` configuration
3. Use the AI assistant with natural language commands

### Using VS Code + GitHub Copilot

1. Ensure you have GitHub Copilot installed
2. VS Code will read the `.vscode/mcp.json` configuration
3. Use Copilot chat to install and discover components

## Available Commands

### Component Discovery
```
"What shadcn components are available?"
"Show me all table components"
"List all form-related components"
```

### Component Installation
```
"Add the calendar component"
"Install accordion and tabs"
"Add toast notifications"
```

### Component Search
```
"Find components for data display"
"Search for navigation components"
"Show dropdown components"
```

### Template & Block Usage
```
"Create a dashboard layout"
"Add a login form block"
"Build a settings page"
```

## Registry Configuration

The project uses the official shadcn/ui registry:
- **URL**: `https://ui.shadcn.com/r/{name}.json`
- **Namespace**: `@shadcn`

### Adding Custom Registries

You can add your own component registries in `components.json`:

```json
{
  "registries": {
    "@shadcn": "https://ui.shadcn.com/r/{name}.json",
    "@custom": "https://your-registry.com/{name}.json",
    "@internal": {
      "url": "https://internal.company.com/{name}.json",
      "headers": {
        "Authorization": "Bearer ${REGISTRY_TOKEN}"
      }
    }
  }
}
```

## Environment Variables (Optional)

For private registries, create a `.env.local` file:

```env
REGISTRY_TOKEN=your_token_here
API_KEY=your_api_key_here
```

## Current Project Setup

### Installed Components
The following shadcn/ui components are already installed:
- ✅ button
- ✅ card
- ✅ input
- ✅ label
- ✅ select
- ✅ textarea
- ✅ dialog
- ✅ dropdown-menu
- ✅ avatar
- ✅ badge
- ✅ separator
- ✅ table
- ✅ alert
- ✅ sidebar
- ✅ breadcrumb
- ✅ tabs
- ✅ sheet
- ✅ tooltip
- ✅ skeleton

### Project Structure
```
frontend/
├── .mcp.json                    # Claude Code MCP config
├── .cursor/
│   └── mcp.json                 # Cursor IDE MCP config
├── .vscode/
│   └── mcp.json                 # VS Code MCP config
├── components.json              # shadcn config with registries
├── src/
│   ├── components/
│   │   ├── ui/                  # shadcn components
│   │   ├── app-sidebar.tsx      # Custom sidebar
│   │   └── app-header.tsx       # Custom header
│   └── app/
│       └── dashboard/           # Dashboard pages
└── MCP-SETUP.md                 # This file
```

## Troubleshooting

### MCP Server Not Loading
1. Restart your IDE/editor
2. Verify the `.mcp.json` file exists in the project root
3. Check that Node.js and npm are installed
4. Run `npm install` to ensure all dependencies are up to date

### Component Installation Fails
1. Verify internet connection
2. Check that `components.json` is properly configured
3. Ensure shadcn CLI is accessible: `npx shadcn@latest --version`
4. Try manual installation: `npx shadcn@latest add [component-name]`

### Registry Not Accessible
1. Check registry URL in `components.json`
2. Verify environment variables for private registries
3. Ensure authentication tokens are valid

## Manual Component Installation

If MCP is not working, you can still install components manually:

```bash
# Install a single component
npx shadcn@latest add button

# Install multiple components
npx shadcn@latest add button card dialog

# List all available components
npx shadcn@latest add
```

## Additional Resources

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [shadcn/ui Blocks](https://ui.shadcn.com/blocks)

## Support

For issues related to:
- **MCP Server**: Check AI assistant documentation
- **shadcn/ui**: Visit [ui.shadcn.com](https://ui.shadcn.com)
- **Components**: Check component docs at [ui.shadcn.com/docs/components](https://ui.shadcn.com/docs/components)

---

**Note**: MCP is designed to work with AI assistants that support the Model Context Protocol. Ensure your IDE/editor has MCP support enabled.
