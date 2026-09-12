"""
Vercel Serverless Function Entrypoint for FastAPI.
100% Local Execution | Zero External APIs | Zero API Keys Required.
"""

import sys
import os

# Redirect cache directories to writable /tmp directory in serverless environments
if "VERCEL" in os.environ or "AWS_LAMBDA_FUNCTION_NAME" in os.environ:
    os.environ["HF_HOME"] = "/tmp/hf_home"
    os.environ["TORCH_HOME"] = "/tmp/torch_home"
    os.environ["TRANSFORMERS_CACHE"] = "/tmp/hf_home"

# Add project root to sys.path so server and backend can be cleanly imported
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from server import app
