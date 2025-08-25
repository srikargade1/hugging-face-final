# HuggingFace Provider Integration for SQLRooms

This document explains how to use the HuggingFace Inference Endpoint provider integration in SQLRooms.

## Overview

The HuggingFace integration allows you to:
- Deploy your own models to HuggingFace Inference Endpoints
- Connect those endpoints to SQLRooms for AI-powered data analysis
- Use custom models for SQL generation, data insights, and chart creation

## Prerequisites

1. **HuggingFace Account**: You need a HuggingFace account with an API token
2. **Inference Endpoint**: A deployed model on HuggingFace Inference Endpoints
3. **API Token**: Your HuggingFace API token (starts with `hf_`)

## Setup Steps

### 1. Deploy a Model to HuggingFace Inference Endpoints

1. Go to [HuggingFace Inference Endpoints](https://ui.endpoints.huggingface.co/)
2. Click "New Endpoint"
3. Select your model (e.g., `microsoft/Phi-3-mini-4k-instruct`)
4. Choose your compute resources
5. Deploy the endpoint
6. Copy the endpoint URL (e.g., `https://your-model-name.endpoints.huggingface.cloud`)

### 2. Configure SQLRooms

1. **Select HuggingFace Provider**: In the model selector, choose "huggingface" as the provider
2. **Enter API Key**: Add your HuggingFace API token
3. **Enter Endpoint URL**: Paste your inference endpoint URL
4. **Select Model**: Choose the model you want to use (or use "custom" for a specific model ID)

## Configuration Options

### Provider Types

The integration supports three types of HuggingFace endpoints:

#### 1. Dedicated Endpoints (Recommended)
- **Use Case**: Production deployments with dedicated compute
- **Configuration**: Requires both `baseURL` and `apiKey`
- **Example**: `https://your-model.endpoints.huggingface.cloud`

#### 2. Serverless Endpoints
- **Use Case**: On-demand inference with shared compute
- **Configuration**: Only requires `apiKey`
- **Base URL**: Automatically uses `https://api-inference.huggingface.co/v1`

#### 3. Inference Providers
- **Use Case**: Using models from HuggingFace's model hub
- **Configuration**: Only requires `apiKey`
- **Base URL**: Automatically uses `https://router.huggingface.co/v1`

### Model Selection

When using HuggingFace, you can:

1. **Use Predefined Models**: Select from popular models like:
   - `microsoft/Phi-3-mini-4k-instruct`
   - `meta-llama/Llama-2-7b-chat-hf`
   - `microsoft/DialoGPT-medium`

2. **Use Custom Models**: Select "custom" and enter any model ID from HuggingFace Hub

## Usage Examples

### Basic Data Analysis
```
User: "What is the average magnitude of earthquakes by year?"
```

The AI will:
1. Generate SQL to analyze the earthquakes dataset
2. Execute the query
3. Provide insights and optionally create charts

### Complex Queries
```
User: "Show me a chart of earthquake frequency by month, excluding events below magnitude 4.0"
```

The AI will:
1. Write complex SQL with filtering and grouping
2. Create a visualization using the Vega chart tool
3. Provide analysis of the patterns

## Error Handling

### Common Issues and Solutions

#### 1. "HuggingFace API key required"
- **Cause**: Missing or invalid API token
- **Solution**: Check your API token in the settings

#### 2. "HuggingFace endpoint URL required"
- **Cause**: Missing endpoint URL
- **Solution**: Add your inference endpoint URL

#### 3. Model Loading Errors (503 status)
- **Cause**: Model is cold-starting or overloaded
- **Solution**: The provider automatically retries with exponential backoff

#### 4. Invalid Model ID
- **Cause**: Model doesn't exist or isn't accessible
- **Solution**: Verify the model ID and ensure you have access

## Performance Considerations

### Cold Start Handling
- The provider includes automatic retry logic for 503 errors
- Exponential backoff prevents overwhelming the endpoint
- Maximum of 3 retry attempts

### Response Time
- Dedicated endpoints: Fastest response times
- Serverless endpoints: Variable response times based on load
- Inference providers: Depends on model availability

## Security Best Practices

1. **API Key Management**: Never commit API keys to version control
2. **Endpoint Access**: Use private endpoints for sensitive data
3. **Model Selection**: Choose models appropriate for your data sensitivity
4. **Input Validation**: Be aware of what data you're sending to external models

## Troubleshooting

### Debug Mode
Enable console logging to see detailed provider information:
```javascript
// In browser console
localStorage.setItem('debug', 'huggingface-provider');
```

### Health Check
Test your endpoint directly:
```bash
curl -X POST "https://your-endpoint.endpoints.huggingface.cloud/v1/chat/completions" \
  -H "Authorization: Bearer hf_your_token" \
  -H "Content-Type: application/json" \
  -d '{"model":"your-model","messages":[{"role":"user","content":"Hello"}]}'
```

### Common Error Codes
- **401**: Invalid API key
- **403**: Insufficient permissions
- **404**: Endpoint not found
- **503**: Model loading or overloaded
- **500**: Internal server error

## Advanced Configuration

### Custom Headers
You can add custom headers for advanced use cases:
```typescript
const huggingface = createHuggingFace({
  endpoint_type: 'dedicated',
  baseURL: 'https://your-endpoint.endpoints.huggingface.cloud',
  apiKey: 'your-api-key',
  headers: {
    'X-Custom-Header': 'custom-value'
  }
});
```

### Environment Variables
For server-side usage, you can set environment variables:
```bash
export HUGGINGFACE_API_KEY="hf_your_token"
```

## Support and Resources

- **HuggingFace Documentation**: [Inference Endpoints Guide](https://huggingface.co/docs/inference-endpoints)
- **SQLRooms Documentation**: [AI Tools and Providers](https://docs.sqlrooms.com)
- **Community Support**: [HuggingFace Community](https://huggingface.co/community)

## Changelog

### v1.0.0
- Initial HuggingFace provider integration
- Support for dedicated, serverless, and inference provider endpoints
- Automatic retry logic for cold starts
- Comprehensive error handling
- UI integration with model selector and configuration fields
