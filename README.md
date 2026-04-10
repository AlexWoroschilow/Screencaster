# Screencast

A low-latency screencasting application built with Python, WebRTC, and FFmpeg.

## Features

-   **Low Latency**: Optimized for real-time screen sharing using WebRTC (aiortc) and FFmpeg.
-   **Multi-Client Support**: Distributes a single screen track to multiple viewers using `MediaRelay`.
-   **Native Admin Window**: Built-in administration interface using `pywebview` to manage broadcasts.
-   **Automatic Discovery**: Network scanning and listener components for easy client-server connection.
-   **System Tray Integration**: Background operation with system tray controls via `pystray`.
-   **Cross-Protocol Streaming**: Supports both HTTP/WebRTC and WebSocket-based streaming.

## Project Structure

-   `application/`: Main application source code.
    -   `src/server/`: HTTP, WebSocket, and Network Scanner components.
    -   `src/client/`: Client-side discovery and listener logic.
    -   `src/window/`: Desktop UI components using `pywebview`.
-   `static/`: Frontend HTML/JavaScript assets for the admin and client interfaces.

## Usage

1.  **Server**: Run `application/main.py` to start the broadcaster and admin interface.
2.  **Client**: Access the stream via the provided `client.html` or use the `client.sh` script for direct FFmpeg/ffplay playback.
