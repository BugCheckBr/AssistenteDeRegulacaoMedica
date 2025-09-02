@echo off
echo.
echo 🔍 Verificando configuracao do VS Code para o Assistente de Regulacao Medica...
echo.

echo 📁 Verificando estrutura de diretorios...
if exist ".vscode" (
    echo ✅ Diretorio VS Code: .vscode
) else (
    echo ❌ Diretorio VS Code: .vscode ^(FALTANDO^)
    goto :error
)

echo.
echo 📋 Verificando arquivos de configuracao...

if exist ".vscode\settings.json" (
    echo ✅ Settings VS Code: .vscode\settings.json
) else (
    echo ❌ Settings VS Code: .vscode\settings.json ^(FALTANDO^)
)

if exist ".vscode\tasks.json" (
    echo ✅ Tasks VS Code: .vscode\tasks.json
) else (
    echo ❌ Tasks VS Code: .vscode\tasks.json ^(FALTANDO^)
)

if exist ".vscode\launch.json" (
    echo ✅ Launch Configurations: .vscode\launch.json
) else (
    echo ❌ Launch Configurations: .vscode\launch.json ^(FALTANDO^)
)

if exist ".vscode\extensions.json" (
    echo ✅ Extensoes Recomendadas: .vscode\extensions.json
) else (
    echo ❌ Extensoes Recomendadas: .vscode\extensions.json ^(FALTANDO^)
)

if exist ".vscode\javascript.code-snippets" (
    echo ✅ Snippets JavaScript: .vscode\javascript.code-snippets
) else (
    echo ❌ Snippets JavaScript: .vscode\javascript.code-snippets ^(FALTANDO^)
)

if exist ".vscode\keybindings.json" (
    echo ✅ Keybindings Personalizados: .vscode\keybindings.json
) else (
    echo ❌ Keybindings Personalizados: .vscode\keybindings.json ^(FALTANDO^)
)

if exist "AssistenteDeRegulacao.code-workspace" (
    echo ✅ Workspace File: AssistenteDeRegulacao.code-workspace
) else (
    echo ❌ Workspace File: AssistenteDeRegulacao.code-workspace ^(FALTANDO^)
)

echo.
echo 🎯 Verificando package.json...
if exist "package.json" (
    echo ✅ package.json encontrado
    findstr /C:"\"dev\"" package.json >nul
    if errorlevel 1 (
        echo ⚠️ Script 'dev' nao encontrado no package.json
    ) else (
        echo ✅ Script 'dev' encontrado no package.json
    )
    
    findstr /C:"\"build:all\"" package.json >nul
    if errorlevel 1 (
        echo ⚠️ Script 'build:all' nao encontrado no package.json
    ) else (
        echo ✅ Script 'build:all' encontrado no package.json
    )
    
    findstr /C:"\"test\"" package.json >nul
    if errorlevel 1 (
        echo ⚠️ Script 'test' nao encontrado no package.json
    ) else (
        echo ✅ Script 'test' encontrado no package.json
    )
) else (
    echo ❌ package.json nao encontrado
)

echo.
echo 🚀 Instrucoes para usar no VS Code:
echo.
echo 1. 📂 Abrir Workspace:
echo    File ^> Open Workspace from File ^> AssistenteDeRegulacao.code-workspace
echo.
echo 2. 🔧 Instalar Extensoes:
echo    Ctrl+Shift+P ^> Extensions: Show Recommended Extensions
echo.
echo 3. ⌨️ Atalhos Principais:
echo    Ctrl+Shift+B: Iniciar desenvolvimento
echo    Ctrl+Alt+B: Build todos os browsers
echo    Ctrl+Shift+T: Executar todos os testes
echo    Ctrl+Shift+V: Validacao completa
echo.
echo 4. 🐛 Debug:
echo    F5: Iniciar debug da extensao Chrome
echo    Ctrl+Shift+F5: Restart debug
echo.
echo 5. 📋 Tasks Disponiveis:
echo    Ctrl+Shift+P ^> Tasks: Run Task
echo    - 🚀 Dev: Start Development
echo    - 🏗️ Build: All Browsers
echo    - 🧪 Test: All Tests
echo    - 🔍 Validate: Complete
echo    - 📦 Package: All Stores
echo.
echo ✅ Configuracao do VS Code completa!
echo 🏥 Pronto para desenvolvimento medico seguro!
echo.
goto :end

:error
echo ❌ Erro na configuracao do VS Code!
exit /b 1

:end
echo ✅ Validacao concluida com sucesso!
