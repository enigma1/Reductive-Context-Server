# Reductive-Context-Server

The **Reductive Context Server** provices the back end workspace for a human-curated, segment-scoped context selection LLM inference. The application incorporates sqlite3 to store bundles of LLM conversation with a user and associates those bundles with folders and files used on a per conversation basis.

Front end which interacts with the server is located here
https://github.com/enigma1/Reductive-Context-SPA.git

## Support This Project

If you find this application useful, you can support development via PayPal:
[![PayPal](https://img.shields.io/badge/Donate-PayPal-blue)](https://www.paypal.com/donate?hosted_button_id=CRPY96XAY793A)
Thank you for helping keep this project maintained and improving!
written by: Mark Samios [@enigma1](https://github.com/enigma1)

## Features

- Selecting relevant files rather than indiscriminately sending entire code trees.
- Extracting signatures when implementation details are unnecessary.
- Extract relevant functions or code lines only.
- Managing context budgets and token estimates.
- Maintaining conversation and bundle history.
- Supports different model providers.
- Keeps the human in control of context selection and approval.

### API Features

- Fastify-based HTTP API
- JSON API responses
- Streaming LLM responses
- Token estimations
- Multi-folder sources that allow file selections
- Structured error handling

### Profile Support

Different profiles are supported using specific folder with instructions in markdown. The profiles are located under `aiRoles` in the root of the `reductive-context-server` and consist of 2 sets for content and scope. The most important files are `role.md` which create the LLM assistant and the assistant's rules in `contentRules.md`. There is also a `contentExamples.md` which helps the LLM with how responses should be formulated.

### Signature Mode

The back end supports extraction for types, interfaces, functions, classes, enums signatures, which can guide the LLMs while reducing massively token usage. Abstract Syntax Trees (ASTs) can be applied on specific file types to eliminate implementation details when signatures are enough.

### Folder Content Tree

When files are requested, a scan initiated from the root of a folder and depending on the depth specified it will return the readable files found. At the same time a tree of folder is contructed and returned to the fron end in text form. The benefit is that it can be optionally included with the bundle before sending it to LLM.

#### AI Integration

The backend provides an LLM-powered dynamic assistant for generating response based on the AI roles configured via natural-language requests.

Verified: Ollama and Google Gemini have been tested end-to-end. OpenAI and Anthropic are supported through LangChain's initChatModel, but have not been end-to-end tested because their API currently requires prepaid credits. Open Router models have also been tested, with the free versions and are working. You can see a full list of models from the from the interface on the front end (Server -> Get Open Router Models).

Features include:

- **Natural-language generation** — Users can operations in plain language and the assistant generates the corresponding content based on a selected profile.
- **Structured output** — API requests/responses and LLM responses are validated against a Zod schema
- **Incomplete request handling** — When a request cannot be completed from the available information, the assistant identifies the missing information and generates clarification questions.
- **Query scope detection** — Requests are classified as either:
  - `current` — parenthesis request exclusively focused on the current user message.
  - `thread` — request is in the context from earlier messages in the conversation.
- **Query Clarification** — When the LLM identifies an incomplete request:
  - `clarification` — request requires additional information.

- **Conversation-aware requests** — Thread-level requests can use the conversation history to answer questions about previously generated content.
- **Bundle history integration** — Previously generated responses are retained as part of the conversation/application context, allowing users to refer back to earlier LLM respond records.
- **Provider-independent LLM support** — The AI layer can use different LLM providers through LangChain, including local Ollama models and hosted providers such as OpenAI, Anthropic, and Google Gemini.
- **Provider-specific configuration** — Local models such as Ollama can use provider-specific options while hosted models are initialized through LangChain's model abstraction.
- **AI availability monitoring** — The backend periodically checks the configured AI provider's health endpoints and input tokens are estimated without consuming model tokens. The frontend uses this status to determine whether the AI functionality should be available.
- **No direct execution by the LLM** — Generated reponses are treated as application requests and is executed only via human approval.
- **LangGraph workflow** — The assistant is implemented as a LangGraph workflow, allowing the content-generation process to be extended with additional decision or processing nodes as the AI functionality evolves.

#### Typical deployment

Browser -> Optional Local Proxy -> **Reductive-Context-Server**

#### Environment

- Tested on node v20-26
- Tested on npm v10-11

#### Installation

```bash
mkdir <Reductive-Context-Server> folder
cd <Reductive-Context-Server> folder
git clone https://github.com/enigma1/Reductive-Context-Server.git .
npm i
# copy the env varioable
cp .env.template .env
# next install the database
npm run db:execute ./scripts/reductive-context.sql
```

#### Configuration

**Reductive-Context-Server** is configured through the `.env` file. The default values are suitable for a local installation, but you should review them before deployment.

##### Frontend

Configure the frontend host and origin used by **Reductive-Context-Server**.

```batch
FRONTEND_HOST=127.0.0.1
FRONTEND_ORIGIN=https://127.0.0.1:5161
```

**FRONTEND_ORIGIN** is used for CORS configuration.
**FRONTEND_HOST** is used when cookie domains are enabled.

When **COOKIE_USE_DOMAIN=1**, the server adds the `Domain` attribute to session cookies using this value.

When **COOKIE_USE_DOMAIN=0** (default), the `Domain` attribute is omitted, creating a host-only cookie. This is usually preferred because the browser automatically associates the cookie with the host that issued it.

```batch
COOKIE_USE_DOMAIN=0
```

For installations where the frontend and backend are served from the same hostname, host-only cookies are recommended.

When **REFLECT_ORIGIN=1** (default), **Reductive-Context-Server** reflects the incoming `Origin` header in the `Access-Control-Allow-Origin` response header.

When **REFLECT_ORIGIN=0**, the server uses the configured **FRONTEND_ORIGIN** value instead.

```batch
REFLECT_ORIGIN=1
```

You can modify the .env file for SSL or NON-SSL modes.
If **SSL_ENABLED=1** (default), the proxy requires a private key and certificate.

To create a certificate...

```batch
openssl req -x509 -newkey rsa:4096 -nodes \
  -keyout server.key \
  -out server.crt \
  -days 1825
```

Configure the following variables:

```batch
TLS_KEY=/path/to/server.key
TLS_CERT=/path/to/server.crt
```

When **SSL_ENABLED=0**, **Reductive-Context-Server** runs over plain HTTP and the TLS variables are ignored.

#### Preferences

Preferences for each user are stored in the directory specified by:

```batch
PREFERENCES_DIR=prefs
```

Optionally, provide an **ENCODING_KEY** to obfuscate preference filenames on disk.

#### AI Configuration

The AI assistant is configured through the application's `.env` file. The backend supports multiple LLM providers and the active model is selected using the `AI_MODEL` setting.

API keys are only required for hosted providers. Local Ollama models do not require an API key.

```batch
# AI provider API keys

ANTHROPIC_API_KEY=your-anthropic-api-key
OPENAI_API_KEY=your-openai-api-key
GOOGLE_API_KEY=your-google-api-key

# Active AI model

AI_MODEL=ollama:qwen3.5:9b
```

Because of Temporal use for time calculations, the use of LLM requires Node version 26 or later.

Note: Model names and availability depend on the configured provider. Hosted providers may require an appropriate API key, account access, and model availability. Some of the Ollama models are free can be installed locally.

#### Operation

For _development_ use

```
npm run dev
```

otherwise for _production_

```
npm run build
npm run start
```

Output files will be generated under the _dist_ folder

##### Advanced Settings

Additional server settings are available in the configuration file:

```
src/config/envConfig.ts
```

These options control internal server behavior such as timeouts, session cleanup intervals. Modify them only when you need behavior different from the defaults.

## 🧾 License

GNU General Public License (GPL) v3
