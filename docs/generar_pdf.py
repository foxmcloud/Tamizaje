#!/usr/bin/env python3
"""Genera el manual PDF a partir del Markdown, sin iniciar la aplicación."""

import argparse
from pathlib import Path
import shutil
import subprocess
import tempfile


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--chromium", default=None, help="Ruta del ejecutable de Chromium o Chrome")
    parser.add_argument("--no-sandbox", action="store_true", help="Sólo para contenedores que ya aporten aislamiento")
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    pandoc = shutil.which("pandoc")
    chromium = args.chromium or shutil.which("chromium") or shutil.which("google-chrome")
    if not pandoc or not chromium:
        raise SystemExit("Instalá Pandoc y Chromium/Chrome, o indicá --chromium /ruta/al/ejecutable.")
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        raise SystemExit("Instalá el controlador de exportación con: python3 -m pip install playwright")
    output = root / "Tamizaje-documentacion-integral.pdf"
    with tempfile.TemporaryDirectory(prefix="tamizaje-pdf-") as temporary:
        temporary = Path(temporary)
        fragment = subprocess.run(
            [pandoc, str(root / "documentacion-integral.md"), "--from=gfm", "--to=html5", "--toc", "--toc-depth=2", "--standalone", "--metadata=lang:es", "--metadata=pagetitle:Tamizaje · Documentación integral"],
            check=True, capture_output=True, text=True,
        ).stdout
        stylesheet = (root / "documentacion.css").read_text(encoding="utf-8")
        fragment = fragment.replace("</head>", f"<style>{stylesheet}</style></head>")
        fragment = fragment.replace("<nav id=\"TOC\"", "<div class=\"cover\"><p class=\"kicker\">FOXMCloud / TAMIZAJE</p><h1>Documentación<br>integral del proyecto</h1><p class=\"subtitle\">Funcionamiento, ramas, arquitectura y guía de archivos</p><div class=\"cover-rule\"></div><p>Spring Boot · Vue.js · React · Bootstrap</p><p class=\"edition\">Edición 15 de octubre de 2026<br>Código Vue de referencia: 9ddfda5</p></div><nav id=\"TOC\"")
        html = temporary / "manual.html"
        html.write_text(fragment, encoding="utf-8")
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(
                executable_path=str(chromium), headless=True,
                chromium_sandbox=not args.no_sandbox,
                args=["--no-sandbox"] if args.no_sandbox else [],
            )
            try:
                page = browser.new_page()
                page.set_content(fragment, wait_until="networkidle", timeout=30000)
                page.evaluate("document.fonts.ready")
                page.pdf(path=str(output), format="A4", prefer_css_page_size=True,
                         print_background=True, outline=True, tagged=True)
            finally:
                browser.close()
    if not output.exists() or output.stat().st_size < 10000:
        raise SystemExit("Chromium no generó un PDF completo.")
    print(f"PDF generado: {output.name} ({output.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
