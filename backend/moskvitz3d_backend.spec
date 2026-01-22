# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['main.py'],
    pathex=['/path/to/your/project/backend'],
    binaries=[],
    datas=[],
    hiddenimports=[
        'app',
        'app.api',
        'app.api.v1',
        'app.api.v1.endpoints',
        'app.core',
        'app.crud',
        'app.db',
        'app.models',
        'app.schemas',
        'sqlalchemy',
        'sqlalchemy.orm',
        'sqlalchemy.ext',
        'sqlalchemy.ext.declarative',
        'sqlalchemy.engine',
        'sqlalchemy.sql',
        'fastapi',
        'fastapi.middleware',
        'fastapi.middleware.cors',
        'uvicorn',
        'pydantic',
        'pydantic_settings',
        'jose',
        'passlib',
        'passlib.context',
        'bcrypt'
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='moskvitz3d_backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)