import sys
from PyQt5.QtWidgets import QApplication, QMainWindow, QVBoxLayout, QWidget
from PyQt5.QtWebEngineWidgets import QWebEngineView
from PyQt5.QtCore import QUrl

class WebAppWindow(QMainWindow):
    def __init__(self):
        super().__init__()

        # Set up the main window
        self.setWindowTitle("TextMan - Desktop App")
        self.setGeometry(100, 100, 1200, 800)

        # Create a widget and layout for the main window
        central_widget = QWidget(self)
        self.setCentralWidget(central_widget)
        layout = QVBoxLayout(central_widget)

        # Create a QWebEngineView to display the HTML file
        self.browser = QWebEngineView()
        
        # Load the local HTML file (use the correct path)
        self.browser.setUrl(QUrl.fromLocalFile(
            'C:/Users/DnnsS/OneDrive/Desktop/dd1/devi/sandbox/textMan/index.html'))

        # Add the browser widget to the layout
        layout.addWidget(self.browser)

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = WebAppWindow()
    window.show()
    sys.exit(app.exec_())
