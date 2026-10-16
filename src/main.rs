use axum::{
    Json, Router,
    extract::State,
    http::StatusCode,
    response::{Html, IntoResponse, Response},
    routing::{get, post},
};
use serde::{Deserialize, Serialize};
use std::{
    collections::BTreeMap,
    net::SocketAddr,
    sync::{
        Arc,
        atomic::{AtomicU64, Ordering},
    },
    time::Duration,
};
use tokio::sync::RwLock;

const DEFAULT_BIND_ADDR: &str = "127.0.0.1:8080";
const DEFAULT_DELAY_SECS: u64 = 1;

#[derive(Debug, Clone)]
pub(crate) struct AppState {
    pub(crate) models: Arc<RwLock<BTreeMap<String, bool>>>,
    pub(crate) load_delay: Arc<AtomicU64>,
    pub(crate) unload_delay: Arc<AtomicU64>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct ChatCompletionRequest {
    model: String,
    #[serde(default)]
    messages: Vec<ChatMessage>,
    #[serde(default)]
    max_tokens: Option<u32>,
}

#[derive(Debug, Deserialize, Serialize)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct UnloadRequest {
    model: String,
}

#[derive(Debug, Deserialize)]
struct SetDelayRequest {
    #[serde(default)]
    delay: Option<u64>,
    #[serde(default)]
    value: Option<u64>,
}

#[derive(Debug, Serialize)]
struct ModelStatus {
    value: &'static str,
}

#[derive(Debug, Serialize)]
struct ModelItem {
    id: String,
    object: &'static str,
    owned_by: &'static str,
    status: ModelStatus,
}

#[derive(Debug, Serialize)]
struct ModelsListResponse {
    object: &'static str,
    data: Vec<ModelItem>,
}

#[derive(Debug, Serialize)]
struct ErrorDetail {
    code: u16,
    message: String,
    #[serde(rename = "type")]
    error_type: &'static str,
}

#[derive(Debug, Serialize)]
struct ErrorResponse {
    error: ErrorDetail,
}

const HTML_TEMPLATE: &str = include_str!("../static/index.html");

fn render_html(load_delay: u64, unload_delay: u64) -> String {
    HTML_TEMPLATE
        .replace("{{LOAD_DELAY}}", &load_delay.to_string())
        .replace("{{UNLOAD_DELAY}}", &unload_delay.to_string())
}

async fn get_root(State(state): State<AppState>) -> impl IntoResponse {
    let load_delay = state.load_delay.load(Ordering::SeqCst);
    let unload_delay = state.unload_delay.load(Ordering::SeqCst);
    Html(render_html(load_delay, unload_delay))
}

async fn handle_fallback(
    State(state): State<AppState>,
    req: axum::extract::Request,
) -> impl IntoResponse {
    let method = req.method().clone();
    if method == axum::http::Method::GET || method == axum::http::Method::HEAD {
        let load_delay = state.load_delay.load(Ordering::SeqCst);
        let unload_delay = state.unload_delay.load(Ordering::SeqCst);
        (
            StatusCode::NOT_FOUND,
            Html(render_html(load_delay, unload_delay)),
        )
            .into_response()
    } else {
        (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({
                "error": {
                    "message": "Route not found",
                    "type": "invalid_request_error",
                    "code": 404
                }
            })),
        )
            .into_response()
    }
}

async fn get_health() -> impl IntoResponse {
    Json(serde_json::json!({ "status": "ok" }))
}

async fn get_models(State(state): State<AppState>) -> impl IntoResponse {
    let models_guard = state.models.read().await;
    let data: Vec<ModelItem> = models_guard
        .iter()
        .map(|(id, is_loaded)| ModelItem {
            id: id.clone(),
            object: "model",
            owned_by: "llamacpp",
            status: ModelStatus {
                value: if *is_loaded { "loaded" } else { "unloaded" },
            },
        })
        .collect();

    Json(ModelsListResponse {
        object: "list",
        data,
    })
}

async fn post_chat_completions(
    State(state): State<AppState>,
    Json(payload): Json<ChatCompletionRequest>,
) -> Response {
    let model_id = payload.model.trim().to_string();
    tracing::info!(model = %model_id, "Received /v1/chat/completions (model load request)");

    {
        let models_guard = state.models.read().await;
        if !models_guard.contains_key(&model_id) {
            tracing::warn!(model = %model_id, "Requested model not recognized");
            return (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: ErrorDetail {
                        code: 400,
                        message: format!("model '{model_id}' not found"),
                        error_type: "invalid_request_error",
                    },
                }),
            )
                .into_response();
        }
    }

    let delay_secs = state.load_delay.load(Ordering::SeqCst);
    tracing::info!(
        model = %model_id,
        delay_secs = delay_secs,
        "Simulating model load delay..."
    );
    tokio::time::sleep(Duration::from_secs(delay_secs)).await;

    {
        let mut models_guard = state.models.write().await;
        if let Some(loaded) = models_guard.get_mut(&model_id) {
            *loaded = true;
            tracing::info!(model = %model_id, "Model status transitioned to 'loaded'");
        }
    }

    let response = serde_json::json!({
        "id": "chatcmpl-mock-load",
        "object": "chat.completion",
        "created": 1700000000,
        "model": model_id,
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": "pong"
                },
                "finish_reason": "stop"
            }
        ],
        "usage": {
            "prompt_tokens": 1,
            "completion_tokens": 1,
            "total_tokens": 2
        }
    });

    (StatusCode::OK, Json(response)).into_response()
}

async fn post_unload_model(
    State(state): State<AppState>,
    Json(payload): Json<UnloadRequest>,
) -> Response {
    let model_id = payload.model.trim().to_string();
    tracing::info!(model = %model_id, "Received /models/unload request");

    {
        let models_guard = state.models.read().await;
        if !models_guard.contains_key(&model_id) {
            tracing::warn!(model = %model_id, "Model to unload not recognized");
            return (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: ErrorDetail {
                        code: 400,
                        message: "model is not found".to_string(),
                        error_type: "invalid_request_error",
                    },
                }),
            )
                .into_response();
        }
    }

    let delay_secs = state.unload_delay.load(Ordering::SeqCst);
    tracing::info!(
        model = %model_id,
        delay_secs = delay_secs,
        "Simulating model unload delay..."
    );
    tokio::time::sleep(Duration::from_secs(delay_secs)).await;

    {
        let mut models_guard = state.models.write().await;
        if let Some(loaded) = models_guard.get_mut(&model_id) {
            *loaded = false;
            tracing::info!(model = %model_id, "Model status transitioned to 'unloaded'");
        }
    }

    (StatusCode::OK, Json(serde_json::json!({ "success": true }))).into_response()
}

async fn get_load_delay(State(state): State<AppState>) -> impl IntoResponse {
    let delay = state.load_delay.load(Ordering::SeqCst);
    Json(serde_json::json!({ "load_delay": delay }))
}

async fn post_load_delay(
    State(state): State<AppState>,
    Json(payload): Json<SetDelayRequest>,
) -> Response {
    let delay = payload.delay.or(payload.value).unwrap_or(0);
    state.load_delay.store(delay, Ordering::SeqCst);
    tracing::info!(
        load_delay_secs = delay,
        "Runtime update: model load delay changed"
    );
    (
        StatusCode::OK,
        Json(serde_json::json!({
            "success": true,
            "load_delay": delay
        })),
    )
        .into_response()
}

async fn get_unload_delay(State(state): State<AppState>) -> impl IntoResponse {
    let delay = state.unload_delay.load(Ordering::SeqCst);
    Json(serde_json::json!({ "unload_delay": delay }))
}

async fn post_unload_delay(
    State(state): State<AppState>,
    Json(payload): Json<SetDelayRequest>,
) -> Response {
    let delay = payload.delay.or(payload.value).unwrap_or(0);
    state.unload_delay.store(delay, Ordering::SeqCst);
    tracing::info!(
        unload_delay_secs = delay,
        "Runtime update: model unload delay changed"
    );
    (
        StatusCode::OK,
        Json(serde_json::json!({
            "success": true,
            "unload_delay": delay
        })),
    )
        .into_response()
}

fn initial_models() -> BTreeMap<String, bool> {
    let mut models = BTreeMap::new();
    models.insert("unsloth/Qwen3-0.6B-GGUF:Q4_K_XL".to_string(), false);
    models.insert("unsloth/Qwen3.5-2B-GGUF:Q4_K_XL".to_string(), false);
    models.insert("unsloth/Qwen3.5-4B-GGUF:Q4_K_XL".to_string(), false);
    models.insert("unsloth/gemma-4-E4B-it-GGUF:Q4_K_XL".to_string(), false);
    models.insert("qwen2.5-coder:7b".to_string(), false);
    models
}

pub(crate) fn create_app(state: AppState) -> Router {
    Router::new()
        .route("/", get(get_root))
        .route("/chat", get(get_root))
        .route("/health", get(get_health))
        .route("/models", get(get_models))
        .route("/v1/models", get(get_models))
        .route("/v1/chat/completions", post(post_chat_completions))
        .route("/models/unload", post(post_unload_model))
        .route("/mock/loaddelay", post(post_load_delay).get(get_load_delay))
        .route(
            "/mock/unloaddelay",
            post(post_unload_delay).get(get_unload_delay),
        )
        .fallback(handle_fallback)
        .with_state(state)
}

fn clean_addr(input: &str) -> String {
    input
        .trim()
        .trim_start_matches("http://")
        .trim_start_matches("https://")
        .trim_end_matches('/')
        .to_string()
}

fn resolve_bind_addr() -> String {
    if let Ok(addr) = std::env::var("LLAMA_MOCK_ADDR") {
        let trimmed = addr.trim();
        if !trimmed.is_empty() {
            return clean_addr(trimmed);
        }
    }

    DEFAULT_BIND_ADDR.to_string()
}

fn resolve_delays() -> (u64, u64) {
    let load_delay = std::env::var("LLAMA_MOCK_LOAD_DELAY")
        .ok()
        .and_then(|v| v.trim().parse::<u64>().ok())
        .unwrap_or(DEFAULT_DELAY_SECS);

    let unload_delay = std::env::var("LLAMA_MOCK_UNLOAD_DELAY")
        .ok()
        .and_then(|v| v.trim().parse::<u64>().ok())
        .unwrap_or(DEFAULT_DELAY_SECS);

    (load_delay, unload_delay)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info")),
        )
        .init();

    let bind_addr = resolve_bind_addr();
    let (load_delay, unload_delay) = resolve_delays();

    tracing::info!(
        load_delay_secs = load_delay,
        unload_delay_secs = unload_delay,
        "Configured initial simulated delays"
    );

    let state = AppState {
        models: Arc::new(RwLock::new(initial_models())),
        load_delay: Arc::new(AtomicU64::new(load_delay)),
        unload_delay: Arc::new(AtomicU64::new(unload_delay)),
    };

    let app = create_app(state);

    let addr: SocketAddr = bind_addr.parse()?;
    tracing::info!(
        "Starting llama-dbusd-mock-llama listening on http://{}",
        addr
    );

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use http_body_util::BodyExt;
    use std::time::Instant;
    use tower::ServiceExt;

    type TestAppState = (
        Router,
        Arc<RwLock<BTreeMap<String, bool>>>,
        Arc<AtomicU64>,
        Arc<AtomicU64>,
    );

    fn test_app_with_delays(load_delay: u64, unload_delay: u64) -> TestAppState {
        let models = Arc::new(RwLock::new(initial_models()));
        let load_atom = Arc::new(AtomicU64::new(load_delay));
        let unload_atom = Arc::new(AtomicU64::new(unload_delay));
        let state = AppState {
            models: Arc::clone(&models),
            load_delay: Arc::clone(&load_atom),
            unload_delay: Arc::clone(&unload_atom),
        };
        (create_app(state), models, load_atom, unload_atom)
    }

    fn test_app() -> (Router, Arc<RwLock<BTreeMap<String, bool>>>) {
        let (app, models, _, _) = test_app_with_delays(1, 1);
        (app, models)
    }

    #[tokio::test]
    async fn test_health_endpoint() {
        let (app, _) = test_app();
        let req = Request::builder()
            .uri("/health")
            .method("GET")
            .body(Body::empty())
            .unwrap();

        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        let bytes = resp.into_body().collect().await.unwrap().to_bytes();
        let json: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(json["status"], "ok");
    }

    #[tokio::test]
    async fn test_root_serves_html_with_theme_toggle_and_delays() {
        let (app, _, _, _) = test_app_with_delays(3, 2);
        let req = Request::builder()
            .uri("/")
            .method("GET")
            .body(Body::empty())
            .unwrap();

        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        assert_eq!(
            resp.headers().get("content-type").unwrap(),
            "text/html; charset=utf-8"
        );
        let bytes = resp.into_body().collect().await.unwrap().to_bytes();
        let html = String::from_utf8(bytes.to_vec()).unwrap();
        assert!(html.contains("llama.cpp Mock Server"));
        assert!(html.contains("id=\"theme-toggle\""));
        assert!(html.contains("id=\"theme-icon-sun\""));
        assert!(html.contains("id=\"theme-icon-moon\""));
        assert!(html.contains("prefers-color-scheme"));
        assert!(html.contains("3s simulated loading • 2s simulated unloading"));
        assert!(html.contains("id=\"load-delay-input\""));
        assert!(html.contains("id=\"unload-delay-input\""));
    }

    #[tokio::test]
    async fn test_runtime_delay_updates() {
        let (app, _, load_atom, unload_atom) = test_app_with_delays(1, 1);

        let req_load = Request::builder()
            .uri("/mock/loaddelay")
            .method("POST")
            .header("content-type", "application/json")
            .body(Body::from(r#"{"delay": 5}"#))
            .unwrap();
        let resp_load = app.clone().oneshot(req_load).await.unwrap();
        assert_eq!(resp_load.status(), StatusCode::OK);
        assert_eq!(load_atom.load(Ordering::SeqCst), 5);

        let req_unload = Request::builder()
            .uri("/mock/unloaddelay")
            .method("POST")
            .header("content-type", "application/json")
            .body(Body::from(r#"{"delay": 7}"#))
            .unwrap();
        let resp_unload = app.clone().oneshot(req_unload).await.unwrap();
        assert_eq!(resp_unload.status(), StatusCode::OK);
        assert_eq!(unload_atom.load(Ordering::SeqCst), 7);
    }

    #[tokio::test]
    async fn test_models_list_initial() {
        let (app, _) = test_app();
        let req = Request::builder()
            .uri("/models")
            .method("GET")
            .body(Body::empty())
            .unwrap();

        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        let bytes = resp.into_body().collect().await.unwrap().to_bytes();
        let json: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(json["object"], "list");
        let data = json["data"].as_array().unwrap();
        assert_eq!(data.len(), 5);

        for item in data {
            assert_eq!(item["status"]["value"], "unloaded");
        }
    }

    #[tokio::test]
    async fn test_load_and_unload_lifecycle() {
        let (app, _) = test_app();
        let model_id = "unsloth/Qwen3-0.6B-GGUF:Q4_K_XL";

        let start_load = Instant::now();
        let load_payload = serde_json::json!({
            "model": model_id,
            "messages": [{"role": "user", "content": "ping"}],
            "max_tokens": 1
        });
        let req = Request::builder()
            .uri("/v1/chat/completions")
            .method("POST")
            .header("content-type", "application/json")
            .body(Body::from(load_payload.to_string()))
            .unwrap();

        let resp = app.clone().oneshot(req).await.unwrap();
        let elapsed_load = start_load.elapsed();
        assert_eq!(resp.status(), StatusCode::OK);
        assert!(
            elapsed_load >= Duration::from_millis(990),
            "Expected at least ~1s delay, elapsed: {:?}",
            elapsed_load
        );

        let req_models = Request::builder()
            .uri("/models")
            .method("GET")
            .body(Body::empty())
            .unwrap();
        let resp_models = app.clone().oneshot(req_models).await.unwrap();
        let bytes = resp_models.into_body().collect().await.unwrap().to_bytes();
        let json_models: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
        let loaded_item = json_models["data"]
            .as_array()
            .unwrap()
            .iter()
            .find(|m| m["id"] == model_id)
            .expect("Model should be in models list");
        assert_eq!(loaded_item["status"]["value"], "loaded");

        let start_unload = Instant::now();
        let unload_payload = serde_json::json!({ "model": model_id });
        let req_unload = Request::builder()
            .uri("/models/unload")
            .method("POST")
            .header("content-type", "application/json")
            .body(Body::from(unload_payload.to_string()))
            .unwrap();

        let resp_unload = app.clone().oneshot(req_unload).await.unwrap();
        let elapsed_unload = start_unload.elapsed();
        assert_eq!(resp_unload.status(), StatusCode::OK);
        assert!(
            elapsed_unload >= Duration::from_millis(990),
            "Expected at least ~1s delay, elapsed: {:?}",
            elapsed_unload
        );

        let req_models2 = Request::builder()
            .uri("/models")
            .method("GET")
            .body(Body::empty())
            .unwrap();
        let resp_models2 = app.oneshot(req_models2).await.unwrap();
        let bytes2 = resp_models2.into_body().collect().await.unwrap().to_bytes();
        let json_models2: serde_json::Value = serde_json::from_slice(&bytes2).unwrap();
        let unloaded_item = json_models2["data"]
            .as_array()
            .unwrap()
            .iter()
            .find(|m| m["id"] == model_id)
            .expect("Model should be in models list");
        assert_eq!(unloaded_item["status"]["value"], "unloaded");
    }

    #[tokio::test]
    async fn test_unknown_model_error() {
        let (app, _) = test_app();

        let req_load = Request::builder()
            .uri("/v1/chat/completions")
            .method("POST")
            .header("content-type", "application/json")
            .body(Body::from(r#"{"model":"unknown-model"}"#))
            .unwrap();
        let resp_load = app.clone().oneshot(req_load).await.unwrap();
        assert_eq!(resp_load.status(), StatusCode::BAD_REQUEST);

        let req_unload = Request::builder()
            .uri("/models/unload")
            .method("POST")
            .header("content-type", "application/json")
            .body(Body::from(r#"{"model":"unknown-model"}"#))
            .unwrap();
        let resp_unload = app.oneshot(req_unload).await.unwrap();
        assert_eq!(resp_unload.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn test_undefined_route_returns_404_html() {
        let (app, _, _, _) = test_app_with_delays(1, 1);
        let req = Request::builder()
            .uri("/some/undefined/page")
            .method("GET")
            .body(Body::empty())
            .unwrap();

        let resp = app.oneshot(req).await.unwrap();
        assert_eq!(resp.status(), StatusCode::NOT_FOUND);
        let bytes = resp.into_body().collect().await.unwrap().to_bytes();
        let html = String::from_utf8(bytes.to_vec()).unwrap();
        assert!(html.contains("llama.cpp Mock Server"));
    }

    #[test]
    fn test_clean_addr_parsing() {
        assert_eq!(clean_addr("http://127.0.0.1:8081"), "127.0.0.1:8081");
        assert_eq!(clean_addr("https://127.0.0.1:8081/"), "127.0.0.1:8081");
        assert_eq!(clean_addr("127.0.0.1:8081"), "127.0.0.1:8081");
        assert_eq!(clean_addr("0.0.0.0:8080"), "0.0.0.0:8080");
    }
}
