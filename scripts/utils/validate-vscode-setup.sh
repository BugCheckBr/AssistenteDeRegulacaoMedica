#!/bin/bash

# 🔍 Script de Validação do VS Code Setup
# Verifica se toda a configuração do VS Code está correta

echo "🔍 Verificando configuração do VS Code para o Assistente de Regulação Médica..."
echo ""

# Função para verificar se arquivo existe
check_file() {
    local file="$1"
    local description="$2"
    
    if [ -f "$file" ]; then
        echo "✅ $description: $file"
        return 0
    else
        echo "❌ $description: $file (FALTANDO)"
        return 1
    fi
}

# Função para verificar se diretório existe
check_dir() {
    local dir="$1"
    local description="$2"
    
    if [ -d "$dir" ]; then
        echo "✅ $description: $dir"
        return 0
    else
        echo "❌ $description: $dir (FALTANDO)"
        return 1
    fi
}

# Função para verificar conteúdo JSON
check_json() {
    local file="$1"
    local description="$2"
    
    if [ -f "$file" ]; then
        if jq empty "$file" 2>/dev/null; then
            echo "✅ $description: JSON válido"
            return 0
        else
            echo "⚠️ $description: JSON inválido"
            return 1
        fi
    else
        echo "❌ $description: Arquivo não encontrado"
        return 1
    fi
}

echo "📁 Verificando estrutura de diretórios..."
check_dir ".vscode" "Diretório VS Code"

echo ""
echo "📋 Verificando arquivos de configuração..."
check_file ".vscode/settings.json" "Settings VS Code"
check_file ".vscode/tasks.json" "Tasks VS Code"
check_file ".vscode/launch.json" "Launch Configurations"
check_file ".vscode/extensions.json" "Extensões Recomendadas"
check_file ".vscode/javascript.code-snippets" "Snippets JavaScript"
check_file ".vscode/keybindings.json" "Keybindings Personalizados"
check_file "AssistenteDeRegulacao.code-workspace" "Workspace File"

echo ""
echo "🧪 Verificando sintaxe JSON..."
check_json ".vscode/settings.json" "Settings JSON"
check_json ".vscode/tasks.json" "Tasks JSON"
check_json ".vscode/launch.json" "Launch JSON"
check_json ".vscode/extensions.json" "Extensions JSON"
check_json ".vscode/javascript.code-snippets" "Snippets JSON"
check_json ".vscode/keybindings.json" "Keybindings JSON"
check_json "AssistenteDeRegulacao.code-workspace" "Workspace JSON"

echo ""
echo "🎯 Verificando configurações específicas..."

# Verifica se o package.json tem os scripts necessários
if [ -f "package.json" ]; then
    if jq -e '.scripts.dev' package.json > /dev/null; then
        echo "✅ Script 'dev' encontrado no package.json"
    else
        echo "❌ Script 'dev' não encontrado no package.json"
    fi
    
    if jq -e '.scripts."build:all"' package.json > /dev/null; then
        echo "✅ Script 'build:all' encontrado no package.json"
    else
        echo "❌ Script 'build:all' não encontrado no package.json"
    fi
    
    if jq -e '.scripts.test' package.json > /dev/null; then
        echo "✅ Script 'test' encontrado no package.json"
    else
        echo "❌ Script 'test' não encontrado no package.json"
    fi
else
    echo "❌ package.json não encontrado"
fi

echo ""
echo "🚀 Instruções para usar no VS Code:"
echo ""
echo "1. 📂 Abrir Workspace:"
echo "   File > Open Workspace from File > AssistenteDeRegulacao.code-workspace"
echo ""
echo "2. 🔧 Instalar Extensões:"
echo "   Ctrl+Shift+P > Extensions: Show Recommended Extensions"
echo ""
echo "3. ⌨️ Atalhos Principais:"
echo "   Ctrl+Shift+B: Iniciar desenvolvimento"
echo "   Ctrl+Alt+B: Build todos os browsers"
echo "   Ctrl+Shift+T: Executar todos os testes"
echo "   Ctrl+Shift+V: Validação completa"
echo ""
echo "4. 🐛 Debug:"
echo "   F5: Iniciar debug da extensão Chrome"
echo "   Ctrl+Shift+F5: Restart debug"
echo ""
echo "5. 📋 Tasks Disponíveis:"
echo "   Ctrl+Shift+P > Tasks: Run Task"
echo "   - 🚀 Dev: Start Development"
echo "   - 🏗️ Build: All Browsers"
echo "   - 🧪 Test: All Tests"
echo "   - 🔍 Validate: Complete"
echo "   - 📦 Package: All Stores"
echo ""
echo "✅ Configuração do VS Code completa!"
echo "🏥 Pronto para desenvolvimento médico seguro!"
