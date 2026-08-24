```typescript
import axios from "axios";

const invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
const stream = false;

const headers = {
  Authorization:
    "Bearer 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",
  Accept: stream ? "text/event-stream" : "application/json",
};

async function main() {
  const payload = {
    model: "minimaxai/minimax-m3",
    messages: [{ role: "user", content: "" }],
    temperature: 1,
    top_p: 0.95,
    max_tokens: 8192,
    stream: stream,
  };

  const response = await axios.post(invokeUrl, payload, {
    headers: headers,
    responseType: stream ? "stream" : "json",
  });

  if (stream) {
    response.data.on("data", (chunk) => {
      console.log(chunk.toString());
    });
  } else {
    console.log(JSON.stringify(response.data));
  }
}

main().catch((error) => {
  if (error.response) {
    console.error(`HTTP ${error.response.status}`);
    if (error.response.data?.on) {
      error.response.data.on("data", (chunk) =>
        console.error(chunk.toString()),
      );
    } else {
      console.error(error.response.data);
    }
  } else {
    console.error(error);
  }
});
```
