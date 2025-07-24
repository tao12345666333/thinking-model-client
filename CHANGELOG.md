# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-07-24

### Added
- xsai integration for LLM provider connections
- Automatic reasoning extraction using `@xsai/utils-reasoning`
- Test script for xsai integration (`test-xsai.js`)
- Enhanced documentation for xsai usage

### Changed
- **BREAKING**: Migrated from `node-fetch` to xsai SDK for all AI model connections
- Chat endpoint now uses `@xsai/stream-text` for streaming responses
- Summarization endpoint now uses `@xsai/generate-text` for text generation
- Improved error handling and streaming reliability
- Enhanced reasoning process extraction and display

### Removed
- `node-fetch` dependency (replaced by xsai packages)

### Technical Details
- Server now uses xsai's `streamText` and `generateText` functions
- Automatic extraction of thinking processes from model responses
- Better streaming performance and error handling
- Runtime-agnostic AI SDK support

## [0.1.1] - 2025-03-23

### Added
- Summarization profile API endpoint for conversation summaries

### Changed
- Bumped version to 0.1.1

## [0.1.0] - 2025-03-21

### Added
- Streaming support for chat interactions (#1)
- Multiple chat profile support
- Summarization profile configuration in settings
- Enhanced UI styling and theming

### Changed
- Updated package dependencies to latest versions
- Refactored ChatList component to remove unnecessary header
- Reorganized summarization profile settings for better clarity
- Removed profile name input from summarization settings

### Fixed
- Style inconsistencies in chat interface

### Documentation
- Updated README with detailed feature descriptions
- Added chat profile configuration guidelines
- Included license information

## [0.0.1] - 2025-01-31

### Initial Release
- Basic chat functionality
- Initial project setup and configuration
fed58aa 2025-03-23 Bump version to 0.1.1
f2fe7c8 2025-03-21 refactor: remove unnecessary header from ChatList component
77aaa1f 2025-03-20 docs: update README to enhance feature descriptions and add chat profile configuration details
4218b1b 2025-03-20 refactor: reorganize summarization profile settings for improved clarity
d2876cb 2025-03-20 refactor: remove profile name input from summarization profile settings
2316bca 2025-03-20 feat: add summarization profile support and API endpoint for conversation summaries
434a486 2025-03-04 feat: update package dependencies and enhance UI styling
fa4edd5 2025-03-03 Add multiple profiles
ee61dec 2025-03-03 fix style
5def997 2025-03-01 Enhances API endpoint handling
fe9f896 2025-02-22 add streaming support (#1)
c9d7e50 2025-01-31 Create LICENSE
863741a 2025-01-31 Update README for hf
ddac6a2 2025-01-31 init version
