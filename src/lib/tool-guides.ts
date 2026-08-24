export type FAQItem = {
    question: string;
    answer: string;
};

export type ToolGuide = {
    title: string;
    introduction: string;
    features: string[];
    howToUse: string[];
    faq: FAQItem[];
    securityInfo: string;
};

export const TOOL_GUIDES: Record<string, ToolGuide> = {
    "base64-encode": {
        title: "Base64 Encoder Guide",
        introduction: "Base64 Encoding is a binary-to-text encoding scheme that represents binary data in an ASCII string format. It is designed to allow binary data to be transmitted over channels that only support text formatting (such as email, HTML, or JSON payloads). Base64 converts every 3 bytes (24 bits) of source data into 4 characters (24 bits) from a standardized 64-character set, ensuring data integrity is maintained during transport.",
        features: [
            "Encodes plain text strings or uploaded binary files securely in the browser.",
            "Supports standard Base64 encoding as well as Url-Safe Base64 variant options.",
            "Visual preview of output format with character count and size estimation.",
            "One-click copying and direct file downloads for large encoded payloads."
        ],
        howToUse: [
            "Input or paste the plain text string you wish to encode into the text area, or upload a local file.",
            "Select the encoding options if necessary (such as standard encoding vs. URL-safe encoding).",
            "The encoded Base64 ASCII string will generate in real time in the output pane.",
            "Click 'Copy' to copy the encoded string to your clipboard, or download it directly as a text file."
        ],
        faq: [
            {
                question: "Does Base64 encoding encrypt my data?",
                answer: "No, Base64 is not a form of encryption. It is a public encoding format that anyone can reverse. It is used solely to format data for transmission, not to hide or secure it."
            },
            {
                question: "What is URL-Safe Base64 encoding?",
                answer: "Standard Base64 uses '+' and '/' characters, which have special meanings in URLs and can cause parsing issues. URL-safe Base64 replaces these characters with '-' and '_' respectively to make the output safe for query parameters and URI paths."
            },
            {
                question: "Why does Base64 output look larger than the original input?",
                answer: "Base64 encoding increases the file size by approximately 33%. This overhead occurs because every 3 bytes of binary input data are represented by 4 ASCII characters in the final output."
            }
        ],
        securityInfo: "All encoding operations are performed locally in your browser using JavaScript. No text, credentials, or uploaded files are sent to any external server."
    },
    "base64-decode": {
        title: "Base64 Decoder Guide",
        introduction: "Base64 Decoding reverses the Base64 encoding process, converting ASCII-formatted character strings back into their original binary or plain text representation. The decoder parses the base64 character set, groups the 6-bit values back into 8-bit bytes, handles optional padding characters ('='), and outputs the resulting text or downloads the reconstructed file.",
        features: [
            "Decodes Base64 ASCII text back into raw readable strings or binary data.",
            "Auto-detects standard vs URL-safe base64 schemes and handles padding errors dynamically.",
            "Displays decoded content in a syntax-highlighted editor or provides binary file downloads.",
            "Full validation feedback indicating if the input string contains invalid characters."
        ],
        howToUse: [
            "Paste your Base64 encoded string into the input panel.",
            "The tool will automatically parse the character layout and validate its format.",
            "View the decoded plain text directly in the output pane, or download the decoded binary file if it is an image, PDF, or zip archive.",
            "Use the copy button to capture text outputs instantly."
        ],
        faq: [
            {
                question: "What does the '=' symbol mean at the end of a Base64 string?",
                answer: "The '=' symbol is a padding character. Since Base64 groups bits into chunks of 24, padding characters are appended to the end of the string if the input binary bytes are not a multiple of three."
            },
            {
                question: "Why does decoding throw an 'Invalid Character' error?",
                answer: "This error occurs if your input contains characters outside the standard Base64 alphabet (A-Z, a-z, 0-9, +, /, and padding =). Double-check for spaces, line breaks, or HTML entities."
            },
            {
                question: "Can I decode a base64 string back into a JPEG or PNG image?",
                answer: "Yes. If the Base64 string represents a compiled image, the decoder will reconstruct the binary file and provide a download link so you can save it to your local storage."
            }
        ],
        securityInfo: "Decoding is executed entirely client-side. Your inputs and outputs remain isolated within your local browser session."
    },
    "json-to-schema": {
        title: "JSON to JSON Schema Converter Guide",
        introduction: "JSON Schema is a declarative vocabulary that allows you to annotate and validate JSON documents. It defines the structure, data types, required fields, and constraints of your JSON payloads. Our converter automatically analyzes a sample JSON object or array, infers the data types (string, number, boolean, array, object), and generates a fully compliant JSON Schema (Draft-07 specification) to validate future inputs.",
        features: [
            "Generates valid JSON Schema structures (Draft-07) instantly from sample JSON instances.",
            "Infers types, formats (e.g. date-time, email), and creates structural definitions for nested objects.",
            "Configurable options to enforce required fields, add description fields, or specify schema boundaries.",
            "Interactive editor with validation error alerts for malformed inputs."
        ],
        howToUse: [
            "Paste your sample JSON object or array into the input editor panel.",
            "Adjust configuration settings if you want to mark all keys as 'required' or generate descriptions.",
            "The generated schema will appear in the output window.",
            "Copy the resulting JSON Schema or save it to validate your API inputs and configurations."
        ],
        faq: [
            {
                question: "What JSON Schema version does this generator support?",
                answer: "This tool generates schemas matching the popular JSON Schema Draft-07 specification, which is widely supported across validation libraries in Python, JavaScript, Go, and Java."
            },
            {
                question: "How does the tool handle dynamic object arrays?",
                answer: "The generator inspects all objects in an array, infers the common properties, and creates an 'items' schema that covers the combined structural definition of the array elements."
            },
            {
                question: "Can I use the generated schema to validate JSON in my API?",
                answer: "Yes, you can copy the schema directly into validation libraries (such as Ajv for JavaScript or jsonschema for Python) to validate incoming API request payloads automatically."
            }
        ],
        securityInfo: "The JSON conversion and schema inference algorithms run fully in-browser. Your proprietary data structures are never transmitted over the internet."
    },
    "json-formatter": {
        title: "JSON Formatter & Validator Guide",
        introduction: "JSON (JavaScript Object Notation) is the standard format for exchanging structured data in modern web APIs and configuration files. Because raw API responses are often minified (compacted without spaces or line breaks) to save bandwidth, they are difficult for humans to read. The JSON Formatter takes raw, minified, or malformed JSON strings, validates their syntax, and outputs clean, indented, syntax-highlighted code.",
        features: [
            "Formats and beautifies minified JSON with customizable spacing (2 or 4 spaces).",
            "Identifies exact syntax errors (like missing quotes, trailing commas) with line number highlights.",
            "Interactive tree view layout to browse deeply nested arrays and objects with collapsible segments.",
            "Supports minification to strip whitespace and optimize JSON payloads for storage or transmission."
        ],
        howToUse: [
            "Type or paste your raw JSON string into the editor box, or upload a JSON file.",
            "The editor will instantly highlight syntax errors if the structure is invalid.",
            "Click 'Prettify' to align lines and indent according to your settings, or click 'Minify' to compress it.",
            "Use the 'Show tree view' toggle to inspect values, collapse arrays, and browse keys interactively."
        ],
        faq: [
            {
                question: "Why is a trailing comma invalid in JSON?",
                answer: "According to the JSON specification (RFC 8259), trailing commas are strictly prohibited after the last element in an array or the last property in an object. This is a common syntax error."
            },
            {
                question: "Does the formatter support comments?",
                answer: "Standard JSON does not support comments (// or /* */). However, our formatter will attempt to parse and clean up comments if present, though they will be removed during strict validation."
            },
            {
                question: "Can this tool format extremely large files?",
                answer: "Yes, our optimized renderer can process JSON payloads up to several megabytes quickly inside the browser without locking up your screen."
            }
        ],
        securityInfo: "Formatting, minification, and tree building happen entirely within your local browser's JavaScript runtime. Your JSON data never leaves your computer."
    },
    "uuid-generator": {
        title: "UUID Generator Guide",
        introduction: "A Universally Unique Identifier (UUID) is a 128-bit label used for identification in computer systems. Because UUIDs have an extremely low probability of duplication, they can be generated independently without coordination from a central authority. This tool supports generating UUID Version 1 (based on system time and hardware address), Version 4 (fully random), and Version 7 (ordered based on time/epoch), which are commonly used as primary keys in databases.",
        features: [
            "Generates single or bulk quantities of high-entropy UUIDs instantly.",
            "Supports Version 1 (timestamp-based), Version 4 (cryptographically random), and Version 7 (time-ordered).",
            "Configurable output formats: standard lowercase, uppercase, or raw continuous hexadecimal.",
            "Bulk export to text files or direct clipboard copies."
        ],
        howToUse: [
            "Select the UUID version you require (v4 is recommended for general random keys).",
            "Choose the quantity of identifiers you need to generate.",
            "Configure case styling (lowercase or uppercase) and hyphen settings.",
            "Click 'Generate' and copy the list from the output panel."
        ],
        faq: [
            {
                question: "What is the difference between UUID v4 and v7?",
                answer: "UUID v4 is completely random and offers no ordering. UUID v7 combines a 48-bit Unix timestamp with random bits, making it sequentially orderable. This makes UUID v7 much better for database indexing and sorting."
            },
            {
                question: "Is there a chance of two UUIDs being identical?",
                answer: "The probability of a collision in UUID v4 is incredibly low. To put it in perspective, you would need to generate billions of UUIDs per second for hundreds of years to have a 50% chance of a single collision."
            },
            {
                question: "Are the generated keys cryptographically secure?",
                answer: "Yes, our generator utilizes the Web Crypto API's secure random number generator (`crypto.getRandomValues`) to ensure the generated keys are cryptographically secure and unpredictable."
            }
        ],
        securityInfo: "All UUID generation runs client-side using browser-native cryptography APIs. No generated identifiers are sent or logged on the server."
    },
    "hash-generator": {
        title: "Cryptographic Hash Generator Guide",
        introduction: "A cryptographic hash function is an algorithm that takes an arbitrary amount of data input and maps it to a fixed-size bit string (the hash value, checksum, or digest). A secure hash is a one-way function, meaning it is computationally infeasible to reconstruct the original input from the output hash. This tool lets developers calculate secure digests (MD5, SHA-1, SHA-256, SHA-512, SHA-3) to verify file integrity, store passwords, or create unique checksums.",
        features: [
            "Calculates hashes in real-time as you type, supporting plain text and custom salts.",
            "Supports MD5, SHA-1, SHA-224, SHA-256, SHA-384, SHA-512, SHA-3, and RIPEMD-160.",
            "Includes non-cryptographic checksum algorithms such as CRC32 and Adler32.",
            "Provides outputs in hex, Base64, or binary layouts."
        ],
        howToUse: [
            "Enter the text you want to hash in the input panel.",
            "Select your desired hashing algorithm from the options list.",
            "Optionally add a secret key or salt if you are computing an HMAC.",
            "Copy the resulting hash value from the designated algorithm card."
        ],
        faq: [
            {
                question: "Is MD5 still secure for password hashing?",
                answer: "No, MD5 and SHA-1 are considered cryptographically broken because of collision vulnerabilities. For password storage or security, use stronger algorithms like SHA-256, bcrypt, or Argon2."
            },
            {
                question: "What is the purpose of a salt?",
                answer: "A salt is random data added to the input before hashing. It ensures that identical inputs result in unique hashes, preventing attackers from using precomputed tables (rainbow tables) to crack hashes."
            },
            {
                question: "Can I reverse a SHA-256 hash?",
                answer: "No, SHA-256 is designed to be a one-way function. It is mathematically impossible to reverse the hash to get the input. The only way to find the input is through brute-force searching or dictionary attacks."
            }
        ],
        securityInfo: "Hashing calculations are executed locally in your browser using optimized JS libraries. Your input strings and secret keys are never exposed over the network."
    },
    "password-generator": {
        title: "Secure Password Generator Guide",
        introduction: "Strong credentials are the first line of defense in cybersecurity. Weak passwords (like short words or common patterns) are easily guessed by automated dictionary and brute-force attacks. Our Password Generator uses cryptographically secure random number generators (CSPRNG) to build unpredictable passwords. It lets you customize length, select specific character pools, and analyze the resulting credential's entropy and strength.",
        features: [
            "Generates random passwords or readable passphrase combinations.",
            "Configurable lengths up to 128 characters with explicit character set selections.",
            "Live password strength estimator displaying entropy bits and guessed cracking times.",
            "One-click secure copy with visual clipboard confirmations."
        ],
        howToUse: [
            "Choose whether you want a random string password or a readable passphrase.",
            "Set the length slider (we recommend at least 16 characters for critical accounts).",
            "Toggle character sets: uppercase, lowercase, numbers, and special symbols.",
            "Copy the generated password and paste it directly into your credential manager."
        ],
        faq: [
            {
                question: "What constitutes a 'strong' password?",
                answer: "A strong password is long (16+ characters), contains a mix of character types, and is completely random. Avoid personal details, dictionary words, or repeating sequences."
            },
            {
                question: "What is password entropy?",
                answer: "Entropy measures the randomness of a password in bits. Higher entropy makes the password harder to guess. Passwords with over 80 bits of entropy are considered highly secure."
            },
            {
                question: "Why should I use a passphrase instead of a random string?",
                answer: "Passphrases (words joined together) are easier for humans to remember while remaining highly secure because of their length. For example, 'correct-horse-battery-staple' is easier to type but offers high entropy."
            }
        ],
        securityInfo: "Passwords are generated locally using the browser's cryptographically secure random values API. No passwords are ever stored, transmitted, or logged."
    },
    "ssl-decoder": {
        title: "SSL Certificate Decoder Guide",
        introduction: "An SSL/TLS certificate is a digital document that binds a public key to an entity's identity (like a website domain). These certificates are typically formatted in Base64-encoded ASCII blocks known as PEM format. The SSL Certificate Decoder helps you parse these opaque blocks into human-readable information to verify expiration dates, identify issuers, and ensure correct domains are covered.",
        features: [
            "Instantly decodes PEM encoded X.509 certificates.",
            "Displays critical information including Subject, Issuer, and Validity periods.",
            "Alerts you automatically if a certificate is expired or expiring soon.",
            "Extracts and lists Subject Alternative Names (SANs) and Key Usages."
        ],
        howToUse: [
            "Paste your PEM encoded certificate into the input area.",
            "Alternatively, drag and drop a .pem or .crt file, or use the Upload button.",
            "Review the decoded details in the output panel.",
            "Use the 'Copy Summary' button to quickly grab the most important details for reports."
        ],
        faq: [
            {
                question: "What is a PEM certificate?",
                answer: "PEM (Privacy Enhanced Mail) is the most common format for X.509 certificates, CSRs, and cryptographic keys. A PEM file is essentially a Base64-encoded block of data enclosed between '-----BEGIN CERTIFICATE-----' and '-----END CERTIFICATE-----' headers."
            },
            {
                question: "What are Subject Alternative Names (SANs)?",
                answer: "The SAN extension allows multiple domain names to be protected by a single SSL certificate. This is the modern standard for identifying which hostnames a certificate is valid for, superseding the Common Name (CN) field."
            },
            {
                question: "Is my certificate sent to a server for decoding?",
                answer: "No. All parsing and decoding is performed locally in your browser. Your public certificate data never leaves your device."
            }
        ],
        securityInfo: "All certificate decoding happens purely client-side using JavaScript. No certificate contents or metadata are transmitted over the network."
    },
    "cron-parser": {
        title: "Interactive Cron Expression Parser Guide",
        introduction: "A cron expression is a string of five or six fields representing a schedule for running automated scripts or tasks (cron jobs). Because standard cron syntax (`*/15 9-17 * * 1-5`) can be cryptic and error-prone, developers often struggle to write them correctly. The Cron Parser translates cron expressions into clear, human-readable sentences and calculates the upcoming execution dates so you can verify your schedules.",
        features: [
            "Translates standard, crontab, and Quartz cron expressions into clear, readable English.",
            "Displays the next 5 execution dates and times based on your current time zone.",
            "Interactive schedule builder to configure minutes, hours, days, and months without writing code.",
            "Live validation checks for out-of-range values or syntax conflicts."
        ],
        howToUse: [
            "Type your cron expression into the input field, or choose a pre-configured template.",
            "Read the translated description below the input box to verify the schedule matches your intent.",
            "Review the 'Next Executions' list to confirm dates and times.",
            "Use the builder controls to modify the fields visually and see the updated expression in real time."
        ],
        faq: [
            {
                question: "What do the five fields in a standard cron expression represent?",
                answer: "The fields stand for: 1. Minute (0-59), 2. Hour (0-23), 3. Day of Month (1-31), 4. Month (1-12 or Jan-Dec), and 5. Day of Week (0-6 or Sun-Sat)."
            },
            {
                question: "What does the 'L' character mean in a cron expression?",
                answer: "The 'L' character stands for 'Last'. In the Day of Month field, it represents the last day of the month (e.g. 31 for January, 28 for February). In the Day of Week field, it represents the last day of the week (Saturday)."
            },
            {
                question: "How do I run a cron job every 15 minutes?",
                answer: "You can write the cron expression as `*/15 * * * *`. The `*/15` in the minute field tells the system to trigger the job at every interval that is a multiple of 15."
            }
        ],
        securityInfo: "Parsing algorithms run client-side. No schedules, servers, or task information are processed on our servers."
    },
    "env-editor": {
        title: "Environment Variable (.env) Editor Guide",
        introduction: "Environment variables (.env files) are standard tools used to configure application settings, database credentials, and API keys outside of code repositories. Managing raw `.env` files can be challenging when variables are formatted incorrectly, contain nested quotes, or lack organization. The Environment Variable Editor parses raw config files into a structured key-value table, making it easy to add, delete, sort, and clean up settings.",
        features: [
            "Parses complex `.env` files into a clean, searchable key-value table grid.",
            "Detects duplicate variables, missing values, and formatting syntax errors.",
            "Hides sensitive credential values by default with hover-to-reveal toggles.",
            "Exports configuration settings to JSON, YAML, or clean `.env` code layouts."
        ],
        howToUse: [
            "Paste your raw `.env` configuration file text into the editor window.",
            "Use the interactive table to edit keys, update values, add new variables, or remove old ones.",
            "Filter or search variables by key name using the search bar.",
            "Select your export format (e.g., `.env`, JSON, or YAML) and copy or download the results."
        ],
        faq: [
            {
                question: "How should I handle values with spaces in a .env file?",
                answer: "Values containing spaces, hash symbols, or special characters should be wrapped in double quotes (e.g. `APP_NAME=\"My Web App\"`) to prevent parsing errors in your backend code."
            },
            {
                question: "Why should I keep my .env files out of git repositories?",
                answer: "Environment files often contain sensitive secrets like database passwords, private keys, and API tokens. Committing them to Git repositories exposes them to anyone with repository access, presenting a severe security risk."
            },
            {
                question: "Can this tool handle comments inside .env files?",
                answer: "Yes, our editor parses lines starting with `#` as comments. It displays them within the grid and preserves them when you export back to the standard `.env` format."
            }
        ],
        securityInfo: "Your configuration details and API keys are parsed and edited entirely in your local browser memory. Absolutely no data is uploaded or saved on any remote server."
    },
    "regex-tester": {
        title: "Regular Expression (Regex) Tester Guide",
        introduction: "Regular Expressions (Regex) are search patterns used to validate, match, and replace characters within text strings. Because regex syntax can be complex and hard to debug (`/^([a-z0-9_\\.-]+)@([\\da-z\\.-]+)\\.([a-z\\.]{2,6})$/`), developers need interactive tools to test patterns. Our Regex Tester highlights matched text in real time, displays captured group details, and explains pattern components in plain English.",
        features: [
            "Real-time highlighting of regex matches and captured groups as you type.",
            "Supports standard flags: global (g), case-insensitive (i), multiline (m), and single-line (s).",
            "Detailed sidebar explanation breaking down the tokens of your regex pattern.",
            "AI-assisted regex generator to translate natural descriptions into patterns."
        ],
        howToUse: [
            "Enter your regex pattern in the top input box (excluding the enclosing slashes).",
            "Paste your target test text into the large text area panel.",
            "Select the active regex flags (like global or case-insensitive) from the settings list.",
            "Inspect the highlighted text and review capture group values in the sidebar."
        ],
        faq: [
            {
                question: "What does the 'global' (g) flag do?",
                answer: "The global flag tells the regex engine to find all matches in the text rather than stopping after the first match. If disabled, only the first match is returned."
            },
            {
                question: "How do I match special characters like '.' or '*' literally?",
                answer: "To match regex syntax characters literally, you must escape them using a backslash (e.g. `\\.` to match a period, or `\\*` to match an asterisk)."
            },
            {
                question: "What is the difference between lazy and greedy matching?",
                answer: "Greedy quantifiers (like `*` or `+`) match as many characters as possible. Adding a question mark (`*?` or `+?`) makes them lazy, telling the engine to match as few characters as possible."
            }
        ],
        securityInfo: "Pattern matching and parsing algorithms run inside your local browser sandbox. No input text or regex patterns are sent over the network."
    },
    "subnet-calculator": {
        title: "CIDR & IP Subnet Calculator Guide",
        introduction: "Subnetting is the practice of dividing a single physical network into multiple logical subnetworks. This helps optimize network traffic, organize devices, and secure subnets. Our calculator takes an IP address and a subnet mask (or CIDR prefix) and calculates network addresses, host address ranges, broadcast addresses, and wildcard masks.",
        features: [
            "Calculates complete subnet metrics from an IP address and CIDR prefix length (e.g. /24).",
            "Displays host address ranges, network address, broadcast address, and total usable host count.",
            "Generates binary representations of the IP and mask to help visualize subnet divisions.",
            "Interactive subnet splitter to split a network range into smaller subnets."
        ],
        howToUse: [
            "Enter the base IP address (IPv4 format, e.g. `192.168.1.1`) in the input box.",
            "Select the subnet mask prefix (e.g., /24 or 255.255.255.0) using the dropdown list.",
            "Review the calculated network details in the dashboard metrics cards.",
            "Use the visual binary breakdown below to understand the network and host bit split."
        ],
        faq: [
            {
                question: "What does CIDR stand for?",
                answer: "CIDR stands for Classless Inter-Domain Routing. It is a method for allocating IP addresses and routing IP packets, replacing the older class-based system (Class A, B, C) with a more flexible prefix-based system (e.g. /24)."
            },
            {
                question: "Why are the first and last IP addresses in a subnet unusable for hosts?",
                answer: "The first address in a subnet is reserved as the network address (used to identify the subnet itself). The last address is reserved as the broadcast address (used to send packets to all devices on the subnet)."
            },
            {
                question: "What is a wildcard mask?",
                answer: "A wildcard mask is the bitwise inverse of a subnet mask (calculated by subtracting the subnet mask from 255.255.255.255). It is commonly used in router access control lists (ACLs) to match IP addresses."
            }
        ],
        securityInfo: "Subnetting calculations are completed client-side using JavaScript. No IP addresses or network details are logged or uploaded."
    },
    "diff-checker": {
        title: "Text Diff Checker Guide",
        introduction: "A Diff Checker compares two versions of text (original vs updated) and highlights the differences between them. It is widely used by developers during code reviews, document validation, and formatting checks to identify added, modified, or deleted characters. The Diff Checker runs comparison algorithms, aligns matching blocks, and displays changes in side-by-side or unified layouts.",
        features: [
            "Highlights added, deleted, and changed lines using standard colors (green/red).",
            "Performs character-level diffing to pinpoint precise edits within lines.",
            "Offers side-by-side split comparison views and unified line-by-line layouts.",
            "Synchronized scrolling to navigate original and updated files together."
        ],
        howToUse: [
            "Paste the original version of your text into the left text box.",
            "Paste the updated version into the right text box.",
            "Toggle between 'Split' and 'Unified' comparison views based on your layout preference.",
            "Review the highlighted additions and deletions directly on screen."
        ],
        faq: [
            {
                question: "What algorithm does this diff checker use?",
                answer: "This tool uses an optimized implementation of the Myers Diff Algorithm, which finds the minimum number of edits required to transform the original text into the updated version."
            },
            {
                question: "Can I compare code files like JavaScript, Python, or HTML?",
                answer: "Yes, this tool can compare any plain text files. It preserves formatting, indentation, and spaces, making it perfect for comparing code snippets, config files, and JSON payloads."
            },
            {
                question: "Does the checker support line wrapping?",
                answer: "Yes, you can toggle line wrapping on or off to prevent long lines from running off the screen, making it easier to read prose or code."
            }
        ],
        securityInfo: "Text diff comparison is performed locally on your device. Your texts, codes, and documents are never uploaded to our servers."
    },
    "dns-lookup": {
        title: "DNS Lookup Utility Guide",
        introduction: "The Domain Name System (DNS) is the phonebook of the internet, translating human-friendly domain names (e.g. `example.com`) into computer-readable IP addresses (e.g. `93.184.216.34`). When you request a domain lookup, the resolver queries name servers to find active records. Our DNS Lookup utility lets you fetch records (A, AAAA, MX, CNAME, TXT, NS, SOA) to troubleshoot server configurations, verify domain ownership, or check email settings.",
        features: [
            "Resolves standard DNS records instantly: A, AAAA, CNAME, MX, TXT, NS, and SOA.",
            "Fetches TTL (Time to Live) details and query execution times.",
            "Validates domain names and identifies propagation status.",
            "Outputs clean, copyable JSON tables of DNS record responses."
        ],
        howToUse: [
            "Enter the domain name (e.g. `google.com`) in the lookup input box.",
            "Select the target record type from the menu, or select 'ANY' to fetch all active records.",
            "Click 'Resolve' to query global DNS name servers.",
            "Review the output table containing record values, TTL durations, and priorities."
        ],
        faq: [
            {
                question: "What is the difference between an A record and a CNAME record?",
                answer: "An A (Address) record maps a domain name directly to an IPv4 address. A CNAME (Canonical Name) record maps an alias domain name to another domain name, rather than an IP address."
            },
            {
                question: "Why do my DNS changes take time to appear?",
                answer: "This delay is due to DNS propagation. Each DNS record has a TTL (Time to Live) value in seconds, telling DNS caches how long to store the record before requesting an update. Propagation can take from a few minutes up to 48 hours."
            },
            {
                question: "What are MX and TXT records used for?",
                answer: "MX (Mail Exchanger) records route email traffic to your mail servers. TXT (Text) records store descriptive text notes, commonly used for domain verification (like Google Search Console) and email security policies (like SPF and DKIM)."
            }
        ],
        securityInfo: "Lookup requests query global DNS resolvers directly. No domain queries, IP addresses, or lookup histories are saved on the server."
    },
    "markdown-editor": {
        title: "Live Markdown Editor & Previewer Guide",
        introduction: "Markdown is a lightweight markup language that uses plain text formatting syntax. It is designed to be easy for humans to read and write, and compiles cleanly into standard HTML. The Live Markdown Editor provides a split-screen workspace where you can write plain text code on one side and see formatted previews (headers, links, lists, code highlighting, tables, and Mermaid.js diagrams) in real time.",
        features: [
            "Split-pane layout with live rendering side-by-side as you type.",
            "Full support for GitHub Flavored Markdown (GFM), including task lists and tables.",
            "Syntax highlighting for code blocks in multiple languages (JS, Python, HTML).",
            "Mermaid.js integration to build and render flowcharts, sequence diagrams, and gantt charts."
        ],
        howToUse: [
            "Type your Markdown code into the editor workspace panel on the left.",
            "Observe the styled, formatted HTML rendering update on the right.",
            "Use the toolbar buttons to quickly insert headers, links, lists, tables, or image tags.",
            "Export the resulting text as a Markdown file (.md) or copy the compiled HTML code."
        ],
        faq: [
            {
                question: "How do I create a link in Markdown?",
                answer: "To insert a hyperlink, wrap the anchor text in square brackets and the URL in parentheses: `[Link Text](https://example.com)`."
            },
            {
                question: "How does the Mermaid.js integration work?",
                answer: "You can render diagrams by writing code inside a fenced code block with the `mermaid` language tag. For example:\n```\n```mermaid\ngraph TD;\nA-->B;\n```\n```"
            },
            {
                question: "Is GFM fully supported?",
                answer: "Yes, our renderer supports GitHub Flavored Markdown features, including tables, strike-through text, automatic link parsing, and task list checkboxes."
            }
        ],
        securityInfo: "All rendering and document parsing happen locally in your browser session. Your documents are never uploaded to any remote server."
    },
    "json-to-types": {
        title: "JSON to Types (TypeScript / Python) Converter Guide",
        introduction: "TypeScript and Python Pydantic models require explicit type declarations to validate API request schemas. When building integrations, manually translating JSON API responses into type interfaces is tedious and prone to typos. Our JSON to Types converter analyzes sample JSON data, detects data types (and nested objects/arrays), and automatically generates clean TypeScript interfaces or Python classes (Pydantic / dataclasses).",
        features: [
            "Converts raw JSON data into TypeScript interfaces or Python Pydantic models.",
            "Supports unquoted keys, single quotes, and template variables (e.g. `{{VAR}}`) in JSON inputs.",
            "Merges heterogeneous arrays into union types (e.g. `(string | number)[]`).",
            "Deduplicates identical nested objects, renaming and reusing sub-interfaces."
        ],
        howToUse: [
            "Paste your sample JSON payload into the input editor panel.",
            "Select your output target: TypeScript interfaces, Python Pydantic v2 models, or Python `@dataclass` classes.",
            "The generated code will appear in the output window.",
            "Copy the resulting types and paste them into your project files."
        ],
        faq: [
            {
                question: "How does the tool handle missing or null keys?",
                answer: "Null keys or values with varying structures across array elements are inferred as optional fields (e.g., `key?: string` in TypeScript or `Optional[str]` in Python)."
            },
            {
                question: "What is Pydantic and why use it?",
                answer: "Pydantic is a library for data parsing and validation in Python. It enforces type hints at runtime, throwing clean errors if input data does not match defined schemas. This is the standard for modern APIs built with FastAPI."
            },
            {
                question: "Can I use malformed JSON as input?",
                answer: "Yes, our parser is designed to be relaxed. It automatically normalizes common issues like unquoted keys, single quotes, trailing commas, and template placeholders before parsing."
            }
        ],
        securityInfo: "All parsing and code generation algorithms run client-side. Your JSON structures and field names are never transmitted over the internet."
    },
    "jwt-decoder": {
        title: "JWT Decoder & Claims Inspector Guide",
        introduction: "A JSON Web Token (JWT) is an open standard (RFC 7519) that defines a compact, self-contained way for securely transmitting information between parties as a JSON object. This information can be verified and trusted because it is digitally signed. JWTs consist of three parts: a header (specifying the signing algorithm), a payload (containing the claims/user data), and a signature (used to verify validity). This utility decodes JWTs client-side, parses standard claims, and verifies HMAC signatures in the browser.",
        features: [
            "Decodes JWT tokens client-side, displaying header and payload JSON structures.",
            "Parses standard claims (expiration, issued at, audience) into readable local date and times.",
            "Cryptographically verifies HMAC signatures (HS256, HS384, HS512) using browser-native Web Crypto API.",
            "Displays visual warning banners for expired or invalid tokens."
        ],
        howToUse: [
            "Paste your JWT token string into the token input box.",
            "The tool will instantly decode the token and display the parsed header and payload.",
            "Review the Claims summary panel to see dates like Expiration and Issued At.",
            "To verify the signature, enter your HMAC secret key in the verification panel."
        ],
        faq: [
            {
                question: "Is it safe to paste my JWT token into this website?",
                answer: "Yes, this tool decodes the token entirely in your browser using JavaScript. No token details or secret keys are sent to a server. You can verify this by inspecting the network tab or running the page offline."
            },
            {
                question: "What does the expiration claim (exp) mean?",
                answer: "The `exp` claim specifies the expiration time on or after which the JWT must not be accepted for processing. It is represented as a Unix epoch timestamp in seconds."
            },
            {
                question: "Can a client-side decoder verify RSA or ECDSA signatures?",
                answer: "Decoders can parse and display tokens signed with RSA or ECDSA. However, cryptographically verifying these signatures requires the corresponding public keys (often fetched via JWKS endpoints), which is not supported in simple HMAC verification inputs."
            }
        ],
        securityInfo: "Decoding, parsing, and cryptographic signature validations are performed client-side. No tokens or keys are ever uploaded or transmitted."
    },
    "notepad": {
        title: "Notepad Guide",
        introduction: "Welcome to toolich.com's ultimate online notepad, designed to provide a fast, reliable, and distraction-free environment for all your note-taking needs. Whether you're jotting down a quick idea, drafting a long document, or pasting code snippets, our browser-based text editor ensures that your data is handled efficiently. Because the tool runs entirely in your browser, there's no need to download or install any heavy applications.",
        features: [
            "Persistent Storage: Your notes are automatically saved to your local browser session. You can accidentally close the tab, and your text will still be here when you return.",
            "Live Statistics: Keep track of your progress with real-time character, word, and line counts. Perfect for meeting strict character limits for social media or essays.",
            "Export to Text File: Done writing? Instantly download your notes as a standard .txt file directly to your device with a single click."
        ],
        howToUse: [
            "Using the Notepad tool is incredibly straightforward. The main interface consists of a large text area where you can immediately start typing or pasting your content.",
            "As you type, you'll notice the live statistics at the bottom of the editor updating in real-time.",
            "Click the 'Copy' button in the toolbar to instantly copy the entire contents of the notepad to your clipboard.",
            "Click the 'Download' button to save your current notes as a standard plain text file (notes.txt)."
        ],
        faq: [
            {
                question: "Will my notes be saved if I refresh the page?",
                answer: "Yes! The notepad utilizes your browser's local storage capabilities to persist your data. Every keystroke is saved locally to your active session."
            },
            {
                question: "Can anyone else see my notes?",
                answer: "No. Your notes are stored purely in your browser's local storage. They are never transmitted over the internet or saved to our servers."
            }
        ],
        securityInfo: "We respect your privacy. All notes remain on your local machine and are never uploaded, stored, or processed on our servers."
    },
    "notebook": {
        title: "Notebook Guide",
        introduction: "Welcome to the Notebook—your structured, long-term personal knowledge base. Unlike temporary scratchpads, the Notebook is designed to help you organize multiple notes, journal entries, and documentation snippets. It supports Markdown formatting and saves all your data persistently across sessions using your browser's local storage.",
        features: [
            "Multi-Note Organization: Create, manage, and switch between multiple notes from the convenient sidebar.",
            "Markdown Support: Write your notes using standard Markdown syntax, and toggle Preview mode to see rich text formatting (bold, italics, lists, etc.).",
            "Persistent Local Storage: Your notes are saved automatically to your device's local storage, meaning they will be here even if you close the browser and return days later.",
            "Search Functionality: Quickly filter your list of notes by title or content using the sidebar search bar.",
            "Export: Instantly export any individual note as a `.md` markdown file."
        ],
        howToUse: [
            "Click the '+ New Note' button in the sidebar to create a fresh note.",
            "Update the 'Note Title' at the top of the editor to keep things organized.",
            "Start typing your content in the main text area. You can use Markdown formatting like `#` for headings, `**bold**` for bold text, and `-` for bullet points.",
            "Click the 'Preview' button in the toolbar to see how your Markdown looks rendered as rich HTML.",
            "To delete a note, hover over its name in the sidebar and click the trash can icon."
        ],
        faq: [
            {
                question: "Where are my notes actually stored?",
                answer: "Your notes are stored in your web browser's `localStorage`. This means they are saved securely on your specific device and browser. They are not uploaded to our servers."
            },
            {
                question: "Will I lose my notes if I clear my browser history?",
                answer: "Yes. Because notes are saved in your browser's local storage, clearing your site data or cache for toolich.com will permanently delete your notes. We highly recommend exporting important notes as files."
            }
        ],
        securityInfo: "Your Notebook operates entirely locally. No textual data, metadata, or titles are ever transmitted over the internet."
    },
    "python-compiler": {
        title: "Python Compiler & REPL Guide",
        introduction: "Python is one of the most popular programming languages for data science, scripting, and web development. Our Python Compiler uses Pyodide to run a full CPython interpreter compiled to WebAssembly (Wasm) directly inside your browser. This allows you to write, test, and execute Python 3 code instantly without installing any local development environments or sending your code to remote servers.",
        features: [
            "Runs a full CPython 3 interpreter locally in your web browser using WebAssembly.",
            "Live interactive console (REPL) and standard output streaming.",
            "Supports standard library modules (like math, datetime, json) out of the box.",
            "Syntax-highlighted code editor with line numbers and auto-indentation."
        ],
        howToUse: [
            "Type your Python 3 code into the editor panel.",
            "Click the 'Run' button (or use Ctrl+Enter / Cmd+Enter) to execute the script.",
            "View the standard output, print statements, or error traces in the console terminal below.",
            "Use the console to interactively test small snippets or check variable values."
        ],
        faq: [
            {
                question: "Can I import third-party packages like NumPy or Pandas?",
                answer: "Currently, this lightweight compiler supports the standard Python library. For heavy scientific computing packages, a larger Pyodide bundle is required, which we omit here to keep the tool extremely fast."
            },
            {
                question: "Does my code run on a backend server?",
                answer: "No. All Python code is executed entirely within your browser's WebAssembly sandbox. We do not transmit or save your code on any server."
            },
            {
                question: "Can I read or write local files using this compiler?",
                answer: "Because the compiler runs in a secure browser sandbox, it cannot directly access your computer's local file system. However, it can read from a virtual in-memory file system provided by Pyodide."
            }
        ],
        securityInfo: "Your Python code is executed inside a secure, sandboxed WebAssembly environment within your browser. Code is never uploaded to any remote server."
    },
    "http-status-codes": {
        title: "HTTP Status Codes Reference",
        introduction: "HTTP Status Codes are standardized three-digit numbers sent by servers in response to a client's request. Understanding these codes is essential for debugging APIs, web applications, and network connectivity issues. The HTTP Status Code Reference tool provides a searchable, categorized database of all standard 1xx through 5xx status codes.",
        features: [
            "Complete dictionary of standard HTTP status codes (1xx, 2xx, 3xx, 4xx, 5xx).",
            "Real-time search to instantly filter by code number or keyword description.",
            "Quick-copy functionality to effortlessly copy status codes and their full descriptions to the clipboard.",
            "Categorized filtering for Informational, Success, Redirection, Client Error, and Server Error codes."
        ],
        howToUse: [
            "Type a status code number (e.g., '404') or a keyword (e.g., 'Not Found') into the search bar.",
            "Browse the filtered list of status codes that match your query.",
            "Click on the category buttons to filter status codes by their generic HTTP class.",
            "Click the 'Copy' icon next to any status code to copy its details to your clipboard."
        ],
        faq: [
            {
                question: "What do the different 100-500 series codes mean?",
                answer: "1xx codes are Informational. 2xx codes indicate Success. 3xx codes are for Redirection. 4xx codes represent Client Errors (e.g., bad request, unauthorized). 5xx codes represent Server Errors (e.g., internal server error, gateway timeout)."
            },
            {
                question: "Are non-standard status codes included?",
                answer: "This reference currently focuses on the official, standardized IANA HTTP status codes to ensure accuracy and relevance for standard web development."
            }
        ],
        securityInfo: "This tool operates entirely locally as a reference guide. No queries or searches are sent to any external server."
    },
    "ip-lookup": {
        title: "IP Address Lookup",
        introduction: "An IP (Internet Protocol) address uniquely identifies a device on the internet or a local network. The IP Address Lookup tool allows you to instantly determine the approximate geographic location, ISP (Internet Service Provider), and ASN (Autonomous System Number) associated with any public IPv4 or IPv6 address.",
        features: [
            "Automatically detects and displays details for your own public IP address upon opening.",
            "Supports querying both IPv4 and modern IPv6 addresses.",
            "Retrieves detailed network metadata including ISP organization, ASN, Country, Region, City, and Timezone.",
            "Displays the IP's registered approximate location on an interactive, highly-responsive map.",
            "One-click copy buttons for every data point."
        ],
        howToUse: [
            "Open the tool to automatically view details and the map location of your current public IP address.",
            "To look up a different IP, type an IPv4 or IPv6 address into the search bar and click 'Lookup'.",
            "Click the 'Clear' button to reset the view back to your own public IP.",
            "Click the 'Copy' icons next to any specific field (like ASN or Coordinates) to copy it to your clipboard."
        ],
        faq: [
            {
                question: "Why does the map show a different city than my actual location?",
                answer: "IP geolocation databases map IP addresses to the physical locations where your ISP registers them, which is often a regional data center or routing hub, rather than your exact GPS location."
            },
            {
                question: "Can I look up private or local IP addresses?",
                answer: "No, private network IP addresses (like 192.168.x.x or 10.x.x.x) are strictly used within local networks and do not have public geographic or ASN data associated with them."
            },
            {
                question: "Why do I have an IPv6 address instead of an IPv4 address?",
                answer: "Due to the global exhaustion of IPv4 addresses, many ISPs (especially mobile carriers) natively assign the longer, newer IPv6 addresses to client devices."
            }
        ],
        securityInfo: "Queries are sent directly to a public IP geolocation API via HTTPS. We do not store or track the IP addresses you search for."
    }
};
