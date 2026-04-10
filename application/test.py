import logging
import os
import sys

system_paths = [
    f"/usr/lib/python{sys.version_info.major}.{sys.version_info.minor}/dist-packages",
    f"/usr/lib/python{sys.version_info.major}.{sys.version_info.minor}/site-packages",
]

[sys.path.append(path) if os.path.exists(path) else "" for path in system_paths]

# 2. Allow the OS to find system C-libraries (.so files)
# This is critical for hardware access (GStreamer, Drivers)
current_ld = os.environ.get("LD_LIBRARY_PATH", "")
os.environ["LD_LIBRARY_PATH"] = f"/usr/lib/x86_64-linux-gnu:/usr/lib64:{current_ld}"

from PySide6.QtCore import QUrl
from PySide6.QtWebEngineCore import QWebEnginePage, QWebEngineSettings
from PySide6.QtWebEngineWidgets import QWebEngineView
from PySide6.QtWidgets import QApplication, QMainWindow

log_format = '[%(relativeCreated)d][%(name)s] %(levelname)s - %(message)s'
logging.basicConfig(level=logging.DEBUG, format=log_format, stream=sys.stdout)

sys.argv.append("--enable-features=WebRTCPipeWireCapturer")
sys.argv.append("--use-fake-ui-for-media-stream")
sys.argv.append("--no-sandbox")


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()

        self.setWindowTitle("PySide6 Webview")
        self.resize(1024, 768)

        self.browser = QWebEngineView()

        # Enable necessary settings for WebRTC and screen capture
        settings = self.browser.settings()
        settings.setAttribute(QWebEngineSettings.LocalContentCanAccessRemoteUrls, True)
        settings.setAttribute(QWebEngineSettings.LocalContentCanAccessFileUrls, True)
        settings.setAttribute(QWebEngineSettings.ScreenCaptureEnabled, True)

        # Handle permission requests (e.g., for getDisplayMedia)
        self.browser.page().featurePermissionRequested.connect(self.handle_permission_request)

        # Get the absolute path to index.html
        file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "index.html"))
        local_url = QUrl.fromLocalFile(file_path)

        # self.browser.setUrl(local_url)
        self.browser.setUrl("https://webrtc.github.io/samples/src/content/getusermedia/getdisplaymedia/")
        self.setCentralWidget(self.browser)

    def handle_permission_request(self, security_origin, feature):
        # Automatically grant permission for desktop capture and other media features
        if feature in (QWebEnginePage.DesktopAudioVideoCapture,
                       QWebEnginePage.DesktopVideoCapture,
                       QWebEnginePage.MediaAudioVideoCapture,
                       QWebEnginePage.MediaAudioCapture,
                       QWebEnginePage.MediaVideoCapture):
            self.browser.page().setFeaturePermission(
                security_origin, feature, QWebEnginePage.PermissionGrantedByUser
            )


if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec())
