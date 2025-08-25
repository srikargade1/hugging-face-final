# SQLRooms AI demo app

[More about this example](https://sqlrooms.github.io/examples/)

## 🚀 Features

- **AI-Powered Data Analysis**: Use AI to generate SQL queries and analyze data
- **Multiple AI Providers**: Support for OpenAI, Anthropic, Google, DeepSeek, Ollama, and **HuggingFace**
- **Interactive Charts**: Create visualizations with Vega charts
- **Data Import**: Load CSV, JSON, Parquet, and other file formats
- **HuggingFace Integration**: Connect your own deployed models for custom AI analysis

## 🤗 HuggingFace Integration

This app includes a complete HuggingFace Inference Endpoint provider integration:

- **Deploy Custom Models**: Use your own models deployed on HuggingFace
- **Multiple Endpoint Types**: Support for dedicated, serverless, and inference provider endpoints
- **Automatic Retry Logic**: Built-in handling for model cold starts
- **Easy Configuration**: Simple UI for API keys and endpoint URLs

### Quick Start
- [5-Minute Setup Guide](QUICKSTART.md)
- [Complete Integration Guide](HUGGINGFACE_INTEGRATION.md)
- [Demo Configurations](src/providers/huggingface/demo-config.ts)

## 🏃‍♂️ Running locally

Run the following:

    npm install
    npm run dev

## 🔧 Configuration

1. **Select AI Provider**: Choose from the available providers in the model selector
2. **Add API Keys**: Enter your API keys for the selected provider
3. **Configure Endpoints**: For HuggingFace, add your inference endpoint URL
4. **Start Analyzing**: Ask questions about your data!

## 📁 Project Structure

```
src/
├── components/           # React components
├── providers/           # AI provider implementations
│   └── huggingface/    # HuggingFace provider
├── store.ts            # State management with Zustand
└── models.ts           # Model definitions
```

## 🆘 Need Help?

- Check the [HuggingFace Integration Guide](HUGGINGFACE_INTEGRATION.md)
- Review the [Quick Start Guide](QUICKSTART.md)
- Explore the [demo configurations](src/providers/huggingface/demo-config.ts)
