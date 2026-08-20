import sys
import os
import webview

def get_resource_path(relative_path):
    """Obtiene la ruta absoluta del recurso, compatible con entorno de desarrollo y ejecutable PyInstaller."""
    if hasattr(sys, '_MEIPASS'):
        return os.path.join(sys._MEIPASS, relative_path)
    return os.path.join(os.path.abspath("."), relative_path)

if __name__ == '__main__':
    html_path = get_resource_path('index.html')
    
    # Crear ventana nativa de escritorio para el simulador de LoL
    window = webview.create_window(
        title='LoL Simulador de Líneas & Campeones - Riot Data Dragon',
        url=html_path,
        width=1380,
        height=900,
        min_size=(1024, 700),
        resizable=True,
        text_select=True
    )
    
    webview.start()
