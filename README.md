# Video 2 Workflow Prompt Generator
An endpoint function exposed via a CLI that takes a tutorial video and returns a structured Guide AI workflow prompt.

## Requirements
- Python 3.9+
- Google Generative AI API key
- Dependencies:
  ```bash
  pip install -r requirements.txt
  ```

## Setup

1. Create a `.env` file in the project root:

   ```text
   GOOGLE_API_KEY=your_api_key_here
   ```

2. Or export variables manually (Linux/macOS):
   ```bash
   export GOOGLE_API_KEY="your_api_key_here"
   ```

## Usage

Pass a video file:

```bash
python main.py --video path/to/tutorial.mp4
```

Save output to a file:

```bash
python main.py --video path/to/tutorial.mp4 > output.txt
```
