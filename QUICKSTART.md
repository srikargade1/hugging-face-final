# Quick Start: HuggingFace Integration

Get up and running with HuggingFace in SQLRooms in 5 minutes!

## 🚀 Step 1: Get Your HuggingFace Credentials

1. **Get API Token**: 
   - Go to [HuggingFace Settings](https://huggingface.co/settings/tokens)
   - Click "New token"
   - Copy the token (starts with `hf_`)

2. **Deploy a Model**:
   - Go to [Inference Endpoints](https://ui.endpoints.huggingface.co/)
   - Click "New Endpoint"
   - Choose a model (e.g., `microsoft/Phi-3-mini-4k-instruct`)
   - Deploy and copy the endpoint URL

## ⚙️ Step 2: Configure SQLRooms

1. **Select Provider**: In the model dropdown, choose "huggingface"
2. **Add API Key**: Paste your HuggingFace token
3. **Add Endpoint URL**: Paste your endpoint URL
4. **Select Model**: Choose your model or use "custom"

## 🧪 Step 3: Test It Out

Ask a question about your data:
```
"What is the average magnitude of earthquakes by year?"
```

## 📝 Example Configuration

```typescript
// Your configuration should look like this:
{
  provider: 'huggingface',
  apiKey: 'hf_your_token_here',
  endpointUrl: 'https://phi-3-mini.endpoints.huggingface.cloud',
  model: 'microsoft/Phi-3-mini-4k-instruct'
}
```

## 🔧 Troubleshooting

- **"API key required"**: Add your HuggingFace token
- **"Endpoint URL required"**: Add your inference endpoint URL
- **503 errors**: Model is loading, wait a moment and retry

## 📚 Next Steps

- Read the full [Integration Guide](HUGGINGFACE_INTEGRATION.md)
- Check out [Demo Configs](src/providers/huggingface/demo-config.ts)
- Explore different model options

## 🆘 Need Help?

- Check the browser console for detailed error messages
- Verify your endpoint is running at [Inference Endpoints](https://ui.endpoints.huggingface.co/)
- Test your endpoint directly with curl (see full guide)

---

**That's it!** You're now using HuggingFace models in SQLRooms! 🎉
