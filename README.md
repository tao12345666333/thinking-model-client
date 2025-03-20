---
title: Thinking Model Client
emoji: 🤖
colorFrom: blue
colorTo: blue
sdk: docker
sdk_version: 1.0.0
app_file: Dockerfile
pinned: false
---


# Thinking Model Client 🧠🤖

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)

A modern React-based chat application that provides a unique interface for interacting with AI models. The application not only displays model responses but also visualizes the thinking process behind each response, giving users insight into how the AI arrives at its conclusions.

## Table of Contents
- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Configuration](#configuration)

## Features ✨

- 🧠 **Thinking Process Visualization**: See the step-by-step reasoning behind each AI response with interactive visualizations
- 🔗 **Flexible API Integration**: Easily connect to different AI models through configurable API endpoints
- 💾 **Conversation Persistence**: All chats are automatically saved in local storage for continuity
- 🐳 **Docker Deployment**: Ready for containerized deployment with included Docker configuration
- ⚙️ **Customizable Settings**: Adjust API parameters and model configurations through an intuitive settings panel
- 💬 **Real-time Chat**: Modern interface with smooth animations and multiple conversation tabs
- 🤖 **Multiple Models**: Support for various AI model integrations through a unified interface
- 🛠️ **Modern Stack**: Built with React and Vite for optimal performance and development experience
- 🧪 **Quality Assured**: Comprehensive unit tests ensure reliable functionality
- 🔒 **Local Data Storage**: All data is stored locally for enhanced privacy and security

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/tao12345666333/thinking-model-client.git
cd thinking-model-client
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

This will concurrently run both the frontend development server and the backend proxy server.

4. Open your browser and navigate to `http://localhost:5173` to use the application.

## Configuration

The application can be configured through the settings panel, which supports multiple profiles:

### Chat Profiles

Each chat profile includes:
- **Profile Name**: Custom name for the profile
- **API Endpoint**: The endpoint for the AI model
  - Ends with `/` → `/chat/completions` will be appended
  - Ends with `#` → `#` will be removed
  - Other cases → `/v1/chat/completions` will be appended
- **API Key**: Your authentication key for the API
- **Model Name**: The model to use (e.g., DeepSeek-R1)

### Summarization Profile

A separate profile for conversation summarization:
- **API Endpoint**: Endpoint for the summarization service
- **API Key**: Authentication key for summarization
- **Model Name**: The model to use for summarization

All settings are stored locally for privacy and security. You can manage multiple chat profiles and switch between them as needed.
