# llama-dbusd-mock-llama

[![Rust Version](https://img.shields.io/badge/rustc-1.85+-orange.svg)](https://www.rust-lang.org/)
[![Axum](https://img.shields.io/badge/web-Axum_0.8-blue.svg)](https://github.com/tokio-rs/axum)
[![Tokio](https://img.shields.io/badge/async-Tokio_1.0-blueviolet.svg)](https://tokio.rs/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI Matrix](https://img.shields.io/badge/targets-Linux%20%7C%20macOS%20%7C%20Windows-brightgreen.svg)](#target-architecture-matrix)

**`llama-dbusd-mock-llama`** is a mock server written in Rust using [Axum](https://github.com/tokio-rs/axum) and [Tokio](https://tokio.rs/). It accurately emulates [`llama.cpp`](https://github.com/ggml-org/llama.cpp) inference server (`llama-server`) HTTP endpoints, providing a faithful, zero-dependency drop-in replacement for development, continuous integration, headless testing, and live environments without downloading multi-gigabyte GGUF model weights.

---

## Table of Contents

- [Overview & Architecture](#overview--architecture)
  - [Core Design](#core-design)
  - [State Synchronization & Concurrency](#state-synchronization--concurrency)
  - [Structured Observability](#structured-observability)
- [REST API Specification](#rest-api-specification)
  - [Model Discovery & Status](#model-discovery--status)
  - [Inference & Model Lifecycle](#inference--model-lifecycle)
  - [Runtime Latency Tuning](#runtime-latency-tuning)
  - [Embedded Web Interface](#embedded-web-interface)
  - [Health & Diagnostic Endpoints](#health--diagnostic-endpoints)
- [Testing Instructions](#testing-instructions)
  - [Running the Integration Test Suite](#running-the-integration-test-suite)
  - [Automated Test Coverage](#automated-test-coverage)
- [Build & Installation](#build--installation)
  - [Compilation](#compilation)
  - [Target Architecture Matrix](#target-architecture-matrix)
  - [Binary Size & Release Profile Optimizations](#binary-size--release-profile-optimizations)
  - [Compiling the Embedded Web Frontend](#compiling-the-embedded-web-frontend)
  - [Command-Line Options](#command-line-options)
  - [Environment Configuration](#environment-configuration)
  - [Manual HTTP Verification with `curl`](#manual-http-verification-with-curl)
- [AI Assistance Attestation](#ai-assistance-attestation)
- [License](#license)

---

## Overview & Architecture

### Core Design

Developing and testing system daemons like [`llama-dbusd`](https://github.com/token419/llama-dbusd) and desktop widgets like `llama-dbusd-manager` requires a predictable, fast, and repeatable backend. Running full local inference engines during CI or automated test passes wastes substantial compute, requires heavy GPU runtimes, and incurs long model loading times.

`llama-dbusd-mock-llama` eliminates these bottlenecks by reproducing the exact HTTP contract and lifecycle behaviors of `llama-server`. It simulates model load and unload states, configurable artificial latency, simulated chat completion responses, and embeds a retro-styled single-file browser dashboard directly within the static binary.

```
+-------------------------------------------------------------+
|                 Desktop UI / GNOME Extension                |
|                    (llama-dbusd-manager)                    |
+-------------------------------------------------------------+
                               |
                      Session D-Bus IPC
                               |
+-------------------------------------------------------------+
|                        llama-dbusd                          |
|             (Background System D-Bus Daemon)                |
+-------------------------------------------------------------+
                               |
                      HTTP / REST API
         (GET /models, POST /v1/chat/completions, etc.)
                               |
+-------------------------------------------------------------+
|                   llama-dbusd-mock-llama                    |
|  - Axum 0.8 HTTP Server & REST API Router                   |
|  - In-Memory Model State (Arc<RwLock<BTreeMap>>)            |
|  - Configurable Latency Emulation (AtomicU64)               |
|  - Embedded Single-File Web UI (Svelte 5 / Vite)            |
+-------------------------------------------------------------+
```

### State Synchronization & Concurrency

`llama-dbusd-mock-llama` manages model registry states and runtime delay configurations using thread-safe, lock-optimized primitives:

```rust
pub struct AppState {
    pub models: Arc<RwLock<BTreeMap<String, bool>>>,
    pub load_delay: Arc<AtomicU64>,
    pub unload_delay: Arc<AtomicU64>,
}
```

- **Concurrent Non-Blocking Reads**: Endpoint requests (`GET /models`, `GET /health`) acquire asynchronous read locks through Tokio, allowing hundreds of concurrent status checks without blocking.
- **Atomic State Transitions**: Triggering a model load via `POST /v1/chat/completions` or an eviction via `POST /models/unload` acquires an exclusive write lock strictly when modifying the model's resident status.
- **Lock-Free Latency Controls**: Load and unload simulation delays are held in `AtomicU64` values (`Ordering::SeqCst`), allowing runtime adjustments via HTTP without stopping or restarting the server.

### Structured Observability

Logging is orchestrated through the asynchronous [`tracing`](https://docs.rs/tracing) facade and [`tracing-subscriber`](https://docs.rs/tracing-subscriber) with dynamic runtime filtering (`EnvFilter`). Every incoming request, model transition, artificial delay pause, and configuration change is emitted with structured key-value attributes (e.g., `model = %model_id`, `delay_secs = delay_secs`), enabling integration into `journald` and terminal consoles.

---

## REST API Specification

### Model Discovery & Status

#### `GET /models` & `GET /v1/models`
Returns the list of available models and their current memory status (`unloaded` or `loaded`).

- **Response `200 OK`**:
  ```json
  {
    "object": "list",
    "data": [
      {
        "id": "unsloth/Qwen3-0.6B-GGUF:Q4_K_XL",
        "object": "model",
        "created": 1700000000,
        "owned_by": "llamacpp",
        "status": {
          "value": "unloaded"
        }
      }
    ]
  }
  ```

### Inference & Model Lifecycle

#### `POST /v1/chat/completions`
Emulates a model load upon initial chat completion. If the model is not currently resident, the server pauses for the configured `load_delay`, transitions the model status to `loaded`, and returns an OpenAI-compatible completion response.

- **Request Body**:
  ```json
  {
    "model": "unsloth/Qwen3-0.6B-GGUF:Q4_K_XL",
    "messages": [
      { "role": "user", "content": "ping" }
    ]
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "id": "chatcmpl-mock-load",
    "object": "chat.completion",
    "created": 1700000000,
    "model": "unsloth/Qwen3-0.6B-GGUF:Q4_K_XL",
    "choices": [
      {
        "index": 0,
        "message": { "role": "assistant", "content": "pong" },
        "finish_reason": "stop"
      }
    ],
    "usage": {
      "prompt_tokens": 1,
      "completion_tokens": 1,
      "total_tokens": 2
    }
  }
  ```
- **Error `400 Bad Request`**: Returned if the requested model ID is unrecognized.

#### `POST /models/unload`
Evicts the target model from resident memory. Pauses for the configured `unload_delay` and transitions the model status back to `unloaded`.

- **Request Body**:
  ```json
  {
    "model": "unsloth/Qwen3-0.6B-GGUF:Q4_K_XL"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "status": "success",
    "message": "Model unsloth/Qwen3-0.6B-GGUF:Q4_K_XL unloaded"
  }
  ```

### Runtime Latency Tuning

#### `POST /mock/loaddelay` & `POST /mock/unloaddelay`
Dynamically adjusts simulated load or unload delays at runtime without restarting the server. Accepts both JSON payloads (`{"delay": 3}` or `{"value": 3}`) and query parameters (`?delay=3`).

- **Response `200 OK`**:
  ```json
  {
    "status": "ok",
    "load_delay": 3
  }
  ```

#### `GET /mock/loaddelay` & `GET /mock/unloaddelay`
Returns the currently configured delay in seconds.

- **Response `200 OK`**:
  ```json
  {
    "load_delay": 3
  }
  ```

### Embedded Web Interface

#### `GET /` & `GET /chat`
Serves a self-contained, responsive modern single-page dashboard built with Svelte 5 and Vite. The web interface includes:
- An interactive chat console that echoes user messages with standard bottom-anchored chat alignment.
- Live latency spinner controls for tuning `load_delay` and `unload_delay` on the fly with fading toast notifications.
- Seamless Dark/Light theme switching with persisted local preferences.

### Health & Diagnostic Endpoints

#### `GET /health`
Returns server operational health:
```json
{
  "status": "ok"
}
```

---

## Testing Instructions

### Running the Integration Test Suite

The test suite validates mock server initialization, address string parsing, HTTP error handling, runtime delay updates, and full model lifecycle transitions (unloaded → loading latency → loaded → unloading latency → unloaded).

To execute the entire test suite:

```bash
cargo test
```

To run tests with detailed stdout logging:

```bash
cargo test -- --nocapture
```

To verify code formatting and strict Clippy rules:

```bash
cargo fmt --check
cargo clippy --all-targets -- -D warnings
```

### Automated Test Coverage

The included test suite exercises:
1. **POSIX CLI Flag & Argument Parsing Suite**: Comprehensive verification of `--url`, `-u`, `--url=<URL>`, `-u<URL>`, bundled `-hu`, `--` delimiter, error diagnostics, and precedence over environment variables.
2. **`test_clean_addr_parsing`**: Verifies URL cleanup (`http://`, trailing slashes) for robust bind address parsing.
3. **`test_health_endpoint`**: Asserts `GET /health` responds with `{"status":"ok"}`.
4. **`test_models_list_initial`**: Validates default model inventory and initial `unloaded` statuses.
5. **`test_load_and_unload_lifecycle`**: Measures artificial latency thresholds and verifies model status transitions.
6. **`test_runtime_delay_updates`**: Validates dynamic delay modifications via `/mock/loaddelay` and `/mock/unloaddelay`.
7. **`test_unknown_model_error`**: Ensures `400 Bad Request` responses for uncataloged model IDs.
8. **`test_root_serves_html_with_theme_toggle_and_delays`**: Confirms embedded frontend delivery with dynamic metadata injection.
9. **`test_undefined_route_returns_404_html`**: Ensures undefined paths return HTTP 404 with styled fallback content.

---

## Build & Installation

### Compilation

Build the release binary using Cargo:

```bash
cargo build --release
```

The resulting compiled binary will be placed at `target/release/llama-dbusd-mock-llama`.

### Target Architecture Matrix

Our continuous integration and release pipeline validates builds across Linux, macOS, and Windows:

| Target Triple | Operating System | Binary Output | Packaging |
| :--- | :--- | :--- | :--- |
| `x86_64-unknown-linux-gnu` | Linux (64-bit x86) | `llama-dbusd-mock-llama` | `.tar.gz` |
| `aarch64-unknown-linux-gnu` | Linux (64-bit ARM) | `llama-dbusd-mock-llama` | `.tar.gz` |
| `x86_64-apple-darwin` | macOS (Intel 64-bit) | `llama-dbusd-mock-llama` | `.tar.gz` |
| `aarch64-apple-darwin` | macOS (Apple Silicon) | `llama-dbusd-mock-llama` | `.tar.gz` |
| `x86_64-pc-windows-msvc` | Windows (64-bit x86) | `llama-dbusd-mock-llama.exe` | `.zip` |

### Binary Size & Release Profile Optimizations

`llama-dbusd-mock-llama` applies aggressive compiler optimizations in `Cargo.toml` to maintain a standalone footprint of ~1.4 MB with the complete web frontend embedded:

```toml
[profile.release]
opt-level = "z"     # Optimize strictly for minimal binary size
lto = true          # Enable Link-Time Optimization globally across all crates
codegen-units = 1   # Single code-generation unit to maximize cross-crate optimizations
panic = "abort"     # Strip unwinding landing pads to reduce binary overhead
strip = true        # Strip all symbols, debug tables, and section names from the binary
```

### Compiling the Embedded Web Frontend

The static frontend is compiled into a single inlined HTML bundle using Vite and `vite-plugin-singlefile`:

```bash
cd web
npm install
npm run build
cd ..
```

The compiled bundle is output to `static/index.html` and embedded into the Rust executable at compile time via `include_str!`.

### Command-Line Options

`llama-dbusd-mock-llama` provides POSIX-compliant argument parsing:

```text
Usage: llama-dbusd-mock-llama [OPTIONS]

Lightweight mock server mimicking llama.cpp server for llama-dbusd testing.

Options:
  -u, --url <URL>    Server listen URL [default: http://127.0.0.1:8080] [env: LLAMA_MOCK_URL]
  -h, --help         Print help information
```

| Flag | Long Flag | Description | Default |
| :--- | :--- | :--- | :--- |
| `-u <URL>` | `--url <URL>` | Server listen URL (overrides `LLAMA_MOCK_URL`) | `http://127.0.0.1:8080` |
| `-h` | `--help` | Print help information and exit | |

Flag syntax supports standard POSIX and GNU conventions (e.g. `-u http://127.0.0.1:8080`, `-uhttp://127.0.0.1:8080`, `--url=http://127.0.0.1:8080`, bundled `-hu`, and `--` option delimiter).

### Environment Configuration

The server supports configuration via environment variables:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `LLAMA_MOCK_URL` | `http://127.0.0.1:8080` | Server listen URL (`http://host:port` or `host:port`). |
| `LLAMA_MOCK_LOAD_DELAY` | `1` | Artificial model loading latency in seconds. |
| `LLAMA_MOCK_UNLOAD_DELAY` | `1` | Artificial model unloading latency in seconds. |
| `RUST_LOG` | `info` | Logging verbosity filter (e.g., `debug`, `llama_dbusd_mock_llama=trace`, `warn`). |

### Manual HTTP Verification with `curl`

Verify mock server operations directly from your terminal:

```bash
# Check server health
curl -s http://127.0.0.1:8080/health

# Query available models and resident status
curl -s http://127.0.0.1:8080/models | jq .

# Trigger model load via chat completion
curl -s -X POST http://127.0.0.1:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"unsloth/Qwen3-0.6B-GGUF:Q4_K_XL","messages":[{"role":"user","content":"ping"}]}' | jq .

# Evict model from memory
curl -s -X POST http://127.0.0.1:8080/models/unload \
  -H "Content-Type: application/json" \
  -d '{"model":"unsloth/Qwen3-0.6B-GGUF:Q4_K_XL"}' | jq .

# Tune load latency to 3 seconds at runtime
curl -s -X POST http://127.0.0.1:8080/mock/loaddelay \
  -H "Content-Type: application/json" \
  -d '{"delay":3}' | jq .
```

---

## AI Assistance Attestation

```
Built in collaboration with Google Gemini.
```

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for full details.
